alter table public.perfiles add column role text not null default 'trabajador' check (role in ('trabajador', 'administrador'));

create or replace function public.handle_new_user()
returns trigger as $$
declare
  nombre_usuario text;
  rol text;
begin
  nombre_usuario := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  rol := coalesce(new.raw_user_meta_data->>'role', 'trabajador');
  if rol not in ('trabajador', 'administrador') then
    rol := 'trabajador';
  end if;

  insert into public.perfiles (id, username, display_name, role)
  values (new.id, nombre_usuario, nombre_usuario, rol);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Solo administradores pueden LEER el historial (el insert lo sigue haciendo el RPC
-- security definer ajustar_stock, que no pasa por esta policy)
drop policy if exists "leer movimientos" on public.movimientos_stock;
create policy "admins leen movimientos" on public.movimientos_stock for select to authenticated
  using (exists (select 1 from public.perfiles where id = auth.uid() and role = 'administrador'));
