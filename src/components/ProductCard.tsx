import type { Producto } from '../types';


interface ProductCardProps {
  producto: Producto;
  onAdjustStock: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
}

export function ProductCard({ producto, onAdjustStock, onDelete }: ProductCardProps) {
  const bajoStock = producto.stock <= producto.minStock;

return (
  <div className="bg-white border border-line rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="font-bold text-sm text-ink">{producto.name}</h3>
        {producto.barcode && (
          <p className="text-xs text-slate font-mono mt-0.5">#{producto.barcode}</p>
        )}
      </div>
      {bajoStock && (
        <span className="shrink-0 text-xs font-bold rounded-lg px-2 py-1 bg-rust-soft text-rust">
          Bajo stock
        </span>
      )}
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 bg-paper rounded-lg px-1 py-1">
        <button
          onClick={() => onAdjustStock(producto.id, -1)}
          className="w-7 h-7 rounded-md bg-white border border-line font-bold text-sm"
        >
          −
        </button>
        <span className="font-mono font-semibold text-sm w-6 text-center">{producto.stock}</span>
        <button
          onClick={() => onAdjustStock(producto.id, 1)}
          className="w-7 h-7 rounded-md bg-white border border-line font-bold text-sm"
        >
          +
        </button>
      </div>
      <button
        onClick={() => onDelete(producto.id)}
        className="text-xs font-bold text-rust hover:underline"
      >
        Eliminar
      </button>
    </div>
  </div>
);
}