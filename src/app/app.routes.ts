import { Routes } from '@angular/router';

/** Cada página se carga bajo demanda (lazy loading): el 3D solo se descarga cuando hace falta. */
export const routes: Routes = [
  {
    path: '',
    title: 'Tutti Dolce · Pastelería',
    loadComponent: () => import('./paginas/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'configurador',
    title: 'Diseña tu torta · Tutti Dolce',
    loadComponent: () => import('./paginas/configurador/configurador').then((m) => m.Configurador),
  },
  {
    path: 'resumen',
    title: 'Resumen del pedido · Tutti Dolce',
    loadComponent: () => import('./paginas/resumen/resumen').then((m) => m.Resumen),
  },
  {
    path: 'galeria',
    title: 'Inspiración · Tutti Dolce',
    loadComponent: () => import('./paginas/galeria/galeria').then((m) => m.Galeria),
  },
  {
    path: 'nosotros',
    title: 'Nosotros · Tutti Dolce',
    loadComponent: () => import('./paginas/nosotros/nosotros').then((m) => m.Nosotros),
  },
  {
    path: 'membresia',
    title: 'Únete gratis · Tutti Dolce',
    loadComponent: () => import('./paginas/membresia/membresia').then((m) => m.Membresia),
  },
  {
    path: 'membresia/confirmar',
    title: 'Confirmar suscripción · Tutti Dolce',
    loadComponent: () => import('./paginas/membresia/confirmar').then((m) => m.Confirmar),
  },
  {
    path: 'membresia/baja',
    title: 'Darse de baja · Tutti Dolce',
    loadComponent: () => import('./paginas/membresia/baja').then((m) => m.Baja),
  },
  {
    path: 'mi-cuenta',
    title: 'Mi cuenta · Tutti Dolce',
    loadComponent: () => import('./paginas/mi-cuenta/mi-cuenta').then((m) => m.MiCuenta),
  },
  {
    path: 'pedido/:codigo',
    title: 'Mi pedido · Tutti Dolce',
    loadComponent: () => import('./paginas/seguimiento/seguimiento').then((m) => m.Seguimiento),
  },
  {
    path: 'privacidad',
    title: 'Privacidad · Tutti Dolce',
    loadComponent: () => import('./paginas/privacidad/privacidad').then((m) => m.Privacidad),
  },
  {
    path: 'admin',
    title: 'Panel de la pastelería · Tutti Dolce',
    loadComponent: () => import('./paginas/admin/admin').then((m) => m.Admin),
  },
  { path: '**', redirectTo: '' },
];
