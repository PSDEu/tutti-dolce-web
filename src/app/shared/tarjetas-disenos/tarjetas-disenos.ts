import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { CATALOGO_TORTAS } from '../../core/catalogo/catalogo';
import { DisenoTorta } from '../../core/diseno/diseno.model';
import { DisenoService } from '../../core/diseno/diseno.service';
import { DISENOS_EJEMPLO } from '../../core/diseno/ejemplos';
import { fichaTecnica } from '../../core/diseno/ficha';
import { calcularPrecio } from '../../core/diseno/precio';
import { CurrencyPipe } from '@angular/common';
import { Torta3d } from '../torta-3d/torta-3d';

interface Tarjeta {
  clave: string;
  nombre: string;
  imagen: string | null;
  diseno: DisenoTorta;
  precio: number;
  resumen: string;
}

/**
 * Diseños de clientes que dieron permiso (y que la pastelería aprobó), con "Usar como base".
 * Si la API no responde o aún no hay ninguno, muestra los diseños de ejemplo.
 */
@Component({
  selector: 'td-tarjetas-disenos',
  imports: [CurrencyPipe, Torta3d],
  template: `
    <div class="rejilla">
      @for (t of tarjetas().slice(0, limite()); track t.clave) {
        <article class="tarjeta">
          <div class="foto">
            @if (t.imagen) {
              <img [src]="t.imagen" [alt]="t.nombre" loading="lazy" />
            } @else if (vista3d() === t.clave) {
              <td-torta-3d [diseno]="t.diseno" controles autoRotar />
            } @else {
              <button type="button" class="ver3d" (click)="vista3d.set(t.clave)">Ver en 3D</button>
            }
          </div>
          <h3>{{ t.nombre }}</h3>
          <p class="resumen">{{ t.resumen }}</p>
          <p class="precio">Desde {{ t.precio | currency: 'EUR' }}</p>
          <button type="button" class="boton secundario pequeno" (click)="usar(t.diseno)">Usar como base</button>
        </article>
      }
    </div>
  `,
  styles: `
    .rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.4rem; }
    .tarjeta { display: flex; flex-direction: column; gap: .4rem; padding: 1rem; }
    .foto { aspect-ratio: 1; border-radius: 10px; overflow: hidden; display: grid; place-items: center;
            background: radial-gradient(ellipse at 50% 40%, #fff, var(--rubor)); }
    .foto img { width: 100%; height: 100%; object-fit: cover; }
    td-torta-3d { width: 100%; height: 100%; }
    .ver3d { font: inherit; border: 1px dashed var(--taupe); background: transparent; color: var(--rosa-profundo);
             border-radius: 999px; padding: .5rem 1rem; cursor: pointer; }
    h3 { margin: .4rem 0 0; font-size: 1.25rem; }
    .resumen { margin: 0; font-size: .85rem; color: var(--tinta); opacity: .8; }
    .precio { margin: 0 0 .4rem; color: var(--rosa-profundo); font-weight: 700; }
    .boton { margin-top: auto; align-self: flex-start; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetasDisenos {
  readonly limite = input(8);
  private readonly router = inject(Router);
  private readonly disenos = inject(DisenoService);
  protected readonly vista3d = signal<string | null>(null);

  private readonly ejemplos: Tarjeta[] = DISENOS_EJEMPLO.map((e, i) => this.tarjeta(`ej${i}`, e.nombre, null, e.diseno));

  protected readonly tarjetas = toSignal(
    inject(ApiService)
      .disenosPublicos()
      .pipe(
        map((lista) => (lista.length ? lista.map((p) => this.tarjeta(p.codigo, p.nombre, p.imagen, p.diseno)) : this.ejemplos)),
        catchError(() => of(this.ejemplos)),
      ),
    { initialValue: this.ejemplos },
  );

  private tarjeta(clave: string, nombre: string, imagen: string | null, diseno: DisenoTorta): Tarjeta {
    const ficha = fichaTecnica(diseno, CATALOGO_TORTAS);
    const valor = (e: string) => ficha.find((l) => l.etiqueta === e)?.valor ?? '';
    return {
      clave,
      nombre,
      imagen,
      diseno,
      precio: calcularPrecio(diseno, CATALOGO_TORTAS).total,
      resumen: `${valor('Bizcocho')} · ${valor('Relleno')} · ${valor('Cobertura').replace(/ \(.*\)/, '')}`,
    };
  }

  protected usar(d: DisenoTorta): void {
    this.disenos.cargar(d);
    this.router.navigate(['/configurador']);
  }
}
