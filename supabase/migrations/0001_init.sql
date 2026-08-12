-- Perfil de la app por cada auth.users de Supabase
create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Se completa solo cuando alguien se registra vía Supabase Auth.
-- Si no viene 'username' en los metadatos (ej. usuario creado a mano desde el dashboard
-- en vez de por la app), usamos la parte local del email como fallback para no romper
-- el insert (perfiles.username es NOT NULL, y si el trigger falla, falla TODA la creación
-- del usuario en auth.users porque corre en la misma transacción).
create function public.handle_new_user()
returns trigger as $$
declare
  nombre_usuario text;
begin
  nombre_usuario := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));

  insert into public.perfiles (id, username, display_name)
  values (new.id, nombre_usuario, nombre_usuario);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.files (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_by uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create type public.categoria as enum ('ropa', 'productos', 'promociones');

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  barcode text,
  name text not null,
  category public.categoria not null,
  variant text,
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  created_by uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index productos_file_category_idx on public.productos(file_id, category);
create index productos_barcode_idx on public.productos(barcode);

-- Auditoría: quién ajustó qué y cuánto (el objetivo original del login: identificar cambios)
create table public.movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  usuario_id uuid not null references public.perfiles(id),
  delta integer not null,
  stock_resultante integer not null,
  created_at timestamptz not null default now()
);
create index movimientos_producto_idx on public.movimientos_stock(producto_id, created_at);

-- Ajuste atómico de stock (evita condiciones de carrera entre dispositivos concurrentes)
create function public.ajustar_stock(p_producto_id uuid, p_delta integer)
returns public.productos as $$
declare
  resultado public.productos;
begin
  update public.productos
    set stock = greatest(0, stock + p_delta), updated_at = now()
    where id = p_producto_id
    returning * into resultado;

  insert into public.movimientos_stock (producto_id, usuario_id, delta, stock_resultante)
    values (p_producto_id, auth.uid(), p_delta, resultado.stock);

  return resultado;
end;
$$ language plpgsql security definer set search_path = public;

-- RLS: cualquier usuario autenticado puede leer/escribir (no hay permisos por file todavía)
alter table public.perfiles enable row level security;
alter table public.files enable row level security;
alter table public.productos enable row level security;
alter table public.movimientos_stock enable row level security;

create policy "leer perfiles" on public.perfiles for select to authenticated using (true);
create policy "todo en files" on public.files for all to authenticated using (true) with check (true);
create policy "todo en productos" on public.productos for all to authenticated using (true) with check (true);
create policy "leer movimientos" on public.movimientos_stock for select to authenticated using (true);
create policy "insertar movimientos" on public.movimientos_stock for insert to authenticated with check (true);

-- Realtime para multi-dispositivo
alter publication supabase_realtime add table public.productos;
