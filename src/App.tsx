import { useState, useEffect } from 'react';
import type { Categoria, Producto } from './types';
import { loadProducts, saveProducts } from './storage';
import { getEstado } from './utils';
import { Sidebar } from './components/Sidebar';
import { StatsCards } from './components/StatsCards';
import { ProductTable } from './components/ProductTable';
import { ProductForm } from './components/ProductForm';
import './App.css';

function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>('ropa');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'enStock' | 'stockBajo' | 'sinStock'>('todos');
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    setProductos(loadProducts());
  }, []);

  function handleAddProduct(nuevo: Producto) {
    const actualizados = [...productos, nuevo];
    setProductos(actualizados);
    saveProducts(actualizados);
    setMostrarForm(false);
  }

  function handleAdjustStock(id: string, delta: number) {
    const actualizados = productos.map((p) =>
      p.id === id
        ? { ...p, stock: Math.max(0, p.stock + delta), updatedAt: new Date().toISOString() }
        : p
    );
    setProductos(actualizados);
    saveProducts(actualizados);
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    const actualizados = productos.filter((p) => p.id !== id);
    setProductos(actualizados);
    saveProducts(actualizados);
  }

  const porCategoria = productos.filter((p) => p.category === categoriaActiva);

  const porEstado =
    filtroEstado === 'todos'
      ? porCategoria
      : porCategoria.filter((p) => getEstado(p) === filtroEstado);

  const productosFiltrados = busqueda
    ? porEstado.filter(
        (p) =>
          p.name.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.barcode.includes(busqueda)
      )
    : porEstado;

  const CATEGORIA_LABEL = { ropa: 'Ropa', productos: 'Productos', promociones: 'Promociones' };

  return (
    <div className="min-h-screen bg-paper flex">
      <Sidebar
        categoriaActiva={categoriaActiva}
        onSelectCategoria={setCategoriaActiva}
        onAddClick={() => setMostrarForm((v) => !v)}
      />

      <main className="flex-1 min-w-0 p-8">
        <h1 className="text-2xl font-bold text-ink">{CATEGORIA_LABEL[categoriaActiva]}</h1>
        <p className="text-sm text-slate mt-1 mb-8">Gestión de inventario en tiempo real</p>

        <StatsCards productos={porCategoria} />

        {mostrarForm && (
          <div className="mb-8">
            <ProductForm onAdd={handleAddProduct} />
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 min-w-[220px] px-4 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:border-teal"
          />
          {(['todos', 'enStock', 'stockBajo', 'sinStock'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                filtroEstado === f ? 'bg-ink text-white' : 'bg-white border border-line text-slate'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'enStock' ? 'En stock' : f === 'stockBajo' ? 'Stock bajo' : 'Sin stock'}
            </button>
          ))}
        </div>

        <ProductTable
          productos={productosFiltrados}
          onAdjustStock={handleAdjustStock}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}

export default App;