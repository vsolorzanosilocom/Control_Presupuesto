import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Eye, 
  FileEdit, 
  Trash2, 
  Send, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building,
  DollarSign,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PresupuestoData, AppConfig } from '../types';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface HistoryManagerProps {
  presupuestos: PresupuestoData[];
  onLoadPresupuesto?: (presupuesto: PresupuestoData) => void;
  onDeletePresupuesto?: (id: string) => void;
  onSendToSheets: (presupuesto: PresupuestoData) => Promise<void>;
  config: AppConfig;
}

export const HistoryManager: React.FC<HistoryManagerProps> = ({
  presupuestos,
  onSendToSheets,
  config
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForPreview, setSelectedForPreview] = useState<PresupuestoData | null>(null);
  const [isSending, setIsSending] = useState(false);

  const filtered = presupuestos.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.numeroPresupuesto && p.numeroPresupuesto.toLowerCase().includes(term)) ||
      (p.clienteNombre && p.clienteNombre.toLowerCase().includes(term)) ||
      (p.sucursalNombre && p.sucursalNombre.toLowerCase().includes(term)) ||
      (p.fecha && p.fecha.includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Historial de Presupuestos Emitidos
            </h1>
            <p className="text-xs text-slate-500">
              Registro y control de sincronización con la hoja general de Google Sheets
            </p>
          </div>
        </div>

        {/* Search Filter */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="input-history-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por CP, cliente, fecha..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* List Container */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            {searchTerm ? 'No se encontraron resultados' : 'No hay presupuestos guardados aún'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Intente buscar con otro número de presupuesto o nombre de cliente.'
              : 'Genere y guarde presupuestos desde la pestaña "Nuevo Presupuesto" para verlos listados aquí.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nº Presupuesto</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente / Razón Social</th>
                  <th className="py-3 px-4">Sucursal</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total US$</th>
                  <th className="py-3 px-4 text-right">Total Bs.S</th>
                  <th className="py-3 px-3 text-center">Estado Sheets</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((item, idx) => {
                  const rawItems = item.items || [];
                  const subtotalCalc = rawItems.reduce((acc, it) => acc + ((it.cantidad || 0) * (it.precioUnitario || 0)), 0);
                  const ivaRate = item.aplicarIva ? (item.porcentajeIva || 16) : 0;
                  const totalUsdVal = item.totalUsd && item.totalUsd > 0 ? item.totalUsd : (subtotalCalc + (subtotalCalc * (ivaRate / 100)));
                  const totalBsVal = item.usarTasa && item.tasaDia > 0 ? (totalUsdVal * item.tasaDia) : (item.totalBs || 0);

                  return (
                    <tr
                      key={`hist-item-${item.id || item.numeroPresupuesto || 'item'}-${idx}`}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      {/* Number */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {item.numeroPresupuesto}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600">
                        {item.fecha}
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 font-semibold text-slate-900 uppercase">
                        {item.clienteNombre}
                      </td>

                      {/* Sucursal */}
                      <td className="py-3 px-4 text-slate-600 uppercase">
                        {item.sucursalNombre || <span className="text-slate-400 font-normal">Principal</span>}
                      </td>

                      {/* Items count */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-700 text-[11px]">
                          {rawItems.length}
                        </span>
                      </td>

                      {/* Total USD */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        US$ {(totalUsdVal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Total Bs */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                        {item.usarTasa && item.tasaDia > 0 ? (
                          `Bs. ${(totalBsVal || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Sheets Status */}
                      <td className="py-3 px-3 text-center">
                        {item.sincronizadoGoogleSheets ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Transmitido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3" /> Local
                          </span>
                        )}
                      </td>

                      {/* Actions - Solo Ver Detalle (Ojito) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setSelectedForPreview(item)}
                            title="Ver detalle del presupuesto y descargar PDF"
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 font-semibold text-xs rounded-xl transition-all border border-blue-200 shadow-sm"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span>Ver Detalle</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview / Detail Modal */}
      {selectedForPreview && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setSelectedForPreview(null)}
          presupuesto={selectedForPreview}
          config={config}
          onSendToSheets={async () => {
            setIsSending(true);
            await onSendToSheets(selectedForPreview);
            setIsSending(false);
          }}
          isSendingToSheets={isSending}
        />
      )}
    </div>
  );
};
