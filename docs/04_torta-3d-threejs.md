# 04 · La torta en 3D con Three.js

```
src/app/three/
├── formas.ts      ← contornos 2D: redonda, cuadrada, corazón
├── texturas.ts    ← texturas generadas por código (miga, rústico, rayas, texto)
├── torta-3d.ts    ← construirTorta(diseno): crea todas las piezas
└── escena.ts      ← EscenaTorta: luces, cámara, animaciones, corte, captura
src/app/shared/torta-3d/torta-3d.ts  ← componente <td-torta-3d> que lo usa desde Angular
```

## Por qué geometría generada por código

Las tortas se construyen a partir de formas simples: un contorno 2D (círculo, cuadrado redondeado o corazón) que se **extruye** hacia arriba para hacer cada piso. Ventajas:

- No hay que descargar modelos: carga rápida en móvil.
- Se adapta a cualquier número de pisos, tamaño o forma.
- Los **sabores son materiales**: cambiar de vainilla a chocolate solo cambia el color.

Más adelante, las piezas detalladas modeladas en Blender (boquillas, toppers) se podrán cargar en **glTF/GLB** (con `GLTFLoader`) y sustituir piezas sueltas sin cambiar el resto.

Unidades: 1 unidad = 10 cm. Una torta de 20 cm tiene radio 1.

## Las piezas

`construirTorta()` devuelve un grupo y una lista de **partes** (`plato`, `piso`, `relleno`, `cobertura`, `drip`, `deco`, `topper`, `mensaje`), cada una con:

- `clave`: describe su configuración. Si no cambia entre dos diseños, la pieza no se vuelve a animar.
- `orden`: el orden del montaje en la portada.

| Pieza | Cómo se hace |
|---|---|
| Pisos | `ExtrudeGeometry` del contorno con bisel, material con textura de "miga" |
| Relleno | Extrusión más fina y un 5 % más estrecha |
| Cobertura | Extrusión que envuelve todo; el **naked cake** solo lleva una capa fina arriba |
| Acabado | Mapa de relieve: ruido (rústico) o rayas (texturizado) |
| Drip | Un tubo por el borde (`TubeGeometry`) + gotas (`CapsuleGeometry`) de largo aleatorio |
| Manga | "Picos" con estrías en espiral: `LatheGeometry` deformada (borlas, rosetones, borde) |
| Toppers | Fresas, arándanos, macarons, figura de corazón y cartel con el mensaje |
| Mensaje | Texto dibujado en un `canvas` y usado como textura sobre la torta |

El azar de la decoración usa un generador con **semilla**: al cambiar otra opción, las gotas del drip no "saltan" de sitio.

## Luz de estudio de producto

- `RoomEnvironment` genera reflejos suaves sin descargar una imagen HDR.
- Luz principal cálida con sombras suaves, luz de relleno fría y contraluz.
- Tono `ACESFilmic`, fondo transparente (se ve el crema de la web) y sombra en el suelo con `ShadowMaterial`.
- Resolución limitada a 2× para que vaya fluido en móvil.

## Ver corte

Dos **planos de recorte** quitan una porción (el cuarto de torta que mira a la cámara). Para que el interior se vea macizo, cada piso y relleno tiene unas **tapas**: rectángulos justo sobre el plano de corte, con el mismo material pero **sin recorte** (si no, se recortarían a sí mismas).

Al activar el corte, los planos se desplazan suavemente hasta el centro y, al llegar, aparecen las tapas.

## Animaciones

Cada pieza nueva entra con una animación: los pisos caen con rebote, la cobertura "se extiende" de abajo arriba, el drip resbala. Solo se animan las piezas cuya clave cambió; cambiar el sabor no hace caer los pisos otra vez.

## El componente Angular

```html
<td-torta-3d [diseno]="diseno" [corte]="verCorte" controles />
<td-torta-3d [diseno]="ejemplo" [montaje]="progreso" />   <!-- portada -->
```

- Three.js se carga con `import()` dinámico dentro de `afterNextRender`: no pesa en la primera carga de la web (va en un fragmento aparte de ~130 KB comprimido).
- Un `effect()` reconstruye la torta cuando cambia el diseño.
- `capturar()` devuelve una imagen PNG de la vista (para el resumen y el pedido). Antes de la foto termina las animaciones pendientes.
- Al destruir el componente se libera la memoria de la GPU (`dispose()`).
