import type { Producto } from '../types';
import { getEstado } from '../utils';
import { IconBarChart, IconCheckCircle, IconAlertTriangle, IconBan } from './icons';

interface StatsCardsProps {
  productos: Producto[];
}

export function StatsCards({ productos }: StatsCardsProps) {
  const total = productos.length;
  const enStock = productos.filter((p) => getEstado(p) === 'enStock').length;
  const stockBajo = productos.filter((p) => getEstado(p) === 'stockBajo').length;
  const sinStock = productos.filter((p) => getEstado(p) === 'sinStock').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 md:mb-10">
      <div className="bg-surface rounded-xl p-4 sm:p-5 shadow-soft-sm border border-line flex flex-col justify-center">
        <div className="w-8 h-8 rounded-lg bg-cloud flex items-center justify-center text-ink mb-3">
          <IconBarChart className="w-4 h-4" />
        </div>
        <div className="text-[11px] font-semibold text-slate uppercase tracking-widest">Total</div>
        <div className="text-2xl sm:text-3xl font-bold text-ink mt-1 tabular-nums">{total}</div>
      </div>

      <div className="bg-surface rounded-xl p-4 sm:p-5 shadow-soft-sm border border-line flex flex-col justify-center">
        <div className="w-8 h-8 rounded-lg bg-success-soft flex items-center justify-center text-success mb-3">
          <IconCheckCircle className="w-4 h-4" />
        </div>
        <div className="text-[11px] font-semibold text-slate uppercase tracking-widest">En stock</div>
        <div className="text-2xl sm:text-3xl font-bold text-success mt-1 tabular-nums">{enStock}</div>
      </div>

      <div className="bg-surface rounded-xl p-4 sm:p-5 shadow-soft-sm border border-line flex flex-col justify-center">
        <div className="w-8 h-8 rounded-lg bg-warning-soft flex items-center justify-center text-warning mb-3">
          <IconAlertTriangle className="w-4 h-4" />
        </div>
        <div className="text-[11px] font-semibold text-slate uppercase tracking-widest">Stock bajo</div>
        <div className="text-2xl sm:text-3xl font-bold text-warning mt-1 tabular-nums">{stockBajo}</div>
      </div>

      <div className="bg-surface rounded-xl p-4 sm:p-5 shadow-soft-sm border border-line flex flex-col justify-center">
        <div className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center text-danger mb-3">
          <IconBan className="w-4 h-4" />
        </div>
        <div className="text-[11px] font-semibold text-slate uppercase tracking-widest">Sin stock</div>
        <div className="text-2xl sm:text-3xl font-bold text-danger mt-1 tabular-nums">{sinStock}</div>
      </div>
    </div>
  );
}
