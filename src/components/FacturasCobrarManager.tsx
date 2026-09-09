import React, { useState, useMemo, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  RefreshCw, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  Layers, 
  ArrowUpDown, 
  Save, 
  Loader2,
  FileCheck2,
  Percent,
  Wallet,
  Coins,
  CreditCard,
  Filter,
  Edit2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { PresupuestoData, AppConfig, FacturaCobroData } from '../types';

interface FacturasCobrarManagerProps {
  presupuestos: PresupuestoData[];
  facturasGuardadas?: FacturaCobroData[];
  onUpdateFacturaCobro: (data: FacturaCobroData) => Promise<{ success: boolean; message: string }>;
  config: AppConfig;
  onRefresh: () => void;
}

interface FacturaRowEditState {
  referencia: string;
  fechaPago: string;
  tasaBss: number;
  tipoRetencion: 'IVA' | 'ISLR' | 'AMBOS' | 'SIN RETENCION' | '';
  islr: number;
  iva: number;
  isSaving?: boolean;
  saveSuccess?: boolean;
  saveError?: string;
  isModified?: boolean;
}

export const FacturasCobrarManager: React.FC<FacturasCobrarManagerProps> = ({
  presupuestos,
  facturasGuardadas = [],
  onUpdateFacturaCobro,
  config,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_payment' | 'paid' | 'pending_retention' | 'with_retention'>('all');
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [rowStates, setRowStates] = useState<Record<string, FacturaRowEditState>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fecha de hoy por defecto para pagos
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Extraer las facturas válidas: combinar las facturas leídas directamente de FACTURAS y los presupuestos aprobados
  const facturasList = useMemo<FacturaCobroData[]>(() => {
    const list: FacturaCobroData[] = [];
    const seenKeys = new Set<string>();

    // 1. Primero, agregar todas las facturas leídas directamente de la hoja FACTURAS
    facturasGuardadas.forEach((fac, idx) => {
      const numFac = (fac.numeroFactura || '').trim();
      const numPres = (fac.numeroPresupuesto || '').trim();
      const uniqueKey = numFac || numPres || `fac-direct-${idx}`;

      if (seenKeys.has(uniqueKey)) return;
      seenKeys.add(uniqueKey);

      // Buscar si el presupuesto correspondiente tiene items detallados en la app
      const relatedPres = presupuestos.find(
        p => (numPres && p.numeroPresupuesto === numPres) ||
             (numFac && p.numeroFactura === numFac)
      );

      const itemsDesc = relatedPres?.items?.map(i => `${i.cantidad}x ${i.producto}`).join(', ') || '';
      const itemsCount = relatedPres?.items?.length || (fac.itemsCount || 1);

      list.push({
        id: fac.id || `fac-${uniqueKey}`,
        numeroFactura: numFac,
        fechaFactura: fac.fechaFactura || relatedPres?.fechaFactura || relatedPres?.fecha || todayStr,
        numeroPresupuesto: numPres || relatedPres?.numeroPresupuesto || '',
        clienteNombre: fac.clienteNombre || relatedPres?.clienteNombre || 'Sin Cliente',
        clienteRif: fac.clienteRif || relatedPres?.clienteRif || '',
        sucursalNombre: fac.sucursalNombre || relatedPres?.sucursalNombre || '',
        itemsCount: itemsCount,
        itemsSummary: itemsDesc,
        totalUsd: fac.totalUsd || relatedPres?.totalUsd || 0,
        totalBs: fac.totalBs || relatedPres?.totalBs || 0,
        referencia: fac.referencia || '',
        fechaPago: fac.fechaPago || '',
        tasaBss: fac.tasaBss || relatedPres?.tasaDia || 0,
        tipoRetencion: fac.tipoRetencion || '',
        islr: fac.islr || 0,
        iva: fac.iva || 0
      });
    });

    // 2. Procesar presupuestos aprobados que aún no estén en la lista
    presupuestos.forEach((p) => {
      const isApproved = (p.aprobado || '').trim().toUpperCase() === 'SI';
      const hasFacturaNum = Boolean((p.numeroFactura || '').trim());

      if (!isApproved && !hasFacturaNum) return;

      const numFactura = (p.numeroFactura || '').trim();
      const numPres = (p.numeroPresupuesto || '').trim();
      const uniqueKey = numFactura || numPres;

      if (seenKeys.has(uniqueKey) || (numPres && seenKeys.has(numPres)) || (numFactura && seenKeys.has(numFactura))) return;
      seenKeys.add(uniqueKey);

      const itemsDesc = (p.items || []).map(i => `${i.cantidad}x ${i.producto}`).join(', ');
      const totalUsd = p.totalUsd || 0;
      const totalBs = p.totalBs || (p.tasaDia ? totalUsd * p.tasaDia : 0);

      list.push({
        id: p.id || `fac-${p.numeroPresupuesto}`,
        numeroFactura: numFactura,
        fechaFactura: p.fechaFactura || p.fecha || todayStr,
        numeroPresupuesto: numPres,
        clienteNombre: p.clienteNombre || 'Sin Cliente',
        clienteRif: p.clienteRif || '',
        sucursalNombre: p.sucursalNombre || '',
        itemsCount: (p.items || []).length,
        itemsSummary: itemsDesc,
        totalUsd: totalUsd,
        totalBs: totalBs,
        referencia: '',
        fechaPago: '',
        tasaBss: p.tasaDia || 0,
        tipoRetencion: '',
        islr: 0,
        iva: 0
      });
    });

    // Ordenar: primero las más recientes
    return list.sort((a, b) => {
      const keyA = a.numeroFactura || a.numeroPresupuesto || '';
      const keyB = b.numeroFactura || b.numeroPresupuesto || '';
      return keyB.localeCompare(keyA);
    });
  }, [presupuestos, facturasGuardadas, todayStr]);

  // Sincronizar estado editable de cada fila con los datos reales traídos del archivo
  useEffect(() => {
    setRowStates(prev => {
      const updated = { ...prev };
      facturasList.forEach(item => {
        const key = item.numeroPresupuesto || item.numeroFactura;
        const current = updated[key];

        // Si la fila no existe en el estado o no ha sido editada activamente en este momento, actualizar con los valores reales del archivo
        if (!current || (editingRowKey !== key && !current.isModified)) {
          updated[key] = {
            referencia: item.referencia || '',
            fechaPago: item.fechaPago || '',
            tasaBss: item.tasaBss || (item.totalBs && item.totalUsd ? item.totalBs / item.totalUsd : 0),
            tipoRetencion: (item.tipoRetencion as any) || '',
            islr: item.islr || 0,
            iva: item.iva || 0,
            isModified: false
          };
        }
      });
      return updated;
    });
  }, [facturasList, editingRowKey]);

  // Iniciar edición de una fila y asegurar valores por defecto útiles (fecha de hoy, tasa)
  const handleStartEdit = (item: FacturaCobroData) => {
    const key = item.numeroPresupuesto || item.numeroFactura;
    const defaultTasa = item.tasaBss || config.tasaBsDia || (item.totalBs && item.totalUsd ? item.totalBs / item.totalUsd : 0);

    setRowStates(prev => {
      const current = prev[key];
      return {
        ...prev,
        [key]: {
          referencia: current?.referencia || item.referencia || '',
          fechaPago: current?.fechaPago || item.fechaPago || todayStr,
          tasaBss: current?.tasaBss || defaultTasa,
          tipoRetencion: (current?.tipoRetencion || item.tipoRetencion || '') as any,
          islr: current?.islr !== undefined ? current.islr : (item.islr || 0),
          iva: current?.iva !== undefined ? current.iva : (item.iva || 0),
          isModified: false,
          isSaving: false,
          saveSuccess: false,
          saveError: undefined
        }
      };
    });

    setEditingRowKey(key);
  };

  // Cancelar edición y restaurar datos originales
  const handleCancelEdit = (item: FacturaCobroData) => {
    const key = item.numeroPresupuesto || item.numeroFactura;
    setRowStates(prev => ({
      ...prev,
      [key]: {
        referencia: item.referencia || '',
        fechaPago: item.fechaPago || '',
        tasaBss: item.tasaBss || (item.totalBs && item.totalUsd ? item.totalBs / item.totalUsd : 0),
        tipoRetencion: (item.tipoRetencion as any) || '',
        islr: item.islr || 0,
        iva: item.iva || 0,
        isModified: false,
        isSaving: false,
        saveError: undefined
      }
    }));
    setEditingRowKey(null);
  };

  // Manejador de cambios en campos de fila
  const handleFieldChange = (
    key: string, 
    field: keyof FacturaRowEditState, 
    value: any
  ) => {
    setRowStates(prev => {
      const current = prev[key] || {
        referencia: '',
        fechaPago: '',
        tasaBss: 0,
        tipoRetencion: '',
        islr: 0,
        iva: 0
      };

      return {
        ...prev,
        [key]: {
          ...current,
          [field]: value,
          isModified: true,
          saveSuccess: false,
          saveError: undefined
        }
      };
    });
  };

  // Guardar fila individual en Google Sheets
  const handleSaveRow = async (item: FacturaCobroData) => {
    const key = item.numeroPresupuesto || item.numeroFactura;
    const currentState = rowStates[key];
    if (!currentState) return;

    // Indicador de guardando
    setRowStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isSaving: true,
        saveError: undefined,
        saveSuccess: false
      }
    }));

    try {
      const payload: FacturaCobroData = {
        ...item,
        referencia: (currentState.referencia || '').trim(),
        fechaPago: currentState.fechaPago || (currentState.referencia ? todayStr : ''),
        tasaBss: Number(currentState.tasaBss) || 0,
        tipoRetencion: currentState.tipoRetencion || '',
        islr: Number(currentState.islr) || 0,
        iva: Number(currentState.iva) || 0
      };

      const res = await onUpdateFacturaCobro(payload);

      if (res.success) {
        setRowStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            isSaving: false,
            saveSuccess: true,
            isModified: false
          }
        }));

        // Salir del modo edición tras guardar con éxito
        setEditingRowKey(null);

        setTimeout(() => {
          setRowStates(prev => ({
            ...prev,
            [key]: { ...prev[key], saveSuccess: false }
          }));
        }, 3500);
      } else {
        setRowStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            isSaving: false,
            saveError: res.message || 'Error al guardar'
          }
        }));
      }
    } catch (err: any) {
      setRowStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          isSaving: false,
          saveError: err?.message || 'Error de conexión'
        }
      }));
    }
  };

  // Filtrado de lista según las reglas especificadas (evaluado contra datos guardados para evitar que salte al escribir)
  const filteredFacturas = useMemo(() => {
    return facturasList.filter(item => {
      const key = item.numeroPresupuesto || item.numeroFactura;
      
      // REGLA FUNDAMENTAL: Si esta fila se está editando en este momento, mantenerla siempre visible
      if (editingRowKey === key) return true;

      // Filtrar según los datos guardados en el registro
      const hasSavedPayment = Boolean((item.referencia && item.referencia.trim()) || (item.fechaPago && item.fechaPago.trim()));
      const islrVal = item.islr || 0;
      const ivaVal = item.iva || 0;
      const tipoRet = item.tipoRetencion;
      const hasSavedRetention = (islrVal > 0) || (ivaVal > 0) || Boolean(tipoRet && tipoRet !== 'SIN RETENCION');

      // 1. Todas
      // 2. Pendientes x Pagos: que no posean pago guardado
      if (statusFilter === 'pending_payment' && hasSavedPayment) return false;
      
      // 3. Pagados: que posean referencia o fecha de pago guardada
      if (statusFilter === 'paid' && !hasSavedPayment) return false;
      
      // 4. Pendientes x Retenciones: los 2 campos de retenciones vacíos / en cero
      if (statusFilter === 'pending_retention' && hasSavedRetention) return false;
      
      // 5. Con Retenciones: al menos 1 campo de retención tiene dato guardado
      if (statusFilter === 'with_retention' && !hasSavedRetention) return false;

      // Filtro de búsqueda textual
      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase().trim();
      const state = rowStates[key];

      return (
        item.numeroFactura.toLowerCase().includes(query) ||
        item.numeroPresupuesto.toLowerCase().includes(query) ||
        item.clienteNombre.toLowerCase().includes(query) ||
        (item.clienteRif && item.clienteRif.toLowerCase().includes(query)) ||
        (item.sucursalNombre && item.sucursalNombre.toLowerCase().includes(query)) ||
        (item.referencia && item.referencia.toLowerCase().includes(query)) ||
        (state?.referencia && state.referencia.toLowerCase().includes(query))
      );
    });
  }, [facturasList, searchTerm, statusFilter, rowStates, editingRowKey]);

  // Cálculos de métricas globales y contadores de filtros basados en registros guardados
  const metrics = useMemo(() => {
    let totalUsdSum = 0;
    let totalBsSum = 0;
    let totalPercibidoSum = 0;
    let pendientesPagoCount = 0;
    let pagadosCount = 0;
    let pendientesRetencionCount = 0;
    let conRetencionCount = 0;

    facturasList.forEach(item => {
      const hasPayment = Boolean((item.referencia && item.referencia.trim()) || (item.fechaPago && item.fechaPago.trim()));
      const tUsd = item.totalUsd || 0;
      const tBs = item.totalBs || 0;
      const islrVal = item.islr || 0;
      const ivaVal = item.iva || 0;
      const tipoRet = item.tipoRetencion;
      const hasRetention = (islrVal > 0) || (ivaVal > 0) || Boolean(tipoRet && tipoRet !== 'SIN RETENCION');

      const percibido = Math.max(0, tBs - islrVal - ivaVal);

      totalUsdSum += tUsd;
      totalBsSum += tBs;
      totalPercibidoSum += percibido;

      if (hasPayment) {
        pagadosCount++;
      } else {
        pendientesPagoCount++;
      }

      if (hasRetention) {
        conRetencionCount++;
      } else {
        pendientesRetencionCount++;
      }
    });

    return {
      totalCount: facturasList.length,
      pendientesPagoCount,
      pagadosCount,
      pendientesRetencionCount,
      conRetencionCount,
      totalUsdSum,
      totalBsSum,
      totalPercibidoSum
    };
  }, [facturasList]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Facturas por Cobrar
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {facturasList.length} Facturas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control y registro de cobranza, referencias bancarias, tasas cambiarias y retenciones
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="btn-refresh-facturas"
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm active:scale-95"
            title="Sincronizar con Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pendientes x Pago</p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{metrics.pendientesPagoCount}</p>
            <span className="text-[10px] text-slate-400">de {metrics.totalCount} facturas</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Facturado (US$)</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ${metrics.totalUsdSum.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">Facturación global</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Facturado (Bs.S)</p>
            <p className="text-xl font-black text-blue-900 mt-0.5">
              Bs. {metrics.totalBsSum.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-blue-600 font-medium">Monto bruto total</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Bs.S Percibidos</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">
              Bs. {metrics.totalPercibidoSum.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-400">Total neto tras retenciones</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-facturas"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Factura, Presupuesto, Cliente o RIF..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* 5 Status filters solicitados */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
          {/* 1. Todas */}
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({facturasList.length})
          </button>

          {/* 2. Pendientes x Pagos */}
          <button
            type="button"
            onClick={() => setStatusFilter('pending_payment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'pending_payment'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            Pendientes x Pagos ({metrics.pendientesPagoCount})
          </button>

          {/* 3. Pagados */}
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            Pagados ({metrics.pagadosCount})
          </button>

          {/* 4. Pendientes x Retenciones (ambos campos vacíos) */}
          <button
            type="button"
            onClick={() => setStatusFilter('pending_retention')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'pending_retention'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            Pendientes x Retenciones ({metrics.pendientesRetencionCount})
          </button>

          {/* 5. Con Retenciones (al menos 1 campo con dato) */}
          <button
            type="button"
            onClick={() => setStatusFilter('with_retention')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'with_retention'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
            }`}
          >
            Con Retenciones ({metrics.conRetencionCount})
          </button>
        </div>
      </div>

      {/* Main Invoices Table */}
      {filteredFacturas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron facturas</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {facturasList.length === 0
              ? 'Cuando apruebes presupuestos o sincronices la hoja FACTURAS, aparecerán automáticamente aquí para gestionar su cobranza.'
              : 'No hay facturas que coincidan con los filtros de búsqueda aplicados.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 min-w-[130px]">Nº Factura</th>
                  <th className="py-3.5 px-3 min-w-[110px]">Fecha Factura</th>
                  <th className="py-3.5 px-3 min-w-[120px]">Nº Presupuesto</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Cliente / Razón Social</th>
                  <th className="py-3.5 px-3 min-w-[140px]">Sucursal</th>
                  <th className="py-3.5 px-3 text-center min-w-[80px]">Items</th>
                  <th className="py-3.5 px-3 text-right min-w-[100px]">Total US$</th>
                  <th className="py-3.5 px-3 text-right min-w-[120px]">Total Bs.S</th>
                  
                  {/* Columnas de Cobro editables */}
                  <th className="py-3.5 px-3 min-w-[150px] bg-slate-800 text-cyan-300">
                    Referencia
                  </th>
                  <th className="py-3.5 px-3 min-w-[135px] bg-slate-800 text-cyan-300">
                    Fecha de Pago
                  </th>
                  <th className="py-3.5 px-3 min-w-[120px] bg-slate-800 text-cyan-300">
                    Tasa Bs.S
                  </th>
                  <th className="py-3.5 px-3 min-w-[135px] bg-slate-800 text-cyan-300">
                    Tipo Retención
                  </th>
                  <th className="py-3.5 px-3 min-w-[115px] bg-slate-800 text-cyan-300 text-right">
                    ISLR (Bs.)
                  </th>
                  <th className="py-3.5 px-3 min-w-[115px] bg-slate-800 text-cyan-300 text-right">
                    IVA (Bs.)
                  </th>
                  <th className="py-3.5 px-4 min-w-[140px] bg-slate-800 text-emerald-300 text-right">
                    Bs.S Percibidos
                  </th>
                  
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFacturas.map((item, idx) => {
                  const key = item.numeroPresupuesto || item.numeroFactura;
                  const isEditing = editingRowKey === key;
                  const rowState = rowStates[key] || {
                    referencia: item.referencia || '',
                    fechaPago: item.fechaPago || '',
                    tasaBss: item.tasaBss || 0,
                    tipoRetencion: item.tipoRetencion || '',
                    islr: item.islr || 0,
                    iva: item.iva || 0
                  };

                  // Cálculo dinámico de Bs.S Percibidos: (Total Bs.S - ISLR - IVA)
                  const totalBsVal = item.totalBs || (item.totalUsd * (rowState.tasaBss || 1));
                  const islrNum = Number(rowState.islr) || 0;
                  const ivaNum = Number(rowState.iva) || 0;
                  const bssPercibidos = Math.max(0, totalBsVal - islrNum - ivaNum);

                  const isPaid = Boolean((rowState.referencia && rowState.referencia.trim()) || (rowState.fechaPago && rowState.fechaPago.trim()));

                  return (
                    <tr 
                      key={`fac-table-row-${item.id || item.numeroFactura || item.numeroPresupuesto || 'fac'}-${idx}`} 
                      className={`transition-colors ${
                        isEditing
                          ? 'bg-blue-50/60 ring-1 ring-blue-400/50'
                          : isPaid 
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Nº Factura */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{item.numeroFactura || <span className="text-slate-400 font-normal italic">Por Asignar</span>}</span>
                        </div>
                      </td>

                      {/* Fecha Factura */}
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {item.fechaFactura || <span className="text-slate-400">-</span>}
                      </td>

                      {/* Nº Presupuesto */}
                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {item.numeroPresupuesto}
                        </span>
                      </td>

                      {/* Cliente / Razón Social */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="truncate max-w-[200px]" title={item.clienteNombre}>
                          {item.clienteNombre}
                        </div>
                        {item.clienteRif && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.clienteRif}
                          </div>
                        )}
                      </td>

                      {/* Sucursal */}
                      <td className="py-3.5 px-3 text-slate-600">
                        <div className="truncate max-w-[140px]" title={item.sucursalNombre || 'Sede Principal'}>
                          {item.sucursalNombre || <span className="text-slate-400 italic">Sede Principal</span>}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span 
                          className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] cursor-help"
                          title={item.itemsSummary || `${item.itemsCount} items`}
                        >
                          {item.itemsCount || 1}
                        </span>
                      </td>

                      {/* Total US$ */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ${(item.totalUsd || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Total Bs.S */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-blue-900 whitespace-nowrap">
                        Bs. {(item.totalBs || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* REFERENCIA */}
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input
                            id={`input-ref-${key}`}
                            type="text"
                            value={rowState.referencia}
                            onChange={(e) => handleFieldChange(key, 'referencia', e.target.value)}
                            placeholder="Nº Transferencia..."
                            className="w-full px-2.5 py-1.5 bg-white border border-blue-400 rounded-lg text-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                            autoFocus
                          />
                        ) : (
                          <div className="font-mono text-xs text-slate-800 truncate max-w-[140px]">
                            {rowState.referencia ? (
                              <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {rowState.referencia}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Sin Ref.</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* FECHA DE PAGO */}
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input
                            id={`input-fecha-pago-${key}`}
                            type="date"
                            value={rowState.fechaPago}
                            onChange={(e) => handleFieldChange(key, 'fechaPago', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-blue-400 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                          />
                        ) : (
                          <div className="text-xs text-slate-700 whitespace-nowrap">
                            {rowState.fechaPago || <span className="text-slate-400 italic text-[11px]">-</span>}
                          </div>
                        )}
                      </td>

                      {/* TASA BSS */}
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input
                            id={`input-tasa-${key}`}
                            type="number"
                            step="any"
                            min="0"
                            value={rowState.tasaBss || ''}
                            onChange={(e) => handleFieldChange(key, 'tasaBss', parseFloat(e.target.value) || 0)}
                            placeholder="779.95"
                            className="w-full px-2 py-1.5 bg-white border border-blue-400 rounded-lg text-slate-800 font-mono font-semibold text-xs focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                          />
                        ) : (
                          <div className="font-mono text-xs text-slate-800 whitespace-nowrap">
                            {rowState.tasaBss ? (
                              `Bs. ${Number(rowState.tasaBss).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* TIPO RETENCION */}
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <select
                            id={`select-retencion-${key}`}
                            value={rowState.tipoRetencion || ''}
                            onChange={(e) => handleFieldChange(key, 'tipoRetencion', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-blue-400 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                          >
                            <option value="">Sin Retención</option>
                            <option value="IVA">IVA</option>
                            <option value="ISLR">ISLR</option>
                            <option value="AMBOS">AMBOS</option>
                          </select>
                        ) : (
                          <div>
                            {rowState.tipoRetencion && rowState.tipoRetencion !== 'SIN RETENCION' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                {rowState.tipoRetencion}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Sin Retención</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* ISLR */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            id={`input-islr-${key}`}
                            type="number"
                            step="any"
                            min="0"
                            value={rowState.islr || ''}
                            onChange={(e) => handleFieldChange(key, 'islr', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full px-2 py-1.5 bg-white border border-blue-400 rounded-lg text-slate-800 font-mono text-xs text-right focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                          />
                        ) : (
                          <div className="font-mono text-xs text-slate-800 whitespace-nowrap">
                            {rowState.islr > 0 ? (
                              <span className="text-purple-900 font-semibold">
                                Bs. {Number(rowState.islr).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* IVA */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            id={`input-iva-${key}`}
                            type="number"
                            step="any"
                            min="0"
                            value={rowState.iva || ''}
                            onChange={(e) => handleFieldChange(key, 'iva', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full px-2 py-1.5 bg-white border border-blue-400 rounded-lg text-slate-800 font-mono text-xs text-right focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                          />
                        ) : (
                          <div className="font-mono text-xs text-slate-800 whitespace-nowrap">
                            {rowState.iva > 0 ? (
                              <span className="text-purple-900 font-semibold">
                                Bs. {Number(rowState.iva).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* BSS PERCIBIDOS (Calculado: Total Bs.S - ISLR - IVA) */}
                      <td className="py-3.5 px-4 bg-emerald-50/30 text-right font-mono font-bold text-emerald-900 whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="text-xs">
                            Bs. {bssPercibidos.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {(islrNum > 0 || ivaNum > 0) && (
                            <span className="text-[9.5px] text-slate-500 font-normal">
                              -Bs. {(islrNum + ivaNum).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACCIONES: EDITAR / GUARDAR / CANCELAR */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Botón Guardar */}
                            <button
                              id={`btn-save-cobro-${key}`}
                              type="button"
                              disabled={rowState.isSaving}
                              onClick={() => handleSaveRow(item)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50"
                              title="Guardar cambios en Google Sheets"
                            >
                              {rowState.isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              <span>Guardar</span>
                            </button>

                            {/* Botón Cancelar */}
                            <button
                              id={`btn-cancel-cobro-${key}`}
                              type="button"
                              disabled={rowState.isSaving}
                              onClick={() => handleCancelEdit(item)}
                              className="flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition-all active:scale-95"
                              title="Cancelar edición"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`btn-edit-cobro-${key}`}
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                                isPaid
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                              }`}
                              title={isPaid ? 'Modificar datos de cobro/retención' : 'Registrar pago o retención'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{isPaid ? 'Editar' : 'Registrar'}</span>
                            </button>
                          </div>
                        )}

                        {rowState.saveSuccess && (
                          <div className="text-[10.5px] text-emerald-600 font-bold mt-1 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Guardado</span>
                          </div>
                        )}

                        {rowState.saveError && (
                          <div className="text-[10px] text-red-600 mt-1 max-w-[120px] truncate" title={rowState.saveError}>
                            {rowState.saveError}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Table footer info */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Mostrando {filteredFacturas.length} de {facturasList.length} facturas</span>
            <span className="text-[11px] text-slate-400">
              Haz clic en "Editar" o "Registrar" en cualquier factura para actualizar sus datos y guardarlos directamente en Google Sheets
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

