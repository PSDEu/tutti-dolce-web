import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IntroLogo } from './shared/intro-logo/intro-logo';

const CLAVE_INTRO = 'td-intro-vista';

/** Componente raíz: cabecera, contenido de cada ruta, pie y la intro del logo al entrar. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IntroLogo],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  /** La intro se muestra una vez por sesión del navegador. */
  protected readonly mostrarIntro = signal(!sessionStorage.getItem(CLAVE_INTRO));
  protected readonly menuAbierto = signal(false);
  protected readonly anio = new Date().getFullYear();
  /** En el configurador no hay pie: ocupa toda la pantalla. */
  protected readonly pantallaCompleta = toSignal(
    inject(Router).events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects.startsWith('/configurador')),
    ),
    { initialValue: false },
  );

  protected introTerminada(): void {
    sessionStorage.setItem(CLAVE_INTRO, '1');
    this.mostrarIntro.set(false);
  }
}
