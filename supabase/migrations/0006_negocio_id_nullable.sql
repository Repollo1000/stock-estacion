-- El diálogo simple "Create a new user" del dashboard de Supabase no permite mandar
-- User Metadata (solo email/password) — así que negocio_id no puede llegar seteado en
-- el signup y no puede ser NOT NULL sin que el trigger falle y tire abajo toda la
-- creación del usuario. Se relaja acá; el negocio se completa después a mano con un
-- UPDATE sobre perfiles.
alter table public.perfiles alter column negocio_id drop not null;
