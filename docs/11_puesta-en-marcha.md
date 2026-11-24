# 11 · Puesta en marcha y despliegue

## Desarrollo en local

1. Base de datos:

   ```powershell
   docker compose up -d db
   ```

2. API (con el JDK 25):

   ```powershell
   cd backend; $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.5.10002-hotspot"; $env:ADMIN_KEY = "una-clave"; .\mvnw spring-boot:run
   ```

3. Web:

   ```powershell
   yarn start
   ```

   http://localhost:4200 · el panel en http://localhost:4200/admin con la clave `ADMIN_KEY`.

Sin Brevo configurado, los emails (confirmaciones, avisos de pedido) aparecen en la consola de la API.

## Todo con Docker

1. Copia `backend/.env.example` a `.env` (en la raíz del repo) y rellena las claves. **`.env` no se sube a git.**
2. `docker compose up -d` levanta:

| Servicio | Puerto | Qué es |
|---|---|---|
| `db` | 5432 | PostgreSQL 19 (datos en el volumen `datos-db`) |
| `api` | 8080 | La API (se compila dentro del contenedor) |
| `n8n` | 5678 | n8n; importa `automatizaciones/n8n/tutti-dolce-eventos.json` |

## Producción (propuesta)

- **Web:** `yarn build` genera `dist/tutti-dolce-web/browser`, una web estática. Se sirve con cualquier hosting estático o con un Nginx que además redirija `/api` a la API. Configurar el servidor para devolver `index.html` en las rutas de Angular (`/configurador`, `/pedido/…`).
- **API + base de datos + n8n:** el mismo `docker-compose.yml` en un servidor (VPS en la UE), con HTTPS delante (Caddy o Nginx) y copias de seguridad diarias de PostgreSQL (`pg_dump`).
- **Variables:** `WEB_URL` con el dominio real (se usa en los enlaces de los emails), `ADMIN_KEY` larga y aleatoria, claves de Brevo y Claude.
- **Brevo:** verificar el dominio del remitente (SPF/DKIM).
