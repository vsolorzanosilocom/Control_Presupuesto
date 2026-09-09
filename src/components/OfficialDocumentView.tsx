import React from 'react';
import { PresupuestoData, AppConfig } from '../types';

interface OfficialDocumentViewProps {
  presupuesto: PresupuestoData;
  config: AppConfig;
  elementId?: string;
}

export const OfficialDocumentView: React.FC<OfficialDocumentViewProps> = ({
  presupuesto,
  config,
  elementId = 'official-printable-document'
}) => {
  const isBs = presupuesto.tipoPresupuesto === 'Bs.S' || (presupuesto.tipoPresupuesto as string) === 'Bs';

  // Format items safely with minimum of rows for authentic invoice look
  const rawItems = Array.isArray(presupuesto?.items) ? presupuesto.items : [];
  const rows = [...rawItems];
  const emptyRowsNeeded = Math.max(0, 8 - rows.length);

  // Compute base USD values
  const subtotalComputed = rawItems.reduce((acc, it) => acc + ((it?.cantidad || 0) * (it?.precioUnitario || 0)), 0);
  const subtotalUsd = presupuesto.subtotalUsd !== undefined && presupuesto.subtotalUsd > 0 ? presupuesto.subtotalUsd : subtotalComputed;
  const ivaRate = presupuesto.aplicarIva ? (presupuesto.porcentajeIva || 16) : 0;
  const ivaUsd = presupuesto.ivaUsd !== undefined && presupuesto.ivaUsd > 0 ? presupuesto.ivaUsd : (subtotalUsd * (ivaRate / 100));
  const totalUsd = presupuesto.totalUsd !== undefined && presupuesto.totalUsd > 0 ? presupuesto.totalUsd : (subtotalUsd + ivaUsd);

  // Compute Bs. values based on rate
  const tasa = presupuesto.tasaDia || 0;
  const subtotalBs = tasa > 0 ? (subtotalUsd * tasa) : (presupuesto.subtotalBs || 0);
  const ivaBs = tasa > 0 ? (ivaUsd * tasa) : (presupuesto.ivaBs || 0);
  const totalBs = tasa > 0 ? (totalUsd * tasa) : (presupuesto.totalBs || 0);

  // Main displayed values based on currency mode (US$ vs Bs.S)
  const displaySubtotal = isBs ? subtotalBs : subtotalUsd;
  const displayIva = isBs ? ivaBs : ivaUsd;
  const displayTotal = isBs ? totalBs : totalUsd;
  const symbol = isBs ? 'Bs.' : 'US$';
  const locale = isBs ? 'es-VE' : 'en-US';

  return (
    <div
      id={elementId}
      className="bg-white text-slate-900 font-sans p-8 md:p-12 max-w-[850px] mx-auto border border-slate-300 shadow-xl rounded-sm print:p-0 print:border-none print:shadow-none print:max-w-none"
      style={{ minHeight: '1100px' }}
    >
      {/* 1. Header Section */}
      <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-slate-900 mb-4 items-start">
        {/* Company Info */}
        <div className="col-span-7">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 text-cyan-400 flex items-center justify-center rounded-lg p-1.5 font-black text-xl tracking-tighter">
              <svg className="w-full h-full text-cyan-400" viewBox="0 0 40 40" fill="none">
                <path d="M20 6L32 13V27L20 34L8 27V13L20 6Z" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="20" r="4.5" fill="#38BDF8" />
                <path d="M20 6V15.5M32 13L24 17.5M32 27L24 22.5M20 34V24.5M8 27L16 22.5M8 13L16 17.5" stroke="#38BDF8" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase leading-tight font-sans">
                {config.nombreEmpresa}
              </h1>
              <p className="text-xs font-bold font-mono text-slate-700">RIF: {config.rifEmpresa}</p>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 leading-tight space-y-0.5">
            <p>{config.direccionEmpresa}</p>
            <p><span className="font-semibold text-slate-800">Telf:</span> {config.telefonoEmpresa} | <span className="font-semibold text-slate-800">Redes:</span> {config.contactoEmpresa}</p>
          </div>
        </div>

        {/* Document Header & Number Box */}
        <div className="col-span-5 text-right flex flex-col justify-between h-full">
          <div className="inline-block bg-slate-100 border border-slate-300 rounded px-2.5 py-1 text-[10px] font-bold text-slate-800 tracking-wider uppercase mb-2 self-end">
            VALIDO SOLO POR {presupuesto.validoDias} DIAS
          </div>

          <div className="bg-slate-900 text-white rounded-lg p-2.5 text-center shadow-sm">
            <div className="text-[9px] uppercase tracking-widest text-cyan-300 font-bold">DOCUMENTO</div>
            <div className="text-xs font-black tracking-wide text-white">PRESUPUESTO DE GESTION</div>
            <div className="mt-1 pt-1 border-t border-slate-700 flex items-center justify-between px-2">
              <span className="text-[10px] text-slate-300 font-semibold">NUMERO:</span>
              <span className="text-xs font-mono font-bold text-yellow-300">{presupuesto.numeroPresupuesto}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700 mt-2 px-1">
            <span>FECHA: <strong className="text-slate-950">{presupuesto.fecha}</strong></span>
            <span className="inline-flex items-center gap-1">
              TIPO: <strong className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${isBs ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-blue-100 text-blue-900 border border-blue-300'}`}>{isBs ? 'Bs.' : 'US$'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Customer & Branch Data Boxes */}
      <div className="space-y-2 mb-4 text-[11px]">
        {/* Customer Box */}
        <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50/70">
          <div className="grid grid-cols-12 gap-x-3 gap-y-1">
            <div className="col-span-12 sm:col-span-6">
              <span className="font-bold text-slate-700">Razón Social: </span>
              <span className="font-bold text-slate-950 uppercase">{presupuesto.clienteNombre || 'N/A'}</span>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <span className="font-bold text-slate-700">RIF: </span>
              <span className="font-mono text-slate-900">{presupuesto.clienteRif || 'N/A'}</span>
              {presupuesto.clienteCodigo && (
                <span className="text-[10px] text-slate-500 font-mono ml-1.5">({presupuesto.clienteCodigo})</span>
              )}
            </div>
            <div className="col-span-6 sm:col-span-3">
              <span className="font-bold text-slate-700">Contacto: </span>
              <span className="text-slate-900 uppercase">{presupuesto.clienteContacto || 'N/A'}</span>
            </div>

            <div className="col-span-12">
              <span className="font-bold text-slate-700">Dirección: </span>
              <span className="text-slate-800 uppercase">{presupuesto.clienteDireccion || 'N/A'}</span>
            </div>

            <div className="col-span-12 sm:col-span-4">
              <span className="font-bold text-slate-700">Ciudad / Estado: </span>
              <span className="text-slate-800 uppercase">{presupuesto.clienteCiudad || 'N/A'}</span>
            </div>
            <div className="col-span-12 sm:col-span-4">
              <span className="font-bold text-slate-700">Teléfono: </span>
              <span className="text-slate-800">{presupuesto.clienteTelefono || 'N/A'}</span>
            </div>
            <div className="col-span-12 sm:col-span-4">
              <span className="font-bold text-slate-700">Correo: </span>
              <span className="text-blue-700 font-mono lowercase">{presupuesto.clienteCorreo || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Branch Box (if selected) */}
        {presupuesto.sucursalNombre && (
          <div className="border border-slate-300 rounded-md p-2 bg-blue-50/40">
            <div className="grid grid-cols-12 gap-x-3 gap-y-0.5 text-[10.5px]">
              <div className="col-span-12 sm:col-span-5">
                <span className="font-bold text-slate-700">Sucursal: </span>
                <span className="font-semibold text-slate-950 uppercase">{presupuesto.sucursalNombre}</span>
              </div>
              <div className="col-span-6 sm:col-span-4">
                <span className="font-bold text-slate-700">RIF / IDEM: </span>
                <span className="font-mono text-slate-900">{presupuesto.sucursalRif || presupuesto.clienteRif}</span>
                {presupuesto.sucursalCodigo && (
                  <span className="font-mono font-bold text-blue-800 ml-1.5">[{presupuesto.sucursalCodigo}]</span>
                )}
              </div>
              <div className="col-span-6 sm:col-span-3">
                <span className="font-bold text-slate-700">Contacto: </span>
                <span className="text-slate-900 uppercase">{presupuesto.sucursalContacto || presupuesto.clienteContacto}</span>
              </div>

              <div className="col-span-12">
                <span className="font-bold text-slate-700">Dirección: </span>
                <span className="text-slate-800 uppercase">{presupuesto.sucursalDireccion || presupuesto.clienteDireccion}</span>
              </div>

              <div className="col-span-12 sm:col-span-4">
                <span className="font-bold text-slate-700">Ciudad: </span>
                <span className="text-slate-800 uppercase">{presupuesto.sucursalCiudad || 'N/A'}</span>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <span className="font-bold text-slate-700">Telf: </span>
                <span className="text-slate-800">{presupuesto.sucursalTelefono || 'N/A'}</span>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <span className="font-bold text-slate-700">Correo: </span>
                <span className="text-blue-700 font-mono lowercase">{presupuesto.sucursalCorreo || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Items Table (Official Format) */}
      <div className="border border-slate-900 rounded-sm overflow-hidden mb-4">
        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-center">
              <th className="py-2 px-1.5 w-8 border-r border-slate-700">IT</th>
              <th className="py-2 px-2 text-left min-w-[140px] border-r border-slate-700">ITEM / PRODUCTO</th>
              <th className="py-2 px-2 text-left min-w-[140px] border-r border-slate-700">ITEM / MARCA - MODELO</th>
              <th className="py-2 px-2 text-left min-w-[160px] border-r border-slate-700">DESCRIPCION</th>
              <th className="py-2 px-1.5 w-12 text-center border-r border-slate-700">CANT.</th>
              <th className="py-2 px-2 text-right w-24 border-r border-slate-700">PRECIO UNIT.</th>
              <th className="py-2 px-2 text-right w-28">PRECIO TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {rows.map((item, idx) => {
              const rawUnit = item.precioUnitario || 0;
              const unitPrice = isBs && tasa > 0 ? (rawUnit * tasa) : rawUnit;
              const itemTotal = (item.cantidad || 0) * unitPrice;
              const marcaModelo = [item.marca, item.modelo].filter(Boolean).join(' ');

              return (
                <tr key={`doc-row-${item.id || 'it'}-${idx}`} className="hover:bg-slate-50">
                  <td className="py-1.5 px-1.5 text-center font-mono font-bold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="py-1.5 px-2 font-bold text-slate-900 uppercase border-r border-slate-200">
                    {item.producto}
                  </td>
                  <td className="py-1.5 px-2 text-slate-800 uppercase border-r border-slate-200">
                    {marcaModelo || 'N/A'}
                  </td>
                  <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">
                    {item.descripcion || '-'}
                  </td>
                  <td className="py-1.5 px-1.5 text-center font-bold text-slate-900 border-r border-slate-200">
                    {item.cantidad}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-900 border-r border-slate-200">
                    {unitPrice.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950 bg-slate-50/30">
                    {symbol} {itemTotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}

            {/* Fill empty lines for authentic paper quotation feel */}
            {Array.from({ length: emptyRowsNeeded }).map((_, idx) => (
              <tr key={`empty-${idx}`} className="h-6">
                <td className="py-1 px-1.5 text-center font-mono text-slate-300 border-r border-slate-200 bg-slate-50/30">
                  {String(rows.length + idx + 1).padStart(2, '0')}
                </td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Payment Info, Banking & Totals Grid */}
      <div className="grid grid-cols-12 gap-4 mb-4 items-start">
        {/* Banking Accounts Notice */}
        <div className="col-span-7 bg-slate-50 border border-slate-300 rounded-md p-3 text-[10px] text-slate-800">
          <p className="font-bold text-slate-900 mb-1">Cuentas Bancarias para Procesar Pago:</p>
          <div className="whitespace-pre-line leading-relaxed font-mono text-[9.5px] text-slate-700">
            {config.cuentasBancarias}
          </div>
          {tasa > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10.5px]">
              <span className="font-bold text-blue-900">Tasa de Cambio Aplicada:</span>
              <span className="font-mono font-bold text-blue-900">Bs.S {tasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
            </div>
          )}
        </div>

        {/* Totals Table */}
        <div className="col-span-5">
          <div className="border border-slate-900 rounded-md overflow-hidden text-xs">
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-100 border-b border-slate-300">
              <span className="font-bold text-slate-700">SUB TOTAL</span>
              <span className="font-mono font-bold text-slate-900">
                {symbol} {displaySubtotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 px-3 bg-white border-b border-slate-300">
              <span className="font-semibold text-slate-700">
                IVA {presupuesto.aplicarIva ? `(${presupuesto.porcentajeIva || 16}%)` : '(0%)'}
              </span>
              <span className="font-mono font-bold text-slate-900">
                {symbol} {displayIva.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 px-3 bg-slate-900 text-white font-bold">
              <span className="text-cyan-300 tracking-wider">TOTAL GENERAL</span>
              <span className="font-mono text-sm font-black text-yellow-300">
                {symbol} {displayTotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* In US$ mode, show reference total in Bs.S. In Bs.S mode, show reference total in US$ */}
            {!isBs && tasa > 0 && (
              <div className="flex justify-between items-center py-1.5 px-3 bg-blue-950 text-cyan-200 text-[11px] font-bold border-t border-slate-800">
                <span>TOTAL EN BS.S:</span>
                <span className="font-mono font-black text-white">
                  Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {isBs && (
              <div className="flex justify-between items-center py-1.5 px-3 bg-blue-950 text-cyan-200 text-[11px] font-bold border-t border-slate-800">
                <span>TOTAL EN US$:</span>
                <span className="font-mono font-black text-white">
                  US$ {totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Conditions & Legal Footnote */}
      <div className="border-t border-slate-300 pt-3 text-[9.5px] text-slate-600 space-y-1">
        <p className="font-bold text-slate-800 uppercase tracking-wide">Condiciones de la oferta:</p>
        <div className="whitespace-pre-line leading-relaxed text-slate-700">
          {config.condicionesGenerales}
        </div>

        {/* Verification Signatures & Stamp */}
        <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[10px]">
          <div className="border-t border-slate-400 pt-1">
            <p className="font-bold text-slate-900">POR SILOCOM, C.A.</p>
            <p className="text-slate-500">Firma y Sello Autorizado</p>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <p className="font-bold text-slate-900">CONFORMIDAD DEL CLIENTE</p>
            <p className="text-slate-500">Nombre, Firma y Sello Receptor</p>
          </div>
        </div>
      </div>
    </div>
  );
};
