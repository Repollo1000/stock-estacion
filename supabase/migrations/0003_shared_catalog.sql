-- Catálogo compartido: qué ES el producto, igual en todos los files
create table public.productos_catalogo (
  id uuid primary key default gen_random_uuid(),
  barcode text,
  case_barcode text,
  units_per_case integer not null default 1 check (units_per_case >= 1),
  name text not null,
  variant text,
  created_by uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  constraint catalogo_case_barcode_distinct check (case_barcode is null or case_barcode <> barcode)
);
create unique index catalogo_barcode_idx
  on public.productos_catalogo(barcode) where barcode is not null and barcode <> '';
create unique index catalogo_case_barcode_idx
  on public.productos_catalogo(case_barcode) where case_barcode is not null;

-- Stock por file: cuánto hay y cómo se clasifica en ESE file
create table public.stock_por_file (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  producto_id uuid not null references public.productos_catalogo(id) on delete cascade,
  category public.categoria not null,
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  created_by uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (file_id, producto_id)
);
create index stock_por_file_file_category_idx on public.stock_por_file(file_id, category);

-- Migrar datos existentes 1:1 (reusamos el mismo id viejo en ambas tablas nuevas
-- para no tener que reescribir el historial de movimientos_stock)
insert into public.productos_catalogo (id, barcode, case_barcode, units_per_case, name, variant, created_by, created_at)
  select id, barcode, case_barcode, units_per_case, name, variant, created_by, created_at
  from public.productos;

insert into public.stock_por_file (id, file_id, producto_id, category, stock, min_stock, created_by, created_at, updated_at)
  select id, file_id, id, category, stock, min_stock, created_by, created_at, updated_at
  from public.productos;

-- movimientos_stock pasa a apuntar a la fila de stock (no al catálogo)
alter table public.movimientos_stock rename column producto_id to stock_id;
alter table public.movimientos_stock drop constraint if exists movimientos_stock_producto_id_fkey;
alter table public.movimientos_stock
  add constraint movimientos_stock_stock_id_fkey foreign key (stock_id) references public.stock_por_file(id) on delete cascade;

-- ajustar_stock ahora opera sobre stock_por_file
drop function if exists public.ajustar_stock(uuid, integer);
create function public.ajustar_stock(p_stock_id uuid, p_delta integer)
returns public.stock_por_file as $$
declare
  resultado public.stock_por_file;
begin
  update public.stock_por_file
    set stock = greatest(0, stock + p_delta), updated_at = now()
    where id = p_stock_id
    returning * into resultado;

  insert into public.movimientos_stock (stock_id, usuario_id, delta, stock_resultante)
    values (p_stock_id, auth.uid(), p_delta, resultado.stock);

  return resultado;
end;
$$ language plpgsql security definer set search_path = public;

-- Agregar producto a un file: reusa el catálogo si el código ya existe (de cualquier
-- file), si no lo crea. Atómico para evitar catálogos duplicados por condición de carrera.
create function public.agregar_producto_a_file(
  p_file_id uuid, p_barcode text, p_case_barcode text, p_units_per_case integer,
  p_name text, p_category public.categoria, p_stock integer, p_min_stock integer
) returns public.stock_por_file as $$
declare
  v_producto_id uuid;
  v_resultado public.stock_por_file;
begin
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

-- Tabla vieja: ya migrada, se puede borrar
drop table public.productos;

-- RLS (mismo criterio que el resto: cualquier autenticado)
alter table public.productos_catalogo enable row level security;
alter table public.stock_por_file enable row level security;
create policy "todo en catalogo" on public.productos_catalogo for all to authenticated using (true) with check (true);
create policy "todo en stock_por_file" on public.stock_por_file for all to authenticated using (true) with check (true);

-- Realtime: lo que necesita verse en vivo es el stock, no el catálogo
alter publication supabase_realtime drop table public.productos;
alter publication supabase_realtime add table public.stock_por_file;
