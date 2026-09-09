import React from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Calculator, 
  Package
} from 'lucide-react';
import { PresupuestoItemRow, ProductoItem } from '../types';

interface ItemsTableProps {
  items: PresupuestoItemRow[];
  productosCatalog: ProductoItem[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onUpdateItem: (id: string, field: keyof PresupuestoItemRow, value: any) => void;
  onOpenCalculator: (rowId: string, currentPrice: number) => void;
  moneda: 'US$' | 'Bs.S';
  tasaDia: number;
  usarTasa: boolean;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  productosCatalog,
  onAddItem,
  onRemoveItem,
  onDuplicateItem,
  onUpdateItem,
  onOpenCalculator,
  moneda,
  tasaDia,
  usarTasa
}) => {
  // Get distinct products from catalog
  const distinctProductos = Array.from(new Set(productosCatalog.map(p => p.producto.trim()))).filter(Boolean);

  const getMarcasForProducto = (prodName: string) => {
    if (!prodName) {
      return Array.from(new Set(productosCatalog.map(p => p.marca.trim()))).filter(m => m && m !== 'N/A');
    }
    const filtered = Array.from(
      new Set(
        productosCatalog
          .filter(p => p.producto.trim().toUpperCase() === prodName.trim().toUpperCase())
          .map(p => p.marca.trim())
      )
    ).filter(m => m && m !== 'N/A');
    if (filtered.length > 0) return filtered;
    return Array.from(new Set(productosCatalog.map(p => p.marca.trim()))).filter(m => m && m !== 'N/A');
  };

  const getModelosForProductoMarca = (prodName: string, marcaName: string) => {
    if (!prodName && !marcaName) {
      return Array.from(new Set(productosCatalog.map(p => p.modelo.trim()))).filter(Boolean);
    }
    const filtered = Array.from(
      new Set(
        productosCatalog
          .filter(
            p =>
              (!prodName || p.producto.trim().toUpperCase() === prodName.trim().toUpperCase()) &&
              (!marcaName || p.marca.trim().toUpperCase() === marcaName.trim().toUpperCase())
          )
          .map(p => p.modelo.trim())
      )
    ).filter(Boolean);
    if (filtered.length > 0) return filtered;
    return Array.from(new Set(productosCatalog.map(p => p.modelo.trim()))).filter(Boolean);
  };

  const handleProductoChange = (id: string, newProducto: string) => {
    onUpdateItem(id, 'producto', newProducto);
  };

  const handleMarcaChange = (id: string, newMarca: string) => {
    onUpdateItem(id, 'marca', newMarca);
  };

  const handleModeloChange = (id: string, newModelo: string) => {
    onUpdateItem(id, 'modelo', newModelo);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      {/* Block Header */}
      <div className="bg-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-400/20 text-cyan-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Detalle de Items, Equipos y Servicios</span>
            </h2>
            <p className="text-xs text-slate-400">
              Seleccione del catálogo de la BD o ingrese valores personalizados
            </p>
          </div>
        </div>

        <button
          id="btn-add-item-row"
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Línea</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <th className="py-3 px-3 w-12 text-center">IT</th>
              <th className="py-3 px-3 min-w-[180px]">Producto / Categoría</th>
              <th className="py-3 px-3 min-w-[150px]">Marca</th>
              <th className="py-3 px-3 min-w-[150px]">Modelo (Opcional)</th>
              <th className="py-3 px-3 min-w-[220px]">Descripción (Máx. 70 car.)</th>
              <th className="py-3 px-2 w-20 text-center">Cant.</th>
              <th className="py-3 px-3 min-w-[130px] text-right">
                Precio Unit. ({moneda === 'Bs.S' ? 'Bs.' : '$'})
              </th>
              <th className="py-3 px-3 min-w-[130px] text-right">
                Total {moneda === 'Bs.S' ? 'Bs.' : 'US$'}
              </th>
              <th className="py-3 px-2 w-20 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-xs">
            {items.map((row, index) => {
              const isBs = moneda === 'Bs.S';
              const rawPrice = row.precioUnitario || 0;
              const itemTotalUsd = (row.cantidad || 0) * rawPrice;
              const itemTotalBs = tasaDia > 0 ? (itemTotalUsd * tasaDia) : 0;
              const marcasDisponibles = getMarcasForProducto(row.producto);
              const modelosDisponibles = getModelosForProductoMarca(row.producto, row.marca);

              return (
                <tr
                  key={`item-row-${row.id || index}`}
                  id={`item-row-${index + 1}`}
                  className="hover:bg-blue-50/40 transition-colors group"
                >
                  {/* Item Number */}
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 bg-slate-50/50">
                    {String(index + 1).padStart(2, '0')}
                  </td>

                  {/* Producto */}
                  <td className="py-2 px-3">
                    <div className="relative">
                      <input
                        type="text"
                        list={`list-prods-${row.id || index}`}
                        value={row.producto}
                        onChange={(e) => handleProductoChange(row.id, e.target.value)}
                        placeholder="Seleccionar o escribir producto..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                      />
                      <datalist id={`list-prods-${row.id || index}`}>
                        {distinctProductos.map((p, i) => (
                          <option key={`prod-opt-${row.id || index}-${i}`} value={p} />
                        ))}
                      </datalist>
                    </div>
                  </td>

                  {/* Marca */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      list={`list-marcas-${row.id || index}`}
                      value={row.marca}
                      onChange={(e) => handleMarcaChange(row.id, e.target.value)}
                      placeholder="Seleccionar marca..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                    />
                    <datalist id={`list-marcas-${row.id || index}`}>
                      {marcasDisponibles.map((m, i) => (
                        <option key={`marca-opt-${row.id || index}-${i}`} value={m} />
                      ))}
                    </datalist>
                  </td>

                  {/* Modelo */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      list={`list-modelos-${row.id || index}`}
                      value={row.modelo}
                      onChange={(e) => handleModeloChange(row.id, e.target.value)}
                      placeholder="Modelo (opcional)"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                    />
                    <datalist id={`list-modelos-${row.id || index}`}>
                      {modelosDisponibles.map((mod, i) => (
                        <option key={`modelo-opt-${row.id || index}-${i}`} value={mod} />
                      ))}
                    </datalist>
                  </td>

                  {/* Descripción */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={row.descripcion}
                      onChange={(e) => onUpdateItem(row.id, 'descripcion', e.target.value)}
                      placeholder="Detalles del servicio o equipo (opcional)"
                      maxLength={70}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </td>

                  {/* Cantidad */}
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.cantidad}
                      onChange={(e) => onUpdateItem(row.id, 'cantidad', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-center text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </td>

                  {/* Precio Unitario */}
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1.5 text-slate-400 font-mono text-[11px]">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.precioUnitario}
                          onChange={(e) => onUpdateItem(row.id, 'precioUnitario', Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-5 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold text-right text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenCalculator(row.id, row.precioUnitario)}
                        title="Abrir calculadora rápida para este item"
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition-colors active:scale-95 cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {isBs && tasaDia > 0 && (
                      <div className="text-[10px] text-emerald-700 font-mono font-medium mt-0.5 pr-1">
                        = Bs. {(rawPrice * tasaDia).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </td>

                  {/* Total Linea */}
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {!isBs ? (
                      <>
                        <div>
                          <span>US$ {itemTotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {usarTasa && tasaDia > 0 && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            Bs. {itemTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-emerald-800 font-extrabold">
                          <span>Bs. {itemTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          US$ {itemTotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onDuplicateItem(row.id)}
                        title="Duplicar item"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(row.id)}
                        title="Eliminar fila"
                        disabled={items.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Bar */}
      <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{items.length}</span>
          <span>líneas de presupuesto registradas</span>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={onAddItem}
            className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Añadir otra fila</span>
          </button>
        </div>

        <div className="flex items-center gap-4 font-medium">
          <div className="text-slate-500">
            Suma Cantidades: <strong className="text-slate-800">{items.reduce((acc, it) => acc + (it.cantidad || 0), 0)}</strong>
          </div>
          <div className="text-slate-500">
            Suma Directa: <strong className="text-slate-800 font-mono">
              US$ {items.reduce((acc, it) => acc + ((it.cantidad || 0) * (it.precioUnitario || 0)), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
