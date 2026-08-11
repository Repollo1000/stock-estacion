import { useState } from 'react';
import type { Producto, Categoria } from '../types';

interface ProductFormProps {
  onAdd: (producto: Producto) => void;
}

export function ProductForm({ onAdd }: ProductFormProps) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<Categoria>('ropa');
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const nuevoProducto: Producto = {
      id: 'p_' + Date.now(),
      barcode,
      name,
      category,
      stock,
      minStock,
      updatedAt: new Date().toISOString(),
    };

    onAdd(nuevoProducto);

    setName('');
    setBarcode('');
    setStock(0);
  }

return (
  <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-white border border-line rounded-2xl p-5 mb-8 shadow-sm">
    <input
      type="text"
      placeholder="Nombre del producto"
      value={name}
      onChange={(e) => setName(e.target.value)}
      className="px-3 py-2.5 rounded-lg border border-line bg-paper text-sm focus:outline-none focus:border-teal"
    />
    <input
      type="text"
      placeholder="Código de barras"
      value={barcode}
      onChange={(e) => setBarcode(e.target.value)}
      className="px-3 py-2.5 rounded-lg border border-line bg-paper text-sm focus:outline-none focus:border-teal"
    />
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value as Categoria)}
      className="px-3 py-2.5 rounded-lg border border-line bg-paper text-sm focus:outline-none focus:border-teal"
    >
      <option value="ropa">Ropa</option>
      <option value="productos">Productos</option>
      <option value="promociones">Promociones</option>
    </select>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-bold text-slate uppercase tracking-wide mb-1">
          Stock inicial
        </label>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-lg border border-line bg-paper text-sm focus:outline-none focus:border-teal"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate uppercase tracking-wide mb-1">
          Stock mínimo
        </label>
        <input
          type="number"
          value={minStock}
          onChange={(e) => setMinStock(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-lg border border-line bg-paper text-sm focus:outline-none focus:border-teal"
        />
      </div>
    </div>

    <button type="submit" className="bg-amber hover:bg-amber-dark text-ink font-bold rounded-lg py-2.5 mt-1">
      Agregar producto
    </button>
  </form>
);
}