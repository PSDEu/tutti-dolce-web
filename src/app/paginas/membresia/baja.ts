import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';

/** Baja de la newsletter desde el enlace de cada email (`?token=…`). Se confirma con un clic. */
@Component({
  selector: 'td-baja',
  imports: [RouterLink],
  template: `
    <div class="contenedor pagina tarjeta" role="status">
      @switch (estado()) {
        @case ('ok') {
          <h1>Te hemos dado de baja</h1>
          <p>No volverás a recibir emails nuestros. Si cambias de idea, puedes <a routerLink="/membresia">volver a unirte</a>.</p>
        }
        @case ('error') {
          <h1>Enlace no válido</h1>
          <p>No hemos encontrado tu suscripción. Escríbenos y lo resolvemos.</p>
        }
        @default {
          <h1>¿Darte de baja?</h1>
          <p>Dejarás de recibir la newsletter y el regalo de cumpleaños.</p>
          <button type="button" class="boton" [disabled]="!token() || estado() === 'enviando'" (click)="confirmar()">
            Sí, darme de baja
          </button>
        }
      }
    </div>
  `,
  styles: `.pagina { margin-top: 3rem; max-width: 560px; text-align: center; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Baja {
  readonly token = input<string>();
  private readonly api = inject(ApiService);
  protected readonly estado = signal<'pregunta' | 'enviando' | 'ok' | 'error'>('pregunta');

  protected confirmar(): void {
    this.estado.set('enviando');
    this.api.darDeBaja(this.token()!).subscribe({
      next: () => this.estado.set('ok'),
      error: () => this.estado.set('error'),
    });
  }
}
