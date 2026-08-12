import { useEffect, useState } from 'react';
import type { Usuario, Negocio } from '../types';
import { getMisNegocios } from '../lib/data';
import { IconLogout } from './icons';

interface SelectNegocioProps {
  usuario: Usuario;
  onSelectNegocio: (negocio: Negocio) => void;
  onLogout: () => void;
}

export function SelectNegocio({ usuario, onSelectNegocio, onLogout }: SelectNegocioProps) {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMisNegocios()
      .then(setNegocios)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar tus negocios.'))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="min-h-screen bg-paper p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-ink">Elegí un negocio</h1>
            <p className="text-sm text-slate mt-1">Hola, {usuario.displayName}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-danger transition"
          >
            <IconLogout className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>

        {cargando && <p className="text-sm text-slate">Cargando...</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        {!cargando && !error && negocios.length === 0 && (
          <p className="text-sm text-slate">
            Todavía no tenés ningún negocio asignado. Pedile a un administrador que te agregue.
          </p>
        )}

        {negocios.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {negocios.map((n) => (
              <button
                key={n.id}
                onClick={() => onSelectNegocio(n)}
                className="text-left bg-surface border border-line rounded-xl p-4 shadow-soft-sm hover:border-brand transition"
              >
                <div className="font-semibold text-ink">{n.name}</div>
                <div className="text-xs text-slate mt-1 capitalize">{n.role}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
