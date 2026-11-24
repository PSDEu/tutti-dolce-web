import { CatalogoTortas } from '../catalogo/catalogo.model';
import { DisenoTorta } from './diseno.model';

/** Días de preparación que necesita el diseño (la opción más lenta manda). */
export function antelacionDias(d: DisenoTorta, c: CatalogoTortas): number {
  const lentas = [
    c.formas.find((f) => f.id === d.forma)?.antelacionDias ?? 0,
    c.coberturas.find((x) => x.id === d.cobertura)?.antelacionDias ?? 0,
    ...d.toppers.map((t) => c.toppers.find((x) => x.id === t)?.antelacionDias ?? 0),
  ];
  const porPisos = Math.ceil((d.pisos - 1) * c.pisos.antelacionPorPisoExtraDias);
  return c.pedido.antelacionBaseDias + Math.max(0, ...lentas) + porPisos;
}

/**
 * Fecha de entrega más próxima posible.
 * - Si se pide después de la hora de corte, se empieza a contar desde mañana.
 * - Si la fecha cae en un día cerrado, pasa al siguiente día abierto.
 */
export function fechaEntregaMinima(d: DisenoTorta, c: CatalogoTortas, ahora = new Date()): Date {
  const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  if (ahora.getHours() >= c.pedido.horaCorte) {
    fecha.setDate(fecha.getDate() + 1);
  }
  fecha.setDate(fecha.getDate() + antelacionDias(d, c));
  for (let i = 0; i < 7 && c.pedido.diasCerrados.includes(fecha.getDay()); i++) {
    fecha.setDate(fecha.getDate() + 1);
  }
  return fecha;
}

/** ¿Es `fecha` una fecha de entrega válida (no antes de la mínima y en día abierto)? */
export function fechaValida(fecha: Date, d: DisenoTorta, c: CatalogoTortas, ahora = new Date()): boolean {
  const minima = fechaEntregaMinima(d, c, ahora);
  const dia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  return dia >= minima && !c.pedido.diasCerrados.includes(dia.getDay());
}

/** Fecha en formato `aaaa-mm-dd` (hora local), para inputs y la API. */
export function aIso(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

export function desdeIso(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}
