import datos from './tortas.json';
import { CatalogoTortas } from './catalogo.model';

/** Catálogo de tortas cargado desde `tortas.json` (se incluye en el build). */
export const CATALOGO_TORTAS: CatalogoTortas = datos as CatalogoTortas;

/** Busca una opción por id y falla con un mensaje claro si no existe. */
export function buscar<T extends { id: string }>(lista: T[], id: string, que: string): T {
  const opcion = lista.find((o) => o.id === id);
  if (!opcion) {
    throw new Error(`No existe la opción "${id}" en ${que}`);
  }
  return opcion;
}
