import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Calendar, 
  Receipt, 
  Save, 
  Loader2, 
  Filter, 
  AlertCircle, 
  FileCheck2,
  Building,
  DollarSign,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PresupuestoData, AppConfig } from '../types';

interface ApprovalRowState {
  aprobado: string; // 'SI' | 'NO' | ''
  numeroFactura: string;
  fechaFactura: string;
  isSaving: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface ApprovalManagerProps {
  presupuestos: PresupuestoData[];
  onUpdateApproval: (data: {
    numeroPresupuesto: string;
    aprobado: string;
    numeroFactura?: string;
    fechaFactura?: string;
  }) => Promise<{ success: boolean; message: string }>;
  config: AppConfig;
  onRefresh?: () => void;
}

export const ApprovalManager: React.FC<ApprovalManagerProps> = ({
  presupuestos,
  onUpdateApproval,
  config: _config,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [rowStates, setRowStates] = useState<Record<string, ApprovalRowState>>({});

  // Obtenemos la fecha de hoy en formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Filtramos los presupuestos pendientes de aprobación (Columna AL vacía o no definida)
  const pendingPresupuestos = presupuestos.filter(p => {
    const isApproved = (p.aprobado || '').trim().toUpperCase();
    return isApproved === '' || isApproved === 'PENDIENTE';
  });

  // Filtramos por término de búsqueda (CP o Cliente)
  const filtered = pendingPresupuestos.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.numeroPresupuesto && p.numeroPresupuesto.toLowerCase().includes(term)) ||
      (p.clienteNombre && p.clienteNombre.toLowerCase().includes(term)) ||
      (p.sucursalNombre && p.sucursalNombre.toLowerCase().includes(term)) ||
      (p.fecha && p.fecha.includes(term))
    );
  });

  // Helper para inicializar o leer el estado de una fila
  const getRowState = (numPres: string): ApprovalRowState => {
    if (rowStates[numPres]) {
      return rowStates[numPres];
    }
    return {
      aprobado: '',
      numeroFactura: '',
      fechaFactura: todayStr,
      isSaving: false
    };
  };

  const handleStateChange = (numPres: string, updates: Partial<ApprovalRowState>) => {
    setRowStates(prev => ({
      ...prev,
      [numPres]: {
        ...getRowState(numPres),
        ...updates
      }
    }));
  };

  const handleSaveRow = async (presupuesto: PresupuestoData) => {
    const numPres = presupuesto.numeroPresupuesto;
    const currentState = getRowState(numPres);

    if (!currentState.aprobado) {
      handleStateChange(numPres, { errorMessage: 'Seleccione SI o NO en Aprobado' });
      return;
    }

    if (currentState.aprobado === 'SI' && !currentState.numeroFactura.trim()) {
      handleStateChange(numPres, { errorMessage: 'Indique el Nº de Factura' });
      return;
    }

    handleStateChange(numPres, { isSaving: true, errorMessage: undefined, successMessage: undefined });

    try {
      const res = await onUpdateApproval({
        numeroPresupuesto: numPres,
        aprobado: currentState.aprobado,
        numeroFactura: currentState.aprobado === 'SI' ? currentState.numeroFactura.trim() : '',
        fechaFactura: currentState.aprobado === 'SI' ? (currentState.fechaFactura || todayStr) : ''
      });

      if (res.success) {
        handleStateChange(numPres, {
          isSaving: false,
          successMessage: '¡Guardado con éxito en Google Sheets!'
        });
        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 1500);
        }
      } else {
        handleStateChange(numPres, {
          isSaving: false,
          errorMessage: res.message || 'Error al guardar en Sheets'
        });
      }
    } catch (e: any) {
      handleStateChange(numPres, {
        isSaving: false,
        errorMessage: e?.message || 'Error de red'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-2xl">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Aprobación y Facturación de Presupuestos
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {pendingPresupuestos.length} Pendiente(s)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión de estatus, número de factura y fecha de facturación en la hoja PRESUPUESTOS
            </p>
          </div>
        </div>

        {/* Search Filter */}
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="input-approval-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por CP, cliente, fecha..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* List Container */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            {searchTerm ? 'No se encontraron presupuestos con esa búsqueda' : '¡No hay presupuestos pendientes por aprobar!'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Verifique el número de presupuesto o razón social ingresado.'
              : 'Todos los presupuestos emitidos ya han sido procesados o marcados con su estatus de aprobación.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Nº Presupuesto</th>
                  <th className="py-3.5 px-3">Fecha</th>
                  <th className="py-3.5 px-4">Cliente / Razón Social</th>
                  <th className="py-3.5 px-3">Sucursal</th>
                  <th className="py-3.5 px-2 text-center">Items</th>
                  <th className="py-3.5 px-3 text-right">Total US$</th>
                  <th className="py-3.5 px-3 text-right">Total Bs.S</th>
                  <th className="py-3.5 px-3 text-center min-w-[130px] bg-slate-800">
                    Aprobado
                  </th>
                  <th className="py-3.5 px-3 min-w-[140px] bg-slate-800">
                    Nº Factura
                  </th>
                  <th className="py-3.5 px-3 min-w-[140px] bg-slate-800">
                    Fecha Factura
                  </th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((item, idx) => {
                  const rawItems = item.items || [];
                  const subtotalCalc = rawItems.reduce((acc, it) => acc + ((it.cantidad || 0) * (it.precioUnitario || 0)), 0);
                  const ivaRate = item.aplicarIva ? (item.porcentajeIva || 16) : 0;
                  const totalUsdVal = item.totalUsd && item.totalUsd > 0 ? item.totalUsd : (subtotalCalc + (subtotalCalc * (ivaRate / 100)));
                  const totalBsVal = item.usarTasa && item.tasaDia > 0 ? (totalUsdVal * item.tasaDia) : (item.totalBs || 0);

                  const numPres = item.numeroPresupuesto;
                  const rowState = getRowState(numPres);

                  return (
                    <tr
                      key={`approval-item-${item.id || item.numeroPresupuesto || 'item'}-${idx}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {item.numeroPresupuesto}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {item.fecha}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 uppercase">
                        {item.clienteNombre}
                      </td>

                      {/* Sucursal */}
                      <td className="py-3.5 px-3 text-slate-600 uppercase text-[11px]">
                        {item.sucursalNombre || 'PRINCIPAL'}
                      </td>

                      {/* Items Count */}
                      <td className="py-3.5 px-2 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-100 font-bold rounded-full text-slate-700 text-[10px]">
                          {rawItems.length || 1}
                        </span>
                      </td>

                      {/* Total USD */}
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        ${totalUsdVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Total BS */}
                      <td className="py-3.5 px-3 text-right font-bold text-slate-700 whitespace-nowrap">
                        {totalBsVal > 0 
                          ? `Bs. ${totalBsVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : '-'}
                      </td>

                      {/* Columna AL: APROBADO (Dropdown) */}
                      <td className="py-3.5 px-3 bg-slate-50/60">
                        <select
                          id={`select-aprobado-${numPres}`}
                          value={rowState.aprobado}
                          onChange={(e) => handleStateChange(numPres, { aprobado: e.target.value, errorMessage: undefined })}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold border outline-none transition-all ${
                            rowState.aprobado === 'SI'
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                              : rowState.aprobado === 'NO'
                              ? 'bg-rose-50 border-rose-400 text-rose-800'
                              : 'bg-white border-slate-300 text-slate-700 focus:border-blue-500'
                          }`}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="SI">SI (Aprobado)</option>
                          <option value="NO">NO (Rechazado)</option>
                        </select>
                      </td>

                      {/* Columna AM: # FACTURA */}
                      <td className="py-3.5 px-3 bg-slate-50/60">
                        <input
                          id={`input-factura-${numPres}`}
                          type="text"
                          disabled={rowState.aprobado !== 'SI'}
                          value={rowState.numeroFactura}
                          onChange={(e) => handleStateChange(numPres, { numeroFactura: e.target.value, errorMessage: undefined })}
                          placeholder={rowState.aprobado === 'SI' ? 'Ej: FAC-00124' : 'N/A si rechaza'}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-mono border outline-none transition-all ${
                            rowState.aprobado === 'SI'
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        />
                      </td>

                      {/* Columna AN: FECHA DE FACTURA */}
                      <td className="py-3.5 px-3 bg-slate-50/60">
                        <input
                          id={`input-fecha-factura-${numPres}`}
                          type="date"
                          disabled={rowState.aprobado !== 'SI'}
                          value={rowState.fechaFactura}
                          onChange={(e) => handleStateChange(numPres, { fechaFactura: e.target.value })}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs border outline-none transition-all ${
                            rowState.aprobado === 'SI'
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        />
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            id={`btn-save-approval-${numPres}`}
                            type="button"
                            disabled={rowState.isSaving || !rowState.aprobado}
                            onClick={() => handleSaveRow(item)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Guardar estado en Google Sheets"
                          >
                            {rowState.isSaving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>{rowState.isSaving ? 'Guardando...' : 'Guardar'}</span>
                          </button>
                        </div>

                        {/* Mensajes de feedback por fila */}
                        {rowState.errorMessage && (
                          <div className="text-[10px] font-medium text-rose-600 mt-1 animate-in fade-in">
                            {rowState.errorMessage}
                          </div>
                        )}
                        {rowState.successMessage && (
                          <div className="text-[10px] font-bold text-emerald-600 mt-1 animate-in fade-in flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{rowState.successMessage}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
