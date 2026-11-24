import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CATALOGO_TORTAS } from '../../core/catalogo/catalogo';
import { DisenoTorta } from '../../core/diseno/diseno.model';
import type { EscenaTorta } from '../../three/escena';

/**
 * Lienzo 3D de la torta. Envuelve `EscenaTorta` (Three.js) para usarla desde plantillas:
 *
 *   <td-torta-3d [diseno]="d" [corte]="verCorte" controles />
 *
 * Three.js se carga con `import()` dinámico: no pesa en el primer arranque de la web.
 */
@Component({
  selector: 'td-torta-3d',
  template: `
    <canvas #lienzo aria-hidden="true"></canvas>
    @if (cargando()) {
      <p class="cargando">Preparando el horno…</p>
    }
    @if (error()) {
      <p class="cargando">No se puede mostrar el 3D en este navegador.</p>
    }
  `,
  styles: `
    :host { display: block; position: relative; width: 100%; height: 100%; touch-action: pan-y; }
    canvas { display: block; width: 100%; height: 100%; outline: none; }
    .cargando {
      position: absolute; inset: 0; display: grid; place-items: center; margin: 0;
      color: var(--rosa-profundo); font-family: var(--fuente-titulos); font-size: 1.3rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Torta3d {
  readonly diseno = input.required<DisenoTorta>();
  readonly corte = input(false);
  /** Permite girar con ratón o dedo. */
  readonly controles = input(false, { transform: (v: boolean | '') => v !== false });
  readonly autoRotar = input(false, { transform: (v: boolean | '') => v !== false });
  /** Si se da, la torta se monta pieza a pieza según este progreso (0–1). */
  readonly montaje = input<number | null>(null);

  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private readonly escena = signal<EscenaTorta | null>(null);

  constructor() {
    afterNextRender(async () => {
      try {
        const { EscenaTorta } = await import('../../three/escena');
        const escena = new EscenaTorta(this.lienzo().nativeElement, {
          controles: this.controles(),
          autoRotar: this.autoRotar(),
        });
        if (this.montaje() !== null) {
          escena.activarMontaje();
        }
        this.escena.set(escena);
      } catch (e) {
        console.error(e);
        this.error.set(true);
      } finally {
        this.cargando.set(false);
      }
    });

    effect(() => {
      const escena = this.escena();
      escena?.mostrar(this.diseno(), CATALOGO_TORTAS);
      // untracked: cambiar el progreso del montaje no debe reconstruir la torta.
      const p = untracked(this.montaje);
      if (escena && p !== null) {
        escena.montaje(p);
      }
    });
    effect(() => this.escena()?.cortar(this.corte()));
    effect(() => {
      const p = this.montaje();
      if (p !== null) {
        this.escena()?.montaje(p);
      }
    });

    inject(DestroyRef).onDestroy(() => this.escena()?.destruir());
  }

  /** Captura PNG (data URL) de la vista actual, o null si el 3D aún no está listo. */
  capturar(): string | null {
    return this.escena()?.capturar() ?? null;
  }
}
