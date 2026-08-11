import type { Producto } from '../types';
import { getEstado } from '../utils';

interface StatsCardsProps {
  productos: Producto[];
}

export function StatsCards({ productos }: StatsCardsProps) {
  const total = productos.length;
  const enStock = productos.filter((p) => getEstado(p) === 'enStock').length;
  const stockBajo = productos.filter((p) => getEstado(p) === 'stockBajo').length;
  const sinStock = productos.filter((p) => getEstado(p) === 'sinStock').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div className="bg-teal-soft rounded-xl p-5">
        <div className="text-[10px] font-bold text-teal uppercase tracking-wide">Total productos</div>
        <div className="text-2xl font-bold text-teal mt-1.5">{total}</div>
      </div>
      <div className="bg-teal-soft rounded-xl p-5">
        <div className="text-[10px] font-bold text-teal uppercase tracking-wide">En stock</div>
        <div className="text-2xl font-bold text-teal mt-1.5">{enStock}</div>
      </div>
      <div className="bg-amber/20 rounded-xl p-5">
        <div className="text-[10px] font-bold text-amber-dark uppercase tracking-wide">Stock bajo</div>
        <div className="text-2xl font-bold text-amber-dark mt-1.5">{stockBajo}</div>
      </div>
      <div className="bg-rust-soft rounded-xl p-5">
        <div className="text-[10px] font-bold text-rust uppercase tracking-wide">Sin stock</div>
        <div className="text-2xl font-bold text-rust mt-1.5">{sinStock}</div>
      </div>
    </div>
  );
}