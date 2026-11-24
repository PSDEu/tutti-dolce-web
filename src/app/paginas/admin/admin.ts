import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApiService,
  Borrador,
  DisenoPublico,
  EstadoPedido,
  ESTADOS_PEDIDO,
  Pedido,
} from '../../core/api/api.service';

type Pestana = 'pedidos' | 'disenos' | 'borradores';
const CLAVE = 'td-admin';

/**
 * Panel de la pastelería:
 * - Pedidos: órdenes de trabajo y cambio de estado (con precio final al confirmar).
 * - Diseños: aprobar los que los clientes permitieron compartir antes de que salgan en la galería.
 * - Borradores: textos para redes escritos por IA con la voz de la dueña. Nada se publica sin su aprobación.
 */
@Component({
  selector: 'td-admin',
  imports: [FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {
  private readonly api = inject(ApiService);
  protected readonly estados = [...ESTADOS_PEDIDO, { id: 'CANCELADO' as EstadoPedido, nombre: 'Cancelado' }];
  protected clave = sessionStorage.getItem(CLAVE) ?? '';
  protected readonly entrado = signal(false);
  protected readonly pestana = signal<Pestana>('pedidos');
  protected readonly error = signal<string | null>(null);
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly disenos = signal<DisenoPublico[]>([]);
  protected readonly borradores = signal<Borrador[]>([]);
  protected readonly abierto = signal<string | null>(null);
  /** Cambios pendientes por pedido (estado, precio y nota) antes de guardarlos. */
  protected readonly cambios: Record<string, { estado: EstadoPedido; precio: number | null; nota: string }> = {};

  constructor() {
    if (this.clave) {
      this.entrar();
    }
  }

  protected entrar(): void {
    this.error.set(null);
    this.api.listarPedidos(this.clave).subscribe({
      next: (lista) => {
        sessionStorage.setItem(CLAVE, this.clave);
        this.entrado.set(true);
        this.ponerPedidos(lista);
      },
      error: (e: HttpErrorResponse) => this.fallo(e),
    });
  }

  protected salir(): void {
    sessionStorage.removeItem(CLAVE);
    this.clave = '';
    this.entrado.set(false);
  }

  protected ver(p: Pestana): void {
    this.pestana.set(p);
    this.error.set(null);
    const sub = { error: (e: HttpErrorResponse) => this.fallo(e) };
    if (p === 'pedidos') this.api.listarPedidos(this.clave).subscribe({ ...sub, next: (l) => this.ponerPedidos(l) });
    if (p === 'disenos') this.api.disenosPorModerar(this.clave).subscribe({ ...sub, next: (l) => this.disenos.set(l) });
    if (p === 'borradores') this.api.listarBorradores(this.clave).subscribe({ ...sub, next: (l) => this.borradores.set(l) });
  }

  protected guardarEstado(p: Pedido): void {
    const c = this.cambios[p.id];
    this.api
      .cambiarEstado(this.clave, p.id, { estado: c.estado, nota: c.nota || undefined, precioConfirmado: c.precio })
      .subscribe({
        next: (nuevo) => {
          this.ponerPedidos(this.pedidos().map((x) => (x.id === nuevo.id ? nuevo : x)));
        },
        error: (e: HttpErrorResponse) => this.fallo(e),
      });
  }

  protected moderar(d: DisenoPublico, aprobado: boolean): void {
    this.api.moderarDiseno(this.clave, d.id, aprobado).subscribe({
      next: (nuevo) => this.disenos.update((l) => l.map((x) => (x.id === nuevo.id ? nuevo : x))),
      error: (e: HttpErrorResponse) => this.fallo(e),
    });
  }

  protected decidir(b: Borrador, estado: 'APROBADO' | 'RECHAZADO'): void {
    this.api.actualizarBorrador(this.clave, b.id, { texto: b.texto, estado }).subscribe({
      next: (nuevo) => this.borradores.update((l) => l.map((x) => (x.id === nuevo.id ? nuevo : x))),
      error: (e: HttpErrorResponse) => this.fallo(e),
    });
  }

  protected nombreEstado(id: EstadoPedido): string {
    return this.estados.find((e) => e.id === id)?.nombre ?? id;
  }

  private ponerPedidos(lista: Pedido[]): void {
    for (const p of lista) {
      this.cambios[p.id] = { estado: p.estado, precio: p.precioConfirmado ?? null, nota: '' };
    }
    this.pedidos.set(lista);
  }

  private fallo(e: HttpErrorResponse): void {
    if (e.status === 401 || e.status === 403) {
      this.salir();
      this.error.set('Clave incorrecta.');
    } else {
      this.error.set(e.error?.detail ?? 'No se pudo conectar con el servidor.');
    }
  }
}
