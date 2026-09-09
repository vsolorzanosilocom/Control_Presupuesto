import React, { useState, useEffect } from 'react';
import { Calculator, X, CornerDownLeft, Delete } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyValue: (value: number) => void;
  initialValue?: number;
  fieldName?: string;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyValue,
  initialValue = 0,
  fieldName = 'Precio Unitario'
}) => {
  const [expression, setExpression] = useState<string>('0');
  const [history, setHistory] = useState<string>('');
  const [justCalculated, setJustCalculated] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setExpression(initialValue > 0 ? String(initialValue) : '0');
      setHistory('');
      setJustCalculated(false);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleButtonClick = (val: string) => {
    if (justCalculated && !['+', '-', '*', '/'].includes(val)) {
      setExpression(val === '.' ? '0.' : val);
      setJustCalculated(false);
      return;
    }

    setJustCalculated(false);

    if (expression === '0' && val !== '.') {
      setExpression(val);
    } else {
      setExpression(prev => prev + val);
    }
  };

  const handleClear = () => {
    setExpression('0');
    setHistory('');
    setJustCalculated(false);
  };

  const handleDelete = () => {
    if (expression.length <= 1) {
      setExpression('0');
    } else {
      setExpression(prev => prev.slice(0, -1));
    }
  };

  const evaluateExpression = (): number | null => {
    try {
      // Safe sanitized arithmetic evaluation
      const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[0-9+\-*/. ()]+$/.test(sanitized)) {
        return null;
      }
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.round(result * 10000) / 10000;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleEquals = () => {
    const result = evaluateExpression();
    if (result !== null) {
      setHistory(expression + ' =');
      setExpression(String(result));
      setJustCalculated(true);
    }
  };

  const handleApply = () => {
    const result = evaluateExpression();
    if (result !== null) {
      onApplyValue(Number(result.toFixed(2)));
      onClose();
    } else {
      const num = parseFloat(expression);
      if (!isNaN(num)) {
        onApplyValue(Number(num.toFixed(2)));
        onClose();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
      handleButtonClick(e.key);
    } else if (['+', '-', '*', '/'].includes(e.key)) {
      handleButtonClick(e.key);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleEquals();
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      id="calc-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        id="calc-modal-content"
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/30 rounded-lg border border-blue-400/20">
              <Calculator className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight text-slate-100">Calculadora Rápida</h3>
              <p className="text-[11px] text-slate-400">Calculando {fieldName}</p>
            </div>
          </div>
          <button
            id="btn-close-calc"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Screen Display */}
        <div className="bg-slate-950 p-4 text-right border-b border-slate-800">
          <div className="text-xs text-slate-400 font-mono h-4 overflow-hidden text-ellipsis">
            {history || '\u00A0'}
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400 tracking-tight overflow-x-auto whitespace-nowrap py-1">
            {expression}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 bg-slate-50 grid grid-cols-4 gap-2">
          <button
            id="calc-btn-clear"
            onClick={handleClear}
            className="p-3 font-semibold text-sm text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all active:scale-95"
          >
            C
          </button>
          <button
            id="calc-btn-delete"
            onClick={handleDelete}
            className="p-3 font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            id="calc-btn-paren"
            onClick={() => handleButtonClick('(')}
            className="p-3 font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            (
          </button>
          <button
            id="calc-btn-div"
            onClick={() => handleButtonClick('/')}
            className="p-3 font-bold text-base text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all active:scale-95"
          >
            ÷
          </button>

          <button
            id="calc-btn-7"
            onClick={() => handleButtonClick('7')}
            className="p-3 text-lg font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            7
          </button>
          <button
            id="calc-btn-8"
            onClick={() => handleButtonClick('8')}
            className="p-3 text-lg font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            8
          </button>
          <button
            id="calc-btn-9"
            onClick={() => handleButtonClick('9')}
            className="p-3 text-lg font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            9
          </button>
          <button
            id="calc-btn-mul"
            onClick={() => handleButtonClick('*')}
            className="p-3 font-bold text-base text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all active:scale-95"
          >
            ×
          </button>

          <button
            id="calc-btn-4"
            onClick={() => handleButtonClick('4')}
            className="p-3 text-lg font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            4
          </button>
          <button
            id="calc-btn-5"
            onClick={() => handleButtonClick('5')}
            className="p-3 text-lg font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            5
          </button>
          <button
            id="calc-btn-6"
            onClick={() => handleButtonClick('6')}
            className="p-3 text-lg font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            6
          </button>
          <button
            id="calc-btn-sub"
            onClick={() => handleButtonClick('-')}
            className="p-3 font-bold text-base text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all active:scale-95"
          >
            −
          </button>

          <button
            id="calc-btn-1"
            onClick={() => handleButtonClick('1')}
            className="p-3 text-lg font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            1
          </button>
          <button
            id="calc-btn-2"
            onClick={() => handleButtonClick('2')}
            className="p-3 text-lg font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            2
          </button>
          <button
            id="calc-btn-3"
            onClick={() => handleButtonClick('3')}
            className="p-3 text-lg font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            3
          </button>
          <button
            id="calc-btn-add"
            onClick={() => handleButtonClick('+')}
            className="p-3 font-bold text-base text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all active:scale-95"
          >
            +
          </button>

          <button
            id="calc-btn-0"
            onClick={() => handleButtonClick('0')}
            className="p-3 text-lg font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            0
          </button>
          <button
            id="calc-btn-dot"
            onClick={() => handleButtonClick('.')}
            className="p-3 text-lg font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            .
          </button>
          <button
            id="calc-btn-eq"
            onClick={handleEquals}
            className="col-span-2 p-3 text-lg font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            =
          </button>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-white border-t border-slate-200">
          <button
            id="btn-apply-calculated-value"
            onClick={handleApply}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <CornerDownLeft className="w-4 h-4" />
            <span>Aplicar Resultado al Campo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
