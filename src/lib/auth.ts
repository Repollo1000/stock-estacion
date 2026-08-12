import { supabase } from './supabase';
import type { Usuario } from '../types';

async function perfilPara(userId: string, fallbackNombre: string): Promise<Usuario> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, username, display_name')
    .eq('id', userId)
    .single();

  if (error || !data) {
    // El trigger que crea el perfil corre async al signUp; si todavía no llegó, devolvemos un fallback razonable.
    return { id: userId, username: fallbackNombre, displayName: fallbackNombre };
  }

  return { id: data.id, username: data.username, displayName: data.display_name };
}

export async function login(identificador: string, password: string): Promise<Usuario> {
  // Las cuentas se crean a mano en el dashboard de Supabase (Authentication → Add user)
  // con el email real de la persona — no hay auto-registro.
  // Se puede loguear con username o con email: si no hay sesión, RLS bloquea leer `perfiles`,
  // así que la resolución usuario -> email pasa por un RPC security-definer.
  const { data: email, error: errorResolver } = await supabase.rpc('email_por_identificador', {
    p_identificador: identificador,
  });

  // Mismo mensaje de error tanto si el identificador no existe como si la contraseña es incorrecta,
  // para no revelar cuáles usuarios/emails existen a través del propio flujo de login.
  if (errorResolver || !email) {
    throw new Error('Usuario/email o contraseña incorrectos.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error('Usuario/email o contraseña incorrectos.');
  }

  const fallback = (data.user.user_metadata?.username as string | undefined) ?? email;
  return perfilPara(data.user.id, fallback);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function solicitarRecuperacion(email: string): Promise<void> {
  // Supabase no distingue "email no existe" de "listo, se envió" en la respuesta (por diseño,
  // para no filtrar qué emails están registrados) — un error acá es un problema real (rate limit, etc).
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin,
  });
  if (error) throw new Error(error.message);
}

export async function actualizarContrasena(nuevaContrasena: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: nuevaContrasena });
  if (error) throw new Error(error.message);
}

export async function getUsuarioActual(): Promise<Usuario | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;

  const fallback = (user.user_metadata?.username as string | undefined) ?? user.email ?? 'usuario';
  return perfilPara(user.id, fallback);
}
