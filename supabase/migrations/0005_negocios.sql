create table public.negocios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.negocios enable row level security;

-- Negocio existente: todo lo que ya hay hoy (files, perfiles) pertenece a este único negocio
insert into public.negocios (id, name) values ('00000000-0000-0000-0000-000000000001', 'Mi negocio');

alter table public.files add column negocio_id uuid references public.negocios(id);
update public.files set negocio_id = '00000000-0000-0000-0000-000000000001';
alter table public.files alter column negocio_id set not null;

alter table public.perfiles add column negocio_id uuid references public.negocios(id);
update public.perfiles set negocio_id = '00000000-0000-0000-0000-000000000001';
alter table public.perfiles alter column negocio_id set not null;

-- Helper security definer: evita recursión de RLS al consultar "mi propio negocio" desde
-- policies de la propia tabla perfiles.
create or replace function public.mi_negocio()
returns uuid language sql security definer stable set search_path = public as $$
  select negocio_id from public.perfiles where id = auth.uid();
$$;

create policy "leer mi negocio" on public.negocios for select to authenticated
  using (id = public.mi_negocio());

-- Un file nuevo hereda el negocio de quien lo crea (así el frontend no necesita cambios)
create or replace function public.set_file_negocio()
returns trigger as $$
begin
  if new.negocio_id is null then
    new.negocio_id := public.mi_negocio();
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger set_file_negocio_trigger before insert on public.files
  for each row execute function public.set_file_negocio();

-- handle_new_user ahora también requiere negocio_id en los metadatos del usuario nuevo
create or replace function public.handle_new_user()
returns trigger as $$
declare
  nombre_usuario text;
  rol text;
  neg_id uuid;
begin
  nombre_usuario := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  rol := coalesce(new.raw_user_meta_data->>'role', 'trabajador');
  if rol not in ('trabajador', 'administrador') then
    rol := 'trabajador';
  end if;
  neg_id := (new.raw_user_meta_data->>'negocio_id')::uuid;

  insert into public.perfiles (id, username, display_name, role, negocio_id)
  values (new.id, nombre_usuario, nombre_usuario, rol, neg_id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- RLS: cada tabla queda restringida al propio negocio (productos_catalogo se deja global,
-- a propósito, para que el catálogo se comparta entre negocios)
drop policy if exists "leer perfiles" on public.perfiles;
create policy "propio negocio en perfiles" on public.perfiles for select to authenticated
  using (negocio_id = public.mi_negocio());

drop policy if exists "todo en files" on public.files;
create policy "propio negocio en files" on public.files for all to authenticated
  using (negocio_id = public.mi_negocio())
  with check (negocio_id = public.mi_negocio());

drop policy if exists "todo en stock_por_file" on public.stock_por_file;
create policy "propio negocio en stock" on public.stock_por_file for all to authenticated
  using (exists (select 1 from public.files f where f.id = stock_por_file.file_id and f.negocio_id = public.mi_negocio()))
  with check (exists (select 1 from public.files f where f.id = stock_por_file.file_id and f.negocio_id = public.mi_negocio()));

drop policy if exists "admins leen movimientos" on public.movimientos_stock;
create policy "admins del negocio leen movimientos" on public.movimientos_stock for select to authenticated
  using (
    exists (select 1 from public.perfiles where id = auth.uid() and role = 'administrador')
    and exists (
      select 1 from public.stock_por_file spf join public.files f on f.id = spf.file_id
      where spf.id = movimientos_stock.stock_id and f.negocio_id = public.mi_negocio()
    )
  );

-- Los RPC security definer bypasean RLS: hay que chequear el negocio a mano adentro,
-- si no cualquier usuario podría ajustar/crear stock en files de OTRO negocio.
create or replace function public.ajustar_stock(p_stock_id uuid, p_delta integer)
returns public.stock_por_file as $$
declare
  resultado public.stock_por_file;
begin
  if not exists (
    select 1 from public.stock_por_file spf join public.files f on f.id = spf.file_id
    where spf.id = p_stock_id and f.negocio_id = public.mi_negocio()
  ) then
    raise exception 'No autorizado';
  end if;

  update public.stock_por_file
    set stock = greatest(0, stock + p_delta), updated_at = now()
    where id = p_stock_id
    returning * into resultado;

  insert into public.movimientos_stock (stock_id, usuario_id, delta, stock_resultante)
    values (p_stock_id, auth.uid(), p_delta, resultado.stock);

  return resultado;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.agregar_producto_a_file(
  p_file_id uuid, p_barcode text, p_case_barcode text, p_units_per_case integer,
  p_name text, p_category public.categoria, p_stock integer, p_min_stock integer
) returns public.stock_por_file as $$
declare
  v_producto_id uuid;
  v_resultado public.stock_por_file;
begin
  if not exists (select 1 from public.files where id = p_file_id and negocio_id = public.mi_negocio()) then
    raise exception 'No autorizado';
  end if;

  select id into v_producto_id from public.productos_catalogo
    where (p_barcode is not null and p_barcode <> '' and barcode = p_barcode)
       or (p_case_barcode is not null and p_case_barcode <> '' and case_barcode = p_case_barcode)
    limit 1;

  if v_producto_id is null then
    insert into public.productos_catalogo (barcode, case_barcode, units_per_case, name, created_by)
      values (nullif(p_barcode, ''), nullif(p_case_barcode, ''), coalesce(p_units_per_case, 1), p_name, auth.uid())
      returning id into v_producto_id;
  end if;

  insert into public.stock_por_file (file_id, producto_id, category, stock, min_stock, created_by)
    values (p_file_id, v_producto_id, p_category, p_stock, p_min_stock, auth.uid())
    returning * into v_resultado;

  return v_resultado;
end;
$$ language plpgsql security definer set search_path = public;
