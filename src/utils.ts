import type { Producto } from './types';

export type Estado = 'sinStock' | 'stockBajo' | 'enStock';

export function getEstado(p: Producto): Estado {
  if (p.stock === 0) return 'sinStock';
  if (p.stock <= p.minStock) return 'stockBajo';
  return 'enStock';
}