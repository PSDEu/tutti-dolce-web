import { computed, effect, Injectable, signal } from '@angular/core';
import { CATALOGO_TORTAS } from '../catalogo/catalogo';
import { DisenoTorta, disenoInicial, normalizarDiseno } from './diseno.model';
import { codificarDiseno, decodificarDiseno } from './enlace';
import { aIso, antelacionDias, fechaEntregaMinima } from './fecha-entrega';
import { calcularPrecio } from './precio';
import { Ajuste, corregir, permitido, validar } from './reglas';

export interface DisenoGuardado {
  id: string;
  nombre: string;
  fecha: string;
  codigo: string;
}

const CLAVE_BORRADOR = 'td-borrador';
const CLAVE_GUARDADOS = 'td-guardados';

function leer<T>(clave: string, defecto: T): T {
  try {
    const texto = globalThis.localStorage?.getItem(clave);
    return texto ? (JSON.parse(texto) as T) : defecto;
  } catch {
    return defecto;
  }
}

function escribir(clave: string, valor: unknown): void {
  try {
    globalThis.localStorage?.setItem(clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento lleno o bloqueado: no es crítico */
  }
}

/**
 * Estado del configurador con signals.
 * Toda la lógica (precio, reglas, fecha) son funciones puras en esta carpeta;
 * el servicio solo las conecta y guarda el borrador en el navegador.
 */
@Injectable({ providedIn: 'root' })
export class DisenoService {
  readonly catalogo = CATALOGO_TORTAS;

  private readonly _diseno = signal<DisenoTorta>(
    normalizarDiseno(leer(CLAVE_BORRADOR, disenoInicial(CATALOGO_TORTAS)), CATALOGO_TORTAS),
  );
  readonly diseno = this._diseno.asReadonly();

  /** Correcciones automáticas del último cambio (para avisar al cliente). */
  readonly ajustes = signal<Ajuste[]>([]);

  readonly presupuesto = computed(() => calcularPrecio(this._diseno(), this.catalogo));
  readonly antelacion = computed(() => antelacionDias(this._diseno(), this.catalogo));
  readonly fechaMinima = computed(() => fechaEntregaMinima(this._diseno(), this.catalogo));
  readonly fechaMinimaIso = computed(() => aIso(this.fechaMinima()));
  readonly infracciones = computed(() => validar(this._diseno(), this.catalogo));
  readonly codigo = computed(() => codificarDiseno(this._diseno()));

  readonly guardados = signal<DisenoGuardado[]>(leer(CLAVE_GUARDADOS, []));

  constructor() {
    effect(() => escribir(CLAVE_BORRADOR, this._diseno()));
    effect(() => escribir(CLAVE_GUARDADOS, this.guardados()));
  }

  cambiar<K extends keyof DisenoTorta>(campo: K, valor: DisenoTorta[K]): void {
    let siguiente: DisenoTorta = { ...this._diseno(), [campo]: valor };
    if (campo === 'cobertura') {
      const colores = this.catalogo.coberturas.find((c) => c.id === valor)!.colores;
      if (!colores.includes(siguiente.colorCobertura)) {
        siguiente.colorCobertura = colores[0];
      }
    }
    const { diseno, ajustes } = corregir(siguiente, this.catalogo);
    siguiente = diseno;
    this.ajustes.set(ajustes);
    this._diseno.set(siguiente);
  }

  /** Añade o quita un id de una lista (decoraciones o toppers). */
  alternar(campo: 'decoraciones' | 'toppers', id: string): void {
    const lista = this._diseno()[campo];
    this.cambiar(campo, lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);
  }

  permitido<K extends keyof DisenoTorta>(campo: K, valor: DisenoTorta[K]): boolean {
    return permitido(this._diseno(), campo, valor, this.catalogo);
  }

  cargar(d: DisenoTorta): void {
    this.ajustes.set([]);
    this._diseno.set(corregir(normalizarDiseno(d, this.catalogo), this.catalogo).diseno);
  }

  cargarCodigo(codigo: string): boolean {
    const d = decodificarDiseno(codigo, this.catalogo);
    if (d) {
      this.cargar(d);
    }
    return !!d;
  }

  reiniciar(): void {
    this.cargar(disenoInicial(this.catalogo));
  }

  enlaceCompartir(origen = globalThis.location?.origin ?? ''): string {
    return `${origen}/configurador?d=${this.codigo()}`;
  }

  guardar(nombre: string): DisenoGuardado {
    const nuevo: DisenoGuardado = {
      id: crypto.randomUUID(),
      nombre: nombre.trim() || 'Mi torta',
      fecha: new Date().toISOString(),
      codigo: this.codigo(),
    };
    this.guardados.update((l) => [nuevo, ...l]);
    return nuevo;
  }

  borrarGuardado(id: string): void {
    this.guardados.update((l) => l.filter((g) => g.id !== id));
  }
}
