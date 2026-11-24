import {
  BufferGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Plane,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { buscar } from '../core/catalogo/catalogo';
import { CatalogoTortas } from '../core/catalogo/catalogo.model';
import { DisenoTorta } from '../core/diseno/diseno.model';
import { crearContorno, escalarContorno, puntosContorno, radioEnDireccion } from './formas';
import { texturaRayas, texturaRuido, texturaTexto } from './texturas';

/**
 * Construye la torta 3D a partir de un diseño. Todo es geometría generada por código
 * (cilindros y extrusiones), así no hay que descargar modelos y se adapta a cualquier
 * número de pisos o tamaño. Los modelos de Blender (GLB) podrán sustituir piezas sueltas.
 *
 * Unidades: 1 unidad = 10 cm. Una torta de 20 cm tiene radio 1.
 */

export type TipoParte = 'plato' | 'piso' | 'relleno' | 'cobertura' | 'drip' | 'deco' | 'topper' | 'mensaje';

export interface Parte {
  /** Identifica la pieza y su configuración: si no cambia, no se vuelve a animar. */
  clave: string;
  tipo: TipoParte;
  /** Orden en el montaje por scroll de la portada. */
  orden: number;
  objeto: Object3D;
  /** Clave que decide si la pieza se anima al cambiar el diseño (por defecto, `clave`). */
  claveAnimacion?: string;
}

export interface TortaConstruida {
  grupo: Group;
  partes: Parte[];
  /** Altura total (para encuadrar la cámara). */
  alto: number;
  radio: number;
}

export const ALTO_PISO = 0.34;
export const ALTO_RELLENO = 0.07;
export const GROSOR_COBERTURA = 0.045;

/** Generador pseudoaleatorio con semilla: la decoración no "salta" al reconstruir la torta. */
function aleatorio(semilla: number): () => number {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function extruir(contorno: Shape, alto: number, bisel = 0.018): BufferGeometry {
  const g = new ExtrudeGeometry(contorno, {
    depth: alto,
    bevelEnabled: bisel > 0,
    bevelThickness: bisel,
    bevelSize: bisel,
    bevelSegments: 3,
    curveSegments: 64,
  });
  g.rotateX(-Math.PI / 2);
  // ExtrudeGeometry crece en z; tras girarla la base queda en y = 0 (más el bisel).
  g.translate(0, bisel, 0);
  return g;
}

/** "Pico" de manga: una gota con estrías en espiral (boquilla rizada). */
function geometriaManga(radio: number, alto: number, estrias = 8, giro = 5): BufferGeometry {
  const perfil: Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const r = radio * Math.pow(1 - t, 0.75) * (1 + 0.35 * Math.sin(Math.PI * t));
    perfil.push(new Vector2(Math.max(r, 0.0001), alto * t));
  }
  const g = new LatheGeometry(perfil, 40);
  const pos = g.attributes['position'];
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ang = Math.atan2(v.z, v.x);
    const r = Math.hypot(v.x, v.z);
    const t = v.y / alto;
    const nr = r * (1 + 0.2 * Math.cos(estrias * (ang + t * giro)));
    v.x = Math.cos(ang) * nr;
    v.z = Math.sin(ang) * nr;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Punto del contorno 2D → posición 3D (el contorno se dibuja en x/-z). */
const en3d = (p: Vector2, y: number) => new Vector3(p.x, y, -p.y);

function luminancia(hex: string): number {
  const c = new Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

export interface OpcionesConstruccion {
  /** Planos de corte compartidos por todos los materiales (los gestiona la escena). */
  planosCorte: Plane[];
}

export function construirTorta(d: DisenoTorta, c: CatalogoTortas, op: OpcionesConstruccion): TortaConstruida {
  const grupo = new Group();
  const partes: Parte[] = [];
  let orden = 0;
  const tamano = buscar(c.tamanos, d.tamano, 'tamaños');
  const R = tamano.diametroCm / 20;
  const contorno = crearContorno(d.forma, R);
  const clip = { clippingPlanes: op.planosCorte, clipIntersection: true };
  const rnd = aleatorio(7);

  const anadir = (tipo: TipoParte, clave: string, objeto: Object3D, claveAnimacion?: string, ord = orden++) => {
    objeto.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    grupo.add(objeto);
    partes.push({ tipo, clave, objeto, orden: ord, claveAnimacion });
  };

  // Radios del contorno en las dos direcciones del corte (+x y +z del mundo).
  const radioX = radioEnDireccion(contorno, 0);
  const radioZ = radioEnDireccion(contorno, -Math.PI / 2);

  /** Caras planas que "tapan" el corte para que el interior se vea macizo. */
  const tapas = (base: Material, y0: number, alto: number, escala = 1, detras = false): Object3D => {
    const g = new Group();
    // Las tapas están justo sobre el plano de corte: su material no debe recortarse.
    const material = base.clone();
    material.clippingPlanes = null;
    material.side = DoubleSide;
    const off = detras ? -0.0015 : 0.0008;
    const caraX = new Mesh(new PlaneGeometry(radioX * escala, alto), material);
    caraX.position.set((radioX * escala) / 2, y0 + alto / 2, off);
    const caraZ = new Mesh(new PlaneGeometry(radioZ * escala, alto), material);
    caraZ.rotation.y = Math.PI / 2;
    caraZ.position.set(off, y0 + alto / 2, (radioZ * escala) / 2);
    for (const cara of [caraX, caraZ]) {
      cara.userData['tapa'] = true;
      cara.visible = false;
      g.add(cara);
    }
    return g;
  };

  // --- Plato / peana -------------------------------------------------------
  const plato = new Group();
  const porcelana = new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.25, clearcoat: 0.6 });
  const radioPlato = R * (d.forma === 'cuadrada' ? 1.5 : 1.38);
  const disco = new Mesh(new CylinderGeometry(radioPlato, radioPlato * 0.97, 0.05, 72), porcelana);
  disco.position.y = -0.025;
  const pie = new Mesh(new CylinderGeometry(R * 0.35, R * 0.55, 0.35, 48), porcelana);
  pie.position.y = -0.225;
  plato.add(disco, pie);
  anadir('plato', `plato:${d.forma}:${d.tamano}`, plato);

  // --- Pisos y rellenos ----------------------------------------------------
  const bizcocho = buscar(c.bizcochos, d.bizcocho, 'bizcochos');
  const relleno = d.relleno ? buscar(c.rellenos, d.relleno, 'rellenos') : null;
  const matBizcocho = new MeshStandardMaterial({
    color: bizcocho.color,
    roughness: 0.92,
    bumpMap: texturaRuido('miga'),
    bumpScale: 0.6,
    side: DoubleSide,
    ...clip,
  });
  const matRelleno = relleno
    ? new MeshStandardMaterial({ color: relleno.color, roughness: 0.45, side: DoubleSide, ...clip })
    : null;

  // Con un solo piso y relleno, el bizcocho se corta en dos capas con el relleno dentro.
  const capas = d.pisos === 1 && relleno ? [ALTO_PISO * 0.55, ALTO_PISO * 0.55] : Array(d.pisos).fill(ALTO_PISO);
  let y = 0;
  const contornoRelleno = escalarContorno(contorno, 0.95);
  capas.forEach((alto: number, i: number) => {
    const piso = new Group();
    const malla = new Mesh(extruir(contorno, alto - 0.036), matBizcocho);
    piso.add(malla, tapas(matBizcocho, 0, alto));
    piso.position.y = y;
    // Cambiar solo el sabor no vuelve a "dejar caer" el piso.
    const estructura = `${d.forma}:${d.tamano}:${capas.length}`;
    anadir('piso', `piso${i}:${estructura}:${d.bizcocho}`, piso, `piso${i}:${estructura}`);
    y += alto;
    if (matRelleno && i < capas.length - 1) {
      const capa = new Group();
      capa.add(new Mesh(extruir(contornoRelleno, ALTO_RELLENO - 0.02, 0.01), matRelleno));
      capa.add(tapas(matRelleno, 0, ALTO_RELLENO, 0.95));
      capa.position.y = y;
      anadir('relleno', `relleno${i}:${estructura}:${d.relleno}`, capa, `relleno${i}:${estructura}`);
      y += ALTO_RELLENO;
    }
  });
  const altoMasa = y;

  // --- Cobertura -----------------------------------------------------------
  const cobertura = buscar(c.coberturas, d.cobertura, 'coberturas');
  const naked = cobertura.id === 'naked';
  const matCobertura = new MeshPhysicalMaterial({
    color: d.colorCobertura,
    roughness: cobertura.rugosidad,
    clearcoat: cobertura.brillo,
    clearcoatRoughness: 0.15,
    sheen: cobertura.id === 'buttercream' ? 0.4 : 0,
    ...clip,
  });
  if (!naked && d.acabado === 'rustico') {
    matCobertura.bumpMap = texturaRuido('rustico');
    matCobertura.bumpScale = 3;
  } else if (!naked && d.acabado === 'texturizado') {
    matCobertura.bumpMap = texturaRayas();
    matCobertura.bumpScale = 2.5;
  }
  const factorCob = (R + GROSOR_COBERTURA) / R;
  const contornoCob = escalarContorno(contorno, naked ? 0.97 : factorCob);
  const capaCob = new Group();
  let altoTotal: number;
  if (naked) {
    // Naked cake: solo una capa fina de crema encima.
    const tapaCrema = new Mesh(extruir(contornoCob, 0.03, 0.012), matCobertura);
    tapaCrema.position.y = altoMasa;
    capaCob.add(tapaCrema);
    altoTotal = altoMasa + 0.054;
  } else {
    capaCob.add(new Mesh(extruir(contornoCob, altoMasa + GROSOR_COBERTURA - 0.04, 0.02), matCobertura));
    capaCob.add(tapas(matCobertura, 0, altoMasa + GROSOR_COBERTURA, factorCob, true));
    altoTotal = altoMasa + GROSOR_COBERTURA;
  }
  anadir(
    'cobertura',
    `cob:${d.forma}:${d.tamano}:${capas.length}:${d.cobertura}:${d.colorCobertura}:${d.acabado}`,
    capaCob,
  );

  const radioBorde = naked ? R : R + GROSOR_COBERTURA;
  const perimetro = contorno.getLength() * (radioBorde / R);

  // --- Drip ----------------------------------------------------------------
  if (d.drip) {
    const drip = buscar(c.drips, d.drip, 'drips');
    const matDrip = new MeshPhysicalMaterial({ color: drip.color, roughness: 0.2, clearcoat: 1, ...clip });
    const g = new Group();
    const borde = escalarContorno(contorno, radioBorde / R);
    const anillo = puntosContorno(borde, 120).map((p) => en3d(p, altoTotal - 0.01));
    g.add(new Mesh(new TubeGeometry(new CatmullRomCurve3(anillo, true), 160, 0.032, 10, true), matDrip));
    const charco = new Mesh(extruir(escalarContorno(contorno, (radioBorde / R) * 0.985), 0.012, 0.008), matDrip);
    charco.position.y = altoTotal - 0.012;
    g.add(charco);
    const gotas = Math.round(perimetro / 0.13);
    for (const p of puntosContorno(borde, gotas)) {
      const largo = 0.05 + rnd() * 0.22;
      const gota = new Mesh(new CapsuleGeometry(0.026, largo, 4, 10), matDrip);
      const pos = en3d(p, altoTotal - 0.02 - largo / 2);
      // Un pelín hacia fuera para que la gota se apoye en la pared.
      pos.add(new Vector3(p.x, 0, -p.y).normalize().multiplyScalar(0.012));
      gota.position.copy(pos);
      g.add(gota);
    }
    anadir('drip', `drip:${d.drip}:${d.forma}:${d.tamano}:${capas.length}:${d.cobertura}`, g);
  }

  // --- Decoración con manga ------------------------------------------------
  const matManga = new MeshPhysicalMaterial({ color: d.colorManga, roughness: 0.7, sheen: 0.3, ...clip });
  const claveBase = `${d.forma}:${d.tamano}:${capas.length}:${d.cobertura}:${d.colorManga}`;
  if (d.decoraciones.includes('borlas')) {
    const g = new Group();
    const geo = geometriaManga(0.06, 0.11);
    const n = Math.round(perimetro / 0.15);
    for (const p of puntosContorno(escalarContorno(contorno, 0.86), n)) {
      const m = new Mesh(geo, matManga);
      m.position.copy(en3d(p, altoTotal - 0.005));
      g.add(m);
    }
    anadir('deco', `borlas:${claveBase}`, g);
  }
  if (d.decoraciones.includes('rosetones')) {
    const g = new Group();
    const geo = geometriaManga(0.11, 0.09, 10, 9);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      const m = new Mesh(geo, matManga);
      m.position.set(Math.cos(a) * R * 0.5, altoTotal - 0.005, Math.sin(a) * R * 0.5);
      m.rotation.y = a;
      g.add(m);
    }
    anadir('deco', `rosetones:${claveBase}`, g);
  }
  if (d.decoraciones.includes('borde')) {
    const g = new Group();
    const geo = geometriaManga(0.065, 0.09, 6, 3);
    const n = Math.round(perimetro / 0.085);
    for (const p of puntosContorno(escalarContorno(contorno, (radioBorde + 0.025) / R), n)) {
      const m = new Mesh(geo, matManga);
      m.position.copy(en3d(p, 0.005));
      m.scale.set(1, 0.8, 1);
      g.add(m);
    }
    anadir('deco', `borde:${claveBase}`, g);
  }

  // --- Toppers -------------------------------------------------------------
  const arriba = altoTotal;
  const claveTop = `${d.forma}:${d.tamano}:${capas.length}:${d.cobertura}`;
  if (d.toppers.includes('fresas')) {
    const g = new Group();
    const matFresa = new MeshPhysicalMaterial({ color: '#c8243a', roughness: 0.35, clearcoat: 0.5, ...clip });
    const matHoja = new MeshStandardMaterial({ color: '#4f7a3a', roughness: 0.6, ...clip });
    const geoFresa = new SphereGeometry(0.075, 20, 14);
    geoFresa.scale(1, 1.25, 1);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const f = new Group();
      const cuerpo = new Mesh(geoFresa, matFresa);
      // Punta hacia arriba y las hojas apoyadas en la torta.
      const hoja = new Mesh(new ConeGeometry(0.065, 0.03, 6), matHoja);
      hoja.position.y = -0.085;
      hoja.rotation.x = Math.PI;
      f.add(cuerpo, hoja);
      f.position.set(Math.cos(a) * R * 0.68, arriba + 0.095, Math.sin(a) * R * 0.68);
      f.rotation.y = a;
      g.add(f);
    }
    anadir('topper', `fresas:${claveTop}`, g);
  }
  if (d.toppers.includes('arandanos')) {
    const g = new Group();
    const mat = new MeshPhysicalMaterial({ color: '#33406b', roughness: 0.3, sheen: 0.6, ...clip });
    const geo = new SphereGeometry(0.036, 16, 12);
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * R * 0.45;
      const m = new Mesh(geo, mat);
      m.position.set(Math.cos(a) * r, arriba + 0.03, Math.sin(a) * r);
      g.add(m);
    }
    anadir('topper', `arandanos:${claveTop}`, g);
  }
  if (d.toppers.includes('macarons')) {
    const g = new Group();
    const colores = ['#CEA59D', '#A0A18F', '#C7B9A7', '#EBDED8'];
    const geoConcha = new SphereGeometry(0.12, 24, 12);
    geoConcha.scale(1, 0.38, 1);
    const geoCrema = new CylinderGeometry(0.11, 0.11, 0.04, 24);
    const matCrema = new MeshStandardMaterial({ color: '#fbf3ea', roughness: 0.6, ...clip });
    colores.forEach((color, i) => {
      const mat = new MeshStandardMaterial({ color, roughness: 0.65, ...clip });
      const m = new Group();
      const abajo = new Mesh(geoConcha, mat);
      abajo.position.y = -0.042;
      const arribaM = new Mesh(geoConcha, mat);
      arribaM.position.y = 0.042;
      m.add(abajo, arribaM, new Mesh(geoCrema, matCrema));
      const a = Math.PI * (1.15 + i * 0.22);
      m.position.set(Math.cos(a) * R * 0.55, arriba + 0.12, Math.sin(a) * R * 0.55);
      m.rotation.set(Math.PI / 2.4, -a + Math.PI / 2, 0);
      g.add(m);
    });
    anadir('topper', `macarons:${claveTop}`, g);
  }
  if (d.toppers.includes('figura-corazon')) {
    const g = new Group();
    const mat = new MeshPhysicalMaterial({ color: '#8E5E56', roughness: 0.3, clearcoat: 1, ...clip });
    const corazon = new Mesh(extruir(crearContorno('corazon', 0.16), 0.03, 0.012), mat);
    corazon.geometry.rotateX(Math.PI / 2); // de pie
    corazon.geometry.center();
    corazon.position.y = 0.32;
    const palito = new Mesh(
      new CylinderGeometry(0.008, 0.008, 0.3, 8),
      new MeshStandardMaterial({ color: '#C7B9A7', ...clip }),
    );
    palito.position.y = 0.15;
    g.add(corazon, palito);
    g.position.set(0, arriba, -R * 0.35);
    anadir('topper', `corazon:${claveTop}`, g);
  }
  const conCartel = d.toppers.includes('cartel');
  if (conCartel) {
    const g = new Group();
    const textura = texturaTexto(d.mensaje.trim() || '¡Felicidades!', '#8E5E56', '#FBF7F4');
    const cartel = new Mesh(
      new PlaneGeometry(0.72, 0.18),
      new MeshStandardMaterial({ map: textura, transparent: true, roughness: 0.6, side: DoubleSide, ...clip }),
    );
    cartel.position.y = 0.34;
    const matPalo = new MeshStandardMaterial({ color: '#C7B9A7', roughness: 0.4, ...clip });
    for (const x of [-0.28, 0.28]) {
      const palo = new Mesh(new CylinderGeometry(0.007, 0.007, 0.34, 8), matPalo);
      palo.position.set(x, 0.17, -0.005);
      g.add(palo);
    }
    g.add(cartel);
    g.position.set(0, arriba, -R * 0.15);
    anadir('topper', `cartel:${claveTop}:${d.mensaje}`, g);
  }

  // --- Mensaje escrito sobre la torta --------------------------------------
  if (d.mensaje.trim() && !conCartel) {
    const color = luminancia(d.colorCobertura) < 0.35 ? '#F4E9D8' : '#8E5E56';
    const ancho = R * 1.25;
    const m = new Mesh(
      new PlaneGeometry(ancho, ancho / 4),
      new MeshStandardMaterial({
        map: texturaTexto(d.mensaje.trim(), color),
        transparent: true,
        roughness: 0.5,
        depthWrite: false,
        ...clip,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, arriba + 0.004, R * 0.22);
    anadir('mensaje', `mensaje:${claveTop}:${d.mensaje}:${color}`, m);
  }

  return { grupo, partes, alto: altoTotal, radio: R };
}

/** Libera la memoria de la GPU de una torta que ya no se usa (las texturas se reutilizan). */
export function liberar(objeto: Object3D): void {
  objeto.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m: Material) => {
        const mapa = (m as MeshStandardMaterial).map;
        if (mapa?.userData['desechable']) {
          mapa.dispose();
        }
        m.dispose();
      });
    }
  });
}
