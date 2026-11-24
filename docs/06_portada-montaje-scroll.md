# 06 · La portada que se monta al hacer scroll

`src/app/paginas/inicio/` · ruta `/`

## La idea

Mientras el cliente baja por la portada, una torta se monta sola: cae el primer bizcocho, luego el relleno, el segundo piso, la cobertura, el drip y la decoración. Al terminar aparece **"Diseña la tuya"**. Así entiende el configurador antes de usarlo.

## Cómo funciona

1. La sección mide **320 vh** y su contenido es `position: sticky`: la torta se queda fija en pantalla mientras se recorre ese espacio.
2. Al hacer scroll se calcula el progreso (0 → 1):

   ```ts
   const recorrido = seccion.offsetHeight - window.innerHeight;
   const p = (window.scrollY - seccion.offsetTop) / recorrido;
   ```

3. `<td-torta-3d [montaje]="progreso()">` reparte el progreso entre las piezas en su orden: con `n` piezas, la pieza `i` entra entre `i/n` y `(i+1)/n`. Se reutiliza la misma animación de entrada del configurador, pero controlada por el scroll en vez del tiempo.
4. Un texto acompaña cada fase ("Primero, el bizcocho." … "Y la decoración final.").

El progreso se lee con `untracked()` al reconstruir la torta: mover el scroll **no** reconstruye la torta, solo recoloca las piezas.

## Resto de la portada

- **Cómo funciona** en 3 pasos.
- **Diseños de clientes** (`<td-tarjetas-disenos>`): pide a la API los diseños aprobados; si no hay o no responde, muestra diseños de ejemplo. Botón "Usar como base" → abre el configurador con ese diseño. "Ver en 3D" carga el visor solo al pulsarlo.
- **La historia de la dueña** (texto provisional).
- **Registro** en la membresía.
