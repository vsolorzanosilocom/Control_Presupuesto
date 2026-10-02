import React from 'react';
import { 
  FileText, 
  History, 
  Database, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  Building2,
  Sparkles,
  FileCheck2,
  Receipt
} from 'lucide-react';
import { AppConfig } from '../types';
import { SilocomLogo } from './SilocomLogo';

interface HeaderProps {
  activeTab: 'generator' | 'history' | 'approval' | 'facturas' | 'settings';
  setActiveTab: (tab: 'generator' | 'history' | 'approval' | 'facturas' | 'settings') => void;
  config: AppConfig;
  isSyncing: boolean;
  onSync: () => void;
  savedCount: number;
  pendingApprovalCount?: number;
  facturasCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  isSyncing,
  onSync,
  savedCount,
  pendingApprovalCount = 0,
  facturasCount = 0
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-xl backdrop-blur-md bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand & Corporate Logo */}
          <div className="flex items-center gap-3.5">
            <div 
              className="cursor-pointer transition-transform hover:scale-[1.02]" 
              onClick={() => setActiveTab('generator')}
              title="Ir al Generador de Presupuestos"
            >
              <SilocomLogo size="sm" showRif={true} variant="badge" />
            </div>

            <div className="hidden sm:block border-l border-slate-700/80 pl-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">
                  Gestión Corporativa
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Presupuestos
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="text-slate-400 truncate max-w-xs">{config.telefonoEmpresa}</span>
                <span className="hidden md:inline text-slate-600">•</span>
                <span className="hidden md:inline text-cyan-400 font-medium">Control Comercial</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Desktop / Tablets) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              id="tab-btn-generator"
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'generator'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Nuevo Presupuesto</span>
            </button>

            <button
              id="tab-btn-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historial</span>
              {savedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-cyan-500 text-slate-950 rounded-full">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              id="tab-btn-approval"
              onClick={() => setActiveTab('approval')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
                activeTab === 'approval'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Aprobación</span>
              {pendingApprovalCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full">
                  {pendingApprovalCount}
                </span>
              )}
            </button>

            <button
              id="tab-btn-facturas"
              onClick={() => setActiveTab('facturas')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
                activeTab === 'facturas'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Facturas por Cobrar</span>
              {facturasCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-cyan-400 text-slate-950 rounded-full">
                  {facturasCount}
                </span>
              )}
            </button>

            <button
              id="tab-btn-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Ajustes</span>
            </button>
          </nav>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-2.5">
            <button
              id="btn-sync-sheets"
              onClick={onSync}
              disabled={isSyncing}
              title="Sincronizar catálogo y datos desde Google Sheets"
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-cyan-300 border border-slate-700/80 transition-all active:scale-95 disabled:opacity-60 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sync Sheets'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium font-mono text-[11px]">En línea</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-between gap-1 py-2.5 border-t border-slate-800/70 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'generator' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Presupuesto</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({savedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('approval')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'approval' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Aprobación</span>
          </button>
          <button
            onClick={() => setActiveTab('facturas')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'facturas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Cobranza</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustes</span>
          </button>
        </div>
      </div>
    </header>
  );
};
