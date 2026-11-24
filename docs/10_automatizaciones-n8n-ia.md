# 10 · Automatizaciones con n8n e IA

## Eventos de la API

La API envía cada evento al webhook de n8n (`N8N_WEBHOOK_URL`) con la forma:

```json
{ "evento": "diseno.compartible", "fecha": "…", "datos": { … } }
```

| Evento | Cuándo |
|---|---|
| `pedido.creado` | Llega un pedido nuevo |
| `pedido.estado` | La pastelería cambia el estado |
| `diseno.compartible` | La pastelería **aprueba** un diseño con permiso del cliente |
| `miembro.confirmado` | Alguien confirma su suscripción |
| `borrador.aprobado` | La dueña aprueba un texto para redes |

## Flujo incluido: borradores para redes con la voz de la dueña

`automatizaciones/n8n/tutti-dolce-eventos.json` (importar en n8n: *Workflows → Import from file*).

```
Webhook ─▶ Según el evento ─┬─ diseno.compartible ─▶ Claude escribe ─▶ Sacar el texto ─▶ POST /api/admin/borradores
                            └─ borrador.aprobado  ─▶ Publicar en Instagram ─▶ Marcar como publicado
```

1. Cuando la pastelería aprueba un diseño, n8n pide a **Claude** (`claude-opus-5-5`, esfuerzo `low` porque son textos cortos) una publicación con la voz de la dueña.
2. El texto se guarda como **borrador PENDIENTE** y la pastelería recibe un email.
3. La dueña lo lee en el panel (`/admin` → Borradores), lo corrige si quiere y pulsa **Aprobar y publicar** (o lo descarta).
4. Solo entonces la API emite `borrador.aprobado` y n8n lo publica.

**Nunca se publica nada sin su aprobación**, y la API solo acepta borradores de diseños aprobados.

### La voz de la dueña

En el nodo "Claude escribe el borrador", el prompt de sistema tiene un hueco `[PEGAR AQUÍ PUBLICACIONES REALES DE LA DUEÑA]`: hay que pegar 5–10 publicaciones suyas. El prompt también impide mencionar nombres, datos personales o el mensaje escrito en la torta.

### Detalles de la llamada a Claude

- `POST https://api.anthropic.com/v1/messages` con `x-api-key`, `anthropic-version: 2026-10-21`.
- Tiene activado el **fallback del servidor** (`fallbacks: "default"` + `anthropic-beta: server-side-fallback-2026-07-01`): si el modelo rechaza la petición, la API de Claude lo reintenta con otro modelo adecuado. Se puede quitar borrando esas dos líneas.
- El nodo "Sacar el texto" comprueba `stop_reason` y junta los bloques de tipo `text`.

### Instagram

Los nodos "Publicar en Instagram" y "Marcar como publicado" están **desactivados**. Para activarlos hace falta:

1. Cuenta de **empresa** de Instagram vinculada a una página de Facebook.
2. `INSTAGRAM_USER_ID` e `INSTAGRAM_TOKEN` (Graph API) en `.env`.
3. Que la API sea accesible desde internet: Instagram descarga la imagen de `/api/disenos/imagen/{codigo}`.
4. Completar la publicación con el segundo paso de la Graph API (`/media_publish` con el id que devuelve `/media`).

Hay que activar los **dos** nodos a la vez.

## Variables de n8n

Se pasan en `docker-compose.yml`: `ANTHROPIC_API_KEY`, `TUTTI_API_URL`, `TUTTI_ADMIN_KEY`, `INSTAGRAM_USER_ID`, `INSTAGRAM_TOKEN` (con `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` para leerlas con `$env`).

## Ideas para más flujos

- `pedido.creado` → aviso por WhatsApp/Telegram a la pastelería.
- `pedido.estado` = `ENTREGADO` → a los 2 días, email pidiendo una reseña o una foto.
- `miembro.confirmado` → secuencia de bienvenida en Brevo.
