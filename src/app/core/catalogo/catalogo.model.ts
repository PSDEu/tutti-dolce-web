/**
 * Tipos del catálogo de un producto (por ahora, tortas).
 * El catálogo vive en JSON (`tortas.json`) para que la pastelería pueda cambiar opciones,
 * precios, antelaciones y reglas sin tocar el código 3D ni la lógica.
 */

export interface OpcionBase {
  id: string;
  nombre: string;
  /** Precio en la moneda del catálogo. */
  precio: number;
}

export interface Forma extends OpcionBase {
  antelacionDias: number;
}

export interface Tamano extends OpcionBase {
  diametroCm: number;
  raciones: string;
  /** Multiplicador para los extras que dependen de la cantidad de masa o crema. */
  factor: number;
}

export interface Bizcocho extends OpcionBase {
  color: string;
}

export interface Relleno extends OpcionBase {
  color: string;
  frutaFresca: boolean;
}

export interface Cobertura extends OpcionBase {
  descripcion: string;
  colores: string[];
  antelacionDias: number;
  /** 0 = espejo, 1 = mate. Lo usa el material 3D. */
  rugosidad: number;
  /** 0–1: capa de brillo (clearcoat) del material 3D. */
  brillo: number;
}

export interface Drip extends OpcionBase {
  color: string;
}

export interface Topper extends OpcionBase {
  antelacionDias: number;
  frutaFresca: boolean;
}

/** Campos sobre los que se pueden escribir reglas (ver `reglas.ts`). */
export type CampoRegla =
  | 'forma'
  | 'tamano'
  | 'bizcocho'
  | 'pisos'
  | 'relleno'
  | 'rellenoFrutaFresca'
  | 'cobertura'
  | 'acabado'
  | 'drip'
  | 'decoraciones'
  | 'toppers'
  | 'toppersFrutaFresca';

export interface Condicion {
  campo: CampoRegla;
  igual?: string | number | boolean | null;
  en?: (string | number)[];
  incluye?: string;
}

export interface Restriccion {
  campo: CampoRegla;
  max?: number;
  min?: number;
  en?: (string | number)[];
  noEn?: (string | number)[];
  noIncluye?: string;
}

export interface Regla {
  id: string;
  mensaje: string;
  /** Todas las condiciones deben cumplirse para que la regla se aplique. */
  si: Condicion[];
  entonces: Restriccion;
}

export interface CatalogoTortas {
  producto: string;
  version: number;
  moneda: string;
  nota?: string;
  pedido: {
    antelacionBaseDias: number;
    /** Hora (0–23) a partir de la cual el pedido cuenta desde el día siguiente. */
    horaCorte: number;
    /** Días sin entregas: 0 = domingo … 6 = sábado. */
    diasCerrados: number[];
  };
  formas: Forma[];
  tamanos: Tamano[];
  bizcochos: Bizcocho[];
  pisos: {
    min: number;
    max: number;
    precioPisoExtra: number;
    antelacionPorPisoExtraDias: number;
  };
  rellenos: Relleno[];
  coberturas: Cobertura[];
  acabados: OpcionBase[];
  drips: Drip[];
  decoracionesManga: OpcionBase[];
  coloresManga: string[];
  toppers: Topper[];
  mensaje: { maxCaracteres: number; precio: number };
  reglas: Regla[];
}
