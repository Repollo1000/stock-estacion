import type { Categoria, Usuario, Negocio, FileEstacion } from '../types';
import { IconClose, IconTag, IconBox, IconPercent, IconSwitch, IconLogout, IconInbox, IconOutbox, IconHistory } from './icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categoriaActiva: Categoria;
  onSelectCategoria: (cat: Categoria) => void;
  onAddClick: () => void;
  onRestockClick: () => void;
  onSalidaClick: () => void;
  onHistorialClick: () => void;
  usuario: Usuario;
  negocioActual: Negocio;
  fileActual: FileEstacion;
  puedeCambiarNegocio: boolean;
  onChangeFile: () => void;
  onChangeNegocio: () => void;
  onLogout: () => void;
}

const CATEGORIAS: { key: Categoria; label: string; icon: typeof IconTag }[] = [
  { key: 'productos', label: 'Productos', icon: IconBox },
  { key: 'ropa', label: 'Ropa', icon: IconTag },
  { key: 'promociones', label: 'Promociones', icon: IconPercent },
];

export function Sidebar({
  isOpen,
  onClose,
  categoriaActiva,
  onSelectCategoria,
  onAddClick,
  onRestockClick,
  onSalidaClick,
  onHistorialClick,
  usuario,
  negocioActual,
  fileActual,
  puedeCambiarNegocio,
  onChangeFile,
  onChangeNegocio,
  onLogout,
}: SidebarProps) {
  return (
    <>
      {/* Overlay oscuro, visible cuando el drawer está abierto (en cualquier tamaño de pantalla) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-30 transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 m-4 rounded-xl shadow-soft bg-ink-deep text-white flex flex-col gap-8 p-5
          transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-sm font-bold shrink-0">
              S
            </span>
            <div>
              <div className="text-base font-semibold">Stock Estación</div>
              <div className="text-xs text-white/50 mt-0.5">{negocioActual.name}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar menú" className="text-white/50 hover:text-white transition">
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <div className="border-t border-white/10" />

        <div>
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">
            Módulos
          </div>
          <nav className="flex flex-col gap-1">
            {CATEGORIAS.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  onSelectCategoria(c.key);
                  onClose();
                }}
                className={`flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  categoriaActiva === c.key
                    ? 'bg-white/10 text-white border-l-2 border-brand-light'
                    : 'text-white/60 hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <c.icon className="w-4 h-4 shrink-0" />
                {c.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={() => {
              onAddClick();
              onClose();
            }}
            className="bg-brand hover:bg-brand-dark transition text-sm font-semibold rounded-lg py-2.5"
          >
            + Agregar producto
          </button>
          <button
            onClick={() => {
              onSalidaClick();
              onClose();
            }}
            className="flex items-center justify-center gap-2 bg-danger/15 text-danger hover:bg-danger/25 transition text-sm font-semibold rounded-lg py-2.5"
          >
            <IconOutbox className="w-4 h-4" />
            - Sacar producto
          </button>
          <button
            onClick={() => {
              onRestockClick();
              onClose();
            }}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 transition text-sm font-semibold rounded-lg py-2.5"
          >
            <IconInbox className="w-4 h-4" />
            Reponer stock
          </button>

          {negocioActual.role === 'administrador' && (
            <button
              onClick={() => {
                onHistorialClick();
                onClose();
              }}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 transition text-sm font-semibold rounded-lg py-2.5"
            >
              <IconHistory className="w-4 h-4" />
              Historial
            </button>
          )}
        </div>

        <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
          <div className="px-1 mb-1">
            <div className="text-sm font-medium text-white/80 truncate">{usuario.displayName}</div>
            <div className="text-xs text-white/40 truncate">
              {fileActual.name} · #{fileActual.code}
            </div>
          </div>
          <button
            onClick={onChangeFile}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition"
          >
            <IconSwitch className="w-4 h-4 shrink-0" />
            Cambiar de file
          </button>
          {puedeCambiarNegocio && (
            <button
              onClick={onChangeNegocio}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition"
            >
              <IconSwitch className="w-4 h-4 shrink-0" />
              Cambiar de negocio
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition"
          >
            <IconLogout className="w-4 h-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
