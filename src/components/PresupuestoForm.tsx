import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Save, 
  Eye, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  Sparkles, 
  Plus, 
  Send,
  Loader2,
  Percent,
  Layers,
  HelpCircle,
  Lock
} from 'lucide-react';
import { Cliente, Sucursal, ProductoItem, PresupuestoData, PresupuestoItemRow, AppConfig } from '../types';
import { ItemsTable } from './ItemsTable';
import { CalculatorModal } from './CalculatorModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { generatePdfFromElement } from '../utils/pdfGenerator';
import { OfficialDocumentView } from './OfficialDocumentView';
import confetti from 'canvas-confetti';

interface PresupuestoFormProps {
  config: AppConfig;
  clientes: Cliente[];
  sucursales: Sucursal[];
  productos: ProductoItem[];
  onSavePresupuesto: (presupuesto: PresupuestoData, sendToSheets: boolean) => Promise<{ success: boolean; message: string }>;
  initialPresupuesto?: PresupuestoData | null;
  onRefreshNextNumber: () => Promise<string>;
}

export const PresupuestoForm: React.FC<PresupuestoFormProps> = ({
  config,
  clientes,
  sucursales,
  productos,
  onSavePresupuesto,
  initialPresupuesto,
  onRefreshNextNumber
}) => {
  // Form State
  const [numeroPresupuesto, setNumeroPresupuesto] = useState<string>('CP-202608006');
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [validoDias, setValidoDias] = useState<number>(config.diasValidezDefecto || 30);
  const [tipoPresupuesto, setTipoPresupuesto] = useState<'US$' | 'Bs.S'>('US$');

  // Cliente
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteRif, setClienteRif] = useState<string>('');
  const [clienteCodigo, setClienteCodigo] = useState<string>('');
  const [clienteDireccion, setClienteDireccion] = useState<string>('');
  const [clienteContacto, setClienteContacto] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [clienteCorreo, setClienteCorreo] = useState<string>('');
  const [clienteCiudad, setClienteCiudad] = useState<string>('');

  // Sucursal
  const [sucursalNombre, setSucursalNombre] = useState<string>('');
  const [sucursalRif, setSucursalRif] = useState<string>('');
  const [sucursalCodigo, setSucursalCodigo] = useState<string>('');
  const [sucursalDireccion, setSucursalDireccion] = useState<string>('');
  const [sucursalContacto, setSucursalContacto] = useState<string>('');
  const [sucursalTelefono, setSucursalTelefono] = useState<string>('');
  const [sucursalCorreo, setSucursalCorreo] = useState<string>('');
  const [sucursalCiudad, setSucursalCiudad] = useState<string>('');

  // Items
  const [items, setItems] = useState<PresupuestoItemRow[]>([
    {
      id: 'row-1',
      producto: '',
      marca: '',
      modelo: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0.00
    }
  ]);

  // Tasa del dia
  const [usarTasa, setUsarTasa] = useState<boolean>(true);
  const [tasaDia, setTasaDia] = useState<number>(config.tasaDefecto || 785.40);

  // IVA
  const [aplicarIva, setAplicarIva] = useState<boolean>(true);
  const [porcentajeIva, setPorcentajeIva] = useState<number>(config.ivaPorDefecto || 16);

  // Modals & UI status
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [calcTargetRowId, setCalcTargetRowId] = useState<string | null>(null);
  const [calcTargetPrice, setCalcTargetPrice] = useState<number>(0);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize from props or default
  useEffect(() => {
    if (initialPresupuesto) {
      setNumeroPresupuesto(initialPresupuesto.numeroPresupuesto);
      setFecha(initialPresupuesto.fecha);
      setValidoDias(initialPresupuesto.validoDias);
      setTipoPresupuesto(initialPresupuesto.tipoPresupuesto);
      setClienteNombre(initialPresupuesto.clienteNombre);
      setClienteRif(initialPresupuesto.clienteRif);
      setClienteCodigo(initialPresupuesto.clienteCodigo || '');
      setClienteDireccion(initialPresupuesto.clienteDireccion);
      setClienteContacto(initialPresupuesto.clienteContacto);
      setClienteTelefono(initialPresupuesto.clienteTelefono);
      setClienteCorreo(initialPresupuesto.clienteCorreo);
      setClienteCiudad(initialPresupuesto.clienteCiudad);
      setSucursalNombre(initialPresupuesto.sucursalNombre);
      setSucursalRif(initialPresupuesto.sucursalRif);
      setSucursalCodigo(initialPresupuesto.sucursalCodigo || '');
      setSucursalDireccion(initialPresupuesto.sucursalDireccion);
      setSucursalContacto(initialPresupuesto.sucursalContacto);
      setSucursalTelefono(initialPresupuesto.sucursalTelefono);
      setSucursalCorreo(initialPresupuesto.sucursalCorreo);
      setSucursalCiudad(initialPresupuesto.sucursalCiudad);
      setItems(initialPresupuesto.items && initialPresupuesto.items.length > 0 ? initialPresupuesto.items : [{
        id: `row-${Date.now()}`,
        producto: '',
        marca: '',
        modelo: '',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0
      }]);
      setUsarTasa(initialPresupuesto.usarTasa);
      setTasaDia(initialPresupuesto.tasaDia);
      setAplicarIva(initialPresupuesto.aplicarIva);
      setPorcentajeIva(initialPresupuesto.porcentajeIva);
    } else {
      onRefreshNextNumber().then(num => {
        if (num) setNumeroPresupuesto(num);
      });
    }
  }, [initialPresupuesto]);

  // Handle Client selection and auto-fill (permite buscar por Nombre, RIF o IDEM/CODIGO)
  const handleSelectCliente = (term: string) => {
    setClienteNombre(term);
    const clean = term.trim().toUpperCase();
    if (!clean) return;

    // Buscar coincidencia exacta por nombre, RIF o código IDEM
    const found = clientes.find(c => 
      c.nombre.trim().toUpperCase() === clean ||
      (c.rif && c.rif.trim().toUpperCase() === clean) ||
      (c.codigo && c.codigo.trim().toUpperCase() === clean)
    );

    if (found) {
      setClienteNombre(found.nombre);
      setClienteRif(found.rif || '');
      setClienteCodigo(found.codigo || '');
      setClienteDireccion(found.direccion || '');
      setClienteContacto(found.contacto || '');
      setClienteTelefono(found.telefono || '');
      setClienteCorreo(found.correo || '');
      setClienteCiudad(found.ciudad || '');

      // Verificar sucursales de este cliente
      const clientBranches = sucursales.filter(
        s => s.clienteNombre.trim().toUpperCase() === found.nombre.trim().toUpperCase()
      );
      if (clientBranches.length > 0) {
        handleSelectSucursal(clientBranches[0].nombre, clientBranches[0]);
      } else {
        setSucursalNombre('');
        setSucursalRif('');
        setSucursalCodigo('');
        setSucursalDireccion('');
        setSucursalContacto('');
        setSucursalTelefono('');
        setSucursalCorreo('');
        setSucursalCiudad('');
      }
    }
  };

  // Handle Sucursal selection and auto-fill (autocompleta por Nombre de Sucursal)
  const handleSelectSucursal = (term: string, directObj?: Sucursal) => {
    setSucursalNombre(term);
    const clean = term.trim().toUpperCase();
    if (!clean) {
      setSucursalRif('');
      setSucursalCodigo('');
      setSucursalDireccion('');
      setSucursalContacto('');
      setSucursalTelefono('');
      setSucursalCorreo('');
      setSucursalCiudad('');
      return;
    }

    // 1. Objeto directo pasado
    if (directObj) {
      setSucursalNombre(directObj.nombre);
      setSucursalRif(directObj.rif || clienteRif);
      setSucursalCodigo(directObj.codigo || '');
      setSucursalDireccion(directObj.direccion || '');
      setSucursalContacto(directObj.contacto || clienteContacto);
      setSucursalTelefono(directObj.telefono || '');
      setSucursalCorreo(directObj.correo || '');
      setSucursalCiudad(directObj.ciudad || '');
      return;
    }

    // 2. Buscar coincidencia exacta por nombre de sucursal
    const foundSuc = sucursales.find(s => s.nombre.trim().toUpperCase() === clean);
    if (foundSuc) {
      setSucursalRif(foundSuc.rif || clienteRif);
      setSucursalCodigo(foundSuc.codigo || '');
      setSucursalDireccion(foundSuc.direccion || '');
      setSucursalContacto(foundSuc.contacto || clienteContacto);
      setSucursalTelefono(foundSuc.telefono || '');
      setSucursalCorreo(foundSuc.correo || '');
      setSucursalCiudad(foundSuc.ciudad || '');
      return;
    }

    // 3. Buscar si coincide exactamente con el nombre de un cliente (ej: Sede Principal)
    const foundCli = clientes.find(c => c.nombre.trim().toUpperCase() === clean);
    if (foundCli) {
      setSucursalRif(foundCli.rif || clienteRif);
      setSucursalCodigo(foundCli.codigo || '');
      setSucursalDireccion(foundCli.direccion || '');
      setSucursalContacto(foundCli.contacto || clienteContacto);
      setSucursalTelefono(foundCli.telefono || '');
      setSucursalCorreo(foundCli.correo || '');
      setSucursalCiudad(foundCli.ciudad || '');
    }
  };

  // Items manipulation
  const handleAddItem = () => {
    const newId = `row-${Date.now()}`;
    setItems(prev => [
      ...prev,
      {
        id: newId,
        producto: '',
        marca: '',
        modelo: '',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0.00
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDuplicateItem = (id: string) => {
    const item = items.find(it => it.id === id);
    if (!item) return;
    const newId = `row-${Date.now()}`;
    setItems(prev => [
      ...prev,
      { ...item, id: newId }
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof PresupuestoItemRow, value: any) => {
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleLoadTemplate = (templateItems: Omit<PresupuestoItemRow, 'id'>[]) => {
    const mapped = templateItems.map((t, idx) => ({
      ...t,
      id: `row-tpl-${Date.now()}-${idx}`
    }));
    setItems(mapped);
    setFeedbackMessage({
      type: 'success',
      text: `Plantilla cargada con ${templateItems.length} items.`
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Calculator Modal
  const handleOpenCalculator = (rowId: string, currentPrice: number) => {
    setCalcTargetRowId(rowId);
    setCalcTargetPrice(currentPrice);
    setIsCalculatorOpen(true);
  };

  const handleApplyCalculatorValue = (value: number) => {
    if (calcTargetRowId) {
      handleUpdateItem(calcTargetRowId, 'precioUnitario', value);
    }
  };

  // Totals calculations
  const subtotalUsd = items.reduce((acc, it) => acc + ((it.cantidad || 0) * (it.precioUnitario || 0)), 0);
  const ivaUsd = aplicarIva ? subtotalUsd * (porcentajeIva / 100) : 0;
  const totalUsd = subtotalUsd + ivaUsd;

  const currentTasa = (usarTasa && tasaDia > 0) ? tasaDia : 0;
  const subtotalBs = currentTasa > 0 ? subtotalUsd * currentTasa : 0;
  const ivaBs = currentTasa > 0 ? ivaUsd * currentTasa : 0;
  const totalBs = currentTasa > 0 ? totalUsd * currentTasa : 0;

  // Build the complete PresupuestoData object
  const getCurrentPresupuestoData = (): PresupuestoData => {
    return {
      numeroPresupuesto,
      fecha,
      validoDias,
      tipoPresupuesto,
      clienteNombre,
      clienteRif,
      clienteCodigo,
      clienteDireccion,
      clienteContacto,
      clienteTelefono,
      clienteCorreo,
      clienteCiudad,
      sucursalNombre,
      sucursalRif,
      sucursalCodigo,
      sucursalDireccion,
      sucursalContacto,
      sucursalTelefono,
      sucursalCorreo,
      sucursalCiudad,
      items,
      usarTasa,
      tasaDia,
      aplicarIva,
      porcentajeIva,
      subtotalUsd: Number(subtotalUsd.toFixed(2)),
      ivaUsd: Number(ivaUsd.toFixed(2)),
      totalUsd: Number(totalUsd.toFixed(2)),
      subtotalBs: Number(subtotalBs.toFixed(2)),
      ivaBs: Number(ivaBs.toFixed(2)),
      totalBs: Number(totalBs.toFixed(2))
    };
  };

  // Save / Transmit handler
  const handleSaveAndSend = async (sendToSheets: boolean) => {
    if (!clienteNombre.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'Por favor ingrese o seleccione la Razón Social / Cliente.'
      });
      return;
    }

    if (items.length === 0 || items.some(it => !it.producto.trim())) {
      setFeedbackMessage({
        type: 'error',
        text: 'Todos los items deben tener al menos un nombre de producto válido.'
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    const budgetData = getCurrentPresupuestoData();
    const res = await onSavePresupuesto(budgetData, sendToSheets);

    setIsSubmitting(false);
    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: res.message
      });
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Auto-limpiar formulario y preparar el siguiente número
      setTimeout(async () => {
        await handleResetForm();
        setFeedbackMessage(null);
      }, 3500);
    } else {
      setFeedbackMessage({
        type: 'error',
        text: res.message
      });
    }
  };

  const handleResetForm = async () => {
    const nextCode = await onRefreshNextNumber();
    setNumeroPresupuesto(nextCode);
    setFecha(new Date().toISOString().split('T')[0]);
    setClienteNombre('');
    setClienteRif('');
    setClienteCodigo('');
    setClienteDireccion('');
    setClienteContacto('');
    setClienteTelefono('');
    setClienteCorreo('');
    setClienteCiudad('');
    setSucursalNombre('');
    setSucursalRif('');
    setSucursalCodigo('');
    setSucursalDireccion('');
    setSucursalContacto('');
    setSucursalTelefono('');
    setSucursalCorreo('');
    setSucursalCiudad('');
    setItems([
      {
        id: `row-${Date.now()}`,
        producto: '',
        marca: '',
        modelo: '',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0
      }
    ]);
    setFeedbackMessage({
      type: 'success',
      text: 'Formulario limpiado. Listo para un nuevo registro.'
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Available branches for current client
  const availableBranches = sucursales.filter(
    s => s.clienteNombre.trim().toUpperCase() === clienteNombre.trim().toUpperCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Notifications Banner */}
      {feedbackMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <p className="text-sm font-semibold">{feedbackMessage.text}</p>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold px-2 py-1 rounded-lg hover:bg-black/5"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Form Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSaveAndSend(true); }}>
        
        {/* BLOQUE 1: DATOS DE IDENTIFICACIÓN Y CLIENTE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-400/20 text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Identificación del Presupuesto y Datos del Cliente</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Control oficial de emisión y vinculación a base de datos de Silocom
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tipo Presupuesto:</span>
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  id="btn-moneda-usd"
                  type="button"
                  onClick={() => setTipoPresupuesto('US$')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tipoPresupuesto === 'US$'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  US$ Dólar
                </button>
                <button
                  id="btn-moneda-bss"
                  type="button"
                  onClick={() => {
                    setTipoPresupuesto('Bs.S');
                    if (!usarTasa) setUsarTasa(true);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tipoPresupuesto === 'Bs.S'
                      ? 'bg-emerald-400 text-slate-950 shadow-sm font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bs.S Bolívares
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Top row: Numero, Fecha, Validez */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Presupuesto Number - Solo Lectura / Auto-Calculado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>Nº Presupuesto</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold normal-case">
                      <Lock className="w-2.5 h-2.5" /> Auto-secuencia
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const num = await onRefreshNextNumber();
                      if (num) setNumeroPresupuesto(num);
                    }}
                    title="Consultar último correlativo en Google Sheets y recalcular"
                    className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline normal-case font-medium flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Recalcular (+1)
                  </button>
                </label>
                <div className="relative">
                  <input
                    id="input-numero-presupuesto"
                    type="text"
                    readOnly
                    value={numeroPresupuesto}
                    placeholder="CP-202608011"
                    title="Campo autocalculado (+1 del último registro en Sheets)."
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100/90 border border-slate-300 rounded-xl text-slate-800 font-mono font-bold text-sm select-all cursor-not-allowed outline-none shadow-inner"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>🔒 Solo visual (+1 automático). No sobreescribe fórmulas al guardar.</span>
                </p>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fecha de Emisión
                </label>
                <div className="relative">
                  <input
                    id="input-fecha-presupuesto"
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Validez */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Válido por (Días)
                </label>
                <select
                  id="select-valido-dias"
                  value={validoDias}
                  onChange={(e) => setValidoDias(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value={1}>1 Día (Cotización Rápida)</option>
                  <option value={7}>7 Días</option>
                  <option value={15}>15 Días</option>
                  <option value={30}>30 Días (Estándar)</option>
                  <option value={60}>60 Días</option>
                  <option value={90}>90 Días</option>
                </select>
              </div>
            </div>

            {/* Middle Section: Cliente Details Card */}
            <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Datos del Cliente / Razón Social
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">Seleccione un Cliente para autocompletar</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Cliente / Comercio Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Comercio / Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-cliente-nombre"
                    type="text"
                    required
                    list="list-clientes-bd"
                    value={clienteNombre}
                    onChange={(e) => handleSelectCliente(e.target.value)}
                    placeholder="Buscar o escribir cliente (ej: NETUNO, CANTV)..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                  <datalist id="list-clientes-bd">
                    {clientes.map((c, idx) => (
                      <option key={`cli-opt-${c.id || c.nombre}-${idx}`} value={c.nombre}>
                        {c.nombre} {c.rif ? `| RIF: ${c.rif}` : ''} {c.codigo ? `| IDEM/CÓD: ${c.codigo}` : ''}
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* RIF */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    RIF Empresa / Cliente
                  </label>
                  <input
                    id="input-cliente-rif"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={clienteRif}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm cursor-not-allowed select-none outline-none uppercase"
                  />
                </div>

                {/* IDEM / Código Cliente */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    IDEM / Código
                  </label>
                  <input
                    id="input-cliente-codigo"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={clienteCodigo}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm cursor-not-allowed select-none outline-none uppercase"
                  />
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Dirección Fiscal
                  </label>
                  <input
                    id="input-cliente-direccion"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={clienteDireccion}
                    placeholder="Auto-completado de la base de datos"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 text-sm cursor-not-allowed select-none outline-none"
                  />
                </div>

                {/* Persona de Contacto */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    id="input-cliente-contacto"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={clienteContacto}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 text-sm cursor-not-allowed select-none outline-none uppercase"
                  />
                </div>

                {/* Ciudad / Estado */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Ciudad / Estado
                  </label>
                  <input
                    id="input-cliente-ciudad"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={clienteCiudad}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 text-sm cursor-not-allowed select-none outline-none uppercase"
                  />
                </div>

                {/* Teléfono */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Teléfono
                  </label>
                  <input
                    id="input-cliente-telefono"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={clienteTelefono}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 text-sm cursor-not-allowed select-none outline-none"
                  />
                </div>

                {/* Correo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    id="input-cliente-correo"
                    type="email"
                    readOnly
                    tabIndex={-1}
                    value={clienteCorreo}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 text-sm cursor-not-allowed select-none outline-none lowercase"
                  />
                </div>
              </div>
            </div>

            {/* Sucursal Card (Optional) */}
            <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-200/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Sucursal / Lugar de Instalación (Opcional)
                  </h3>
                </div>
                <span className="text-xs text-blue-800 font-medium">Seleccione una Sucursal para autocompletar</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Sucursal Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sucursal / Destino
                  </label>
                  <input
                    id="input-sucursal-nombre"
                    type="text"
                    list="list-sucursales-bd"
                    value={sucursalNombre}
                    onChange={(e) => handleSelectSucursal(e.target.value)}
                    placeholder="Buscar o escribir sucursal (ej: SUCURSAL CHACAO)..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                  <datalist id="list-sucursales-bd">
                    {availableBranches.map((s, idx) => (
                      <option key={`branch-avail-${s.id || s.nombre}-${idx}`} value={s.nombre}>
                        {s.nombre} {s.codigo ? `| CÓD: ${s.codigo}` : ''} - {s.ciudad}
                      </option>
                    ))}
                    {sucursales.map((s, idx) => (
                      <option key={`branch-all-${s.id || s.nombre}-${idx}`} value={s.nombre}>
                        {s.nombre} {s.codigo ? `| CÓD: ${s.codigo}` : ''} - {s.ciudad}
                      </option>
                    ))}
                    {clientes.map((c, idx) => (
                      <option key={`cli-suc-${c.id || c.nombre}-${idx}`} value={c.nombre}>
                        {c.nombre} {c.codigo ? `| CÓD: ${c.codigo}` : ''} (Principal)
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* RIF Sucursal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Cédula / RIF Sucursal
                  </label>
                  <input
                    id="input-sucursal-rif"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={sucursalRif}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm cursor-not-allowed select-none outline-none uppercase"
                  />
                </div>

                {/* IDEM / Código Sucursal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    IDEM / Código Sucursal
                  </label>
                  <input
                    id="input-sucursal-codigo"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={sucursalCodigo}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm cursor-not-allowed select-none outline-none uppercase"
                  />
                </div>

                {/* Dirección Sucursal */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Dirección Sucursal
                  </label>
                  <input
                    id="input-sucursal-direccion"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={sucursalDireccion}
                    placeholder="Auto-completado de la base de datos"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 text-sm cursor-not-allowed select-none outline-none"
                  />
                </div>

                {/* Persona de Contacto Sucursal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    id="input-sucursal-contacto"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={sucursalContacto}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 text-sm cursor-not-allowed select-none outline-none uppercase"
                  />
                </div>

                {/* Ciudad / Estado Sucursal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Ciudad / Estado
                  </label>
                  <input
                    id="input-sucursal-ciudad"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={sucursalCiudad}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 text-sm cursor-not-allowed select-none outline-none uppercase"
                  />
                </div>

                {/* Teléfono Sucursal */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Teléfono
                  </label>
                  <input
                    id="input-sucursal-telefono"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={sucursalTelefono}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 text-sm cursor-not-allowed select-none outline-none"
                  />
                </div>

                {/* Correo Sucursal */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    id="input-sucursal-correo"
                    type="email"
                    readOnly
                    tabIndex={-1}
                    value={sucursalCorreo}
                    placeholder="Auto-completado"
                    className="w-full px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 text-sm cursor-not-allowed select-none outline-none lowercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: TABLA DE ITEMS */}
        <ItemsTable
          items={items}
          productosCatalog={productos}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onDuplicateItem={handleDuplicateItem}
          onUpdateItem={handleUpdateItem}
          onOpenCalculator={handleOpenCalculator}
          moneda={tipoPresupuesto}
          tasaDia={tasaDia}
          usarTasa={usarTasa}
        />

        {/* BLOQUE 3 Y 4: TASA DEL DÍA Y CÁLCULOS GENERALES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* Bloque 3: Tasa de Cambio */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Tasa del Día en Bs.S
                </h3>
                <p className="text-xs text-slate-500">Conversión a moneda de curso legal</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  id="checkbox-usar-tasa"
                  type="checkbox"
                  checked={usarTasa}
                  onChange={(e) => setUsarTasa(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="checkbox-usar-tasa" className="text-sm font-semibold text-slate-800 cursor-pointer">
                  Activar cálculo de Tasa del Día
                </label>
              </div>

              {usarTasa && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Tasa Oficial / Referencial (Bs./US$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-sm">Bs.</span>
                    <input
                      id="input-tasa-dia"
                      type="number"
                      step="any"
                      min="0"
                      value={tasaDia}
                      onChange={(e) => setTasaDia(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="779.9522"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-base text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Se aplicará a cada item para calcular totales automáticos en Bolívares.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bloque 4: Resumen y Totales */}
          <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col justify-between">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                  Totales y Cálculos Generales
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="checkbox-aplicar-iva"
                  type="checkbox"
                  checked={aplicarIva}
                  onChange={(e) => setAplicarIva(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-400 cursor-pointer"
                />
                <label htmlFor="checkbox-aplicar-iva" className="text-xs font-bold text-cyan-300 cursor-pointer">
                  Aplicar IVA ({porcentajeIva}%)
                </label>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* USD Column */}
              <div className={`rounded-xl p-4 border transition-all ${
                tipoPresupuesto === 'US$'
                  ? 'bg-slate-800/90 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-lg'
                  : 'bg-slate-800/40 border-slate-700/60 opacity-80'
              } space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Valores en Dólares (US$)
                  </span>
                  {tipoPresupuesto === 'US$' && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 uppercase">
                      Principal
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-xs text-slate-300 pt-1">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-white">
                    US$ {subtotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>IVA ({aplicarIva ? porcentajeIva : 0}%):</span>
                  <span className="font-mono font-bold text-white">
                    US$ {ivaUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                  <span className="text-xs font-extrabold text-cyan-300 uppercase">Total US$:</span>
                  <span className="text-lg font-black font-mono text-yellow-300">
                    US$ {totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Bs.S Column */}
              <div className={`rounded-xl p-4 border transition-all ${
                tipoPresupuesto === 'Bs.S'
                  ? 'bg-slate-800/90 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg'
                  : 'bg-slate-800/40 border-slate-700/60 opacity-80'
              } space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Valores en Bolívares (Bs.S)
                  </span>
                  {tipoPresupuesto === 'Bs.S' && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 uppercase">
                      Principal
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300 pt-1">
                  <span>Subtotal Bs.:</span>
                  <span className="font-mono font-bold text-white">
                    Bs. {subtotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>IVA Bs.:</span>
                  <span className="font-mono font-bold text-white">
                    Bs. {ivaBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                  <span className="text-xs font-extrabold text-emerald-300 uppercase">Total Bs.S:</span>
                  <span className="text-lg font-black font-mono text-emerald-300">
                    Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Control Bar */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  id="btn-preview-modal-open"
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 shadow-sm"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Vista Previa del Documento</span>
                </button>

                <button
                  id="btn-reset-form"
                  type="button"
                  onClick={handleResetForm}
                  className="flex items-center gap-2 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs font-medium"
                  title="Limpiar y generar siguiente número"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Limpiar Formulario</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-save-and-transmit"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Guardando en Google Sheets...' : 'Guardar & Transmitir a Sheets'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Hidden printable container for direct PDF extraction */}
      <div className="hidden">
        <OfficialDocumentView
          presupuesto={getCurrentPresupuestoData()}
          config={config}
          elementId="official-direct-pdf-doc"
        />
      </div>

      {/* Calculator Modal */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onApplyValue={handleApplyCalculatorValue}
        initialValue={calcTargetPrice}
        fieldName="Precio Unitario"
      />

      {/* Official Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        presupuesto={getCurrentPresupuestoData()}
        config={config}
        onSendToSheets={async () => {
          await handleSaveAndSend(true);
        }}
        isSendingToSheets={isSubmitting}
      />
    </div>
  );
};
