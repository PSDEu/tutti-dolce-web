import { CATALOGO_TORTAS as C } from '../catalogo/catalogo';
import { DisenoTorta, disenoInicial, normalizarDiseno } from './diseno.model';
import { codificarDiseno, decodificarDiseno } from './enlace';
import { aIso, antelacionDias, fechaEntregaMinima, fechaValida } from './fecha-entrega';
import { calcularPrecio } from './precio';
import { corregir, permitido, validar } from './reglas';

const base = (): DisenoTorta => ({
  ...disenoInicial(C),
  forma: 'redonda',
  tamano: 'm',
  bizcocho: 'vainilla',
  pisos: 2,
  relleno: 'dulce-de-leche',
  cobertura: 'buttercream',
  acabado: 'liso',
});

describe('precio', () => {
  it('suma tamaño, pisos, relleno y cobertura con el factor del tamaño', () => {
    const p = calcularPrecio(base(), C);
    // 38 (mediana) + 9*1.4 (piso extra) + 3*1*1.4 (relleno) + 6*1.4 (buttercream)
    expect(p.total).toBeCloseTo(38 + 12.6 + 4.2 + 8.4, 2);
  });

  it('cobra el mensaje solo si hay texto', () => {
    const sin = calcularPrecio(base(), C).total;
    const con = calcularPrecio({ ...base(), mensaje: 'Feliz cumple' }, C).total;
    expect(con - sin).toBeCloseTo(C.mensaje.precio, 2);
    expect(calcularPrecio({ ...base(), mensaje: '   ' }, C).total).toBe(sin);
  });

  it('una torta de un piso sin relleno no cobra relleno', () => {
    const p = calcularPrecio({ ...base(), pisos: 1, relleno: null }, C);
    expect(p.lineas.some((l) => l.concepto.startsWith('Relleno'))).toBe(false);
  });
});

describe('reglas', () => {
  it('un diseño normal es válido', () => {
    expect(validar(base(), C)).toEqual([]);
  });

  it('fruta fresca limita los pisos a 2', () => {
    const d = { ...base(), relleno: 'frutos-rojos', pisos: 3 };
    expect(validar(d, C).map((i) => i.regla)).toContain('fruta-fresca-pisos');
    expect(permitido({ ...base(), relleno: 'frutos-rojos' }, 'pisos', 3, C)).toBe(false);
    expect(permitido({ ...base(), relleno: 'frutos-rojos' }, 'pisos', 2, C)).toBe(true);
  });

  it('corregir ajusta el campo restringido, no el elegido', () => {
    const { diseno, ajustes } = corregir({ ...base(), pisos: 4, relleno: 'frutos-rojos' }, C);
    expect(diseno.relleno).toBe('frutos-rojos');
    expect(diseno.pisos).toBe(2);
    expect(ajustes.length).toBeGreaterThan(0);
  });

  it('naked y glaseado fuerzan acabado liso', () => {
    expect(corregir({ ...base(), cobertura: 'naked', acabado: 'rustico' }, C).diseno.acabado).toBe('liso');
    expect(corregir({ ...base(), cobertura: 'glaseado', acabado: 'texturizado' }, C).diseno.acabado).toBe('liso');
  });

  it('fondant quita las borlas', () => {
    const d = corregir({ ...base(), cobertura: 'fondant', decoraciones: ['borlas', 'borde'] }, C).diseno;
    expect(d.decoraciones).toEqual(['borde']);
  });

  it('más de un piso exige relleno', () => {
    expect(validar({ ...base(), relleno: null }, C).map((i) => i.regla)).toContain('relleno-obligatorio');
    expect(corregir({ ...base(), relleno: null }, C).diseno.relleno).not.toBeNull();
    expect(permitido({ ...base(), pisos: 1 }, 'relleno', null, C)).toBe(true);
  });
});

describe('fecha de entrega', () => {
  // Miércoles 25-11-2026 a las 10:00 (antes de la hora de corte).
  const miercoles = new Date(2026, 10, 25, 10, 0);

  it('suma la antelación base y la de la opción más lenta', () => {
    expect(antelacionDias(base(), C)).toBe(C.pedido.antelacionBaseDias + 1); // 1 piso extra → ceil(0.5)
    expect(antelacionDias({ ...base(), toppers: ['figura-corazon'] }, C)).toBe(2 + 2 + 1);
  });

  it('después de la hora de corte empieza a contar mañana', () => {
    const tarde = new Date(2026, 10, 25, 18, 0);
    const a = fechaEntregaMinima(base(), C, miercoles);
    const b = fechaEntregaMinima(base(), C, tarde);
    expect(b.getTime()).toBeGreaterThan(a.getTime());
  });

  it('salta los días cerrados', () => {
    // Viernes 27 + 3 días = lunes 30 (cerrado) → martes 1-12.
    const viernes = new Date(2026, 10, 27, 9, 0);
    expect(aIso(fechaEntregaMinima(base(), C, viernes))).toBe('2026-12-01');
  });

  it('valida fechas elegidas por el cliente', () => {
    const minima = fechaEntregaMinima(base(), C, miercoles);
    const antes = new Date(minima);
    antes.setDate(antes.getDate() - 1);
    expect(fechaValida(minima, base(), C, miercoles)).toBe(true);
    expect(fechaValida(antes, base(), C, miercoles)).toBe(false);
  });
});

describe('enlace para compartir', () => {
  it('codifica y decodifica el mismo diseño (con tildes y emojis)', () => {
    const d = { ...base(), mensaje: 'Feliz cumpleaños 🎂' };
    expect(decodificarDiseno(codificarDiseno(d), C)).toEqual(d);
  });

  it('un código roto devuelve null', () => {
    expect(decodificarDiseno('%%%no-es-valido', C)).toBeNull();
  });

  it('normalizar descarta ids desconocidos', () => {
    const d = normalizarDiseno({ forma: 'triangulo', toppers: ['fresas', 'x'], pisos: 99 }, C);
    expect(d.forma).toBe(C.formas[0].id);
    expect(d.toppers).toEqual(['fresas']);
    expect(d.pisos).toBe(C.pisos.max);
  });
});
