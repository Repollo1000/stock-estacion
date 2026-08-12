create table public.perfil_negocios (
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  role text not null default 'trabajador' check (role in ('trabajador', 'administrador')),
  primary key (perfil_id, negocio_id)
);
alter table public.perfil_negocios enable row level security;

-- Migrar membresías existentes desde las columnas viejas (se ignoran perfiles sin negocio_id)
insert into public.perfil_negocios (perfil_id, negocio_id, role)
  select id, negocio_id, role from public.perfiles where negocio_id is not null;

-- cascade porque hay varias policies viejas (perfiles, files, stock_por_file, movimientos_stock)
-- y la función mi_negocio() que dependen de estas columnas — todo eso se recrea más abajo.
alter table public.perfiles drop column role cascade;
alter table public.perfiles drop column negocio_id cascade;

-- Ya no aplica: un file nuevo no puede "heredar" un negocio único porque ahora
-- puede haber varios — el negocio pasa a ser explícito desde el cliente.
drop trigger if exists set_file_negocio_trigger on public.files;
drop function if exists public.set_file_negocio();
drop function if exists public.mi_negocio() cascade;

create policy "ver mis membresias" on public.perfil_negocios for select to authenticated
  using (perfil_id = auth.uid());

drop policy if exists "propio negocio en perfiles" on public.perfiles;
create policy "ver perfiles de mis negocios" on public.perfiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.perfil_negocios mine join public.perfil_negocios theirs on theirs.negocio_id = mine.negocio_id
      where mine.perfil_id = auth.uid() and theirs.perfil_id = perfiles.id
    )
  );

drop policy if exists "leer mi negocio" on public.negocios;
create policy "ver mis negocios" on public.negocios for select to authenticated
  using (exists (select 1 from public.perfil_negocios pn where pn.perfil_id = auth.uid() and pn.negocio_id = negocios.id));

drop policy if exists "propio negocio en files" on public.files;
create policy "files de mis negocios" on public.files for all to authenticated
  using (exists (select 1 from public.perfil_negocios pn where pn.perfil_id = auth.uid() and pn.negocio_id = files.negocio_id))
  with check (exists (select 1 from public.perfil_negocios pn where pn.perfil_id = auth.uid() and pn.negocio_id = files.negocio_id));

drop policy if exists "propio negocio en stock" on public.stock_por_file;
create policy "stock de mis negocios" on public.stock_por_file for all to authenticated
  using (exists (
    select 1 from public.files f join public.perfil_negocios pn on pn.negocio_id = f.negocio_id
    where f.id = stock_por_file.file_id and pn.perfil_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.files f join public.perfil_negocios pn on pn.negocio_id = f.negocio_id
    where f.id = stock_por_file.file_id and pn.perfil_id = auth.uid()
  ));

drop policy if exists "admins del negocio leen movimientos" on public.movimientos_stock;
create policy "admins de mis negocios leen movimientos" on public.movimientos_stock for select to authenticated
  using (exists (
    select 1 from public.stock_por_file spf
    join public.files f on f.id = spf.file_id
    join public.perfil_negocios pn on pn.negocio_id = f.negocio_id
    where spf.id = movimientos_stock.stock_id and pn.perfil_id = auth.uid() and pn.role = 'administrador'
  ));

-- RPC: chequeo de negocio actualizado a "soy miembro de ese negocio" (antes era "es MI negocio")
create or replace function public.ajustar_stock(p_stock_id uuid, p_delta integer)
returns public.stock_por_file as $$
declare
  resultado public.stock_por_file;
begin
  if not exists (
    select 1 from public.stock_por_file spf
    join public.files f on f.id = spf.file_id
    join public.perfil_negocios pn on pn.negocio_id = f.negocio_id
    where spf.id = p_stock_id and pn.perfil_id = auth.uid()
  ) then
    raise exception 'No autorizado';
  end if;

  update public.stock_por_file set stock = greatest(0, stock + p_delta), updated_at = now()
    where id = p_stock_id returning * into resultado;
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
  if not exists (
    select 1 from public.files f join public.perfil_negocios pn on pn.negocio_id = f.negocio_id
    where f.id = p_file_id and pn.perfil_id = auth.uid()
  ) then
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

-- handle_new_user: ya no escribe role/negocio_id en perfiles (se borraron esas columnas);
-- si vienen en los metadatos, arma la primera membresía en perfil_negocios.
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

  insert into public.perfiles (id, username, display_name) values (new.id, nombre_usuario, nombre_usuario);

  if neg_id is not null then
    insert into public.perfil_negocios (perfil_id, negocio_id, role) values (new.id, neg_id, rol);
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
