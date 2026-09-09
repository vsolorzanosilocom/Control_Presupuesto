import React, { useState } from 'react';
import { X, Download, Printer, Send, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { PresupuestoData, AppConfig } from '../types';
import { OfficialDocumentView } from './OfficialDocumentView';
import { generatePdfFromElement } from '../utils/pdfGenerator';
import confetti from 'canvas-confetti';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  presupuesto: PresupuestoData;
  config: AppConfig;
  onSendToSheets: () => Promise<void>;
  isSendingToSheets: boolean;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  presupuesto,
  config,
  onSendToSheets,
  isSendingToSheets
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    const fileName = `Presupuesto_${presupuesto.numeroPresupuesto}_${presupuesto.clienteNombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    try {
      const success = await generatePdfFromElement('official-preview-modal-doc', fileName);
      if (success) {
        setPdfSuccess(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
        setTimeout(() => setPdfSuccess(false), 4000);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="preview-modal-container"
        className="w-full max-w-5xl bg-slate-100 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col max-h-[96vh] overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="bg-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-400/20 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 leading-tight">
                Vista Previa Oficial: {presupuesto.numeroPresupuesto || 'Sin Asignar'}
              </h3>
              <p className="text-xs text-slate-400">
                Formato corporativo Silocom, C.A. idéntico al documento para el cliente
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-print-doc"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-700 shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              id="btn-download-pdf"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
              ) : pdfSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPdf ? 'Generando PDF...' : pdfSuccess ? '¡Descargado!' : 'Descargar PDF'}</span>
            </button>

            <button
              id="btn-modal-send-sheets"
              onClick={onSendToSheets}
              disabled={isSendingToSheets}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-60"
            >
              {isSendingToSheets ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden md:inline">Enviar a Google Sheets</span>
              <span className="md:hidden">Sheets</span>
            </button>

            <button
              id="btn-close-preview"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-300/60 flex justify-center">
          <div className="shadow-2xl rounded-sm">
            <OfficialDocumentView
              presupuesto={presupuesto}
              config={config}
              elementId="official-preview-modal-doc"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
