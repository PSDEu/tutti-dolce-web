# 05 · El configurador

`src/app/paginas/configurador/` · ruta `/configurador`

## Distribución

- **Ordenador:** rejilla CSS con el 3D (2/3) y el panel de pasos (1/3); abajo, la barra fija.
- **Móvil (< 860 px):** el 3D arriba, el panel debajo con un asa para plegarlo y la barra abajo. Los pasos se desplazan en horizontal para manejarlos con el pulgar.
- En el configurador no se muestra el pie de página: ocupa toda la pantalla.

## Los pasos

Forma (y tamaño) → Bizcocho → Pisos → Relleno → Cobertura (y color) → Acabado (y drip) → Decoración con manga (y color) → Toppers → Mensaje.

Cada paso es un `@case` dentro de un `@switch`. Las opciones son botones; la elegida se marca con `.elegida`, y las imposibles por las reglas se desactivan con `[disabled]="!s.permitido('pisos', n)"`.

```html
@let dis = s.diseno();
<button class="opcion" [class.elegida]="dis.bizcocho === b.id" (click)="s.cambiar('bizcocho', b.id)">
```

`@let` (Angular 18.1+) guarda un valor en la plantilla para no repetir `s.diseno()`.

## La barra fija

- **Precio** en vivo: al pulsarlo se abre el desglose.
- **Lista desde**: la fecha de entrega más próxima.
- **Ver corte / Cerrar corte**.
- **Encargar**: captura el 3D (sin corte) y va al resumen. Se desactiva si el diseño incumple alguna regla.

## Avisos de ajustes

Si una elección obliga a cambiar otra (p. ej. elegir fruta fresca con 4 pisos), el servicio corrige el diseño y el configurador muestra el motivo encima del 3D.

## Guardar y compartir

- **Guardar diseño:** se guarda en el navegador (`localStorage`) y aparece en "Mi cuenta".
- **Compartir enlace:** usa el menú de compartir del móvil (`navigator.share`) o copia el enlace. Al abrir `/configurador?d=…` se carga ese diseño (gracias a `withComponentInputBinding()`, el parámetro `d` llega como `input()` del componente).
