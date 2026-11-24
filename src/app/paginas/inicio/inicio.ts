import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DISENOS_EJEMPLO } from '../../core/diseno/ejemplos';
import { TarjetasDisenos } from '../../shared/tarjetas-disenos/tarjetas-disenos';
import { Torta3d } from '../../shared/torta-3d/torta-3d';

/**
 * Inicio: la torta 3D se monta sola al hacer scroll (bizcocho, relleno, pisos, cobertura,
 * drip y decoración). Al terminar aparece "Diseña la tuya".
 */
@Component({
  selector: 'td-inicio',
  imports: [Torta3d, RouterLink, TarjetasDisenos],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:scroll)': 'alHacerScroll()' },
})
export class Inicio {
  protected readonly torta = { ...DISENOS_EJEMPLO[1].diseno, mensaje: '' };
  protected readonly progreso = signal(0);
  private readonly portada = viewChild.required<ElementRef<HTMLElement>>('portada');

  protected readonly fases = [
    'Primero, el bizcocho.',
    'Después, el relleno.',
    'Piso a piso.',
    'La cobertura lo envuelve todo.',
    'Un drip de chocolate.',
    'Y la decoración final.',
  ];

  protected faseActual(): number {
    return Math.min(this.fases.length - 1, Math.floor(this.progreso() * this.fases.length));
  }

  protected alHacerScroll(): void {
    const el = this.portada().nativeElement;
    const recorrido = el.offsetHeight - window.innerHeight;
    const p = recorrido > 0 ? (window.scrollY - el.offsetTop) / recorrido : 1;
    this.progreso.set(Math.min(1, Math.max(0, p)));
  }
}
