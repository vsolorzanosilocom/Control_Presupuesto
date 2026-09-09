export interface Cliente {
  id: string;
  nombre: string;
  rif: string;
  codigo?: string; // IDEM/CODIGO (Columna C de BD)
  direccion: string;
  contacto: string;
  telefono: string;
  correo: string;
  ciudad: string;
}

export interface Sucursal {
  id: string;
  clienteNombre: string;
  nombre: string;
  rif: string;
  codigo?: string; // IDEM/CODIGO (Columna C de BD)
  direccion: string;
  contacto: string;
  telefono: string;
  correo: string;
  ciudad: string;
}

export interface ProductoItem {
  id: string;
  producto: string;
  marca: string;
  modelo: string;
  descripcionSugerida?: string;
  precioSugerido?: number;
}

export interface PresupuestoItemRow {
  id: string;
  producto: string;
  marca: string;
  modelo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface PresupuestoData {
  id?: string;
  numeroPresupuesto: string;
  fecha: string;
  validoDias: number;
  tipoPresupuesto: 'US$' | 'Bs.S';
  
  // Cliente (Columna J - P)
  clienteNombre: string;
  clienteRif: string;
  clienteCodigo?: string; // IDEM/CODIGO del Cliente
  clienteDireccion: string;
  clienteContacto: string;
  clienteTelefono: string;
  clienteCorreo: string;
  clienteCiudad: string;

  // Sucursal (Columna Q - W)
  sucursalNombre: string;
  sucursalRif: string;
  sucursalCodigo?: string; // IDEM/CODIGO de la Sucursal (Columna C de BD)
  sucursalDireccion: string;
  sucursalContacto: string;
  sucursalTelefono: string;
  sucursalCorreo: string;
  sucursalCiudad: string;

  // Items (Columnas Z - AE)
  items: PresupuestoItemRow[];

  // Tasa y Moneda (Columna AF)
  usarTasa: boolean;
  tasaDia: number;

  // IVA y Totales
  aplicarIva: boolean;
  porcentajeIva: number;
  subtotalUsd: number;
  ivaUsd: number;
  totalUsd: number;
  subtotalBs: number;
  ivaBs: number;
  totalBs: number;

  // Metadata
  notas?: string;
  condiciones?: string;
  cuentasBancarias?: string;
  creadoEn?: string;
  sincronizadoGoogleSheets?: boolean;

  // Control de Aprobación y Facturación (Columnas AL, AM, AN)
  // AL: APROBADO ('SI' | 'NO' | '')
  // AM: # FACTURA
  // AN: FECHA DE FACTURA
  aprobado?: string;
  numeroFactura?: string;
  fechaFactura?: string;
}

export interface FacturaCobroData {
  id: string;
  numeroFactura: string;
  fechaFactura: string;
  numeroPresupuesto: string;
  clienteNombre: string;
  clienteRif?: string;
  sucursalNombre?: string;
  itemsCount?: number;
  itemsSummary?: string;
  totalUsd: number;
  totalBs: number;
  
  // Cobranza (Columnas L, M, N, Q, R, S)
  referencia: string;        // Col L: REFERENCIA
  fechaPago: string;         // Col M: FECHA DE PAGO
  tasaBss: number;           // Col N: TASA BSS
  tipoRetencion: 'IVA' | 'ISLR' | 'AMBOS' | 'SIN RETENCION' | ''; // Col Q: TIPO RETENCION
  islr: number;              // Col R: ISLR
  iva: number;               // Col S: IVA
  
  // Calculado: bssPercibidos (Total Bs - islr - iva)
  bssPercibidos?: number;
  notas?: string;
  actualizadoEn?: string;
}

export interface AppConfig {
  scriptUrl: string;
  spreadsheetId: string;
  nombreEmpresa: string;
  rifEmpresa: string;
  direccionEmpresa: string;
  telefonoEmpresa: string;
  contactoEmpresa: string;
  cuentasBancarias: string;
  condicionesGenerales: string;
  tasaDefecto: number;
  diasValidezDefecto: number;
  ivaPorDefecto: number;
}
