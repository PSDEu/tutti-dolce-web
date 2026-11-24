import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DisenoService } from '../../core/diseno/diseno.service';
import { IdPaso, PASOS } from '../../core/diseno/diseno.model';
import { Torta3d } from '../../shared/torta-3d/torta-3d';
import { CapturaService } from '../../core/diseno/captura.service';

/**
 * Configurador de tortas (el corazón de la web).
 * Ordenador: 3D a la izquierda (~2/3) y pasos a la derecha.
 * Móvil: 3D arriba y los pasos en un panel deslizable abajo.
 * Barra fija con precio en vivo, fecha más próxima y "Ver corte".
 */
@Component({
  selector: 'td-configurador',
  imports: [Torta3d, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './configurador.html',
  styleUrl: './configurador.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Configurador {
  /** Diseño compartido por enlace: `/configurador?d=<código>`. */
  readonly d = input<string>();

  protected readonly s = inject(DisenoService);
  private readonly captura = inject(CapturaService);
  private readonly router = inject(Router);
  protected readonly c = this.s.catalogo;
  protected readonly pasos = PASOS;
  protected readonly paso = signal<IdPaso>('forma');
  protected readonly indice = computed(() => PASOS.findIndex((p) => p.id === this.paso()));
  protected readonly verCorte = signal(false);
  protected readonly panelAbierto = signal(true);
  protected readonly verDesglose = signal(false);
  protected readonly enlaceCopiado = signal(false);
  protected readonly enlaceInvalido = signal(false);
  protected readonly guardado = signal(false);

  protected readonly coberturaActual = computed(() =>
    this.c.coberturas.find((x) => x.id === this.s.diseno().cobertura)!,
  );
  protected readonly pisosPosibles = computed(() => {
    const lista: number[] = [];
    for (let n = this.c.pisos.min; n <= this.c.pisos.max; n++) lista.push(n);
    return lista;
  });

  constructor() {
    effect(() => {
      const codigo = this.d();
      if (codigo) {
        this.enlaceInvalido.set(!this.s.cargarCodigo(codigo));
      }
    });
  }

  protected irA(id: IdPaso): void {
    this.paso.set(id);
    this.panelAbierto.set(true);
  }

  protected mover(delta: number): void {
    const i = Math.min(PASOS.length - 1, Math.max(0, this.indice() + delta));
    this.paso.set(PASOS[i].id);
  }

  protected cambiarMensaje(evento: Event): void {
    this.s.cambiar('mensaje', (evento.target as HTMLInputElement).value.slice(0, this.c.mensaje.maxCaracteres));
  }

  protected guardar(): void {
    const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    this.s.guardar(`Mi torta del ${fecha}`);
    this.guardado.set(true);
    setTimeout(() => this.guardado.set(false), 2500);
  }

  protected async compartir(): Promise<void> {
    const url = this.s.enlaceCompartir();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mi torta Tutti Dolce', text: 'Mira la torta que he diseñado', url });
        return;
      } catch {
        /* el usuario canceló: copiamos el enlace */
      }
    }
    await navigator.clipboard?.writeText(url);
    this.enlaceCopiado.set(true);
    setTimeout(() => this.enlaceCopiado.set(false), 2500);
  }

  protected irAlResumen(torta: Torta3d): void {
    // La foto del pedido es la torta entera: si está cortada, se cierra el corte antes.
    const esperar = this.verCorte() ? 700 : 0;
    this.verCorte.set(false);
    setTimeout(() => {
      this.captura.imagen.set(torta.capturar());
      this.router.navigate(['/resumen']);
    }, esperar);
  }
}
