import { Shape, Vector2 } from 'three';

/**
 * Contornos 2D de las formas de bizcocho. Se extruyen hacia arriba para hacer cada piso.
 * Todas las formas caben en un círculo de radio `r` y están centradas en (0, 0).
 */
export function crearContorno(forma: string, r: number): Shape {
  switch (forma) {
    case 'cuadrada':
      return rectanguloRedondeado(r * 0.86, r * 0.16);
    case 'corazon':
      return corazon(r);
    default: {
      const s = new Shape();
      s.absarc(0, 0, r, 0, Math.PI * 2, false);
      return s;
    }
  }
}

function rectanguloRedondeado(m: number, radio: number): Shape {
  const s = new Shape();
  s.moveTo(-m + radio, -m);
  s.lineTo(m - radio, -m);
  s.quadraticCurveTo(m, -m, m, -m + radio);
  s.lineTo(m, m - radio);
  s.quadraticCurveTo(m, m, m - radio, m);
  s.lineTo(-m + radio, m);
  s.quadraticCurveTo(-m, m, -m, m - radio);
  s.lineTo(-m, -m + radio);
  s.quadraticCurveTo(-m, -m, -m + radio, -m);
  return s;
}

/** Corazón con la punta hacia -y (hacia el cliente después de girar la geometría). */
function corazon(r: number): Shape {
  const k = r / 1.05;
  const s = new Shape();
  s.moveTo(0, -1.0 * k);
  s.bezierCurveTo(0.35 * k, -0.62 * k, 1.05 * k, -0.2 * k, 1.0 * k, 0.32 * k);
  s.bezierCurveTo(0.96 * k, 0.78 * k, 0.45 * k, 1.02 * k, 0, 0.62 * k);
  s.bezierCurveTo(-0.45 * k, 1.02 * k, -0.96 * k, 0.78 * k, -1.0 * k, 0.32 * k);
  s.bezierCurveTo(-1.05 * k, -0.2 * k, -0.35 * k, -0.62 * k, 0, -1.0 * k);
  return s;
}

/** Puntos del contorno a distancias iguales (para colocar drip, borlas, bordes…). */
export function puntosContorno(contorno: Shape, n: number): Vector2[] {
  return contorno.getSpacedPoints(n).slice(0, n);
}

/**
 * Distancia del centro al borde en una dirección (ángulo en el plano del contorno).
 * Se usa para dibujar las "tapas" del corte.
 */
export function radioEnDireccion(contorno: Shape, angulo: number): number {
  const puntos = contorno.getSpacedPoints(360);
  let mejor = 0;
  let menorDif = Infinity;
  for (const p of puntos) {
    let dif = Math.abs(Math.atan2(p.y, p.x) - angulo);
    dif = Math.min(dif, Math.PI * 2 - dif);
    if (dif < menorDif) {
      menorDif = dif;
      mejor = p.length();
    }
  }
  return mejor;
}

/** Copia de un contorno escalada desde el centro (para la cobertura o el relleno). */
export function escalarContorno(contorno: Shape, factor: number): Shape {
  const puntos = contorno.getSpacedPoints(160).map((p) => p.clone().multiplyScalar(factor));
  return new Shape(puntos);
}
