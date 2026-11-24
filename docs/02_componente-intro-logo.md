# 02 · Primer componente: la intro animada del logo

Convertimos la animación del logo (`branding/logo-intro/tutti-dolce-intro.html`) en un componente Angular reutilizable: `<td-intro-logo>`.

## ¿Cómo crear un componente?

Con el CLI:

```powershell
npx ng generate component shared/intro-logo --flat --skip-tests
```

Angular 22 crea tres archivos: `intro-logo.ts` (la clase), `intro-logo.html` (la plantilla) y `intro-logo.scss` (los estilos). Son **standalone**: no hay módulos, el componente declara lo que usa en `imports`.

## 1. Las capas

El logo solo existe como captura (~845 px), así que se recortó en 9 capas PNG (anillo, tallos, rosas, "tutti", "dolce", batidor, "PASTELERÍA"). Están en `public/logo/` y se sirven como `logo/<capa>.png`.

Las posiciones salen de `posiciones.json` en píxeles; el componente las pasa a porcentajes para que el logo escale a cualquier tamaño:

```ts
left: (x / 845) * 100   // en %
```

## 2. La plantilla: `@for` y estilos enlazados

```html
@for (capa of capas; track capa.id) {
  <img class="capa {{ capa.id }}" [src]="'logo/' + capa.id + '.png'"
       [style.left.%]="capa.left" [style.top.%]="capa.top" ... />
}
```

- `@for` es el **control flow** moderno (sustituye a `*ngFor`). `track` es obligatorio: le dice a Angular cómo identificar cada elemento.
- `[style.left.%]` añade la unidad automáticamente.

## 3. La animación: solo CSS

Cada capa tiene su animación con un retraso (`animation-delay`) que forma una línea de tiempo: el disco aparece, el anillo se dibuja, "tutti" se escribe, el batidor cae, florecen las rosas, aparece "PASTELERÍA" y un brillo cruza el logo. No hace falta JavaScript.

El anillo se "dibuja" con una máscara cónica y una propiedad CSS animable:

```scss
@property --a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.ring { mask-image: conic-gradient(from 0deg, #000 calc(var(--a) - 3deg), transparent var(--a)); }
```

## 4. Inputs y outputs con signals

```ts
readonly modo = input<'intro' | 'logo'>('logo');
readonly tamano = input('min(78vmin, 520px)');
readonly terminada = output<void>();
```

- `input()` crea una **signal** de solo lectura: en la plantilla se lee como `modo()`.
- `output()` sustituye a `@Output() new EventEmitter()`.

Uso:

```html
<td-intro-logo modo="intro" (terminada)="introTerminada()" />   <!-- pantalla completa al entrar -->
<td-intro-logo tamano="280px" />                                <!-- logo dentro de una página -->
```

## 5. Que no bloquee la navegación

- Se cierra sola al terminar el brillo, o al pulsar "Saltar intro", hacer clic o pulsar Escape.
- Se muestra **una vez por sesión** (`sessionStorage`), no en cada página.
- Con "reducir movimiento" activado en el sistema, todas las animaciones duran 0,01 ms: el logo aparece completo al instante.

### Trampa: nombres de animación

Angular "encapsula" los estilos de cada componente y **renombra los `@keyframes`** (por ejemplo `brillo` pasa a algo como `_ngcontent-abc_brillo`). Por eso, al escuchar `animationend`, se compara el final del nombre:

```ts
if (evento.animationName.endsWith('brillo')) { ... }
```

## Resultado

`src/app/shared/intro-logo/` · usado en `app.html` (intro al entrar) y en la página "Nosotros".
