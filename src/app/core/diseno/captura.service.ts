import { Injectable, signal } from '@angular/core';

/** Guarda la última captura del 3D para usarla en el resumen y en el pedido. */
@Injectable({ providedIn: 'root' })
export class CapturaService {
  readonly imagen = signal<string | null>(null);
}
