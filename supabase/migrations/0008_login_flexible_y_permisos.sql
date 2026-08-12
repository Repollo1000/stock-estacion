-- Bloque 1: función que resuelve "usuario o email" -> email real, para poder loguearse con cualquiera de los dos.
-- Es security definer porque antes de loguearse no hay sesión (rol anon) y RLS bloquea la lectura de perfiles/auth.users;
-- esta función corre con privilegios del dueño (postgres) y expone SOLO el email resuelto, nada más.
-- Nota de seguridad: como cualquiera (anon) puede llamarla, en teoría permite enumerar qué usernames existen
-- (si el resultado no es null, el username existe). Es un trade-off inherente a soportar login por usuario.
create or replace function public.email_por_identificador(p_identificador text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_identificador ilike '%@%' then lower(trim(p_identificador))
    else (
      select u.email from auth.users u
      join public.perfiles p on p.id = u.id
      where lower(p.username) = lower(trim(p_identificador))
      limit 1
    )
  end;
$$;

revoke all on function public.email_por_identificador(text) from public;
grant execute on function public.email_por_identificador(text) to anon, authenticated;

-- Bloque 2: solo administradores pueden crear files nuevos (antes cualquier miembro del negocio podía).
-- De paso, la policy vieja era "for all" (select+insert+update+delete con la misma condición);
-- se reemplaza por policies separadas y más chicas: cualquier miembro puede LEER, solo un admin puede CREAR.
drop policy if exists "files de mis negocios" on public.files;

create policy "ver files de mis negocios" on public.files for select to authenticated
  using (exists (
    select 1 from public.perfil_negocios pn
    where pn.perfil_id = auth.uid() and pn.negocio_id = files.negocio_id
  ));

create policy "admins crean files" on public.files for insert to authenticated
  with check (exists (
    select 1 from public.perfil_negocios pn
    where pn.perfil_id = auth.uid() and pn.negocio_id = files.negocio_id and pn.role = 'administrador'
  ));
