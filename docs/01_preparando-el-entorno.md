# 01 · Preparando el entorno: instalando Angular

En esta guía preparamos el ordenador, creamos el proyecto Angular de **Tutti Dolce** y lo subimos a GitHub. Al terminar tendrás la web funcionando en `http://localhost:4200`.

Versiones comprobadas el **24 de noviembre de 2026**.

---

## 1. Qué necesitas

| Herramienta | Versión usada | Para qué sirve |
|---|---|---|
| Node.js | 26.13.1 (LTS) | Ejecuta las herramientas de Angular |
| npm | 11.5.1 | Viene con Node; lo usamos para consultar versiones |
| Yarn | 1.22.22 | Gestor de paquetes del proyecto |
| Angular CLI | 22.3.0 | Crea, sirve y compila el proyecto |
| Git | 2.56.1 | Control de versiones |
| GitHub CLI (`gh`) | 2.105.0 | Crea el repositorio desde la terminal |
| VS Code | 1.139.1 | Editor |

## 2. Comprueba lo que ya tienes

Antes de instalar nada, mira qué versiones tienes:

```powershell
node -v
npm -v
ng version
git --version
gh --version
```

> En el proyecto usamos el script `inventario-entorno.ps1`, que hace esto mismo y guarda el resultado en `inventario-entorno.txt`.

## 3. Node.js: usa una versión compatible

Cada versión de Angular exige versiones concretas de Node. **Angular 22 necesita Node ≥ 22.22, ≥ 24.13 o 26.** Con Node 22.14, por ejemplo, el CLI no funciona.

1. Descarga la versión **LTS** desde [nodejs.org](https://nodejs.org) e instálala.
2. Cierra y vuelve a abrir la terminal.
3. Comprueba: `node -v` → `v26.13.1`.

**¿Por qué LTS?** *Long Term Support*: recibe correcciones durante años. Es la adecuada para proyectos reales.

## 4. Instala el Angular CLI

Comprueba primero cuál es la última versión estable:

```powershell
npm view @angular/core version
```

E instala el CLI de forma global:

```powershell
npm install -g @angular/cli
```

## 5. Crea el proyecto

Desde la carpeta donde guardas tus proyectos:

```powershell
ng new tutti-dolce-web
```

Opciones elegidas:

- **Estilos:** SCSS (nos facilitará la paleta de la marca con variables).
- **SSR (renderizado en servidor):** no, por ahora.
- **Gestor de paquetes:** Yarn.

### Qué ha creado

```
tutti-dolce-web/
├── public/              ← archivos estáticos (favicon, imágenes)
├── src/
│   ├── app/
│   │   ├── app.ts         ← componente raíz
│   │   ├── app.html       ← su plantilla
│   │   ├── app.scss       ← sus estilos
│   │   ├── app.config.ts  ← configuración de la aplicación
│   │   ├── app.routes.ts  ← rutas
│   │   └── app.spec.ts    ← test del componente
│   ├── index.html
│   ├── main.ts          ← punto de entrada
│   └── styles.scss      ← estilos globales
├── angular.json
└── package.json
```

### Lo moderno de Angular 22

- **Componentes standalone:** no hay `app.module.ts`. Cada componente declara lo que usa en `imports`.
- **Nombres cortos:** el componente raíz es `App` en `app.ts` (antes `AppComponent` en `app.component.ts`).
- **Signals:** el título ya se guarda en una *signal*, la forma moderna de manejar estado reactivo:

  ```ts
  export class App {
    protected readonly title = signal('tutti-dolce-web');
  }
  ```

- **Vitest** para los tests, en lugar de Karma.

## 6. Sube el proyecto a GitHub

Inicia sesión una sola vez:

```powershell
gh auth login
```

Desde la carpeta del proyecto, crea el repositorio público y conéctalo como `origin`, **sin subir nada todavía**:

```powershell
gh repo create tutti-dolce-web --public --source=. --remote=origin
```

Comprueba a dónde apunta:

```powershell
git remote -v
```

```
origin  https://github.com/<tu-usuario>/tutti-dolce-web.git (fetch)
origin  https://github.com/<tu-usuario>/tutti-dolce-web.git (push)
```

Cuando lo hayas revisado, sube la rama `main`:

```powershell
git push -u origin main
```

`-u` deja `main` enlazada con `origin/main`, así los siguientes `git push` no necesitan más argumentos.

## 7. Abre y arranca el proyecto

```powershell
code .
```

```powershell
ng serve
```

Cuando veas `Local: http://localhost:4200/`, ábrelo en el navegador. Cada vez que guardes un archivo, la página se recarga sola.

---

## Resumen

- [x] Entorno comprobado con un inventario de versiones.
- [x] Node.js LTS compatible con Angular 22.
- [x] Proyecto Angular 22.3 creado con SCSS y Yarn.
- [x] Repositorio en GitHub enlazado y subido.
- [x] Web funcionando en `localhost:4200`.

**Siguiente episodio:** 02 · Primer componente: la intro animada del logo.
