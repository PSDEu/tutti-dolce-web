import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TarjetasDisenos } from '../../shared/tarjetas-disenos/tarjetas-disenos';

/** Galería de inspiración: diseños con permiso de sus autores, para partir de uno. */
@Component({
  selector: 'td-galeria',
  imports: [TarjetasDisenos, RouterLink],
  template: `
    <div class="contenedor pagina">
      <h1>Inspiración</h1>
      <p class="intro">
        Diseños reales de nuestros clientes (solo los que nos dieron permiso para compartirlos).
        Pulsa "Usar como base" para abrirlo en el configurador y cambiar lo que quieras.
      </p>
      <td-tarjetas-disenos [limite]="48" />
      <p class="final">¿No encuentras lo que buscas? <a routerLink="/configurador">Empieza desde cero</a>.</p>
    </div>
  `,
  styles: `
    .pagina { padding: 2.5rem 0; }
    .intro { max-width: 60ch; margin-bottom: 2rem; }
    .final { margin-top: 2rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Galeria {}
