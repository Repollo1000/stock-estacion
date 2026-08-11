import type { Producto } from './types';

const PRODUCTS_KEY = 'productos';

export function loadProducts(): Producto[] {
  const datosGuardados = localStorage.getItem(PRODUCTS_KEY);
  if (!datosGuardados) return [];
  return JSON.parse(datosGuardados) as Producto[];
}

export function saveProducts(products: Producto[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}