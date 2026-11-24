# 07 · Resumen del pedido y resto de páginas

## Resumen (`/resumen`)

- **Imagen** del diseño (captura del 3D al pulsar "Encargar"), **ficha técnica** en palabras, **precio orientativo** y **fecha mínima**.
- Botones **Guardar** y **Compartir con enlace**.
- Formulario de solicitud (template-driven con `ngModel`): fecha (no antes de la mínima ni en día cerrado), recogida o domicilio, nombre, email, teléfono, notas.
- Dos casillas **separadas y sin marcar**: permitir compartir el diseño y aceptar la política de privacidad (obligatoria).
- Al enviar se muestra el **código del pedido** (`TD-2026-00001`) y un botón "Seguir mi pedido".

## Seguimiento (`/pedido/:codigo`)

Línea de estados: solicitado → confirmado → en preparación → listo → entregado. Para entrar hace falta:

- el **token** del enlace (`?t=…`, el que llega por email), o
- el **email** del pedido, escrito en "Mi cuenta". El email viaja en el **estado de la navegación** y en una **cabecera HTTP**, nunca en la URL (no queda en el historial ni en los logs).

## Mi cuenta (`/mi-cuenta`)

Diseños guardados en el navegador (abrir / borrar) y formulario para seguir un pedido.

## Inspiración (`/galeria`)

Diseños de clientes que dieron permiso **y** que la pastelería aprobó. "Usar como base" los abre en el configurador.

## Panel de la pastelería (`/admin`)

Protegido con una clave (`ADMIN_KEY`), que se guarda solo durante la sesión del navegador.

| Pestaña | Qué se hace |
|---|---|
| Pedidos | Ver la orden de trabajo (imagen, ficha, cliente, notas, historial) y cambiar de estado; al confirmar se fija el precio final. El cliente recibe un email en cada cambio. |
| Diseños para la galería | Publicar o retirar los diseños que los clientes permitieron compartir. Publicar uno avisa a n8n para preparar el borrador de redes. |
| Borradores para redes | Leer, corregir y **aprobar** o descartar los textos escritos por la IA. Nada se publica sin aprobación. |

## Otras páginas

- **Nosotros** (con el logo animado) y **contacto** (datos provisionales).
- **Privacidad**: borrador de política RGPD pendiente de revisión.
- **Membresía**, **confirmar** y **baja**: ver la guía 09.

Todas las páginas se cargan bajo demanda (`loadComponent`), con título propio en la pestaña del navegador.
