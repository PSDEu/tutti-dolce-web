import { CatalogoTortas } from '../catalogo/catalogo.model';

/** Lo que el cliente elige en el configurador. Solo guarda ids del catálogo. */
export interface DisenoTorta {
  forma: string;
  tamano: string;
  bizcocho: string;
  pisos: number;
  /** null = sin relleno (solo posible con 1 piso). */
  relleno: string | null;
  cobertura: string;
  colorCobertura: string;
  acabado: string;
  drip: string | null;
  decoraciones: string[];
  colorManga: string;
  toppers: string[];
  mensaje: string;
}

/** Los pasos del configurador, en orden (PROYECTO-WEB.md §3.2). */
export const PASOS = [
  { id: 'forma', titulo: 'Forma' },
  { id: 'bizcocho', titulo: 'Bizcocho' },
  { id: 'pisos', titulo: 'Pisos' },
  { id: 'relleno', titulo: 'Relleno' },
  { id: 'cobertura', titulo: 'Cobertura' },
  { id: 'acabado', titulo: 'Acabado' },
  { id: 'manga', titulo: 'Decoración con manga' },
  { id: 'toppers', titulo: 'Toppers' },
  { id: 'mensaje', titulo: 'Mensaje' },
] as const;

export type IdPaso = (typeof PASOS)[number]['id'];

export function disenoInicial(c: CatalogoTortas): DisenoTorta {
  const cobertura = c.coberturas[0];
  return {
    forma: c.formas[0].id,
    tamano: c.tamanos[1]?.id ?? c.tamanos[0].id,
    bizcocho: c.bizcochos[0].id,
    pisos: 2,
    relleno: c.rellenos[0].id,
    cobertura: cobertura.id,
    colorCobertura: cobertura.colores[0],
    acabado: c.acabados[0].id,
    drip: null,
    decoraciones: [],
    colorManga: c.coloresManga[0],
    toppers: [],
    mensaje: '',
  };
}

/**
 * Comprueba que un objeto (p. ej. leído de un enlace) es un diseño válido para el catálogo.
 * Rellena con valores por defecto lo que falte y descarta ids desconocidos.
 */
export function normalizarDiseno(entrada: unknown, c: CatalogoTortas): DisenoTorta {
  const base = disenoInicial(c);
  if (!entrada || typeof entrada !== 'object') {
    return base;
  }
  const d = entrada as Partial<Record<keyof DisenoTorta, unknown>>;
  const id = (v: unknown, lista: { id: string }[], defecto: string) =>
    typeof v === 'string' && lista.some((o) => o.id === v) ? v : defecto;
  const ids = (v: unknown, lista: { id: string }[]) =>
    Array.isArray(v)
      ? [...new Set(v.filter((x): x is string => typeof x === 'string' && lista.some((o) => o.id === x)))]
      : [];
  const color = (v: unknown, permitidos: string[], defecto: string) =>
    typeof v === 'string' && permitidos.includes(v) ? v : defecto;

  const cobertura = id(d.cobertura, c.coberturas, base.cobertura);
  const coloresCobertura = c.coberturas.find((x) => x.id === cobertura)!.colores;
  const pisos =
    typeof d.pisos === 'number' && Number.isInteger(d.pisos)
      ? Math.min(c.pisos.max, Math.max(c.pisos.min, d.pisos))
      : base.pisos;

  return {
    forma: id(d.forma, c.formas, base.forma),
    tamano: id(d.tamano, c.tamanos, base.tamano),
    bizcocho: id(d.bizcocho, c.bizcochos, base.bizcocho),
    pisos,
    relleno: d.relleno === null && pisos === 1 ? null : id(d.relleno, c.rellenos, base.relleno!),
    cobertura,
    colorCobertura: color(d.colorCobertura, coloresCobertura, coloresCobertura[0]),
    acabado: id(d.acabado, c.acabados, base.acabado),
    drip: d.drip === null || d.drip === undefined ? null : id(d.drip, c.drips, c.drips[0].id),
    decoraciones: ids(d.decoraciones, c.decoracionesManga),
    colorManga: color(d.colorManga, c.coloresManga, base.colorManga),
    toppers: ids(d.toppers, c.toppers),
    mensaje: typeof d.mensaje === 'string' ? d.mensaje.slice(0, c.mensaje.maxCaracteres) : '',
  };
}
