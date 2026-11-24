# Tutti Dolce · Web con configurador 3D de tortas

Web de **Tutti Dolce Pastelería**: el cliente diseña su torta en 3D (forma, bizcocho, pisos, relleno, cobertura, decoración…), la ve **por dentro**, conoce el **precio** y la **fecha de entrega** al momento y envía la solicitud a la pastelería como una orden de trabajo clara.

Proyecto construido paso a paso como curso gratuito. Cada paso está explicado en [`docs/`](docs/00_indice.md).

## Qué incluye

| Parte | Tecnología | Dónde |
|---|---|---|
| Web | Angular 22 (standalone, signals, control flow nuevo) | `src/` |
| 3D | Three.js 0.187 (geometría generada por código) | `src/app/three/` |
| Catálogo, precios y reglas | JSON editable sin tocar código | `src/app/core/catalogo/tortas.json` |
| API | Spring Boot 4.2 · Java 25 · PostgreSQL 19 · Flyway | `backend/` |
| Emails y newsletter | Brevo (API v3) | `backend/.../notificaciones/` |
| Automatizaciones | n8n en Docker + Claude para los borradores de redes | `automatizaciones/n8n/` |

## Arrancar en local

Requisitos: Node 26 LTS, Yarn 1.22, Java 25, Docker Desktop.

```powershell
docker compose up -d db
```

```powershell
cd backend; $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.5.10002-hotspot"; .\mvnw spring-boot:run
```

```powershell
yarn install; yarn start
```

Abre http://localhost:4200. La web redirige `/api` a `localhost:8080` (ver `proxy.conf.json`).

Todo con Docker (base de datos, API y n8n): `docker compose up -d` (antes, crea `.env` a partir de `backend/.env.example`).

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `yarn start` | Web en modo desarrollo |
| `yarn test --watch=false` | Tests de la lógica (precio, reglas, fecha, enlaces) |
| `yarn build` | Compilación de producción en `dist/` |
| `yarn docs` | Referencia del código con Compodoc en `documentacion/` |
| `cd backend; .\mvnw test` | Tests de la API contra un PostgreSQL real (Testcontainers) |

## Antes de publicar

Ver [`docs/12_pendientes.md`](docs/12_pendientes.md): precios y reglas reales de la pastelería, textos, datos de contacto, revisión legal y permiso de la clienta para usar su marca.
