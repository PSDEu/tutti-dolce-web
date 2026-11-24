# 03 · Catálogo, precio, reglas y fecha de entrega

La lógica del configurador no depende del 3D ni de Angular: son **funciones puras** que reciben un diseño y el catálogo y devuelven un resultado. Así se prueban fácilmente y el día de mañana sirven para galletas o cupcakes.

```
src/app/core/
├── catalogo/
│   ├── tortas.json         ← opciones, precios, antelaciones y reglas (lo edita la pastelería)
│   ├── catalogo.model.ts   ← tipos del catálogo
│   └── catalogo.ts         ← carga el JSON
└── diseno/
    ├── diseno.model.ts     ← qué elige el cliente (DisenoTorta) y los pasos
    ├── precio.ts           ← calcularPrecio()
    ├── reglas.ts           ← validar(), permitido(), corregir()
    ├── fecha-entrega.ts    ← antelacionDias(), fechaEntregaMinima()
    ├── enlace.ts           ← codificar/decodificar un diseño para compartirlo
    ├── ficha.ts            ← ficha técnica en palabras
    ├── diseno.service.ts   ← une todo con signals
    └── logica.spec.ts      ← tests
```

## El catálogo en JSON

Cada opción tiene `id`, `nombre` y `precio`; algunas, más datos (`color`, `antelacionDias`, `frutaFresca`…). Para añadir un sabor de bizcocho basta con añadir una línea:

```json
{ "id": "pistacho", "nombre": "Pistacho", "color": "#B5C48A", "precio": 4 }
```

> **Los valores actuales son de ejemplo.** Precios, antelaciones y reglas los tiene que dar la clienta.

## El diseño solo guarda ids

```ts
interface DisenoTorta {
  forma: string; tamano: string; bizcocho: string; pisos: number;
  relleno: string | null; cobertura: string; colorCobertura: string;
  acabado: string; drip: string | null; decoraciones: string[];
  colorManga: string; toppers: string[]; mensaje: string;
}
```

Al leer un diseño de fuera (un enlace, el navegador) se pasa por `normalizarDiseno()`, que descarta ids desconocidos y rellena lo que falte.

## Precio

`calcularPrecio(diseno, catalogo)` devuelve las líneas del desglose y el total. Lo que depende de la cantidad de masa o crema se multiplica por el **factor del tamaño** (`1` pequeña, `1.4` mediana, `1.9` grande). Es un precio **orientativo**: la pastelería confirma el final al aceptar el pedido.

## Reglas de la pastelería

Las reglas se escriben en el JSON como "si … entonces …":

```json
{
  "id": "fruta-fresca-pisos",
  "mensaje": "Con relleno de fruta fresca la torta admite como máximo 2 pisos.",
  "si": [{ "campo": "rellenoFrutaFresca", "igual": true }],
  "entonces": { "campo": "pisos", "max": 2 }
}
```

- Condiciones: `igual`, `en` (lista), `incluye` (para listas como toppers).
- Restricciones: `max`, `min`, `en`, `noEn`, `noIncluye`.

El motor ofrece tres funciones:

| Función | Para qué |
|---|---|
| `validar()` | Lista de reglas incumplidas (vacía = diseño válido). Sin infracciones no se puede encargar. |
| `permitido(diseno, campo, valor)` | Desactiva las opciones imposibles en el paso que se está editando (p. ej. 3 pisos con fruta fresca). |
| `corregir()` | Si el cliente cambia algo que rompe una regla, ajusta **el otro campo** y avisa ("Hemos ajustado…"). Así nunca se queda bloqueado. |

## Fecha de entrega más próxima

```
antelación = base + (la opción más lenta) + medio día por piso extra (redondeado hacia arriba)
```

- Si se encarga después de la **hora de corte** (14:00), se cuenta desde mañana.
- Si la fecha cae en un **día cerrado** (lunes), pasa al siguiente.

## Compartir con un enlace

`codificarDiseno()` convierte el diseño en texto apto para URL (JSON → UTF-8 → base64url): `/configurador?d=eyJmb3JtYS…`. No hace falta servidor para compartir un diseño.

## Estado con signals

`DisenoService` guarda el diseño en una `signal` y calcula todo con `computed()`:

```ts
readonly presupuesto = computed(() => calcularPrecio(this._diseno(), this.catalogo));
readonly fechaMinima = computed(() => fechaEntregaMinima(this._diseno(), this.catalogo));
```

Cada vez que cambia el diseño, el precio, la fecha y la vista 3D se actualizan solos. Un `effect()` guarda el borrador en `localStorage` para no perderlo al recargar.

## Tests

```powershell
yarn test --watch=false
```

16 tests cubren precio, reglas, correcciones, fechas (hora de corte, días cerrados) y enlaces (con tildes y emojis).
