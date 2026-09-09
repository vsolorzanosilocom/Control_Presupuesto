import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PresupuestoForm } from './components/PresupuestoForm';
import { HistoryManager } from './components/HistoryManager';
import { ApprovalManager } from './components/ApprovalManager';
import { FacturasCobrarManager } from './components/FacturasCobrarManager';
import { SettingsModal } from './components/SettingsModal';
import { 
  AppConfig, 
  Cliente, 
  Sucursal, 
  ProductoItem, 
  PresupuestoData,
  FacturaCobroData
} from './types';
import { 
  getAppConfig, 
  saveAppConfig, 
  getStoredClientes, 
  getStoredSucursales, 
  getStoredProductos, 
  getStoredPresupuestos,
  getStoredFacturasCobro, 
  savePresupuestoToHistory, 
  deletePresupuestoFromHistory, 
  fetchLastPresupuestoNumber, 
  syncCatalogFromGoogleSheets, 
  sendPresupuestoToGoogleSheets,
  updatePresupuestoApproval,
  updateFacturaCobro,
  fetchServerConfig
} from './services/apiService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'history' | 'approval' | 'facturas' | 'settings'>('generator');
  
  // Master In-Memory State (initialized with permanent corporate defaults)
  const [config, setConfig] = useState<AppConfig>(getAppConfig);
  const [clientes, setClientes] = useState<Cliente[]>(getStoredClientes);
  const [sucursales, setSucursales] = useState<Sucursal[]>(getStoredSucursales);
  const [productos, setProductos] = useState<ProductoItem[]>(getStoredProductos);
  const [history, setHistory] = useState<PresupuestoData[]>(getStoredPresupuestos);
  const [facturas, setFacturas] = useState<FacturaCobroData[]>(getStoredFacturasCobro);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activePresupuestoToEdit, setActivePresupuestoToEdit] = useState<PresupuestoData | null>(null);

  // Automatic live sync with Google Sheets on startup
  const handleSyncWithSheets = async (targetUrl?: string) => {
    setIsSyncing(true);
    try {
      const urlToUse = targetUrl || config.scriptUrl;
      const res = await syncCatalogFromGoogleSheets(urlToUse);
      if (res.clientes && res.clientes.length > 0) setClientes(res.clientes);
      if (res.sucursales && res.sucursales.length > 0) setSucursales(res.sucursales);
      if (res.productos && res.productos.length > 0) setProductos(res.productos);
      if (res.presupuestos && res.presupuestos.length > 0) setHistory(res.presupuestos);
      if (res.facturas && res.facturas.length > 0) setFacturas(res.facturas);
    } catch (e) {
      console.warn('Sync finished with memory fallback:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Perform live fetch on mount so any user on any device gets real-time data
  useEffect(() => {
    const initConfigAndSync = async () => {
      const serverConf = await fetchServerConfig();
      if (serverConf?.scriptUrl && serverConf.scriptUrl !== config.scriptUrl) {
        setConfig(prev => {
          const updated = { ...prev, scriptUrl: serverConf.scriptUrl! };
          if (serverConf.spreadsheetId) updated.spreadsheetId = serverConf.spreadsheetId;
          saveAppConfig(updated);
          return updated;
        });
        handleSyncWithSheets(serverConf.scriptUrl);
      } else {
        handleSyncWithSheets();
      }
    };
    initConfigAndSync();
  }, []);

  // Compute next budget sequence from Google Sheets
  const handleGetNextNumber = async (): Promise<string> => {
    const res = await fetchLastPresupuestoNumber(config.scriptUrl);
    return res.nextCode;
  };

  // Save budget directly to Google Sheets
  const handleSavePresupuesto = async (
    presupuesto: PresupuestoData, 
    sendToSheets: boolean
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (sendToSheets) {
        const sendRes = await sendPresupuestoToGoogleSheets(config.scriptUrl, presupuesto);
        // Refresh live history from Google Sheets
        const syncRes = await syncCatalogFromGoogleSheets(config.scriptUrl);
        if (syncRes.presupuestos) {
          setHistory(syncRes.presupuestos);
        } else {
          setHistory(getStoredPresupuestos());
        }
        return sendRes;
      } else {
        const updatedList = savePresupuestoToHistory(presupuesto);
        setHistory(updatedList);
        return {
          success: true,
          message: `Presupuesto ${presupuesto.numeroPresupuesto} guardado en memoria de sesión.`
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: `Error al guardar: ${e?.message || 'Fallo inesperado'}`
      };
    }
  };

  // Handle updating approval and invoice info in Google Sheets
  const handleUpdateApproval = async (data: {
    numeroPresupuesto: string;
    aprobado: string;
    numeroFactura?: string;
    fechaFactura?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const res = await updatePresupuestoApproval(config.scriptUrl, data);
    if (res.success) {
      // Re-sync to get freshly updated statuses
      const syncRes = await syncCatalogFromGoogleSheets(config.scriptUrl);
      if (syncRes.presupuestos) {
        setHistory(syncRes.presupuestos);
      }
      if (syncRes.facturas) {
        setFacturas(syncRes.facturas);
      }
    }
    return res;
  };

  // Handle updating billing and payment collection in Google Sheets (Hoja FACTURAS)
  const handleUpdateFacturaCobro = async (
    data: FacturaCobroData
  ): Promise<{ success: boolean; message: string }> => {
    const res = await updateFacturaCobro(config.scriptUrl, data);
    if (res.success) {
      const syncRes = await syncCatalogFromGoogleSheets(config.scriptUrl);
      if (syncRes.facturas) {
        setFacturas(syncRes.facturas);
      }
    }
    return res;
  };

  // Load from history into generator
  const handleLoadPresupuesto = (item: PresupuestoData) => {
    setActivePresupuestoToEdit(item);
    setActiveTab('generator');
  };

  // Delete from history
  const handleDeletePresupuesto = (id: string) => {
    const updated = deletePresupuestoFromHistory(id);
    setHistory(updated);
  };

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    saveAppConfig(newConfig);
  };

  const pendingApprovalsCount = history.filter(p => {
    const isApproved = (p.aprobado || '').trim().toUpperCase();
    return isApproved === '' || isApproved === 'PENDIENTE';
  }).length;

  const approvedInvoicesCount = history.filter(p => {
    const isApproved = (p.aprobado || '').trim().toUpperCase() === 'SI';
    const hasFactura = Boolean((p.numeroFactura || '').trim());
    return isApproved || hasFactura;
  }).length;

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Corporate Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        config={config}
        isSyncing={isSyncing}
        onSync={handleSyncWithSheets}
        savedCount={history.length}
        pendingApprovalCount={pendingApprovalsCount}
        facturasCount={approvedInvoicesCount}
      />

      {/* Main Views */}
      <main className="flex-1 pb-16">
        {activeTab === 'generator' && (
          <PresupuestoForm
            config={config}
            clientes={clientes}
            sucursales={sucursales}
            productos={productos}
            onSavePresupuesto={handleSavePresupuesto}
            initialPresupuesto={activePresupuestoToEdit}
            onRefreshNextNumber={handleGetNextNumber}
          />
        )}

        {activeTab === 'history' && (
          <HistoryManager
            presupuestos={history}
            onLoadPresupuesto={handleLoadPresupuesto}
            onDeletePresupuesto={handleDeletePresupuesto}
            onSendToSheets={async (item) => {
              await handleSavePresupuesto(item, true);
            }}
            config={config}
          />
        )}

        {activeTab === 'approval' && (
          <ApprovalManager
            presupuestos={history}
            onUpdateApproval={handleUpdateApproval}
            config={config}
            onRefresh={handleSyncWithSheets}
          />
        )}

        {activeTab === 'facturas' && (
          <FacturasCobrarManager
            presupuestos={history}
            facturasGuardadas={facturas}
            onUpdateFacturaCobro={handleUpdateFacturaCobro}
            config={config}
            onRefresh={handleSyncWithSheets}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            config={config}
            onSaveConfig={handleSaveConfig}
          />
        )}
      </main>

      {/* Corporate Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 px-4 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wide">SILOCOM, C.A.</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono">{config.rifEmpresa}</span>
            <span className="text-slate-600">•</span>
            <span>Sistema Corporativo de Gestión y Control de Presupuestos</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Google Sheets ID: {config.spreadsheetId.slice(0, 12)}...</span>
            <span>Conectado en vivo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
