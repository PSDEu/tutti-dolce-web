import { DisenoTorta } from './diseno.model';

/**
 * Diseños de ejemplo para la portada y la galería mientras no haya diseños de clientes
 * con permiso para publicarse. Sirven también como "Usar como base".
 */
export const DISENOS_EJEMPLO: { nombre: string; diseno: DisenoTorta }[] = [
  {
    nombre: 'Rosa empolvado con frutos rojos',
    diseno: {
      forma: 'redonda',
      tamano: 'm',
      bizcocho: 'vainilla',
      pisos: 2,
      relleno: 'frutos-rojos',
      cobertura: 'buttercream',
      colorCobertura: '#EBDED8',
      acabado: 'rustico',
      drip: null,
      decoraciones: ['borlas'],
      colorManga: '#CEA59D',
      toppers: ['fresas'],
      mensaje: '',
    },
  },
  {
    nombre: 'Chocolate con drip y macarons',
    diseno: {
      forma: 'redonda',
      tamano: 'm',
      bizcocho: 'chocolate',
      pisos: 3,
      relleno: 'dulce-de-leche',
      cobertura: 'buttercream',
      colorCobertura: '#FBF3EA',
      acabado: 'liso',
      drip: 'chocolate',
      decoraciones: ['borde'],
      colorManga: '#FFFFFF',
      toppers: ['macarons'],
      mensaje: '',
    },
  },
  {
    nombre: 'Corazón de fondant',
    diseno: {
      forma: 'corazon',
      tamano: 'm',
      bizcocho: 'red-velvet',
      pisos: 2,
      relleno: 'crema-vainilla',
      cobertura: 'fondant',
      colorCobertura: '#CEA59D',
      acabado: 'liso',
      drip: null,
      decoraciones: ['rosetones'],
      colorManga: '#FFFFFF',
      toppers: ['figura-corazon'],
      mensaje: 'Te quiero',
    },
  },
  {
    nombre: 'Naked de limón',
    diseno: {
      forma: 'redonda',
      tamano: 's',
      bizcocho: 'limon',
      pisos: 3,
      relleno: 'limon-curd',
      cobertura: 'naked',
      colorCobertura: '#FBF3EA',
      acabado: 'liso',
      drip: null,
      decoraciones: [],
      colorManga: '#FFFFFF',
      toppers: ['arandanos'],
      mensaje: '',
    },
  },
];
