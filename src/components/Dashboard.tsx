import { useState, useEffect, useCallback } from 'react';
import type { Categoria, Producto, Usuario, Negocio, FileEstacion } from '../types';
import { getProductos, addProducto, adjustStock, deleteProducto, subscribeToProductos } from '../lib/data';
import type { NuevoProductoInput } from './ProductForm';
import { getEstado } from '../utils';
import { Sidebar } from './Sidebar';
import { StatsCards } from './StatsCards';
import { ProductTable } from './ProductTable';
import { ProductCard } from './ProductCard';
import { ProductForm } from './ProductForm';
import { StockScanner } from './StockScanner';
import { MovimientosHistorial } from './MovimientosHistorial';
import { IconMenu, IconSearch, IconInbox } from './icons';

interface DashboardProps {
  usuario: Usuario;
  negocioActual: Negocio;
  fileActual: FileEstacion;
  puedeCambiarNegocio: boolean;
  onChangeFile: () => void;
  onChangeNegocio: () => void;
  onLogout: () => void;
}

const CATEGORIA_LABEL = { ropa: 'Ropa', productos: 'Productos', promociones: 'Promociones' };

const FILTRO_ACTIVE_CLASSES = {
  todos: 'bg-brand text-white',
  enStock: 'bg-success text-white',
  stockBajo: 'bg-warning text-white',
  sinStock: 'bg-danger text-white',
};

export function Dashboard({ usuario, negocioActual, fileActual, puedeCambiarNegocio, onChangeFile, onChangeNegocio, onLogout }: DashboardProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>('productos');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'enStock' | 'stockBajo' | 'sinStock'>('todos');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [barcodePrefill, setBarcodePrefill] = useState<string | undefined>(undefined);
  const [mostrarRestock, setMostrarRestock] = useState(false);
  const [mostrarSalida, setMostrarSalida] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const recargar = useCallback(() => {
    getProductos(fileActual.id)
      .then(setProductos)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los productos.'));
  }, [fileActual.id]);

  useEffect(() => {
    setCargando(true);
    getProductos(fileActual.id)
      .then(setProductos)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los productos.'))
      .finally(() => setCargando(false));

    // Refleja cambios hechos desde otros dispositivos sobre el mismo file
    const unsubscribe = subscribeToProductos(fileActual.id, recargar);
    return unsubscribe;
  }, [fileActual.id, recargar]);

  async function handleAddProduct(input: NuevoProductoInput) {
    const nuevo = await addProducto({ fileId: fileActual.id, ...input });
    setProductos((actuales) => [...actuales, nuevo]);
    setMostrarForm(false);
    setBarcodePrefill(undefined);
  }

  function handleAbrirFormNuevo() {
    setBarcodePrefill(undefined);
    setMostrarForm(true);
  }

  function handleProductoActualizadoPorReposicion(actualizado: Producto) {
    setProductos((actuales) => actuales.map((p) => (p.id === actualizado.id ? actualizado : p)));
  }

  function handleCodigoNoEncontradoEnReposicion(codigo: string) {
    setMostrarRestock(false);
    setBarcodePrefill(codigo);
    setMostrarForm(true);
  }

  async function handleAdjustStock(id: string, delta: number) {
    // Actualización optimista: se ve al instante, y se corrige si el servidor difiere.
    setProductos((actuales) =>
      actuales.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    );
    try {
      const actualizado = await adjustStock(id, delta);
      setProductos((actuales) => actuales.map((p) => (p.id === id ? actualizado : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ajustar el stock.');
      recargar();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    const anteriores = productos;
    setProductos((actuales) => actuales.filter((p) => p.id !== id));
    try {
      await deleteProducto(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el producto.');
      setProductos(anteriores);
    }
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

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categoriaActiva={categoriaActiva}
        onSelectCategoria={setCategoriaActiva}
        onAddClick={handleAbrirFormNuevo}
        onRestockClick={() => setMostrarRestock(true)}
        onSalidaClick={() => setMostrarSalida(true)}
        onHistorialClick={() => setMostrarHistorial(true)}
        usuario={usuario}
        negocioActual={negocioActual}
        fileActual={fileActual}
        puedeCambiarNegocio={puedeCambiarNegocio}
        onChangeFile={onChangeFile}
        onChangeNegocio={onChangeNegocio}
        onLogout={onLogout}
      />

      {mostrarRestock && (
        <StockScanner
          modo="entrada"
          fileId={fileActual.id}
          onClose={() => setMostrarRestock(false)}
          onProductoActualizado={handleProductoActualizadoPorReposicion}
          onCodigoNoEncontrado={handleCodigoNoEncontradoEnReposicion}
        />
      )}

      {mostrarSalida && (
        <StockScanner
          modo="salida"
          fileId={fileActual.id}
          onClose={() => setMostrarSalida(false)}
          onProductoActualizado={handleProductoActualizadoPorReposicion}
        />
      )}

      {mostrarHistorial && (
        <MovimientosHistorial fileId={fileActual.id} onClose={() => setMostrarHistorial(false)} />
      )}

      <main className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-line bg-surface text-ink hover:bg-cloud transition"
          >
            <IconMenu className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-ink">{CATEGORIA_LABEL[categoriaActiva]}</h1>
        </div>
        <p className="text-sm text-slate mt-1 mb-8 md:mb-10">Gestión de inventario en tiempo real</p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-danger-soft text-danger text-sm flex items-center justify-between gap-3">
            {error}
            <button onClick={() => setError('')} className="font-semibold shrink-0">
              Cerrar
            </button>
          </div>
        )}

        <StatsCards productos={porCategoria} />

        {mostrarForm && (
          <div className="mb-8 md:mb-10">
            <ProductForm onAdd={handleAddProduct} initialBarcode={barcodePrefill} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0">
            {(['todos', 'enStock', 'stockBajo', 'sinStock'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroEstado(f)}
                className={`shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filtroEstado === f ? FILTRO_ACTIVE_CLASSES[f] : 'bg-surface border border-line text-slate hover:bg-cloud'
                }`}
              >
                {f === 'todos' ? 'Todos' : f === 'enStock' ? 'En stock' : f === 'stockBajo' ? 'Stock bajo' : 'Sin stock'}
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-16 text-slate text-sm">Cargando productos...</div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-line rounded-xl">
            <div className="w-14 h-14 rounded-lg bg-cloud flex items-center justify-center mx-auto mb-4 text-slate">
              <IconInbox className="w-6 h-6" />
            </div>
            <p className="font-semibold text-base text-ink mb-1">Nada por aquí todavía</p>
            <p className="text-sm text-slate mb-5">Agrega el primer producto de esta categoría.</p>
            <button
              onClick={handleAbrirFormNuevo}
              className="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition"
            >
              + Agregar producto
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
              {productosFiltrados.map((p) => (
                <ProductCard
                  key={p.id}
                  producto={p}
                  onAdjustStock={handleAdjustStock}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <ProductTable
                productos={productosFiltrados}
                onAdjustStock={handleAdjustStock}
                onDelete={handleDelete}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
