import { useState } from 'react';
import type { Producto } from '../types';
import { getEstado } from '../utils';
import { IconTrash } from './icons';

interface ProductCardProps {
  producto: Producto;
  onAdjustStock: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
}

const ESTADO_BADGE = {
  sinStock: { label: 'Sin stock', bg: 'bg-danger-soft', text: 'text-danger' },
  stockBajo: { label: 'Bajo stock', bg: 'bg-warning-soft', text: 'text-warning' },
  enStock: null,
};

export function ProductCard({ producto, onAdjustStock, onDelete }: ProductCardProps) {
  const badge = ESTADO_BADGE[getEstado(producto)];
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

  return (
    <div className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-3 shadow-soft-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm text-ink">{producto.name}</h3>
          {producto.barcode && (
            <p className="text-xs text-slate font-mono mt-0.5">#{producto.barcode}</p>
          )}
          {producto.caseBarcode && (
            <p className="text-xs text-slate mt-0.5">📦 ×{producto.unitsPerCase} por caja</p>
          )}
        </div>
        {badge && (
          <span className={`shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-cloud rounded-lg px-1 py-1">
          <button
            onClick={() => onAdjustStock(producto.id, -1)}
            className="w-9 h-9 rounded-md bg-surface border border-line text-ink font-semibold text-base hover:border-brand hover:text-brand transition"
          >
            −
          </button>
          {editando ? (
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
              className="w-12 text-center font-semibold text-sm bg-surface border border-brand rounded-md px-1 py-1.5 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={empezarEdicion}
              title="Tocar para editar la cantidad exacta"
              className="font-semibold text-sm w-8 text-center tabular-nums hover:underline decoration-dotted"
            >
              {producto.stock}
            </button>
          )}
          <button
            onClick={() => onAdjustStock(producto.id, 1)}
            className="w-9 h-9 rounded-md bg-surface border border-line text-ink font-semibold text-base hover:border-brand hover:text-brand transition"
          >
            +
          </button>
        </div>
        <button
          onClick={() => onDelete(producto.id)}
          aria-label="Eliminar producto"
          className="w-8 h-8 rounded-md flex items-center justify-center text-slate hover:text-danger hover:bg-danger-soft transition"
        >
          <IconTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
