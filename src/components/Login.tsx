import { useState } from 'react';
import type { Usuario } from '../types';
import { login, solicitarRecuperacion } from '../lib/auth';

interface LoginProps {
  onLogin: (usuario: Usuario) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false);
  const [mensajeRecuperar, setMensajeRecuperar] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const identificadorLimpio = identificador.trim();
    if (!identificadorLimpio || !password) return;

    setCargando(true);
    setError('');
    try {
      const usuario = await login(identificadorLimpio, password);
      onLogin(usuario);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault();
    const emailLimpio = emailRecuperar.trim();
    if (!emailLimpio) return;

    setEnviandoRecuperar(true);
    setMensajeRecuperar('');
    try {
      await solicitarRecuperacion(emailLimpio);
      setMensajeRecuperar('Si ese email tiene una cuenta, te llegará un link para restablecer la contraseña.');
    } catch (err) {
      setMensajeRecuperar(err instanceof Error ? err.message : 'No se pudo enviar el email.');
    } finally {
      setEnviandoRecuperar(false);
    }
  }

  if (modoRecuperar) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <form
          onSubmit={handleRecuperar}
          className="w-full max-w-sm bg-surface border border-line rounded-xl shadow-soft-sm p-6 flex flex-col gap-4"
        >
          <div>
            <div className="text-base font-semibold text-ink">Recuperar contraseña</div>
            <div className="text-xs text-slate mt-1">Ingresá tu email y te mandamos un link para elegir una nueva.</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Email</label>
            <input
              type="email"
              value={emailRecuperar}
              onChange={(e) => {
                setEmailRecuperar(e.target.value);
                setMensajeRecuperar('');
              }}
              autoFocus
              disabled={enviandoRecuperar}
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
            />
          </div>

          {mensajeRecuperar && <p className="text-xs text-slate">{mensajeRecuperar}</p>}

          <button
            type="submit"
            disabled={enviandoRecuperar}
            className="bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg py-2.5 transition disabled:opacity-60"
          >
            {enviandoRecuperar ? 'Enviando...' : 'Enviar link'}
          </button>

          <button
            type="button"
            onClick={() => {
              setModoRecuperar(false);
              setMensajeRecuperar('');
            }}
            className="text-xs font-semibold text-slate hover:text-brand transition text-center"
          >
            Volver a iniciar sesión
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface border border-line rounded-xl shadow-soft-sm p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-sm font-bold text-white shrink-0">
            S
          </span>
          <div>
            <div className="text-base font-semibold text-ink">Stock Estación</div>
            <div className="text-xs text-slate">Ingresá con tu usuario o email</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Usuario o email</label>
          <input
            type="text"
            value={identificador}
            onChange={(e) => {
              setIdentificador(e.target.value);
              setError('');
            }}
            autoFocus
            disabled={cargando}
            autoComplete="username"
            className="w-full px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate uppercase tracking-wide">Contraseña</label>
            <button
              type="button"
              onClick={() => {
                setModoRecuperar(true);
                setEmailRecuperar('');
              }}
              className="text-xs font-semibold text-brand hover:text-brand-dark transition"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            disabled={cargando}
            autoComplete="current-password"
            className="w-full px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg py-2.5 transition disabled:opacity-60"
        >
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="text-xs text-slate text-center leading-relaxed">
          Las cuentas las crea un administrador. Si no podés entrar, pedí que te den de alta.
        </p>
      </form>
    </div>
  );
}
