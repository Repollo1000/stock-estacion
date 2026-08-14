-- Bloque único: "Sacar producto" (motivo='venta') queda restringido a administradores.
-- Se refuerza en el RPC (no solo en la UI) porque cualquier miembro del negocio podría
-- llamar a ajustar_stock directo (ej. desde devtools) evitando el botón escondido.
RESET ROLE;

create or replace function public.ajustar_stock(p_stock_id uuid, p_delta integer, p_motivo text default 'ajuste')
returns public.stock_por_file as $$
declare
  resultado public.stock_por_file;
  v_motivo text := p_motivo;
  v_role text;
begin
  if v_motivo not in ('venta', 'ajuste', 'reposicion') then
    v_motivo := 'ajuste';
  end if;

  select pn.role into v_role
    from public.stock_por_file spf
    join public.files f on f.id = spf.file_id
    join public.perfil_negocios pn on pn.negocio_id = f.negocio_id
    where spf.id = p_stock_id and pn.perfil_id = auth.uid();

  if v_role is null then
    raise exception 'No autorizado';
  end if;

  if v_motivo = 'venta' and v_role <> 'administrador' then
    raise exception 'Solo un administrador puede registrar salidas de stock';
  end if;

  update public.stock_por_file set stock = greatest(0, stock + p_delta), updated_at = now()
    where id = p_stock_id returning * into resultado;
  insert into public.movimientos_stock (stock_id, usuario_id, delta, stock_resultante, motivo)
    values (p_stock_id, auth.uid(), p_delta, resultado.stock, v_motivo);
  return resultado;
end;
$$ language plpgsql security definer set search_path = public;
