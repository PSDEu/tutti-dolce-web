import { buscar } from '../catalogo/catalogo';
import { CatalogoTortas } from '../catalogo/catalogo.model';
import { DisenoTorta } from './diseno.model';

export interface LineaPrecio {
  concepto: string;
  importe: number;
}

export interface Presupuesto {
  lineas: LineaPrecio[];
  total: number;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Calcula el precio de un diseño con su desglose.
 * Los extras que dependen de la cantidad de masa o crema se multiplican por el factor del tamaño.
 * Es un precio orientativo: la pastelería lo confirma al aceptar el pedido.
 */
export function calcularPrecio(d: DisenoTorta, c: CatalogoTortas): Presupuesto {
  const tamano = buscar(c.tamanos, d.tamano, 'tamaños');
  const f = tamano.factor;
  const lineas: LineaPrecio[] = [];
  const sumar = (concepto: string, importe: number) => {
    if (importe > 0) {
      lineas.push({ concepto, importe: redondear(importe) });
    }
  };

  sumar(`Torta ${tamano.nombre.toLowerCase()} (${tamano.diametroCm} cm)`, tamano.precio);
  const forma = buscar(c.formas, d.forma, 'formas');
  sumar(`Forma ${forma.nombre.toLowerCase()}`, forma.precio);
  const bizcocho = buscar(c.bizcochos, d.bizcocho, 'bizcochos');
  sumar(`Bizcocho de ${bizcocho.nombre.toLowerCase()}`, bizcocho.precio * f);
  if (d.pisos > 1) {
    sumar(`${d.pisos - 1} piso(s) extra`, (d.pisos - 1) * c.pisos.precioPisoExtra * f);
  }
  if (d.relleno) {
    const relleno = buscar(c.rellenos, d.relleno, 'rellenos');
    const capas = Math.max(1, d.pisos - 1);
    sumar(`Relleno de ${relleno.nombre.toLowerCase()} × ${capas}`, relleno.precio * capas * f);
  }
  const cobertura = buscar(c.coberturas, d.cobertura, 'coberturas');
  sumar(`Cobertura ${cobertura.nombre}`, cobertura.precio * f);
  const acabado = buscar(c.acabados, d.acabado, 'acabados');
  sumar(`Acabado ${acabado.nombre.toLowerCase()}`, acabado.precio * f);
  if (d.drip) {
    const drip = buscar(c.drips, d.drip, 'drips');
    sumar(drip.nombre, drip.precio);
  }
  for (const id of d.decoraciones) {
    const deco = buscar(c.decoracionesManga, id, 'decoraciones');
    sumar(deco.nombre, deco.precio * f);
  }
  for (const id of d.toppers) {
    const topper = buscar(c.toppers, id, 'toppers');
    sumar(topper.nombre, topper.precio);
  }
  if (d.mensaje.trim()) {
    sumar('Mensaje personalizado', c.mensaje.precio);
  }

  return { lineas, total: redondear(lineas.reduce((t, l) => t + l.importe, 0)) };
}
