# 09 · Membresía, RGPD y Brevo

## Registro con doble opt-in

1. El cliente rellena `/membresia`: nombre, email, cumpleaños (**solo día y mes**, opcional) y dos casillas **separadas y sin marcar**:
   - "Quiero recibir novedades, ofertas y el regalo de cumpleaños" (newsletter, opcional);
   - "He leído y acepto la política de privacidad" (obligatoria).
2. La API guarda el miembro como `PENDIENTE`, con la fecha de cada consentimiento, y envía un email con un enlace de confirmación (caduca en 48 h).
3. Al pulsarlo (`/membresia/confirmar?token=…`) pasa a `CONFIRMADO`. Solo entonces, si aceptó la newsletter, se da de alta en la lista de Brevo.

Si alguien se registra con un email que ya es miembro confirmado, la respuesta es la misma: no se revela quién es miembro.

## Baja

Cada email comercial lleva un enlace de baja (y la cabecera `List-Unsubscribe` para darse de baja desde el propio gestor de correo). `/membresia/baja?token=…` pide confirmar con un clic, marca `BAJA`, retira el consentimiento y quita el contacto de la lista de Brevo.

## Regalo de cumpleaños

Todos los días a las 9:00 (hora de Madrid) la API busca miembros confirmados, con newsletter aceptada, que cumplen años ese día, y les envía un código de descuento (`CUMPLE-XXXXXX`, 10 % configurable). Se envía **una vez al año** (`ultimo_regalo_anio`). Quien nació el 29 de febrero lo recibe el 28 en los años no bisiestos.

## Brevo

Servicio europeo de email (Francia). La API usa su API v3:

| Uso | Llamada |
|---|---|
| Emails transaccionales | `POST /v3/smtp/email` |
| Alta en la lista de newsletter | `POST /v3/contacts` (con `listIds` y `updateEnabled`) |
| Baja de la lista | `POST /v3/contacts/lists/{id}/contacts/remove` |

Configuración (variables de entorno): `BREVO_API_KEY`, `BREVO_REMITENTE` (un remitente verificado en Brevo) y `BREVO_LISTA_NEWSLETTER` (id de la lista).

**Sin `BREVO_API_KEY` no se envía nada:** los emails se escriben en el log de la API. Así se desarrolla sin mandar correos reales.

Las **newsletters** se diseñan y envían desde el panel de Brevo a la lista "Newsletter", que la API mantiene al día.

## Checklist RGPD

- [x] Doble opt-in.
- [x] Consentimientos separados, sin marcar, con fecha.
- [x] Cumpleaños sin año.
- [x] Enlace de baja en cada email comercial.
- [x] Diseños publicados solo con permiso y sin datos personales.
- [x] Sin cookies de analítica ni fuentes de Google (tipografías servidas desde la propia web).
- [ ] Revisión de un asesor y datos del responsable en la política de privacidad.
