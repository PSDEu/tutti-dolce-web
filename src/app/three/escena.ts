import {
  ACESFilmicToneMapping,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CatalogoTortas } from '../core/catalogo/catalogo.model';
import { DisenoTorta } from '../core/diseno/diseno.model';
import { construirTorta, liberar, Parte, TortaConstruida } from './torta-3d';

export interface OpcionesEscena {
  /** Permite girar la torta con el ratón o el dedo. */
  controles?: boolean;
  autoRotar?: boolean;
}

interface Animacion {
  parte: Parte;
  inicio: number;
  duracion: number;
}

const DURACION = 650;
const SIN_CORTE = 5;

/** Curvas de animación. */
const suave = (t: number) => 1 - Math.pow(1 - t, 3);
function rebote(t: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

/**
 * Escena 3D de "estudio de producto": luz cálida y suave, sombra en el suelo,
 * fondo transparente (se ve el crema de la web detrás).
 *
 * - `mostrar(diseno)`: reconstruye la torta y anima solo las piezas que han cambiado.
 * - `montaje(p)`: para la portada, monta la torta pieza a pieza según el progreso del scroll (0–1).
 * - `cortar(true)`: quita una porción para ver los pisos y rellenos por dentro.
 */
export class EscenaTorta {
  private readonly renderer: WebGLRenderer;
  private readonly escena = new Scene();
  private readonly camara = new PerspectiveCamera(32, 1, 0.1, 60);
  private readonly controles?: OrbitControls;
  private readonly planos = [new Plane(new Vector3(-1, 0, 0), SIN_CORTE), new Plane(new Vector3(0, 0, -1), SIN_CORTE)];
  private readonly observador: ResizeObserver;
  private readonly pmrem: PMREMGenerator;

  private torta?: TortaConstruida;
  private animaciones: Animacion[] = [];
  private corteActual = SIN_CORTE;
  private corteObjetivo = SIN_CORTE;
  private radioEncuadrado = 0;
  private aspectoEncuadrado = 0;
  private modoMontaje = false;

  constructor(
    private readonly lienzo: HTMLCanvasElement,
    opciones: OpcionesEscena = {},
  ) {
    this.renderer = new WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.localClippingEnabled = true;

    // Reflejos suaves de un "estudio" generado (sin descargar un HDRI).
    this.pmrem = new PMREMGenerator(this.renderer);
    this.escena.environment = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.escena.environmentIntensity = 0.55;

    this.escena.add(new HemisphereLight('#fff6ee', '#e8d9cf', 0.7));
    const principal = new DirectionalLight('#fff1e0', 2.3);
    principal.position.set(3, 5.5, 2.5);
    principal.castShadow = true;
    principal.shadow.mapSize.set(1024, 1024);
    principal.shadow.camera.left = principal.shadow.camera.bottom = -3;
    principal.shadow.camera.right = principal.shadow.camera.top = 3;
    principal.shadow.radius = 6;
    principal.shadow.bias = -0.0005;
    const relleno = new DirectionalLight('#f3f0ff', 0.6);
    relleno.position.set(-4, 2, -1);
    const contra = new DirectionalLight('#ffffff', 0.9);
    contra.position.set(-1, 3, -4);
    this.escena.add(principal, relleno, contra);

    const suelo = new Mesh(new PlaneGeometry(14, 14), new ShadowMaterial({ opacity: 0.16 }));
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.y = -0.4;
    suelo.receiveShadow = true;
    this.escena.add(suelo);

    this.camara.position.set(2.7, 2.1, 3.7);
    if (opciones.controles) {
      this.controles = new OrbitControls(this.camara, lienzo);
      this.controles.enableDamping = true;
      this.controles.enablePan = false;
      this.controles.maxPolarAngle = 1.48;
    }
    if (opciones.autoRotar && this.controles) {
      this.controles.autoRotate = true;
      this.controles.autoRotateSpeed = 0.8;
    }

    this.observador = new ResizeObserver(() => this.ajustarTamano());
    this.observador.observe(lienzo.parentElement ?? lienzo);
    this.ajustarTamano();
    this.renderer.setAnimationLoop((t) => this.fotograma(t));
  }

  /** Muestra un diseño. Las piezas nuevas o cambiadas entran con animación. */
  mostrar(d: DisenoTorta, c: CatalogoTortas, animar = true): void {
    const anteriores = new Set(this.torta?.partes.map((p) => p.claveAnimacion ?? p.clave) ?? []);
    const nueva = construirTorta(d, c, { planosCorte: this.planos });
    if (this.torta) {
      this.escena.remove(this.torta.grupo);
      liberar(this.torta.grupo);
    }
    this.torta = nueva;
    this.escena.add(nueva.grupo);
    for (const parte of nueva.partes) {
      parte.objeto.userData['baseY'] = parte.objeto.position.y;
    }
    this.mostrarTapas(this.corteActual < 0.001);
    this.encuadrar();

    const ahora = performance.now();
    this.animaciones = [];
    if (this.modoMontaje) {
      return;
    }
    let retraso = 0;
    for (const parte of nueva.partes) {
      if (animar && !anteriores.has(parte.claveAnimacion ?? parte.clave)) {
        this.aplicarEntrada(parte, 0);
        this.animaciones.push({ parte, inicio: ahora + retraso, duracion: DURACION });
        retraso += anteriores.size ? 40 : 90;
      }
    }
  }

  /** Activa el modo montaje (portada): las piezas se colocan según `montaje(progreso)`. */
  activarMontaje(): void {
    this.modoMontaje = true;
  }

  montaje(progreso: number): void {
    if (!this.torta) return;
    const partes = [...this.torta.partes].sort((a, b) => a.orden - b.orden);
    const n = partes.length;
    partes.forEach((parte, i) => {
      // El plato está desde el principio; el resto entra uno detrás de otro.
      const t = i === 0 ? 1 : Math.min(1, Math.max(0, progreso * n - (i - 1)));
      this.aplicarEntrada(parte, t);
    });
  }

  cortar(activo: boolean): void {
    this.corteObjetivo = activo ? 0 : SIN_CORTE;
    if (!activo) {
      this.mostrarTapas(false);
    }
  }

  /** Imagen PNG de lo que se ve ahora (para el resumen y el pedido). */
  capturar(): string {
    // Si alguna pieza aún está entrando, se coloca en su sitio antes de la foto.
    for (const a of this.animaciones) {
      this.aplicarEntrada(a.parte, 1);
    }
    this.animaciones = [];
    this.renderer.render(this.escena, this.camara);
    return this.lienzo.toDataURL('image/png');
  }

  destruir(): void {
    this.renderer.setAnimationLoop(null);
    this.observador.disconnect();
    this.controles?.dispose();
    if (this.torta) {
      liberar(this.torta.grupo);
    }
    this.escena.environment?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------------------

  private fotograma(ahora: number): void {
    this.animaciones = this.animaciones.filter((a) => {
      const t = Math.min(1, Math.max(0, (ahora - a.inicio) / a.duracion));
      this.aplicarEntrada(a.parte, t);
      return t < 1;
    });

    if (Math.abs(this.corteActual - this.corteObjetivo) > 0.0005) {
      this.corteActual += (this.corteObjetivo - this.corteActual) * 0.12;
      if (Math.abs(this.corteActual - this.corteObjetivo) <= 0.0005) {
        this.corteActual = this.corteObjetivo;
        this.mostrarTapas(this.corteActual === 0);
      }
      for (const p of this.planos) {
        p.constant = this.corteActual;
      }
    }

    this.controles?.update();
    this.renderer.render(this.escena, this.camara);
  }

  /** Coloca una pieza en su animación de entrada (t = 0 fuera, t = 1 en su sitio). */
  private aplicarEntrada(parte: Parte, t: number): void {
    const o = parte.objeto;
    const baseY = (o.userData['baseY'] as number) ?? 0;
    o.visible = t > 0;
    switch (parte.tipo) {
      case 'plato': {
        const e = suave(t);
        o.scale.setScalar(0.85 + 0.15 * e);
        break;
      }
      case 'cobertura': {
        // La cobertura "se extiende" de abajo arriba.
        const e = suave(t);
        o.scale.set(1 + 0.03 * (1 - e), Math.max(0.001, e), 1 + 0.03 * (1 - e));
        break;
      }
      case 'drip': {
        o.position.y = baseY + 0.25 * (1 - suave(t));
        o.scale.y = Math.max(0.001, suave(t));
        break;
      }
      default: {
        // Pisos, rellenos y decoración caen desde arriba con un pequeño rebote.
        o.position.y = baseY + 1.4 * (1 - rebote(t));
      }
    }
  }

  private mostrarTapas(visibles: boolean): void {
    this.torta?.grupo.traverse((o) => {
      if (o.userData['tapa']) {
        o.visible = visibles;
      }
    });
  }

  private encuadrar(forzar = false): void {
    if (!this.torta) return;
    const { radio, alto } = this.torta;
    const objetivo = new Vector3(0, alto * 0.4, 0);
    if (this.controles) {
      this.controles.target.copy(objetivo);
    }
    const aspecto = this.camara.aspect;
    if (forzar || Math.abs(radio - this.radioEncuadrado) > 0.01 || Math.abs(aspecto - this.aspectoEncuadrado) > 0.05) {
      // Distancia para que quepan el plato (a lo ancho) y la torta (a lo alto), con margen.
      const tanV = Math.tan(((this.camara.fov / 2) * Math.PI) / 180);
      const medioAncho = radio * 1.55;
      const medioAlto = Math.max(radio * 1.1, (alto + 0.7) * 0.75);
      const distancia = Math.max(medioAncho / (tanV * aspecto), medioAlto / tanV) * 1.12;
      const dir = this.camara.position.clone().sub(objetivo).normalize();
      this.camara.position.copy(objetivo).addScaledVector(dir, distancia);
      if (this.controles) {
        this.controles.maxDistance = distancia * 2;
        this.controles.minDistance = distancia * 0.45;
      }
      this.radioEncuadrado = radio;
      this.aspectoEncuadrado = aspecto;
    }
    this.camara.lookAt(objetivo);
  }

  private ajustarTamano(): void {
    const contenedor = this.lienzo.parentElement ?? this.lienzo;
    const ancho = contenedor.clientWidth || 1;
    const alto = contenedor.clientHeight || 1;
    this.renderer.setSize(ancho, alto, false);
    this.camara.aspect = ancho / alto;
    this.camara.updateProjectionMatrix();
    this.encuadrar();
  }
}
