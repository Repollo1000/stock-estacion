import { useRef, useState } from 'react';
import type { Categoria, Producto } from '../types';
import { findProductoByBarcode, findCatalogoByBarcode, addProducto, adjustStock, type CatalogoEntry } from '../lib/data';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { IconCamera, IconClose, IconInbox, IconOutbox } from './icons';

type Modo = 'entrada' | 'salida';

interface StockScannerProps {
  modo: Modo;
  fileId: string;
  onClose: () => void;
  onProductoActualizado: (producto: Producto) => void;
  // Solo aplica al modo 'entrada': no tiene sentido "crear un producto nuevo" al sacar stock.
  onCodigoNoEncontrado?: (codigo: string) => void;
}

interface Entrada {
  id: string;
  texto: string;
  ok: boolean;
}

// Evita contar dos veces el mismo código si sigue en cuadro en el próximo frame.
const COOLDOWN_MS = 2500;

const TEXTOS: Record<Modo, { titulo: string; icono: typeof IconInbox; descripcion: string; botonEscanear: string }> = {
  entrada: {
    titulo: 'Reponer stock',
    icono: IconInbox,
    descripcion:
      'Escaneá el código de la caja (suma todas las unidades de golpe) o de una unidad suelta (suma 1). Podés seguir escaneando cajas una tras otra sin cerrar esto.',
    botonEscanear: 'Empezar a escanear',
  },
  salida: {
    titulo: 'Sacar producto',
    icono: IconOutbox,
    descripcion:
      'Escaneá el código de la caja (resta todas las unidades de golpe) o de una unidad suelta (resta 1, lo normal en una venta). Podés seguir escaneando sin cerrar esto.',
    botonEscanear: 'Empezar a escanear',
  },
};

export function StockScanner({ modo, fileId, onClose, onProductoActualizado, onCodigoNoEncontrado }: StockScannerProps) {
  const textos = TEXTOS[modo];
  const [historial, setHistorial] = useState<Entrada[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [noEncontrado, setNoEncontrado] = useState<string | null>(null);

  // Código ya existe en el catálogo (de OTRO file) pero no está cargado en este file todavía.
  // Solo aplica en modo 'entrada'.
  const [enCatalogo, setEnCatalogo] = useState<CatalogoEntry | null>(null);
  const [categoriaNueva, setCategoriaNueva] = useState<Categoria>('ropa');
  const [stockInicial, setStockInicial] = useState(0);
  const [minStockNuevo, setMinStockNuevo] = useState(5);
  const [agregandoAFile, setAgregandoAFile] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');

  const ultimoCodigo = useRef<{ texto: string; ts: number } | null>(null);

  async function handleDecode(codigo: string) {
    const ahora = Date.now();
    if (ultimoCodigo.current?.texto === codigo && ahora - ultimoCodigo.current.ts < COOLDOWN_MS) {
      return;
    }
    ultimoCodigo.current = { texto: codigo, ts: ahora };

    setProcesando(true);
    try {
      const encontrado = await findProductoByBarcode(fileId, codigo);
      if (encontrado) {
        const delta = modo === 'entrada' ? encontrado.unidades : -encontrado.unidades;
        const actualizado = await adjustStock(encontrado.producto.id, delta, modo === 'entrada' ? 'reposicion' : 'venta');
        onProductoActualizado(actualizado);
        setHistorial((actuales) => [
          {
            id: `${codigo}-${ahora}`,
            texto: `${modo === 'entrada' ? '+' : '-'}${encontrado.unidades} · ${actualizado.name} · nuevo stock: ${actualizado.stock}`,
            ok: true,
          },
          ...actuales,
        ].slice(0, 8));
        return;
      }

      if (modo === 'salida') {
        // No tiene sentido "agregar como producto nuevo" al sacar stock: si no está en este file, no hay nada que restar.
        scanner.detenerEscaneo();
        setNoEncontrado(codigo);
        return;
      }

      // No está en ESTE file — ¿ya existe en el catálogo compartido (cargado en otro file)?
      const catalogo = await findCatalogoByBarcode(codigo);
      scanner.detenerEscaneo();
      if (catalogo) {
        setEnCatalogo(catalogo);
        setStockInicial(0);
        setMinStockNuevo(5);
        setCategoriaNueva('ropa');
      } else {
        setNoEncontrado(codigo);
      }
    } catch (err) {
      setHistorial((actuales) => [
        { id: `err-${ahora}`, texto: err instanceof Error ? err.message : 'No se pudo ajustar el stock.', ok: false },
        ...actuales,
      ].slice(0, 8));
    } finally {
      setProcesando(false);
    }
  }

  const scanner = useBarcodeScanner(handleDecode);

  function handleAgregarNuevo() {
    if (!noEncontrado || !onCodigoNoEncontrado) return;
    scanner.detenerEscaneo();
    onCodigoNoEncontrado(noEncontrado);
  }

  function handleSeguirEscaneando() {
    setNoEncontrado(null);
    scanner.iniciarEscaneo();
  }

  async function handleAgregarAEsteFile() {
    if (!enCatalogo) return;
    setAgregandoAFile(true);
    try {
      const nuevo = await addProducto({
        fileId,
        barcode: enCatalogo.barcode,
        caseBarcode: enCatalogo.caseBarcode ?? '',
        unitsPerCase: enCatalogo.unitsPerCase,
        name: enCatalogo.name,
        category: categoriaNueva,
        stock: stockInicial,
        minStock: minStockNuevo,
      });
      onProductoActualizado(nuevo);
      setHistorial((actuales) => [
        { id: `add-${Date.now()}`, texto: `+ ${nuevo.name} agregado a este file (stock inicial: ${nuevo.stock})`, ok: true },
        ...actuales,
      ].slice(0, 8));
      setEnCatalogo(null);
      scanner.iniciarEscaneo();
    } catch (err) {
      setHistorial((actuales) => [
        { id: `err-${Date.now()}`, texto: err instanceof Error ? err.message : 'No se pudo agregar el producto.', ok: false },
        ...actuales,
      ].slice(0, 8));
    } finally {
      setAgregandoAFile(false);
    }
  }

  function handleCancelarAgregar() {
    setEnCatalogo(null);
    scanner.iniciarEscaneo();
  }

  function handleBuscarManual(e: React.FormEvent) {
    e.preventDefault();
    const codigo = codigoManual.trim();
    if (!codigo) return;
    setCodigoManual('');
    handleDecode(codigo);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-surface rounded-xl shadow-soft p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <textos.icono className="w-5 h-5 text-brand" />
            <h2 className="font-semibold text-ink">{textos.titulo}</h2>
          </div>
          <button
            onClick={() => {
              scanner.detenerEscaneo();
              onClose();
            }}
            aria-label="Cerrar"
            className="text-slate hover:text-ink transition"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate">{textos.descripcion}</p>

        <form onSubmit={handleBuscarManual} className="flex gap-2">
          <input
            type="text"
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value)}
            placeholder="O escribí el código a mano"
            disabled={procesando}
            className="flex-1 px-3 py-2 rounded-lg border border-line bg-cloud text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={procesando || !codigoManual.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-ink border border-line bg-surface hover:bg-cloud transition disabled:opacity-60"
          >
            Buscar
          </button>
        </form>

        {!scanner.escaneando && !noEncontrado && !enCatalogo && (
          <button
            onClick={scanner.iniciarEscaneo}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition"
          >
            <IconCamera className="w-4 h-4" />
            {textos.botonEscanear}
          </button>
        )}

        {scanner.escaneando && (
          <div className="rounded-lg overflow-hidden border border-line">
            <video ref={scanner.videoRef} muted playsInline className="w-full max-h-[40vh] object-cover bg-ink-deep" />
            <p className="text-xs text-slate text-center py-2">
              {procesando ? 'Procesando...' : 'Apuntá al código de la caja o de la unidad'}
            </p>
          </div>
        )}

        {scanner.errorEscaneo && <p className="text-xs text-danger">{scanner.errorEscaneo}</p>}

        {enCatalogo && (
          <div className="rounded-lg border border-dashed border-brand-light bg-brand-soft/40 p-3 flex flex-col gap-3">
            <p className="text-sm text-ink">
              <span className="font-semibold">{enCatalogo.name}</span> ya existe en el catálogo (cargado en otro
              file) pero no está en este todavía. Sumale stock inicial y categoría para agregarlo acá.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={categoriaNueva}
                onChange={(e) => setCategoriaNueva(e.target.value as Categoria)}
                disabled={agregandoAFile}
                className="px-3 py-2 rounded-lg border border-line bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
              >
                <option value="ropa">Ropa</option>
                <option value="productos">Productos</option>
                <option value="promociones">Promociones</option>
              </select>
              <input
                type="number"
                min={0}
                value={stockInicial}
                onChange={(e) => setStockInicial(Math.max(0, Number(e.target.value)))}
                placeholder="Stock inicial"
                disabled={agregandoAFile}
                className="px-3 py-2 rounded-lg border border-line bg-surface text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAgregarAEsteFile}
                disabled={agregandoAFile}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition disabled:opacity-60"
              >
                {agregandoAFile ? 'Agregando...' : 'Agregar a este file'}
              </button>
              <button
                onClick={handleCancelarAgregar}
                disabled={agregandoAFile}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate border border-line hover:bg-cloud transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {noEncontrado && (
          <div className="rounded-lg border border-dashed border-line p-3 flex flex-col gap-2">
            <p className="text-sm text-ink">
              El código <span className="font-mono">{noEncontrado}</span>{' '}
              {modo === 'entrada'
                ? 'no está registrado en ningún producto.'
                : 'no está cargado en este file, así que no hay nada que sacar.'}
            </p>
            <div className="flex gap-2">
              {modo === 'entrada' && (
                <button
                  onClick={handleAgregarNuevo}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition"
                >
                  Agregar como producto nuevo
                </button>
              )}
              <button
                onClick={handleSeguirEscaneando}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border border-line hover:bg-cloud transition ${
                  modo === 'entrada' ? 'text-slate' : 'flex-1 text-white bg-brand hover:bg-brand-dark border-transparent'
                }`}
              >
                Seguir escaneando
              </button>
            </div>
          </div>
        )}

        {historial.length > 0 && (
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {historial.map((h) => (
              <div key={h.id} className={`text-xs px-2.5 py-1.5 rounded-md ${h.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                {h.texto}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
