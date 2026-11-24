import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DisenoTorta } from '../diseno/diseno.model';
import { LineaFicha } from '../diseno/ficha';

/** Estados del pedido. El pago online se añadirá como un estado más. */
export type EstadoPedido = 'SOLICITADO' | 'CONFIRMADO' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

export const ESTADOS_PEDIDO: { id: EstadoPedido; nombre: string }[] = [
  { id: 'SOLICITADO', nombre: 'Solicitado' },
  { id: 'CONFIRMADO', nombre: 'Confirmado' },
  { id: 'EN_PREPARACION', nombre: 'En preparación' },
  { id: 'LISTO', nombre: 'Listo' },
  { id: 'ENTREGADO', nombre: 'Entregado' },
];

export interface NuevoPedido {
  diseno: DisenoTorta;
  ficha: LineaFicha[];
  precioEstimado: number;
  fechaEntrega: string;
  entrega: 'RECOGIDA' | 'DOMICILIO';
  direccion?: string;
  nombre: string;
  email: string;
  telefono: string;
  notas?: string;
  imagen?: string | null;
  permitePublicar: boolean;
  aceptaPrivacidad: boolean;
}

export interface CambioEstado {
  estado: EstadoPedido;
  fecha: string;
  nota?: string;
}

export interface Pedido {
  id: string;
  codigo: string;
  estado: EstadoPedido;
  fechaEntrega: string;
  entrega: 'RECOGIDA' | 'DOMICILIO';
  direccion?: string;
  nombre: string;
  email?: string;
  telefono?: string;
  notas?: string;
  precioEstimado: number;
  precioConfirmado?: number | null;
  ficha: LineaFicha[];
  diseno: DisenoTorta;
  imagen?: string | null;
  tokenSeguimiento?: string;
  creado: string;
  historial: CambioEstado[];
}

export interface DisenoPublico {
  id: string;
  codigo: string;
  nombre: string;
  imagen: string | null;
  diseno: DisenoTorta;
  aprobado?: boolean;
  creado?: string;
}

export interface NuevoMiembro {
  nombre: string;
  email: string;
  cumpleDia: number | null;
  cumpleMes: number | null;
  aceptaNewsletter: boolean;
  aceptaPrivacidad: boolean;
}

export type EstadoBorrador = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'PUBLICADO';

export interface Borrador {
  id: string;
  disenoCodigo: string;
  red: string;
  texto: string;
  estado: EstadoBorrador;
  imagen?: string | null;
  creado: string;
}

/**
 * Cliente de la API de Spring Boot. En desarrollo `/api` se redirige a localhost:8080
 * (ver `proxy.conf.json`). Las rutas `/api/admin/**` necesitan la clave de la pastelería.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  crearPedido(p: NuevoPedido): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.base}/pedidos`, p);
  }

  /** Consulta con el email del pedido o con el token del enlace (`acceso`). Van en cabeceras, no en la URL. */
  consultarPedido(codigo: string, acceso: { email?: string; token?: string }): Observable<Pedido> {
    const cabeceras: Record<string, string> = {};
    if (acceso.email) cabeceras['X-Email'] = acceso.email;
    if (acceso.token) cabeceras['X-Token'] = acceso.token;
    return this.http.get<Pedido>(`${this.base}/pedidos/${encodeURIComponent(codigo)}`, {
      headers: new HttpHeaders(cabeceras),
    });
  }

  disenosPublicos(): Observable<DisenoPublico[]> {
    return this.http.get<DisenoPublico[]>(`${this.base}/disenos/publicos`);
  }

  registrarMiembro(m: NuevoMiembro): Observable<void> {
    return this.http.post<void>(`${this.base}/miembros`, m);
  }

  confirmarMiembro(token: string): Observable<void> {
    return this.http.post<void>(`${this.base}/miembros/confirmar`, { token });
  }

  darDeBaja(token: string): Observable<void> {
    return this.http.post<void>(`${this.base}/miembros/baja`, { token });
  }

  // --- Panel de la pastelería ---------------------------------------------

  private admin(clave: string) {
    return { headers: new HttpHeaders({ 'X-Admin-Key': clave }) };
  }

  listarPedidos(clave: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.base}/admin/pedidos`, this.admin(clave));
  }

  cambiarEstado(
    clave: string,
    id: string,
    cambio: { estado: EstadoPedido; nota?: string; precioConfirmado?: number | null },
  ): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.base}/admin/pedidos/${id}/estado`, cambio, this.admin(clave));
  }

  disenosPorModerar(clave: string): Observable<DisenoPublico[]> {
    return this.http.get<DisenoPublico[]>(`${this.base}/admin/disenos`, this.admin(clave));
  }

  moderarDiseno(clave: string, id: string, aprobado: boolean): Observable<DisenoPublico> {
    return this.http.patch<DisenoPublico>(`${this.base}/admin/disenos/${id}`, { aprobado }, this.admin(clave));
  }

  listarBorradores(clave: string): Observable<Borrador[]> {
    return this.http.get<Borrador[]>(`${this.base}/admin/borradores`, this.admin(clave));
  }

  actualizarBorrador(clave: string, id: string, cambio: { texto: string; estado: EstadoBorrador }): Observable<Borrador> {
    return this.http.patch<Borrador>(`${this.base}/admin/borradores/${id}`, cambio, this.admin(clave));
  }
}
