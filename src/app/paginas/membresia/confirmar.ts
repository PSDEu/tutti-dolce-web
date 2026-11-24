import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';

/** Segundo paso del doble opt-in: se llega desde el enlace del email (`?token=…`). */
@Component({
  selector: 'td-confirmar',
  imports: [RouterLink],
  template: `
    <div class="contenedor pagina tarjeta" role="status">
      @switch (estado()) {
        @case ('cargando') {
          <p>Confirmando…</p>
        }
        @case ('ok') {
          <h1>¡Te damos la bienvenida!</h1>
          <p>Tu suscripción está confirmada. Ya formas parte de Tutti Dolce.</p>
          <a routerLink="/configurador" class="boton">Diseña tu torta</a>
        }
        @default {
          <h1>Enlace no válido</h1>
          <p>El enlace ha caducado o ya se usó. Puedes <a routerLink="/membresia">registrarte de nuevo</a>.</p>
        }
      }
    </div>
  `,
  styles: `.pagina { margin-top: 3rem; max-width: 560px; text-align: center; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Confirmar {
  readonly token = input<string>();
  private readonly api = inject(ApiService);
  protected readonly estado = signal<'cargando' | 'ok' | 'error'>('cargando');

  constructor() {
    effect(() => {
      const t = this.token();
      if (!t) {
        this.estado.set('error');
        return;
      }
      this.api.confirmarMiembro(t).subscribe({
        next: () => this.estado.set('ok'),
        error: () => this.estado.set('error'),
      });
    });
  }
}
