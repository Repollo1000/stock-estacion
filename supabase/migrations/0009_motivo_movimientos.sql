-- Bloque único: agrega motivo a los movimientos (para poder distinguir ventas de correcciones
-- manuales o reposiciones) y actualiza ajustar_stock para que lo reciba y lo guarde.
RESET ROLE;

alter table public.movimientos_stock
  add column motivo text not null default 'ajuste' check (motivo in ('venta', 'ajuste', 'reposicion'));

-- Se dropea explícito antes de recrear: cambia la firma (nuevo parámetro), y "create or replace"
-- con una firma distinta crea una función NUEVA en vez de reemplazar la vieja (quedarían las dos).
drop function if exists public.ajustar_stock(uuid, integer);

create or replace function public.ajustar_stock(p_stock_id uuid, p_delta integer, p_motivo text default 'ajuste')
returns public.stock_por_file as $$
declare
  resultado public.stock_por_file;
  v_motivo text := p_motivo;
begin
  if v_motivo not in ('venta', 'ajuste', 'reposicion') then
    v_motivo := 'ajuste';
  end if;

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
  insert into public.movimientos_stock (stock_id, usuario_id, delta, stock_resultante, motivo)
    values (p_stock_id, auth.uid(), p_delta, resultado.stock, v_motivo);
  return resultado;
end;
$$ language plpgsql security definer set search_path = public;
