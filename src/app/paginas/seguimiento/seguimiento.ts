import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, ESTADOS_PEDIDO, Pedido } from '../../core/api/api.service';

/** Estado de un pedido: solicitado → confirmado → en preparación → listo → entregado. */
@Component({
  selector: 'td-seguimiento',
  imports: [DatePipe, CurrencyPipe, RouterLink],
  template: `
    <div class="contenedor pagina">
      @if (error()) {
        <div class="tarjeta">
          <h1>No encontramos el pedido</h1>
          <p>Revisa el código y el email. <a routerLink="/mi-cuenta">Volver a intentarlo</a></p>
        </div>
      } @else if (pedido(); as p) {
        <h1>Pedido {{ p.codigo }}</h1>
        @if (p.estado === 'CANCELADO') {
          <p class="aviso error">Este pedido está cancelado. Si tienes dudas, contacta con la pastelería.</p>
        } @else {
          <ol class="linea" aria-label="Estado del pedido">
            @for (e of estados; track e.id; let i = $index) {
              <li [class.hecho]="i <= paso()" [attr.aria-current]="i === paso() ? 'step' : null">
                <span class="punto"></span>{{ e.nombre }}
              </li>
            }
          </ol>
        }
        <div class="rejilla">
          @if (p.imagen) {
            <img [src]="p.imagen" alt="Diseño del pedido" class="tarjeta" />
          }
          <div class="tarjeta">
            <p><strong>Entrega:</strong> {{ p.fechaEntrega | date: 'EEEE d MMMM y' }} · {{ p.entrega === 'RECOGIDA' ? 'Recogida en tienda' : 'A domicilio' }}</p>
            <p>
              <strong>Precio:</strong>
              @if (p.precioConfirmado) { {{ p.precioConfirmado | currency: 'EUR' }} (confirmado) }
              @else { {{ p.precioEstimado | currency: 'EUR' }} (orientativo, pendiente de confirmar) }
            </p>
            <dl>
              @for (l of p.ficha; track l.etiqueta) {
                <dt>{{ l.etiqueta }}</dt><dd>{{ l.valor }}</dd>
              }
            </dl>
          </div>
        </div>
      } @else {
        <p>Cargando…</p>
      }
    </div>
  `,
  styles: `
    .pagina { padding: 2.5rem 0; }
    .linea { list-style: none; display: flex; padding: 0; margin: 2rem 0; gap: 0; }
    .linea li { flex: 1; text-align: center; position: relative; font-size: .85rem; color: var(--taupe); padding-top: 1.6rem; }
    .linea li::before { content: ''; position: absolute; top: .45rem; left: -50%; right: 50%; height: 3px; background: var(--rubor); }
    .linea li:first-child::before { display: none; }
    .linea li.hecho { color: var(--salvia-oscuro); font-weight: 700; }
    .linea li.hecho::before { background: var(--salvia); }
    .punto { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 1.1rem; height: 1.1rem; border-radius: 50%; background: var(--rubor); z-index: 1; }
    .hecho .punto { background: var(--salvia-oscuro); }
    .rejilla { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    img.tarjeta { padding: 0; width: 100%; object-fit: contain; background: var(--blanco); }
    dl { display: grid; grid-template-columns: auto 1fr; gap: .3rem 1rem; }
    dt { font-weight: 700; color: var(--salvia-oscuro); } dd { margin: 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Seguimiento {
  readonly codigo = input.required<string>();
  /** Token del enlace del email (`?t=…`). */
  readonly t = input<string>();
  private readonly api = inject(ApiService);
  protected readonly estados = ESTADOS_PEDIDO;
  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly error = signal(false);
  protected readonly paso = computed(() => ESTADOS_PEDIDO.findIndex((e) => e.id === this.pedido()?.estado));

  constructor() {
    effect(() => {
      // Desde "Mi cuenta" llega el email en el estado de la navegación (no en la URL).
      const email = (history.state as { email?: string } | null)?.email;
      this.api.consultarPedido(this.codigo(), { email, token: this.t() }).subscribe({
        next: (p) => this.pedido.set(p),
        error: () => this.error.set(true),
      });
    });
  }
}
