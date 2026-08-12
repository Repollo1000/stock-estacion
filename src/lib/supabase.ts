import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // No usamos `throw` acá: un throw incondicional a nivel de módulo hace que Vite/Rolldown
  // trate todo lo que importa este archivo (o sea, toda la app) como código muerto y lo
  // elimine del bundle de producción en silencio cuando falta el .env en build time.
  console.error(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copiá .env.example a .env y completá tus credenciales de Supabase.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
