import { CatalogoTortas } from '../catalogo/catalogo.model';
import { DisenoTorta, normalizarDiseno } from './diseno.model';

/**
 * Convierte un diseño en un código corto para la URL (JSON → UTF-8 → base64url) y al revés.
 * Así se puede compartir un diseño con un enlace sin necesidad de guardarlo en el servidor.
 */
export function codificarDiseno(d: DisenoTorta): string {
  const bytes = new TextEncoder().encode(JSON.stringify(d));
  let binario = '';
  bytes.forEach((b) => (binario += String.fromCharCode(b)));
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodificarDiseno(codigo: string, c: CatalogoTortas): DisenoTorta | null {
  try {
    const b64 = codigo.replace(/-/g, '+').replace(/_/g, '/');
    const binario = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(binario, (ch) => ch.charCodeAt(0));
    return normalizarDiseno(JSON.parse(new TextDecoder().decode(bytes)), c);
  } catch {
    return null;
  }
}
