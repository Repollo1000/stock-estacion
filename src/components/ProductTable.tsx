import { useState } from 'react';
import type { Producto } from '../types';
import { getEstado } from '../utils';
import { IconTrash } from './icons';

interface ProductTableProps {
  productos: Producto[];
  onAdjustStock: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
}

const ESTADO_STYLES = {
  enStock: { label: 'En stock', bg: 'bg-success-soft', text: 'text-success' },
  stockBajo: { label: 'Stock bajo', bg: 'bg-warning-soft', text: 'text-warning' },
  sinStock: { label: 'Sin stock', bg: 'bg-danger-soft', text: 'text-danger' },
};

function StockCell({ producto, onAdjustStock }: { producto: Producto; onAdjustStock: (id: string, delta: number) => void }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');

  function empezarEdicion() {
    setValor(String(producto.stock));
    setEditando(true);
  }

  function confirmarEdicion() {
    const nuevo = Math.max(0, Math.round(Number(valor)));
    if (!Number.isNaN(nuevo) && nuevo !== producto.stock) {
      onAdjustStock(producto.id, nuevo - producto.stock);
    }
    setEditando(false);
  }

  if (editando) {
    return (
      <input
        type="number"
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={confirmarEdicion}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmarEdicion();
          if (e.key === 'Escape') setEditando(false);
        }}
        className="w-14 text-center text-sm bg-surface border border-brand rounded-md px-1 py-1 focus:outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={empezarEdicion}
      title="Tocar para editar la cantidad exacta"
      className="font-semibold tabular-nums hover:underline decoration-dotted"
    >
      {producto.stock}
    </button>
  );
}

export function ProductTable({ productos, onAdjustStock, onDelete }: ProductTableProps) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-16 text-slate">
        <p className="font-semibold text-ink mb-1">Nada por aquí todavía</p>
        <p className="text-sm">Agrega el primer producto de esta categoría.</p>
      </div>
    );
  }

  return (
    <table className="w-full bg-surface border border-line rounded-xl overflow-hidden shadow-soft-sm">
      <thead className="bg-cloud">
        <tr>
          <th className="text-left text-[11px] font-semibold text-slate uppercase tracking-widest px-4 py-3">Nombre</th>
          <th className="text-left text-[11px] font-semibold text-slate uppercase tracking-widest px-4 py-3">Código</th>
          <th className="text-center text-[11px] font-semibold text-slate uppercase tracking-widest px-4 py-3">Stock</th>
          <th className="text-center text-[11px] font-semibold text-slate uppercase tracking-widest px-4 py-3">Mínimo</th>
          <th className="text-left text-[11px] font-semibold text-slate uppercase tracking-widest px-4 py-3">Estado</th>
          <th className="text-right text-[11px] font-semibold text-slate uppercase tracking-widest px-4 py-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {productos.map((p) => {
          const estado = ESTADO_STYLES[getEstado(p)];
          return (
            <tr key={p.id} className="border-t border-line hover:bg-cloud/60 transition">
              <td className="px-4 py-3 text-sm font-medium text-ink">{p.name}</td>
              <td className="px-4 py-3 text-xs font-mono text-slate">
                {p.barcode || '—'}
                {p.caseBarcode && (
                  <div className="text-[10px] text-slate font-sans mt-0.5">📦 ×{p.unitsPerCase}/caja</div>
                )}
              </td>
              <td className="px-4 py-3 text-center text-sm">
                <StockCell producto={p} onAdjustStock={onAdjustStock} />
              </td>
              <td className="px-4 py-3 text-center text-sm text-slate tabular-nums">{p.minStock}</td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${estado.bg} ${estado.text}`}>
                  {estado.label}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end items-center gap-1.5">
                  <button
                    onClick={() => onAdjustStock(p.id, -1)}
                    className="w-7 h-7 rounded-md bg-surface border border-line text-ink text-xs font-semibold hover:border-brand hover:text-brand transition"
                  >
                    −
                  </button>
                  <button
                    onClick={() => onAdjustStock(p.id, 1)}
                    className="w-7 h-7 rounded-md bg-surface border border-line text-ink text-xs font-semibold hover:border-brand hover:text-brand transition"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    aria-label="Eliminar producto"
                    className="w-7 h-7 rounded-md flex items-center justify-center text-slate hover:text-danger hover:bg-danger-soft transition ml-1"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
