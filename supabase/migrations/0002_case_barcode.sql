alter table public.productos
  add column case_barcode text,
  add column units_per_case integer not null default 1 check (units_per_case >= 1),
  add constraint case_barcode_distinct check (case_barcode is null or case_barcode <> barcode);

-- Únicos por file para que "buscar producto por código escaneado" no sea ambiguo.
-- No cubre el caso borde de un case_barcode que coincida con el barcode de OTRO
-- producto (requeriría una tabla de códigos normalizada aparte, innecesaria para
-- los dos niveles fijos de empaque que se necesitan hoy).
create unique index productos_barcode_unique_idx
  on public.productos(file_id, barcode) where barcode is not null and barcode <> '';
create unique index productos_case_barcode_unique_idx
  on public.productos(file_id, case_barcode) where case_barcode is not null;
