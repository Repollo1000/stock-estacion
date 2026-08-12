import { useState } from 'react';
import { actualizarContrasena } from '../lib/auth';

interface NuevaContrasenaProps {
  onListo: () => void;
}

export function NuevaContrasena({ onListo }: NuevaContrasenaProps) {
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setGuardando(true);
    setError('');
    try {
      await actualizarContrasena(password);
      onListo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface border border-line rounded-xl shadow-soft-sm p-6 flex flex-col gap-4"
      >
        <div>
          <div className="text-base font-semibold text-ink">Elegí una nueva contraseña</div>
          <div className="text-xs text-slate mt-1">Se va a usar para tu próximo inicio de sesión.</div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Nueva contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            autoFocus
            disabled={guardando}
            autoComplete="new-password"
            className="w-full px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Repetir contraseña</label>
          <input
            type="password"
            value={confirmar}
            onChange={(e) => {
              setConfirmar(e.target.value);
              setError('');
            }}
            disabled={guardando}
            autoComplete="new-password"
            className="w-full px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg py-2.5 transition disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </form>
    </div>
  );
}
