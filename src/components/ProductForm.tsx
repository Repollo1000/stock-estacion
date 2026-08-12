import { useState } from 'react';
import type { Categoria } from '../types';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { IconCamera, IconClose } from './icons';

export interface NuevoProductoInput {
  barcode: string;
  caseBarcode: string;
  unitsPerCase: number;
  name: string;
  category: Categoria;
  stock: number;
  minStock: number;
}

interface ProductFormProps {
  onAdd: (input: NuevoProductoInput) => Promise<void>;
  initialBarcode?: string;
}

export function ProductForm({ onAdd, initialBarcode }: ProductFormProps) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState(initialBarcode ?? '');
  const [caseBarcode, setCaseBarcode] = useState('');
  const [unitsPerCase, setUnitsPerCase] = useState(1);
  const [category, setCategory] = useState<Categoria>('ropa');
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [campoEscaneando, setCampoEscaneando] = useState<'unidad' | 'caja' | null>(null);
  const scanner = useBarcodeScanner((texto) => {
    if (campoEscaneando === 'caja') {
      setCaseBarcode(texto);
    } else {
      setBarcode(texto);
    }
    scanner.detenerEscaneo();
    setCampoEscaneando(null);
  });

  function toggleEscaneo(campo: 'unidad' | 'caja') {
    if (scanner.escaneando && campoEscaneando === campo) {
      scanner.detenerEscaneo();
      setCampoEscaneando(null);
      return;
    }
    setCampoEscaneando(campo);
    scanner.iniciarEscaneo();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setGuardando(true);
    setError('');
    try {
      await onAdd({ barcode, caseBarcode, unitsPerCase, name, category, stock, minStock });
      setName('');
      setBarcode('');
      setCaseBarcode('');
      setUnitsPerCase(1);
      setStock(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el producto.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 bg-surface border border-line rounded-xl p-4 sm:p-5 mb-6 md:mb-8 shadow-soft-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Nombre del producto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={guardando}
          className="px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Categoria)}
          disabled={guardando}
          className="px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
        >
          <option value="ropa">Ropa</option>
          <option value="productos">Productos</option>
          <option value="promociones">Promociones</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Código de barras (unidad)"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
        <button
          type="button"
          onClick={() => toggleEscaneo('unidad')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-ink border border-line bg-surface hover:bg-cloud transition"
        >
          {scanner.escaneando && campoEscaneando === 'unidad' ? (
            <IconClose className="w-4 h-4" />
          ) : (
            <IconCamera className="w-4 h-4" />
          )}
          {scanner.escaneando && campoEscaneando === 'unidad' ? 'Cerrar' : 'Escanear'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:items-end">
        <div>
          <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">
            Código de caja (opcional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={caseBarcode}
              onChange={(e) => setCaseBarcode(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
            <button
              type="button"
              onClick={() => toggleEscaneo('caja')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-ink border border-line bg-surface hover:bg-cloud transition"
            >
              {scanner.escaneando && campoEscaneando === 'caja' ? (
                <IconClose className="w-4 h-4" />
              ) : (
                <IconCamera className="w-4 h-4" />
              )}
              {scanner.escaneando && campoEscaneando === 'caja' ? 'Cerrar' : 'Escanear'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">
            Unidades por caja
          </label>
          <input
            type="number"
            min={1}
            value={unitsPerCase}
            onChange={(e) => setUnitsPerCase(Math.max(1, Number(e.target.value)))}
            className="w-full sm:w-28 px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
      </div>
      {caseBarcode && (
        <p className="text-xs text-slate -mt-1">
          Al escanear ese código de caja al reponer stock, se van a sumar {unitsPerCase} unidades de golpe.
        </p>
      )}

      {scanner.escaneando && (
        <div className="rounded-lg overflow-hidden border border-line">
          <video ref={scanner.videoRef} muted playsInline className="w-full bg-ink-deep" />
          <p className="text-xs text-slate text-center py-2">
            Apuntá de cerca, con buena luz, y que el código llene el recuadro
            {campoEscaneando === 'caja' ? ' (código de caja)' : ' (código de unidad)'}
          </p>
        </div>
      )}

      {scanner.errorEscaneo && <p className="text-xs text-danger -mt-1">{scanner.errorEscaneo}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:items-end">
        <div>
          <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Stock inicial</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            disabled={guardando}
            className="w-full px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Stock mínimo</label>
          <input
            type="number"
            value={minStock}
            onChange={(e) => setMinStock(Number(e.target.value))}
            disabled={guardando}
            className="w-full px-3 py-2.5 rounded-lg border border-line bg-cloud text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="col-span-2 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg py-2.5 transition disabled:opacity-60"
        >
          {guardando ? 'Agregando...' : 'Agregar producto'}
        </button>
      </div>

      {error && <p className="text-xs text-danger -mt-1">{error}</p>}
    </form>
  );
}
