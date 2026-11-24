# 08 · La API con Spring Boot

`backend/` · Spring Boot 4.2 · Java 25 · PostgreSQL 19 · Flyway · generado con Spring Initializr.

## Paquetes

```
es.tuttidolce.api
├── config/          ← propiedades tutti.*, filtro del panel (X-Admin-Key)
├── comun/           ← errores (RFC 9457) y generación de tokens/códigos
├── pedidos/         ← Pedido, estados, historial, servicio y controlador
├── disenos/         ← diseños compartidos y galería
├── miembros/        ← membresía, doble opt-in, cumpleaños
├── borradores/      ← textos para redes pendientes de aprobación
└── notificaciones/  ← Brevo (emails), eventos para n8n, plantillas HTML
```

## Endpoints

| Método | Ruta | Para qué |
|---|---|---|
| POST | `/api/pedidos` | Crear un pedido desde la web |
| GET | `/api/pedidos/{codigo}` | Consultar (cabecera `X-Email` o `X-Token`) |
| GET | `/api/disenos/publicos` | Galería (solo aprobados) |
| GET | `/api/disenos/imagen/{codigo}` | Imagen PNG de un diseño aprobado |
| POST | `/api/miembros` | Registro (envía el email de confirmación) |
| POST | `/api/miembros/confirmar` | Confirmar con el token del email |
| POST | `/api/miembros/baja` | Baja con el token de cada email |
| GET | `/api/admin/pedidos` | Panel: pedidos (primero los próximos) |
| PATCH | `/api/admin/pedidos/{id}/estado` | Panel: cambiar estado / fijar precio |
| GET · PATCH | `/api/admin/disenos[/{id}]` | Panel: moderar la galería |
| GET · POST · PATCH | `/api/admin/borradores[/{id}]` | n8n crea borradores; la dueña los aprueba |

`/api/admin/**` exige la cabecera `X-Admin-Key` (comparación en tiempo constante). Sin `ADMIN_KEY` configurada, el panel queda cerrado.

## Estados del pedido

```
SOLICITADO → CONFIRMADO → EN_PREPARACION → LISTO → ENTREGADO
     └──────────┴──────────────┴─────────────┴──→ CANCELADO
```

La transición la valida el propio enum (`EstadoPedido.puedePasarA`); un salto no permitido devuelve **409**. Cada cambio queda en `cambio_estado` con fecha y nota. El **pago online** se añadirá como un estado más (p. ej. `PAGADO` entre confirmado y en preparación) sin rehacer nada.

## Decisiones

- **El precio que manda la web es orientativo.** La pastelería fija el precio final al confirmar. Así las reglas de precio viven en un solo sitio (el catálogo JSON) y nadie puede "colar" un precio.
- **Diseño y ficha en JSONB:** el catálogo puede cambiar sin migraciones. Se guardan como texto con `@ColumnTransformer(write = "?::jsonb")`.
- **Seguimiento por token:** cada pedido tiene un token aleatorio de 256 bits para el enlace del email; el email nunca va en la URL.
- **Emails y n8n asíncronos (`@Async`)** con hilos virtuales: si Brevo o n8n fallan, el pedido se guarda igualmente.
- **Errores en `application/problem+json`** (RFC 9457) con mensajes en español.
- **Reloj inyectable (`Clock`)** para probar fechas y cumpleaños.

## Migraciones

`src/main/resources/db/migration/V1__esquema_inicial.sql`. Flyway las aplica al arrancar; Hibernate solo **valida** el esquema (`ddl-auto: validate`). Un cambio de esquema = un archivo `V2__…sql` nuevo.

## Tests

```powershell
cd backend; .\mvnw test
```

8 tests de integración con **Testcontainers** levantan un `postgres:19` real en Docker y prueban: crear y consultar pedidos, datos inválidos, clave del panel, orden de estados, galería con permiso y aprobación, borradores, doble opt-in y baja, y el regalo de cumpleaños una vez al año.

> En esta laptop `JAVA_HOME` apunta al JDK 21. Para Maven hay que usar el 25:
> `$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.5.10002-hotspot"`

## Probar con Postman o TablePlus

- Postman: importar las rutas de la tabla; para el panel, añadir la cabecera `X-Admin-Key`.
- TablePlus: PostgreSQL en `localhost:5432`, base `tuttidolce`, usuario `tuttidolce`, contraseña la de `.env`.
