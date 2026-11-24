# Guía del proyecto Tutti Dolce

Cada documento explica un paso del proyecto: qué se hace, por qué se hace así y cómo repetirlo. Están en el orden en que se construyó la web.

| Nº | Tema | Qué aprendes |
|---|---|---|
| 01 | [Preparando el entorno](01_preparando-el-entorno.md) | Node LTS, Angular CLI, `ng new`, GitHub con `gh` |
| 02 | [Primer componente: la intro del logo](02_componente-intro-logo.md) | Cómo crear un componente standalone, inputs/outputs con signals, animaciones CSS |
| 03 | [Catálogo, precio, reglas y fecha](03_catalogo-precio-reglas-fecha.md) | Datos en JSON, funciones puras, motor de reglas, tests con Vitest |
| 04 | [La torta en 3D con Three.js](04_torta-3d-threejs.md) | Escena de estudio, extrusiones, materiales, vista en corte, animaciones |
| 05 | [El configurador](05_configurador.md) | Estado con signals, pasos, barra de precio, panel deslizable en móvil |
| 06 | [La portada que se monta al hacer scroll](06_portada-montaje-scroll.md) | `position: sticky`, progreso del scroll, montaje pieza a pieza |
| 07 | [Resumen, pedido y resto de páginas](07_resumen-y-paginas.md) | Formularios, captura del 3D, seguimiento, galería, panel de la pastelería |
| 08 | [La API con Spring Boot](08_backend-spring-boot.md) | Entidades, estados del pedido, Flyway, errores RFC 9457, Testcontainers |
| 09 | [Membresía, RGPD y Brevo](09_membresia-rgpd-brevo.md) | Doble opt-in, consentimientos, cumpleaños, emails |
| 10 | [Automatizaciones con n8n e IA](10_automatizaciones-n8n-ia.md) | Eventos, borradores con Claude con la voz de la dueña, aprobación |
| 11 | [Puesta en marcha y despliegue](11_puesta-en-marcha.md) | Docker Compose, variables de entorno, producción |
| 12 | [Pendientes antes de publicar](12_pendientes.md) | Lo que debe aportar o revisar la pastelería |

La referencia técnica de cada clase y componente se genera con `yarn docs` (Compodoc).
