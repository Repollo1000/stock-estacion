import type { Producto } from '../types';
import { getEstado } from '../utils';

interface ProductTableProps {
  productos: Producto[];
  onAdjustStock: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
}

const ESTADO_STYLES = {
  enStock: { label: 'En stock', bg: 'bg-teal-soft', text: 'text-teal' },
  stockBajo: { label: 'Stock bajo', bg: 'bg-amber/20', text: 'text-amber-dark' },
  sinStock: { label: 'Sin stock', bg: 'bg-rust-soft', text: 'text-rust' },
};

export function ProductTable({ productos, onAdjustStock, onDelete }: ProductTableProps) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-16 text-slate">
        <p className="font-bold text-ink mb-1">Nada por aquí todavía</p>
        <p className="text-sm">Agrega el primer producto de esta categoría.</p>
      </div>
    );
  }

  return (
    <table className="w-full bg-white border border-line rounded-xl overflow-hidden">
      <thead className="bg-paper">
        <tr>
          <th className="text-left text-[11px] font-bold text-slate uppercase tracking-wide px-4 py-3.5">Nombre</th>
          <th className="text-left text-[11px] font-bold text-slate uppercase tracking-wide px-4 py-3.5">Código</th>
          <th className="text-center text-[11px] font-bold text-slate uppercase tracking-wide px-4 py-3.5">Stock</th>
          <th className="text-center text-[11px] font-bold text-slate uppercase tracking-wide px-4 py-3.5">Mínimo</th>
          <th className="text-left text-[11px] font-bold text-slate uppercase tracking-wide px-4 py-3.5">Estado</th>
          <th className="text-right text-[11px] font-bold text-slate uppercase tracking-wide px-4 py-3.5">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {productos.map((p) => {
          const estado = ESTADO_STYLES[getEstado(p)];
          return (
            <tr key={p.id} className="border-t border-line">
              <td className="px-4 py-3.5 text-sm font-semibold text-ink">{p.name}</td>
              <td className="px-4 py-3.5 text-xs font-mono text-slate">{p.barcode || '—'}</td>
              <td className="px-4 py-3.5 text-center text-sm font-mono font-bold">{p.stock}</td>
              <td className="px-4 py-3.5 text-center text-sm text-slate">{p.minStock}</td>
              <td className="px-4 py-3.5">
                <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${estado.bg} ${estado.text}`}>
                  {estado.label}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex justify-end items-center gap-1.5">
                  <button onClick={() => onAdjustStock(p.id, -1)} className="w-6 h-6 rounded border border-line text-xs font-bold">−</button>
                  <button onClick={() => onAdjustStock(p.id, 1)} className="w-6 h-6 rounded border border-line text-xs font-bold">＋</button>
                  <button onClick={() => onDelete(p.id)} className="text-xs font-bold text-rust ml-2">Eliminar</button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}