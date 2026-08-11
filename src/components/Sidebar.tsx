import type { Categoria } from '../types';

interface SidebarProps {
  categoriaActiva: Categoria;
  onSelectCategoria: (cat: Categoria) => void;
  onAddClick: () => void;
}

const CATEGORIAS: { key: Categoria; label: string; icon: string }[] = [
  { key: 'ropa', label: 'Ropa', icon: '👕' },
  { key: 'productos', label: 'Productos', icon: '📦' },
  { key: 'promociones', label: 'Promociones', icon: '🏷️' },
];

export function Sidebar({ categoriaActiva, onSelectCategoria, onAddClick }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-ink text-white flex flex-col gap-8 p-5 min-h-screen">
      <div>
        <div className="text-base font-bold">Stock Estación</div>
        <div className="text-xs text-slate-300 mt-0.5">Sistema de inventario</div>
      </div>

      <div className="border-t border-white/10" />

      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">
          Módulos
        </div>
        <nav className="flex flex-col gap-1">
          {CATEGORIAS.map((c) => (
            <button
              key={c.key}
              onClick={() => onSelectCategoria(c.key)}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${
                categoriaActiva === c.key
                  ? 'bg-amber text-ink'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </nav>
      </div>

      <button
        onClick={onAddClick}
        className="mt-auto bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-lg py-2.5"
      >
        ＋ Agregar producto
      </button>
    </aside>
  );
}