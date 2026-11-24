import { CatalogoTortas } from '../catalogo/catalogo.model';
import { DisenoTorta } from './diseno.model';

export interface LineaFicha {
  etiqueta: string;
  valor: string;
}

const nombre = (lista: { id: string; nombre: string }[], id: string | null) =>
  lista.find((o) => o.id === id)?.nombre ?? '—';

/**
 * Ficha técnica del diseño en palabras: la ve el cliente en el resumen y la recibe
 * la pastelería como orden de trabajo.
 */
export function fichaTecnica(d: DisenoTorta, c: CatalogoTortas): LineaFicha[] {
  const tamano = c.tamanos.find((t) => t.id === d.tamano)!;
  const lineas: LineaFicha[] = [
    { etiqueta: 'Forma', valor: nombre(c.formas, d.forma) },
    { etiqueta: 'Tamaño', valor: `${tamano.nombre} · ${tamano.diametroCm} cm · ${tamano.raciones} raciones` },
    { etiqueta: 'Bizcocho', valor: nombre(c.bizcochos, d.bizcocho) },
    { etiqueta: 'Pisos', valor: String(d.pisos) },
    { etiqueta: 'Relleno', valor: d.relleno ? nombre(c.rellenos, d.relleno) : 'Sin relleno' },
    { etiqueta: 'Cobertura', valor: `${nombre(c.coberturas, d.cobertura)} (${d.colorCobertura})` },
    { etiqueta: 'Acabado', valor: nombre(c.acabados, d.acabado) },
    { etiqueta: 'Drip', valor: d.drip ? nombre(c.drips, d.drip) : 'No' },
    {
      etiqueta: 'Decoración con manga',
      valor: d.decoraciones.length
        ? `${d.decoraciones.map((x) => nombre(c.decoracionesManga, x)).join(', ')} (${d.colorManga})`
        : 'No',
    },
    { etiqueta: 'Toppers', valor: d.toppers.length ? d.toppers.map((x) => nombre(c.toppers, x)).join(', ') : 'No' },
    { etiqueta: 'Mensaje', valor: d.mensaje.trim() ? `"${d.mensaje.trim()}"` : 'Sin mensaje' },
  ];
  return lineas;
}
