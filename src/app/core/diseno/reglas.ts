import { CampoRegla, CatalogoTortas, Condicion, Regla, Restriccion } from '../catalogo/catalogo.model';
import { DisenoTorta } from './diseno.model';

/**
 * Motor de reglas de la pastelería.
 *
 * Las reglas se escriben en el catálogo JSON con la forma
 * "si <condiciones> entonces <restricción>", por ejemplo:
 *   si relleno con fruta fresca → pisos como máximo 2.
 *
 * Además de las reglas del JSON hay una regla estructural fija:
 * con más de un piso el relleno es obligatorio.
 */

type Valor = string | number | boolean | null | string[];
export type Hechos = Record<CampoRegla, Valor>;

export interface Infraccion {
  regla: string;
  mensaje: string;
}

export interface Ajuste {
  regla: string;
  mensaje: string;
}

export function hechos(d: DisenoTorta, c: CatalogoTortas): Hechos {
  return {
    forma: d.forma,
    tamano: d.tamano,
    bizcocho: d.bizcocho,
    pisos: d.pisos,
    relleno: d.relleno,
    rellenoFrutaFresca: !!c.rellenos.find((r) => r.id === d.relleno)?.frutaFresca,
    cobertura: d.cobertura,
    acabado: d.acabado,
    drip: d.drip,
    decoraciones: d.decoraciones,
    toppers: d.toppers,
    toppersFrutaFresca: d.toppers.some((t) => c.toppers.find((x) => x.id === t)?.frutaFresca),
  };
}

function cumple(cond: Condicion, h: Hechos): boolean {
  const v = h[cond.campo];
  if ('igual' in cond) {
    return v === cond.igual;
  }
  if (cond.en) {
    return cond.en.includes(v as string | number);
  }
  if (cond.incluye !== undefined) {
    return Array.isArray(v) && v.includes(cond.incluye);
  }
  return false;
}

function respeta(r: Restriccion, h: Hechos): boolean {
  const v = h[r.campo];
  if (r.max !== undefined && typeof v === 'number' && v > r.max) return false;
  if (r.min !== undefined && typeof v === 'number' && v < r.min) return false;
  if (r.en && !r.en.includes(v as string | number)) return false;
  if (r.noEn && r.noEn.includes(v as string | number)) return false;
  if (r.noIncluye !== undefined && Array.isArray(v) && v.includes(r.noIncluye)) return false;
  return true;
}

function aplica(regla: Regla, h: Hechos): boolean {
  return regla.si.every((cond) => cumple(cond, h));
}

/** Devuelve las reglas que el diseño incumple (lista vacía = diseño válido). */
export function validar(d: DisenoTorta, c: CatalogoTortas): Infraccion[] {
  const h = hechos(d, c);
  const infracciones: Infraccion[] = [];
  if (d.pisos > 1 && !d.relleno) {
    infracciones.push({ regla: 'relleno-obligatorio', mensaje: 'Con más de un piso hace falta relleno.' });
  }
  for (const regla of c.reglas) {
    if (aplica(regla, h) && !respeta(regla.entonces, h)) {
      infracciones.push({ regla: regla.id, mensaje: regla.mensaje });
    }
  }
  return infracciones;
}

/**
 * ¿Se puede poner `valor` en `campo` sin romper ninguna regla que restrinja ese campo?
 * Sirve para desactivar opciones en el paso que el cliente está editando.
 */
export function permitido<K extends keyof DisenoTorta>(
  d: DisenoTorta,
  campo: K,
  valor: DisenoTorta[K],
  c: CatalogoTortas,
): boolean {
  const prueba = { ...d, [campo]: valor };
  if (campo === 'relleno' && valor === null && prueba.pisos > 1) {
    return false;
  }
  const h = hechos(prueba, c);
  return c.reglas
    .filter((r) => r.entonces.campo === campo)
    .every((r) => !aplica(r, h) || respeta(r.entonces, h));
}

/**
 * Corrige un diseño para que cumpla las reglas, cambiando el campo restringido
 * (no el que el cliente acaba de elegir). Devuelve el diseño corregido y qué se ajustó.
 */
export function corregir(d: DisenoTorta, c: CatalogoTortas): { diseno: DisenoTorta; ajustes: Ajuste[] } {
  let diseno: DisenoTorta = { ...d, decoraciones: [...d.decoraciones], toppers: [...d.toppers] };
  const ajustes: Ajuste[] = [];

  if (diseno.pisos > 1 && !diseno.relleno) {
    diseno.relleno = c.rellenos[0].id;
    ajustes.push({ regla: 'relleno-obligatorio', mensaje: 'Hemos añadido relleno: con más de un piso es necesario.' });
  }

  // Varias pasadas por si una corrección activa otra regla.
  for (let pasada = 0; pasada < 4; pasada++) {
    let cambiado = false;
    for (const regla of c.reglas) {
      const h = hechos(diseno, c);
      if (!aplica(regla, h) || respeta(regla.entonces, h)) continue;
      diseno = aplicarRestriccion(diseno, regla.entonces, c);
      ajustes.push({ regla: regla.id, mensaje: regla.mensaje });
      cambiado = true;
    }
    if (!cambiado) break;
  }
  return { diseno, ajustes };
}

function aplicarRestriccion(d: DisenoTorta, r: Restriccion, c: CatalogoTortas): DisenoTorta {
  const copia = { ...d } as unknown as Record<string, unknown>;
  const actual = copia[r.campo];
  if (r.max !== undefined && typeof actual === 'number') {
    copia[r.campo] = Math.min(actual, r.max);
  } else if (r.min !== undefined && typeof actual === 'number') {
    copia[r.campo] = Math.max(actual, r.min);
  } else if (r.noIncluye !== undefined && Array.isArray(actual)) {
    copia[r.campo] = actual.filter((x) => x !== r.noIncluye);
  } else if (r.en) {
    copia[r.campo] = r.en[0];
  } else if (r.noEn) {
    const opciones = opcionesDe(r.campo, c);
    copia[r.campo] = opciones.find((o) => !r.noEn!.includes(o)) ?? actual;
  }
  return copia as unknown as DisenoTorta;
}

function opcionesDe(campo: CampoRegla, c: CatalogoTortas): string[] {
  const mapa: Partial<Record<CampoRegla, { id: string }[]>> = {
    forma: c.formas,
    tamano: c.tamanos,
    bizcocho: c.bizcochos,
    relleno: c.rellenos,
    cobertura: c.coberturas,
    acabado: c.acabados,
    drip: c.drips,
  };
  return (mapa[campo] ?? []).map((o) => o.id);
}
