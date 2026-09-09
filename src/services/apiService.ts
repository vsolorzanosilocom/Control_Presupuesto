import { AppConfig, Cliente, Sucursal, ProductoItem, PresupuestoData, FacturaCobroData } from '../types';
import { DEFAULT_CONFIG, INITIAL_CLIENTES, INITIAL_SUCURSALES, INITIAL_PRODUCTOS } from '../data/defaultCatalog';

// In-memory runtime cache to share state during the active session without isolating data in browser localStorage
let runtimeClientes: Cliente[] = [...INITIAL_CLIENTES];
let runtimeSucursales: Sucursal[] = [...INITIAL_SUCURSALES];
let runtimeProductos: ProductoItem[] = [...INITIAL_PRODUCTOS];
let runtimeHistory: PresupuestoData[] = [];
let runtimeFacturasCobro: FacturaCobroData[] = [];

const CONFIG_STORAGE_KEY = 'silocom_app_config_v2';
const OLD_OUTDATED_URL_SNIPPET = 'AKfycbzBILy7K6A';

// Permanent App Configuration (stored in localStorage with fallback to DEFAULT_CONFIG)
export function getAppConfig(): AppConfig {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate: if the stored URL is the old/outdated one, replace it with the new active DEFAULT_CONFIG.scriptUrl
      if (!parsed.scriptUrl || parsed.scriptUrl.includes(OLD_OUTDATED_URL_SNIPPET)) {
        parsed.scriptUrl = DEFAULT_CONFIG.scriptUrl;
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ ...DEFAULT_CONFIG, ...parsed }));
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Error reading config from localStorage:', e);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Ensures any client syncs with the central server config on startup
 */
export async function fetchServerConfig(): Promise<{ scriptUrl?: string; spreadsheetId?: string } | null> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data && data.scriptUrl) {
        // Ensure runtime DEFAULT_CONFIG is updated
        DEFAULT_CONFIG.scriptUrl = data.scriptUrl;
        if (data.spreadsheetId) {
          DEFAULT_CONFIG.spreadsheetId = data.spreadsheetId;
        }
        return data;
      }
    }
  } catch (e) {
    console.warn('Could not fetch server config:', e);
  }
  return null;
}

export function saveAppConfig(config: AppConfig): void {
  // Update in memory
  Object.assign(DEFAULT_CONFIG, config);
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving config to localStorage:', e);
  }
}

export function getStoredClientes(): Cliente[] {
  return runtimeClientes;
}

export function saveStoredClientes(clientes: Cliente[]): void {
  runtimeClientes = clientes;
}

export function getStoredSucursales(): Sucursal[] {
  return runtimeSucursales;
}

export function saveStoredSucursales(sucursales: Sucursal[]): void {
  runtimeSucursales = sucursales;
}

export function getStoredProductos(): ProductoItem[] {
  return runtimeProductos;
}

export function saveStoredProductos(productos: ProductoItem[]): void {
  runtimeProductos = productos;
}

export function getStoredFacturasCobro(): FacturaCobroData[] {
  return runtimeFacturasCobro;
}

export function saveStoredFacturasCobro(facturas: FacturaCobroData[]): void {
  runtimeFacturasCobro = facturas;
}

export function saveFacturaCobroToMemory(factura: FacturaCobroData): FacturaCobroData[] {
  const existingIdx = runtimeFacturasCobro.findIndex(
    f => (f.numeroPresupuesto && f.numeroPresupuesto === factura.numeroPresupuesto) ||
         (f.numeroFactura && f.numeroFactura === factura.numeroFactura && factura.numeroFactura !== '')
  );

  if (existingIdx >= 0) {
    runtimeFacturasCobro[existingIdx] = { ...runtimeFacturasCobro[existingIdx], ...factura };
  } else {
    runtimeFacturasCobro.unshift(factura);
  }
  return [...runtimeFacturasCobro];
}

export function getStoredPresupuestos(): PresupuestoData[] {
  return runtimeHistory;
}

export function savePresupuestoToHistory(presupuesto: PresupuestoData): PresupuestoData[] {
  const existingIdx = runtimeHistory.findIndex(
    p => p.id === presupuesto.id || (p.numeroPresupuesto === presupuesto.numeroPresupuesto && presupuesto.numeroPresupuesto !== '')
  );
  
  const newItem: PresupuestoData = {
    ...presupuesto,
    id: presupuesto.id || `cp-${Date.now()}`,
    creadoEn: presupuesto.creadoEn || new Date().toISOString()
  };

  if (existingIdx >= 0) {
    runtimeHistory[existingIdx] = newItem;
  } else {
    runtimeHistory.unshift(newItem);
  }
  return [...runtimeHistory];
}

export function deletePresupuestoFromHistory(id: string): PresupuestoData[] {
  runtimeHistory = runtimeHistory.filter(p => p.id !== id);
  return [...runtimeHistory];
}

/**
 * Fetch helper with automatic fallback between backend proxy and direct client call
 */
async function callSheetsGet(action: string, scriptUrl: string): Promise<any> {
  // 1. Try server-side proxy
  try {
    const proxyUrl = `/api/sheets/get?action=${encodeURIComponent(action)}&scriptUrl=${encodeURIComponent(scriptUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`Proxy GET /api/sheets/get failed for action ${action}, trying direct fetch:`, err);
  }

  // 2. Direct client fetch fallback
  const directUrl = `${scriptUrl}?action=${encodeURIComponent(action)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40000);
  try {
    const res = await fetch(directUrl, { signal: controller.signal });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn(`Direct fetch to Google Apps Script failed for action ${action}:`, e);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Helper to compute the next sequential correlativo (increments the numeric suffix by 1)
 * Example: 'CP-202608010' -> 'CP-202608011'
 */
export function incrementCorrelativo(lastCode: string): string {
  if (!lastCode || typeof lastCode !== 'string' || !lastCode.trim()) {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    return `CP-${yearMonth}001`;
  }

  const trimmed = lastCode.trim();

  // Match prefix and number at the end, e.g. "CP-202608010" -> "CP-" and "202608010"
  const match = trimmed.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const numLen = numStr.length;
    try {
      const nextNum = (BigInt(numStr) + 1n).toString();
      const padded = nextNum.padStart(numLen, '0');
      return `${prefix}${padded}`;
    } catch {
      const nextNum = (parseInt(numStr, 10) + 1).toString();
      const padded = nextNum.padStart(numLen, '0');
      return `${prefix}${padded}`;
    }
  }

  // Fallback if no clean trailing digits found
  const digits = trimmed.replace(/\D/g, '');
  if (digits) {
    const nextVal = (parseInt(digits, 10) + 1).toString();
    return `CP-${nextVal}`;
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `CP-${yearMonth}001`;
}

/**
 * Fetch last budget number directly from Sheet PRESUPUESTOS (Column Y)
 */
export async function fetchLastPresupuestoNumber(scriptUrl: string): Promise<{ success: boolean; nextCode: string; lastCode?: string; lastNumber?: number; error?: string }> {
  try {
    const data = await callSheetsGet('getLastPresupuesto', scriptUrl);
    if (data && data.success && data.nextCode) {
      return {
        success: true,
        nextCode: data.nextCode,
        lastCode: data.lastCode,
        lastNumber: data.lastNumber || 0
      };
    }
  } catch (e) {
    console.warn('Could not fetch last budget from Sheets, calculating from memory:', e);
  }

  // Fallback: calculate by finding the latest budget in memory history
  if (runtimeHistory && runtimeHistory.length > 0) {
    const lastBudget = runtimeHistory[0]; // history is sorted descending or latest first
    if (lastBudget && lastBudget.numeroPresupuesto) {
      const computed = incrementCorrelativo(lastBudget.numeroPresupuesto);
      return { success: true, nextCode: computed, lastCode: lastBudget.numeroPresupuesto };
    }
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const nextCode = `CP-${yearMonth}001`;
  return { success: true, nextCode };
}

/**
 * Sync complete catalog (BD) and complete history (PRESUPUESTOS) live from Google Sheets
 */
export async function syncCatalogFromGoogleSheets(scriptUrl: string): Promise<{
  success: boolean;
  clientes?: Cliente[];
  sucursales?: Sucursal[];
  productos?: ProductoItem[];
  presupuestos?: PresupuestoData[];
  facturas?: FacturaCobroData[];
  message?: string;
}> {
  try {
    // 1. Fetch BD catalog
    const bdData = await callSheetsGet('getBDCompleta', scriptUrl);

    let updatedClientes: Cliente[] = runtimeClientes;
    let updatedSucursales: Sucursal[] = runtimeSucursales;
    let updatedProductos: ProductoItem[] = runtimeProductos;

    if (bdData && bdData.success) {
      if (Array.isArray(bdData.clientes) && bdData.clientes.length > 0) {
        updatedClientes = bdData.clientes.map((c, idx) => ({
          ...c,
          id: c.id ? `${c.id}-${idx}` : `cli-${idx}`
        }));
        runtimeClientes = updatedClientes;
      }
      if (Array.isArray(bdData.sucursales) && bdData.sucursales.length > 0) {
        updatedSucursales = bdData.sucursales.map((s, idx) => ({
          ...s,
          id: s.id ? `${s.id}-${idx}` : `suc-${idx}`
        }));
        runtimeSucursales = updatedSucursales;
      }
      if (Array.isArray(bdData.productos) && bdData.productos.length > 0) {
        updatedProductos = bdData.productos.map((p, idx) => ({
          ...p,
          id: p.id ? `${p.id}-${idx}` : `prod-${idx}`
        }));
        runtimeProductos = updatedProductos;
      }
    }

    // 2. Fetch History of budgets from sheet PRESUPUESTOS
    let updatedPresupuestos: PresupuestoData[] = runtimeHistory;
    try {
      const histData = await callSheetsGet('getPresupuestosHistory', scriptUrl);
      if (histData && histData.success && Array.isArray(histData.presupuestos)) {
        updatedPresupuestos = histData.presupuestos.map((p, idx) => ({
          ...p,
          id: p.id ? `${p.id}-${idx}` : `cp-${p.numeroPresupuesto || 'item'}-${idx}`
        }));
        runtimeHistory = updatedPresupuestos;
      }
    } catch (histErr) {
      console.warn('History fetch from Sheets warning:', histErr);
    }

    // 3. Fetch Invoices and Payment data from sheet FACTURAS
    let updatedFacturas: FacturaCobroData[] = runtimeFacturasCobro;
    try {
      const facData = await callSheetsGet('getFacturasCobro', scriptUrl);
      if (facData && facData.success && Array.isArray(facData.facturas)) {
        updatedFacturas = facData.facturas.map((f, idx) => ({
          ...f,
          id: f.id ? `${f.id}-${idx}` : `fac-${f.numeroFactura || f.numeroPresupuesto || 'item'}-${idx}`
        }));
        runtimeFacturasCobro = updatedFacturas;
      }
    } catch (facErr) {
      console.warn('Facturas fetch from Sheets warning:', facErr);
    }

    return {
      success: true,
      clientes: updatedClientes,
      sucursales: updatedSucursales,
      productos: updatedProductos,
      presupuestos: updatedPresupuestos,
      facturas: updatedFacturas,
      message: 'Catálogo, presupuestos y facturas sincronizados en vivo con Google Sheets'
    };
  } catch (error: any) {
    console.warn('Error during full Sheets sync:', error);
    return {
      success: false,
      clientes: runtimeClientes,
      sucursales: runtimeSucursales,
      productos: runtimeProductos,
      presupuestos: runtimeHistory,
      facturas: runtimeFacturasCobro,
      message: `Modo local activo. Conexión a Google Sheets: ${error?.message || 'Reintentando en segundo plano...'}`
    };
  }
}

/**
 * Send Presupuesto to Google Sheets (Hoja PRESUPUESTOS - 40 columnas respetando fórmulas)
 */
export async function sendPresupuestoToGoogleSheets(
  scriptUrl: string,
  presupuesto: PresupuestoData
): Promise<{ success: boolean; message: string; rowsInserted?: number }> {
  const payload = {
    action: 'guardarPresupuesto',
    numeroPresupuesto: presupuesto.numeroPresupuesto,
    fecha: presupuesto.fecha,
    validoDias: presupuesto.validoDias,
    cliente: presupuesto.clienteNombre,
    clienteRif: presupuesto.clienteRif || '',
    clienteDireccion: presupuesto.clienteDireccion || '',
    clienteContacto: presupuesto.clienteContacto || '',
    clienteTelefono: presupuesto.clienteTelefono || '',
    clienteCorreo: presupuesto.clienteCorreo || '',
    clienteCiudad: presupuesto.clienteCiudad || '',
    sucursal: presupuesto.sucursalNombre || '',
    sucursalDireccion: presupuesto.sucursalDireccion || '',
    sucursalContacto: presupuesto.sucursalContacto || '',
    sucursalTelefono: presupuesto.sucursalTelefono || '',
    sucursalCorreo: presupuesto.sucursalCorreo || '',
    sucursalCiudad: presupuesto.sucursalCiudad || '',
    tasaDia: presupuesto.tasaDia || 0,
    usarTasa: presupuesto.usarTasa,
    aplicarIva: presupuesto.aplicarIva,
    items: presupuesto.items.map(it => ({
      producto: it.producto,
      marca: it.marca,
      modelo: it.modelo,
      descripcion: it.descripcion,
      cantidad: it.cantidad,
      precio: it.precioUnitario
    }))
  };

  // 1. Try sending via backend proxy route
  try {
    const proxyRes = await fetch('/api/sheets/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptUrl, payload })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.success) {
        presupuesto.sincronizadoGoogleSheets = true;
        savePresupuestoToHistory(presupuesto);
        const filaInfo = data.startRow || data.filaInicio ? ` en la fila ${data.startRow || data.filaInicio}` : '';
        return {
          success: true,
          message: `Presupuesto ${presupuesto.numeroPresupuesto} guardado en Google Sheets${filaInfo} (${presupuesto.items.length} item(s) insertados).`,
          rowsInserted: presupuesto.items.length
        };
      }
    }
  } catch (err) {
    console.warn('Proxy POST /api/sheets/post failed, falling back to direct post:', err);
  }

  // 2. Fallback to direct POST
  try {
    const postData = new URLSearchParams();
    postData.append('data', JSON.stringify(payload));

    await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData,
      mode: 'no-cors'
    });

    presupuesto.sincronizadoGoogleSheets = true;
    savePresupuestoToHistory(presupuesto);

    return {
      success: true,
      message: `Presupuesto ${presupuesto.numeroPresupuesto} transmitido a Google Sheets con éxito.`,
      rowsInserted: presupuesto.items.length
    };
  } catch (err: any) {
    console.error('Error sending directly to Google Sheets:', err);
    savePresupuestoToHistory({ ...presupuesto, sincronizadoGoogleSheets: false });
    return {
      success: false,
      message: `Error al conectar con Google Sheets: ${err?.message || 'Error de red'}`
    };
  }
}

/**
 * Actualizar columnas de aprobación (AL: APROBADO, AM: # FACTURA, AN: FECHA DE FACTURA)
 */
export async function updatePresupuestoApproval(
  scriptUrl: string,
  data: {
    numeroPresupuesto: string;
    aprobado: string; // 'SI' o 'NO'
    numeroFactura?: string;
    fechaFactura?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const payload = {
    action: 'actualizarAprobacion',
    numeroPresupuesto: data.numeroPresupuesto,
    aprobado: data.aprobado,
    numeroFactura: data.numeroFactura || '',
    fechaFactura: data.fechaFactura || ''
  };

  try {
    const proxyRes = await fetch('/api/sheets/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptUrl, payload })
    });

    if (proxyRes.ok) {
      const resData = await proxyRes.json();
      if (resData.success) {
        // Update runtime in-memory item
        const existing = runtimeHistory.find(p => p.numeroPresupuesto === data.numeroPresupuesto);
        if (existing) {
          existing.aprobado = data.aprobado;
          existing.numeroFactura = data.numeroFactura || '';
          existing.fechaFactura = data.fechaFactura || '';
        }
        return {
          success: true,
          message: resData.message || `Presupuesto ${data.numeroPresupuesto} actualizado correctamente.`
        };
      } else {
        return {
          success: false,
          message: resData.error || 'Error reportado por Google Sheets'
        };
      }
    } else {
      const errText = await proxyRes.text();
      return {
        success: false,
        message: `Error en servidor proxy: ${errText}`
      };
    }
  } catch (err: any) {
    console.error('Error in updatePresupuestoApproval:', err);
    return {
      success: false,
      message: `Error de conexión: ${err?.message || 'No se pudo contactar a Google Sheets'}`
    };
  }
}

/**
 * Guardar cobranza en la hoja FACTURAS (Columnas L, M, N, Q, R, S)
 * L: REFERENCIA
 * M: FECHA DE PAGO
 * N: TASA BSS
 * Q: TIPO RETENCION
 * R: ISLR
 * S: IVA
 */
export async function updateFacturaCobro(
  scriptUrl: string,
  data: FacturaCobroData
): Promise<{ success: boolean; message: string }> {
  const payload = {
    action: 'guardarFacturaCobro',
    numeroFactura: data.numeroFactura || '',
    numeroPresupuesto: data.numeroPresupuesto || '',
    referencia: data.referencia || '',
    fechaPago: data.fechaPago || '',
    tasaBss: data.tasaBss || 0,
    tipoRetencion: data.tipoRetencion || '',
    islr: data.islr || 0,
    iva: data.iva || 0
  };

  try {
    const proxyRes = await fetch('/api/sheets/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptUrl, payload })
    });

    if (proxyRes.ok) {
      const resData = await proxyRes.json();
      if (resData.success) {
        saveFacturaCobroToMemory(data);
        return {
          success: true,
          message: resData.message || `Cobranza de factura ${data.numeroFactura || data.numeroPresupuesto} guardada correctamente.`
        };
      } else {
        return {
          success: false,
          message: resData.error || 'Error reportado por Google Sheets'
        };
      }
    } else {
      const errText = await proxyRes.text();
      return {
        success: false,
        message: `Error en servidor proxy: ${errText}`
      };
    }
  } catch (err: any) {
    console.error('Error in updateFacturaCobro:', err);
    // Guardar en memoria local como respaldo
    saveFacturaCobroToMemory(data);
    return {
      success: false,
      message: `Error de conexión con Google Sheets: ${err?.message || 'Reintentando'}`
    };
  }
}

