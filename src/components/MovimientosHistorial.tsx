import { useEffect, useState } from 'react';
import { getMovimientos, type Movimiento, type MotivoMovimiento } from '../lib/data';
import { IconClose, IconHistory } from './icons';

interface MovimientosHistorialProps {
  fileId: string;
  onClose: () => void;
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const MOTIVO_LABEL: Record<MotivoMovimiento, string> = {
  venta: 'Venta',
  reposicion: 'Reposición',
  ajuste: 'Ajuste',
};

const MOTIVO_CLASSES: Record<MotivoMovimiento, string> = {
  venta: 'bg-danger-soft text-danger',
  reposicion: 'bg-success-soft text-success',
  ajuste: 'bg-cloud text-slate',
};

export function MovimientosHistorial({ fileId, onClose }: MovimientosHistorialProps) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMovimientos(fileId)
      .then(setMovimientos)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el historial.'))
      .finally(() => setCargando(false));
  }, [fileId]);

  const totalVendido = movimientos
    .filter((m) => m.motivo === 'venta')
    .reduce((suma, m) => suma + Math.abs(m.delta), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface rounded-xl shadow-soft p-4 sm:p-5 flex flex-col gap-3 max-h-[85vh]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconHistory className="w-5 h-5 text-brand" />
            <h2 className="font-semibold text-ink">Historial de movimientos</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate hover:text-ink transition">
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {cargando && <p className="text-sm text-slate">Cargando...</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        {!cargando && !error && movimientos.length === 0 && (
          <p className="text-sm text-slate">Todavía no hay movimientos registrados en este file.</p>
        )}

        {movimientos.length > 0 && (
          <p className="text-xs text-slate -mt-1">
            Vendido (últimos {movimientos.length} movimientos): <span className="font-semibold text-ink">{totalVendido}</span> unidades
          </p>
        )}

        {movimientos.length > 0 && (
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {movimientos.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-line text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-ink truncate">{m.productoNombre}</span>
                    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${MOTIVO_CLASSES[m.motivo]}`}>
                      {MOTIVO_LABEL[m.motivo]}
                    </span>
                  </div>
                  <div className="text-xs text-slate">
                    {m.usuarioNombre} · {formatearFecha(m.createdAt)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-semibold tabular-nums ${m.delta >= 0 ? 'text-success' : 'text-danger'}`}>
                    {m.delta >= 0 ? '+' : ''}
                    {m.delta}
                  </div>
                  <div className="text-xs text-slate tabular-nums">stock: {m.stockResultante}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
