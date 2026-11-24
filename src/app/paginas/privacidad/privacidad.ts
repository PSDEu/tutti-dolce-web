import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Política de privacidad (RGPD / LOPDGDD).
 * BORRADOR: debe revisarlo un asesor y completarse con los datos del responsable.
 */
@Component({
  selector: 'td-privacidad',
  template: `
    <article class="contenedor pagina">
      <h1>Política de privacidad</h1>
      <p class="aviso">Borrador pendiente de revisión por un asesor legal.</p>

      <h2>Responsable</h2>
      <p>[Nombre o razón social] · [NIF] · [Dirección] · [Email de contacto].</p>

      <h2>Qué datos tratamos y para qué</h2>
      <ul>
        <li><strong>Pedidos:</strong> nombre, email, teléfono, dirección (si hay envío) y el diseño, para preparar y entregar tu pedido. Base legal: ejecución del contrato.</li>
        <li><strong>Membresía y newsletter:</strong> nombre, email y, si nos lo das, el día y el mes de tu cumpleaños (nunca el año), para enviarte novedades y tu regalo de cumpleaños. Base legal: tu consentimiento, que puedes retirar cuando quieras.</li>
        <li><strong>Publicar tu diseño:</strong> solo si marcas la casilla. Publicamos la imagen del diseño, nunca tus datos.</li>
      </ul>

      <h2>Doble confirmación</h2>
      <p>Al unirte te enviamos un email para confirmar que la dirección es tuya. Hasta que no lo confirmes no recibirás nada.</p>

      <h2>Con quién compartimos datos</h2>
      <p>Usamos Brevo (Sendinblue SAS, Francia, UE) para enviar los emails. No vendemos ni cedemos tus datos.</p>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>Los datos de pedidos, el tiempo que exige la normativa fiscal. Los de la newsletter, hasta que te des de baja.</p>

      <h2>Tus derechos</h2>
      <p>
        Puedes acceder, rectificar, suprimir, oponerte, limitar el tratamiento y pedir la portabilidad escribiendo a
        [email]. Cada email incluye un enlace para darte de baja. También puedes reclamar ante la Agencia Española de
        Protección de Datos (aepd.es).
      </p>

      <h2>Cookies y almacenamiento local</h2>
      <p>
        No usamos cookies de publicidad ni de analítica. Guardamos en tu navegador (almacenamiento local) el diseño en
        el que estás trabajando y los que guardas, para que no los pierdas. No salen de tu dispositivo hasta que envías un pedido.
      </p>
    </article>
  `,
  styles: `
    .pagina { padding: 2.5rem 0; max-width: 760px; }
    h2 { font-size: 1.5rem; margin-top: 2rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Privacidad {}
