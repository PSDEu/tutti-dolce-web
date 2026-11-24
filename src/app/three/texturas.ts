import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture } from 'three';

/**
 * Texturas generadas por código (sin descargar imágenes): ruido para la miga y el acabado
 * rústico, rayas para el texturizado y el texto del mensaje.
 * Se guardan en caché porque se reutilizan en cada reconstrucción de la torta.
 */
const cache = new Map<string, Texture>();

function lienzo(ancho: number, alto: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  return [c, c.getContext('2d')!];
}

function repetible(t: Texture, rx: number, ry: number): Texture {
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}

/** Ruido suave en escala de grises (mapa de relieve). */
export function texturaRuido(clave: 'miga' | 'rustico'): Texture {
  const id = `ruido-${clave}`;
  if (cache.has(id)) return cache.get(id)!;
  const [c, ctx] = lienzo(256, 256);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  const manchas = clave === 'miga' ? 2600 : 380;
  for (let i = 0; i < manchas; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = clave === 'miga' ? 0.6 + Math.random() * 1.6 : 6 + Math.random() * 22;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const claro = Math.random() > 0.5;
    g.addColorStop(0, claro ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(128,128,128,0)');
    ctx.fillStyle = g;
    // Dibuja también envuelto en los bordes para que la textura se repita sin costuras.
    for (const dx of [-256, 0, 256]) {
      for (const dy of [-256, 0, 256]) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const t = repetible(new CanvasTexture(c), clave === 'miga' ? 3 : 1.5, clave === 'miga' ? 3 : 1.5);
  cache.set(id, t);
  return t;
}

/** Rayas horizontales (acabado texturizado con espátula). */
export function texturaRayas(): Texture {
  const id = 'rayas';
  if (cache.has(id)) return cache.get(id)!;
  const [c, ctx] = lienzo(8, 128);
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  for (let i = 0; i <= 8; i++) {
    g.addColorStop(i / 8, i % 2 ? '#ffffff' : '#404040');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 128);
  const t = repetible(new CanvasTexture(c), 1, 3);
  cache.set(id, t);
  return t;
}

/** Texto con letra manuscrita sobre fondo transparente (mensaje y cartel). */
export function texturaTexto(texto: string, color: string, fondo?: string): CanvasTexture {
  const [c, ctx] = lienzo(1024, 256);
  if (fondo) {
    ctx.fillStyle = fondo;
    ctx.beginPath();
    ctx.roundRect(8, 8, 1008, 240, 40);
    ctx.fill();
  }
  let tam = 130;
  ctx.font = `italic 600 ${tam}px "Cormorant Garamond Variable", Georgia, serif`;
  while (ctx.measureText(texto).width > 940 && tam > 40) {
    tam -= 6;
    ctx.font = `italic 600 ${tam}px "Cormorant Garamond Variable", Georgia, serif`;
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 512, 132);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  t.userData['desechable'] = true; // no está en caché: se libera con la torta
  return t;
}
