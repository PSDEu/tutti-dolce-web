import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DisenoService } from '../../core/diseno/diseno.service';

/**
 * Mi cuenta: diseños guardados en este navegador y seguimiento de pedidos.
 * (Fase 2: con la membresía confirmada, los diseños se sincronizarán con el servidor.)
 */
@Component({
  selector: 'td-mi-cuenta',
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="contenedor pagina">
      <h1>Mi cuenta</h1>

      <section class="tarjeta" aria-labelledby="guardados-titulo">
        <h2 id="guardados-titulo">Mis diseños guardados</h2>
        @if (s.guardados().length) {
          <ul class="lista">
            @for (g of s.guardados(); track g.id) {
              <li>
                <div>
                  <strong>{{ g.nombre }}</strong>
                  <small>{{ g.fecha | date: 'd MMM y, HH:mm' }}</small>
                </div>
                <div class="acciones">
                  <button type="button" class="boton pequeno" (click)="abrir(g.codigo)">Abrir</button>
                  <button type="button" class="boton secundario pequeno" (click)="s.borrarGuardado(g.id)" [attr.aria-label]="'Borrar ' + g.nombre">Borrar</button>
                </div>
              </li>
            }
          </ul>
        } @else {
          <p>Aún no has guardado ningún diseño. <a routerLink="/configurador">Diseña tu primera torta</a>.</p>
        }
        <p class="nota">Se guardan en este navegador. Si cambias de dispositivo, usa "Compartir enlace" para llevártelos.</p>
      </section>

      <section class="tarjeta" aria-labelledby="pedido-titulo">
        <h2 id="pedido-titulo">Seguir un pedido</h2>
        <form #f="ngForm" (ngSubmit)="f.valid && seguir()" class="seguir">
          <div class="campo">
            <label for="codigo">Código del pedido</label>
            <input id="codigo" name="codigo" required placeholder="TD-2026-00001" [(ngModel)]="codigo" />
          </div>
          <div class="campo">
            <label for="email">Email del pedido</label>
            <input id="email" name="email" type="email" required email [(ngModel)]="email" />
          </div>
          <button type="submit" class="boton" [disabled]="!f.valid">Ver estado</button>
        </form>
      </section>

      <section class="tarjeta" aria-labelledby="membresia-titulo">
        <h2 id="membresia-titulo">Membresía</h2>
        <p>¿Aún no eres miembro? <a routerLink="/membresia">Únete gratis</a> y recibe un regalo en tu cumpleaños.</p>
      </section>
    </div>
  `,
  styles: `
    .pagina { padding: 2.5rem 0; display: grid; gap: 1.5rem; max-width: 820px; }
    .lista { list-style: none; padding: 0; margin: 0; }
    .lista li { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: .7rem 0; border-bottom: 1px solid var(--rubor); flex-wrap: wrap; }
    .lista small { display: block; color: var(--rosa-profundo); }
    .acciones { display: flex; gap: .5rem; }
    .seguir { display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end; }
    .seguir .boton { margin-bottom: 1rem; }
    @media (max-width: 640px) { .seguir { grid-template-columns: 1fr; } }
    .nota { color: var(--rosa-profundo); font-size: .85rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiCuenta {
  protected readonly s = inject(DisenoService);
  private readonly router = inject(Router);
  protected codigo = '';
  protected email = '';

  protected abrir(codigo: string): void {
    this.router.navigate(['/configurador'], { queryParams: { d: codigo } });
  }

  protected seguir(): void {
    // El email viaja en el estado de la navegación, no en la URL.
    this.router.navigate(['/pedido', this.codigo.trim().toUpperCase()], { state: { email: this.email.trim() } });
  }
}
