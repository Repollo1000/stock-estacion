import { supabase } from './supabase';
import type { Categoria, FileEstacion, Negocio, Producto } from '../types';

// Escapa un valor para pasarlo dentro de un filtro .or() de PostgREST: si el código escaneado/tipeado
// a mano trae una coma, paréntesis o punto, esos caracteres son sintaxis de filtro para PostgREST
// (rompen el "or" o lo redefinen) salvo que el valor completo vaya entre comillas dobles.
function comoValorDeFiltro(valor: string): string {
  return `"${valor.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

const STOCK_COLUMNS_EMBED = `
  id, category, stock, min_stock, updated_at,
  producto:productos_catalogo ( barcode, case_barcode, units_per_case, name, variant )
`;

interface CatalogoRow {
  barcode: string | null;
  case_barcode: string | null;
  units_per_case: number;
  name: string;
  variant: string | null;
}

interface StockRow {
  id: string;
  category: Categoria;
  stock: number;
  min_stock: number;
  updated_at: string;
  producto: CatalogoRow;
}

function rowToProducto(row: StockRow): Producto {
  return {
    id: row.id,
    barcode: row.producto.barcode ?? '',
    caseBarcode: row.producto.case_barcode ?? undefined,
    unitsPerCase: row.producto.units_per_case,
    name: row.producto.name,
    category: row.category,
    variant: row.producto.variant ?? undefined,
    stock: row.stock,
    minStock: row.min_stock,
    updatedAt: row.updated_at,
  };
}

export async function getMisNegocios(): Promise<Negocio[]> {
  const { data, error } = await supabase
    .from('perfil_negocios')
    .select('role, negocio:negocios ( id, name )');

  if (error) throw new Error(error.message);

  return (data as unknown as { role: Negocio['role']; negocio: { id: string; name: string } }[])
    .map((row) => ({ id: row.negocio.id, name: row.negocio.name, role: row.role }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFiles(negocioId: string): Promise<FileEstacion[]> {
  const { data, error } = await supabase
    .from('files')
    .select('id, code, name')
    .eq('negocio_id', negocioId)
    .order('code');

  if (error) throw new Error(error.message);
  return data;
}

export async function createFile(code: string, name: string, negocioId: string): Promise<FileEstacion> {
  const { data, error } = await supabase
    .from('files')
    .insert({ code, name, negocio_id: negocioId })
    .select('id, code, name')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe un file con ese código.');
    throw new Error(error.message);
  }
  return data;
}

export async function getProductos(fileId: string): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('stock_por_file')
    .select(STOCK_COLUMNS_EMBED)
    .eq('file_id', fileId);

  if (error) throw new Error(error.message);
  // No se puede ordenar por columna embebida (productos_catalogo.name) vía PostgREST.
  return (data as unknown as StockRow[]).map(rowToProducto).sort((a, b) => a.name.localeCompare(b.name));
}

interface NuevoProducto {
  fileId: string;
  barcode: string;
  caseBarcode: string;
  unitsPerCase: number;
  name: string;
  category: Categoria;
  stock: number;
  minStock: number;
}

export async function addProducto(nuevo: NuevoProducto): Promise<Producto> {
  const { data, error } = await supabase
    .rpc('agregar_producto_a_file', {
      p_file_id: nuevo.fileId,
      p_barcode: nuevo.barcode,
      p_case_barcode: nuevo.caseBarcode,
      p_units_per_case: nuevo.unitsPerCase || 1,
      p_name: nuevo.name,
      p_category: nuevo.category,
      p_stock: nuevo.stock,
      p_min_stock: nuevo.minStock,
    })
    .select(STOCK_COLUMNS_EMBED)
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Ya tenés este producto cargado en este file.');
    throw new Error(error.message);
  }
  return rowToProducto(data as unknown as StockRow);
}

export async function adjustStock(stockId: string, delta: number): Promise<Producto> {
  const { data, error } = await supabase
    .rpc('ajustar_stock', { p_stock_id: stockId, p_delta: delta })
    .select(STOCK_COLUMNS_EMBED)
    .single();

  if (error) throw new Error(error.message);
  return rowToProducto(data as unknown as StockRow);
}

export async function deleteProducto(id: string): Promise<void> {
  const { error } = await supabase.from('stock_por_file').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

interface ProductoEncontrado {
  producto: Producto;
  unidades: number;
}

export async function findProductoByBarcode(fileId: string, codigo: string): Promise<ProductoEncontrado | null> {
  const { data, error } = await supabase
    .from('stock_por_file')
    .select(STOCK_COLUMNS_EMBED)
    .eq('file_id', fileId)
    .or(`barcode.eq.${comoValorDeFiltro(codigo)},case_barcode.eq.${comoValorDeFiltro(codigo)}`, { foreignTable: 'productos_catalogo' })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const producto = rowToProducto(data as unknown as StockRow);
  const unidades = producto.barcode === codigo ? 1 : producto.unitsPerCase;
  return { producto, unidades };
}

export interface CatalogoEntry {
  id: string;
  barcode: string;
  caseBarcode?: string;
  unitsPerCase: number;
  name: string;
  variant?: string;
}

// Busca en el catálogo COMPLETO (de cualquier file), no solo en el stock del file actual.
// Se usa cuando "Reponer stock" no encuentra el código en este file, para saber si el
// producto ya fue cargado en otro file y así reusar sus datos en vez de pedirlos de nuevo.
export async function findCatalogoByBarcode(codigo: string): Promise<CatalogoEntry | null> {
  const { data, error } = await supabase
    .from('productos_catalogo')
    .select('id, barcode, case_barcode, units_per_case, name, variant')
    .or(`barcode.eq.${comoValorDeFiltro(codigo)},case_barcode.eq.${comoValorDeFiltro(codigo)}`)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    barcode: data.barcode ?? '',
    caseBarcode: data.case_barcode ?? undefined,
    unitsPerCase: data.units_per_case,
    name: data.name,
    variant: data.variant ?? undefined,
  };
}

export interface Movimiento {
  id: string;
  productoNombre: string;
  usuarioNombre: string;
  delta: number;
  stockResultante: number;
  createdAt: string;
}

interface MovimientoEmbebido {
  id: string;
  delta: number;
  stock_resultante: number;
  created_at: string;
  usuario: { display_name: string } | null;
}

interface StockConMovimientosRow {
  producto: { name: string };
  movimientos: MovimientoEmbebido[];
}

// RLS restringe la lectura de movimientos_stock a usuarios con role='administrador' —
// para un 'trabajador' esto simplemente devuelve una lista vacía (no un error).
export async function getMovimientos(fileId: string, limite = 100): Promise<Movimiento[]> {
  const { data, error } = await supabase
    .from('stock_por_file')
    .select(`
      producto:productos_catalogo ( name ),
      movimientos:movimientos_stock ( id, delta, stock_resultante, created_at, usuario:perfiles ( display_name ) )
    `)
    .eq('file_id', fileId);

  if (error) throw new Error(error.message);

  const filas = data as unknown as StockConMovimientosRow[];
  const todos: Movimiento[] = filas.flatMap((fila) =>
    fila.movimientos.map((m) => ({
      id: m.id,
      productoNombre: fila.producto.name,
      usuarioNombre: m.usuario?.display_name ?? '—',
      delta: m.delta,
      stockResultante: m.stock_resultante,
      createdAt: m.created_at,
    }))
  );

  return todos
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limite);
}

export function subscribeToProductos(fileId: string, onChange: () => void) {
  const channel = supabase
    .channel(`stock-file-${fileId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'stock_por_file', filter: `file_id=eq.${fileId}` },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
