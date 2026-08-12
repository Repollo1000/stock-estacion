import { useEffect, useState } from 'react';
import type { Usuario, Negocio, FileEstacion } from '../types';
import { getFiles, createFile } from '../lib/data';
import { IconLogout, IconSwitch } from './icons';

interface SelectFileProps {
  usuario: Usuario;
  negocioActual: Negocio;
  onSelectFile: (file: FileEstacion) => void;
  onChangeNegocio: () => void;
  onLogout: () => void;
}

export function SelectFile({ usuario, negocioActual, onSelectFile, onChangeNegocio, onLogout }: SelectFileProps) {
  const [files, setFiles] = useState<FileEstacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    getFiles(negocioActual.id)
      .then(setFiles)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los files.'))
      .finally(() => setCargando(false));
  }, [negocioActual.id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const codeLimpio = code.trim();
    const nameLimpio = name.trim();
    if (!codeLimpio || !nameLimpio) return;

    setCreando(true);
    setError('');
    try {
      const nuevoFile = await createFile(codeLimpio, nameLimpio, negocioActual.id);
      onSelectFile(nuevoFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el file.');
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-ink">Elegí un file</h1>
            <p className="text-sm text-slate mt-1">
              {usuario.displayName} · {negocioActual.name}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onChangeNegocio}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-brand transition"
            >
              <IconSwitch className="w-4 h-4" />
              Cambiar negocio
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-danger transition"
            >
              <IconLogout className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>

        {cargando && <p className="text-sm text-slate mb-6">Cargando files...</p>}

        {!cargando && files.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {files.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFile(f)}
                className="text-left bg-surface border border-line rounded-xl p-4 shadow-soft-sm hover:border-brand transition"
              >
                <div className="text-xs font-mono text-slate">#{f.code}</div>
                <div className="font-semibold text-ink mt-1">{f.name}</div>
              </button>
            ))}
          </div>
        )}

        {negocioActual.role === 'administrador' && (showForm ? (
          <form
            onSubmit={handleCreate}
            className="bg-surface border border-line rounded-xl p-4 shadow-soft-sm flex flex-col gap-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Código</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError('');
                  }}
                  autoFocus
                  disabled={creando}
                  className="w-full px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Nombre / ubicación</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={creando}
                  className="w-full px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
                />
              </div>
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creando}
                className="flex-1 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-lg py-2.5 transition disabled:opacity-60"
              >
                {creando ? 'Creando...' : 'Crear y entrar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError('');
                }}
                disabled={creando}
                className="px-4 rounded-lg border border-line text-sm font-semibold text-slate hover:bg-cloud transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border border-dashed border-line rounded-xl py-4 text-sm font-semibold text-slate hover:border-brand hover:text-brand transition"
          >
            + Crear nuevo file
          </button>
        ))}
      </div>
    </div>
  );
}
