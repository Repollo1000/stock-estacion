import { useState, useEffect } from 'react';
import type { Usuario, Negocio, FileEstacion } from './types';
import { supabase } from './lib/supabase';
import { getUsuarioActual, logout } from './lib/auth';
import { getMisNegocios } from './lib/data';
import { Login } from './components/Login';
import { NuevaContrasena } from './components/NuevaContrasena';
import { SelectNegocio } from './components/SelectNegocio';
import { SelectFile } from './components/SelectFile';
import { Dashboard } from './components/Dashboard';
import './App.css';

type Pantalla = 'cargando' | 'login' | 'nuevaContrasena' | 'selectNegocio' | 'selectFile' | 'dashboard';

function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('cargando');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [negocioActual, setNegocioActual] = useState<Negocio | null>(null);
  const [fileActual, setFileActual] = useState<FileEstacion | null>(null);

  useEffect(() => {
    getUsuarioActual().then((u) => {
      if (u) {
        setUsuario(u);
        entrarASeleccionDeNegocio();
      } else {
        setPantalla('login');
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUsuario(null);
        setNegocioActual(null);
        setFileActual(null);
        setPantalla('login');
      } else if (event === 'PASSWORD_RECOVERY') {
        // Supabase abre una sesión temporal al entrar desde el link del email de recuperación.
        setPantalla('nuevaContrasena');
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Si la cuenta pertenece a un solo negocio, nos ahorramos la pantalla de elegirlo.
  async function entrarASeleccionDeNegocio() {
    try {
      const negocios = await getMisNegocios();
      if (negocios.length === 1) {
        setNegocioActual(negocios[0]);
        setPantalla('selectFile');
        return;
      }
    } catch {
      // si falla, dejamos que la pantalla de selección lo muestre/reintente
    }
    setPantalla('selectNegocio');
  }

  function handleLogin(u: Usuario) {
    setUsuario(u);
    entrarASeleccionDeNegocio();
  }

  function handleSelectNegocio(n: Negocio) {
    setNegocioActual(n);
    setPantalla('selectFile');
  }

  function handleSelectFile(f: FileEstacion) {
    setFileActual(f);
    setPantalla('dashboard');
  }

  async function handleLogout() {
    await logout();
    setUsuario(null);
    setNegocioActual(null);
    setFileActual(null);
    setPantalla('login');
  }

  function handleChangeFile() {
    setFileActual(null);
    setPantalla('selectFile');
  }

  function handleChangeNegocio() {
    setNegocioActual(null);
    setFileActual(null);
    setPantalla('selectNegocio');
  }

  async function handleContrasenaLista() {
    const u = await getUsuarioActual();
    if (u) {
      setUsuario(u);
      entrarASeleccionDeNegocio();
    } else {
      setPantalla('login');
    }
  }

  if (pantalla === 'cargando') {
    return <div className="min-h-screen bg-paper" />;
  }

  // Independiente de `usuario`: el link de recuperación abre una sesión temporal
  // antes de que carguemos el perfil, así que este chequeo va antes del de login.
  if (pantalla === 'nuevaContrasena') {
    return <NuevaContrasena onListo={handleContrasenaLista} />;
  }

  if (pantalla === 'login' || !usuario) {
    return <Login onLogin={handleLogin} />;
  }

  if (pantalla === 'selectNegocio' || !negocioActual) {
    return <SelectNegocio usuario={usuario} onSelectNegocio={handleSelectNegocio} onLogout={handleLogout} />;
  }

  if (pantalla === 'selectFile' || !fileActual) {
    return (
      <SelectFile
        usuario={usuario}
        negocioActual={negocioActual}
        onSelectFile={handleSelectFile}
        onChangeNegocio={handleChangeNegocio}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Dashboard
      usuario={usuario}
      negocioActual={negocioActual}
      fileActual={fileActual}
      onChangeFile={handleChangeFile}
      onChangeNegocio={handleChangeNegocio}
      onLogout={handleLogout}
    />
  );
}

export default App;
