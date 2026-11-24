import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IntroLogo } from '../../shared/intro-logo/intro-logo';

/**
 * Nosotros y contacto.
 * TEXTOS Y DATOS DE CONTACTO PROVISIONALES: sustituir por los reales de la pastelería.
 */
@Component({
  selector: 'td-nosotros',
  imports: [IntroLogo, RouterLink],
  template: `
    <div class="contenedor pagina">
      <div class="cabeza">
        <td-intro-logo tamano="min(60vw, 280px)" />
        <div>
          <h1>Nosotros</h1>
          <p>
            Somos una pastelería artesanal. Cada torta se hornea a mano, con ingredientes de verdad y
            el tiempo que necesita. Creemos que una torta es parte de un recuerdo, por eso queremos que la
            diseñes con nosotros.
          </p>
          <p>
            La web te deja verla en 3D, también por dentro, antes de encargarla: así lo que imaginas y lo que
            recibes es lo mismo.
          </p>
        </div>
      </div>

      <section id="contacto" class="tarjeta contacto" aria-labelledby="contacto-titulo">
        <h2 id="contacto-titulo">Contacto</h2>
        <dl>
          <dt>Dirección</dt><dd>[Dirección de la pastelería]</dd>
          <dt>Horario</dt><dd>Martes a domingo · 9:00 – 20:00 (lunes cerrado)</dd>
          <dt>Teléfono</dt><dd>[Teléfono]</dd>
          <dt>Email</dt><dd>[Email de contacto]</dd>
          <dt>Instagram</dt><dd>[&#64;cuenta]</dd>
        </dl>
        <a routerLink="/configurador" class="boton">Diseña tu torta</a>
      </section>
    </div>
  `,
  styles: `
    .pagina { padding: 2.5rem 0; }
    .cabeza { display: grid; grid-template-columns: auto 1fr; gap: 2.5rem; align-items: center; margin-bottom: 3rem; }
    @media (max-width: 760px) { .cabeza { grid-template-columns: 1fr; } }
    .contacto { max-width: 640px; }
    dl { display: grid; grid-template-columns: auto 1fr; gap: .4rem 1.2rem; margin-bottom: 1.5rem; }
    dt { font-weight: 700; color: var(--salvia-oscuro); }
    dd { margin: 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nosotros {}
