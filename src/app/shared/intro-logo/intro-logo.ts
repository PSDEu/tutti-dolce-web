import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

/** Una capa PNG del logo con su posición en % dentro del disco (de `posiciones.json`). */
interface Capa {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Tamaño de la captura original del logo, en píxeles (las posiciones se pasan a %). */
const LADO = 845;
const POSICIONES: Record<string, [number, number, number, number]> = {
  ring: [77, 63, 687, 719],
  stems_tl: [113, 108, 283, 266],
  stems_br: [444, 422, 303, 325],
  tutti: [279, 222, 347, 184],
  whisk: [566, 205, 67, 95],
  dolce: [204, 402, 443, 164],
  pasteleria: [209, 579, 338, 47],
  rose_tl: [169, 153, 119, 119],
  rose_br: [570, 556, 124, 126],
};

/**
 * Intro animada del logo de Tutti Dolce.
 *
 * - Nueve capas PNG que se animan solo con CSS (no hace falta JavaScript para la animación).
 * - `modo="intro"`: capa a pantalla completa que desaparece sola y se puede saltar. No bloquea la navegación.
 * - `modo="logo"`: el logo animado dentro de la página, sin capa.
 * - Respeta `prefers-reduced-motion`.
 */
@Component({
  selector: 'td-intro-logo',
  templateUrl: './intro-logo.html',
  styleUrl: './intro-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.intro]': "modo() === 'intro'",
    '[class.saliendo]': 'saliendo()',
    '(click)': 'saltar()',
    '(keydown.escape)': 'saltar()',
    '(animationend)': 'alTerminar($event)',
  },
})
export class IntroLogo {
  /** "intro" (pantalla completa, se cierra sola) o "logo" (incrustado). */
  readonly modo = input<'intro' | 'logo'>('logo');
  /** Tamaño máximo del logo. */
  readonly tamano = input('min(78vmin, 520px)');
  /** Se emite cuando la intro termina o se salta. */
  readonly terminada = output<void>();

  protected readonly saliendo = signal(false);
  protected readonly capas: Capa[] = Object.entries(POSICIONES).map(([id, [x, y, w, h]]) => ({
    id,
    left: (x / LADO) * 100,
    top: (y / LADO) * 100,
    width: (w / LADO) * 100,
    height: (h / LADO) * 100,
  }));

  protected saltar(): void {
    if (this.modo() === 'intro' && !this.saliendo()) {
      this.saliendo.set(true);
    }
  }

  protected alTerminar(evento: AnimationEvent): void {
    if (this.modo() !== 'intro') return;
    if (evento.animationName.endsWith('brillo')) {
      // La animación del logo termina con el brillo: esperamos un poco y salimos.
      setTimeout(() => this.saltar(), 500);
    }
    if (evento.animationName.endsWith('salida')) {
      this.terminada.emit();
    }
  }
}
