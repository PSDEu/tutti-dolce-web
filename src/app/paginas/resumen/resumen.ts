import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Pedido } from '../../core/api/api.service';
import { CapturaService } from '../../core/diseno/captura.service';
import { DisenoService } from '../../core/diseno/diseno.service';
import { desdeIso, fechaValida } from '../../core/diseno/fecha-entrega';
import { fichaTecnica } from '../../core/diseno/ficha';
import { Torta3d } from '../../shared/torta-3d/torta-3d';

/**
 * Resumen del pedido: imagen + ficha técnica + fecha + precio,
 * y los botones guardar, compartir y enviar la solicitud a la pastelería.
 */
@Component({
  selector: 'td-resumen',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, Torta3d],
  templateUrl: './resumen.html',
  styleUrl: './resumen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Resumen {
  protected readonly s = inject(DisenoService);
  private readonly api = inject(ApiService);
  protected readonly imagen = inject(CapturaService).imagen;
  protected readonly ficha = computed(() => fichaTecnica(this.s.diseno(), this.s.catalogo));

  protected readonly datos = {
    fecha: this.s.fechaMinimaIso(),
    entrega: 'RECOGIDA' as 'RECOGIDA' | 'DOMICILIO',
    direccion: '',
    nombre: '',
    email: '',
    telefono: '',
    notas: '',
    permitePublicar: false,
    aceptaPrivacidad: false,
  };

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly guardado = signal(false);
  protected readonly copiado = signal(false);

  protected fechaCorrecta(iso: string): boolean {
    return !!iso && fechaValida(desdeIso(iso), this.s.diseno(), this.s.catalogo);
  }

  protected guardar(): void {
    this.s.guardar(this.datos.nombre ? `Torta para ${this.datos.nombre}` : 'Mi torta');
    this.guardado.set(true);
  }

  protected async compartir(): Promise<void> {
    await navigator.clipboard?.writeText(this.s.enlaceCompartir());
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2500);
  }

  protected enviar(): void {
    this.error.set(null);
    if (!this.fechaCorrecta(this.datos.fecha)) {
      this.error.set('Elige una fecha a partir de la fecha mínima y que no sea un día cerrado.');
      return;
    }
    this.enviando.set(true);
    this.api
      .crearPedido({
        diseno: this.s.diseno(),
        ficha: this.ficha(),
        precioEstimado: this.s.presupuesto().total,
        fechaEntrega: this.datos.fecha,
        entrega: this.datos.entrega,
        direccion: this.datos.entrega === 'DOMICILIO' ? this.datos.direccion : undefined,
        nombre: this.datos.nombre.trim(),
        email: this.datos.email.trim(),
        telefono: this.datos.telefono.trim(),
        notas: this.datos.notas.trim() || undefined,
        imagen: this.imagen(),
        permitePublicar: this.datos.permitePublicar,
        aceptaPrivacidad: this.datos.aceptaPrivacidad,
      })
      .subscribe({
        next: (p) => {
          this.pedido.set(p);
          this.enviando.set(false);
          window.scrollTo({ top: 0 });
        },
        error: (e: HttpErrorResponse) => {
          this.enviando.set(false);
          this.error.set(
            e.status === 0 || e.status >= 500
              ? 'No hemos podido conectar con la pastelería. Guarda tu diseño y vuelve a intentarlo en un rato.'
              : (e.error?.detail ?? 'Revisa los datos del formulario.'),
          );
        },
      });
  }
}
