import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  ExternalLink, 
  RotateCcw, 
  CheckCircle2, 
  FileSpreadsheet, 
  Code2,
  Copy,
  Check,
  Building,
  CreditCard,
  Layers,
  HelpCircle,
  Activity,
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppConfig } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultCatalog';

interface SettingsModalProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
}

const CODIGO_GS_SOURCE = `/**
 * ==============================================================================
 * SILOCOM, C.A. - SISTEMA DE CONTROL Y EMISIÓN DE PRESUPUESTOS
 * ARCHIVO: CODIGO.GS (Google Apps Script)
 * SPREADSHEET ID: 1KBpl5KQH9R2LS2o6phmTCWAJwnWbVJrEqSikOMW5WNg
 * ==============================================================================
 * 
 * INSTRUCCIONES DE INSTALACIÓN / ACTUALIZACIÓN:
 * 1. Abra su Google Spreadsheet: https://docs.google.com/spreadsheets/d/1KBpl5KQH9R2LS2o6phmTCWAJwnWbVJrEqSikOMW5WNg/edit
 * 2. Vaya al menú superior: Extensiones > Apps Script.
 * 3. Reemplace TODO el contenido del archivo Código.gs con este código completo.
 * 4. Haga clic en el icono de Guardar (disco).
 * 5. Haga clic en "Implementar" (Deploy) > "Nueva implementación" (o Administrar implementaciones).
 * 6. Tipo: "Aplicación web", Ejecutar como: "Yo", Quién tiene acceso: "Cualquier persona".
 * ==============================================================================
 */

var SPREADSHEET_ID = '1KBpl5KQH9R2LS2o6phmTCWAJwnWbVJrEqSikOMW5WNg';
var HOJA_PRESUPUESTOS = 'PRESUPUESTOS';
var HOJA_BD = 'BD';
var HOJA_FACTURAS = 'FACTURAS';

/**
 * Obtiene la hoja de cálculo activa o por ID
 */
function getSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Función ultra-robusta para encontrar la primera fila disponible en PRESUPUESTOS.
 * Funciona con tablas nativas, filas limpias y filas con fórmulas.
 */
function getFirstAvailableRow(sheet) {
  if (!sheet) {
    var ss = getSpreadsheet();
    sheet = ss.getSheetByName(HOJA_PRESUPUESTOS);
  }
  
  if (!sheet) return 2;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 2;

  // 1. Verificamos si la última fila detectada por Sheets contiene Fecha (Col F) o Cliente (Col J)
  try {
    var lastRowCheck = sheet.getRange(lastRow, 6, 1, 5).getValues()[0];
    var lastFecha = (lastRowCheck[0] || '').toString().trim(); // Col F (índice 0)
    var lastCli = (lastRowCheck[4] || '').toString().trim();   // Col J (índice 4)
    
    // Si la última fila tiene datos reales, la siguiente fila libre es lastRow + 1
    if (lastFecha || lastCli) {
      return lastRow + 1;
    }
  } catch (e) {
    Logger.log('Error verificando lastRow: ' + e);
  }

  // 2. Si la última fila no tiene fecha/cliente (ej: fórmulas pre-arrastradas), escaneamos de arriba hacia abajo
  var maxRows = Math.min(sheet.getMaxRows(), 3000);
  if (maxRows > 1) {
    var checkRange = sheet.getRange(2, 6, maxRows - 1, 5).getValues();
    for (var r = 0; r < checkRange.length; r++) {
      var fVal = (checkRange[r][0] || '').toString().trim();
      var cVal = (checkRange[r][4] || '').toString().trim();
      if (!fVal && !cVal) {
        return r + 2; // +2 porque el rango empieza en fila 2
      }
    }
  }

  // 3. Si no hay celdas vacías en el rango actual, agregamos filas
  sheet.insertRowsAfter(lastRow, 20);
  return lastRow + 1;
}

/**
 * FUNCIÓN DE PRUEBA DIRECTA DENTRO DEL EDITOR DE APPS SCRIPT
 * Puedes seleccionar 'testConexion()' en la barra superior y presionar 'Ejecutar'
 * para verificar que todo conecta sin errores y ver qué fila detecta.
 */
function testConexion() {
  var ss = getSpreadsheet();
  var sheetPres = ss.getSheetByName(HOJA_PRESUPUESTOS);
  var sheetBD = ss.getSheetByName(HOJA_BD);

  Logger.log('Conexión con Spreadsheet exitosa: ' + ss.getName());
  Logger.log('Hoja PRESUPUESTOS encontrada: ' + (sheetPres ? 'SI (Última fila con datos: ' + sheetPres.getLastRow() + ')' : 'NO'));
  Logger.log('Hoja BD encontrada: ' + (sheetBD ? 'SI (Filas: ' + sheetBD.getLastRow() + ')' : 'NO'));
  
  if (sheetPres) {
    var siguienteFila = getFirstAvailableRow(sheetPres);
    Logger.log('>>> La siguiente fila libre donde se guardará el nuevo presupuesto es: FILA ' + siguienteFila + ' <<<');
  }
  
  return 'Prueba completada exitosamente';
}

function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action || 'getBDCompleta';
    var ss = getSpreadsheet();

    // 1. Obtener catálogo completo de la hoja BD
    if (action === 'getBDCompleta') {
      var sheetBD = ss.getSheetByName(HOJA_BD);
      if (!sheetBD) return createJsonResponse({ success: false, error: 'Hoja BD no encontrada' });
      var lastRow = sheetBD.getLastRow();
      if (lastRow < 2) return createJsonResponse({ success: true, clientes: [], sucursales: [], productos: [] });

      var lastCol = Math.max(sheetBD.getLastColumn(), 15);
      var headers = sheetBD.getRange(1, 1, 1, lastCol).getValues()[0];

      function findCol(keyword, fallbackIdx) {
        for (var h = 0; h < headers.length; h++) {
          var hText = (headers[h] || '').toString().toUpperCase().trim();
          if (hText.indexOf(keyword.toUpperCase()) !== -1) return h;
        }
        return fallbackIdx;
      }

      var idxCli = findCol('COMERCIO', 0);
      var idxRif = findCol('CEDULA', 1);
      var idxCod = findCol('IDEM', 2);
      if (idxCod === 2 && (headers[2] || '').toString().toUpperCase().indexOf('CODIGO') !== -1) idxCod = 2;
      var idxDir = findCol('DIRECCION', 3);
      var idxCon = findCol('CONTACTO', 4);
      var idxTel = findCol('TELEFONO', 5);
      var idxCor = findCol('CORREO', 6);
      var idxCiu = findCol('CIUDAD', 7);
      var idxEst = findCol('ESTADO', 8);
      var idxPro = findCol('PRODUCTO', 10);
      var idxMar = findCol('MARCA', 11);
      var idxMod = findCol('MODELO', 12);

      var data = sheetBD.getRange(2, 1, lastRow - 1, lastCol).getValues();
      var clientesMap = {};
      var sucursalesList = [];
      var productosMap = {};

      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        
        var nombreCli = (row[idxCli] || '').toString().trim();
        var rifVal = (row[idxRif] || '').toString().trim();
        var codigoVal = (row[idxCod] || '').toString().trim();
        var dirVal = (row[idxDir] || '').toString().trim();
        var conVal = (row[idxCon] || '').toString().trim();
        var telVal = (row[idxTel] || '').toString().trim();
        var corVal = (row[idxCor] || '').toString().trim();
        var ciudad = (row[idxCiu] || '').toString().trim();
        var estado = (row[idxEst] || '').toString().trim();
        var ciudadEstado = ciudad && estado ? ciudad + ' ' + estado : (ciudad || estado || '');

        if (nombreCli && !clientesMap[nombreCli]) {
          clientesMap[nombreCli] = {
            id: 'cli-' + (i + 1),
            nombre: nombreCli,
            rif: rifVal,
            codigo: codigoVal,
            direccion: dirVal,
            contacto: conVal,
            telefono: telVal,
            correo: corVal,
            ciudad: ciudadEstado
          };
        }

        if (nombreCli) {
          sucursalesList.push({
            id: 'suc-' + (i + 1),
            clienteNombre: nombreCli,
            nombre: nombreCli,
            rif: rifVal,
            codigo: codigoVal,
            direccion: dirVal,
            contacto: conVal,
            telefono: telVal,
            correo: corVal,
            ciudad: ciudadEstado
          });
        }

        var prodNom = (row[idxPro] || '').toString().trim();
        var marca = (row[idxMar] || '').toString().trim();
        var modelo = (row[idxMod] || '').toString().trim();

        if (prodNom) {
          var key = prodNom + '|' + marca + '|' + modelo;
          if (!productosMap[key]) {
            productosMap[key] = {
              id: 'prod-' + (i + 1),
              producto: prodNom,
              marca: marca || 'N/A',
              modelo: modelo || '',
              descripcionSugerida: prodNom + (marca && marca !== 'N/A' ? ' ' + marca : '') + (modelo ? ' ' + modelo : ''),
              precioSugerido: 0
            };
          }
        }
      }

      return createJsonResponse({
        success: true,
        clientes: Object.keys(clientesMap).map(function(k) { return clientesMap[k]; }),
        sucursales: sucursalesList,
        productos: Object.keys(productosMap).map(function(k) { return productosMap[k]; })
      });
    }

    // 2. Obtener correlativo secuencial de presupuestos (Columna Y - Solo Lectura)
    if (action === 'getLastPresupuesto') {
      var sheetPresupuestos = ss.getSheetByName(HOJA_PRESUPUESTOS);
      if (!sheetPresupuestos || sheetPresupuestos.getLastRow() < 2) {
        var now = new Date();
        var ym = Utilities.formatDate(now, 'America/Caracas', 'yyyyMM');
        return createJsonResponse({ success: true, lastNumber: 0, lastCode: '', nextCode: 'CP-' + ym + '001' });
      }
      var maxScanY = Math.min(sheetPresupuestos.getLastRow(), 2000);
      var values = sheetPresupuestos.getRange(2, 25, maxScanY - 1, 1).getValues();
      var lastRawCode = '';
      for (var i = values.length - 1; i >= 0; i--) {
        var val = (values[i][0] || '').toString().trim();
        if (val) {
          lastRawCode = val;
          break;
        }
      }
      var nextCode = '';
      if (lastRawCode) {
        var match = lastRawCode.match(/^(.*?)(\\d+)$/);
        if (match) {
          var prefix = match[1];
          var numStr = match[2];
          var nextNum = (parseInt(numStr, 10) + 1).toString();
          while (nextNum.length < numStr.length) {
            nextNum = '0' + nextNum;
          }
          nextCode = prefix + nextNum;
        } else {
          var digits = lastRawCode.replace(/\\D/g, '');
          if (digits) {
            var n = parseInt(digits, 10) + 1;
            nextCode = 'CP-' + n;
          }
        }
      }
      if (!nextCode) {
        var now = new Date();
        var ym = Utilities.formatDate(now, 'America/Caracas', 'yyyyMM');
        nextCode = 'CP-' + ym + '001';
      }
      return createJsonResponse({
        success: true,
        lastCode: lastRawCode,
        nextCode: nextCode
      });
    }

    // 3. Historial de presupuestos desde la hoja PRESUPUESTOS
    if (action === 'getPresupuestosHistory') {
      var sheetPres = ss.getSheetByName(HOJA_PRESUPUESTOS);
      if (!sheetPres || sheetPres.getLastRow() < 2) return createJsonResponse({ success: true, presupuestos: [] });

      var maxScanH = Math.min(sheetPres.getLastRow(), 3000);
      var rows = sheetPres.getRange(2, 1, maxScanH - 1, 41).getValues();
      var grupos = {};

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var num = (r[24] || '').toString().trim(); // Col Y
        var fechaRaw = r[5]; // Col F
        var cliNom = (r[9] || '').toString().trim(); // Col J

        if (!num && !cliNom) continue;
        if (!num) num = 'S/N-' + (i + 2);

        var fechaStr = fechaRaw instanceof Date ? Utilities.formatDate(fechaRaw, 'America/Caracas', 'yyyy-MM-dd') : (fechaRaw || '').toString();

        // Columnas AL (38), AM (39), AN (40)
        var aprobadoVal = (r[37] || '').toString().trim(); // Col AL
        var numFacturaVal = (r[38] || '').toString().trim(); // Col AM
        var fechaFacturaRaw = r[39]; // Col AN
        var fechaFacturaStr = fechaFacturaRaw instanceof Date ? Utilities.formatDate(fechaFacturaRaw, 'America/Caracas', 'yyyy-MM-dd') : (fechaFacturaRaw || '').toString();

        if (!grupos[num]) {
          grupos[num] = {
            id: 'cp-' + num,
            numeroPresupuesto: num,
            fecha: fechaStr,
            validoDias: parseInt(r[8], 10) || 30, // Col I
            clienteNombre: cliNom,
            clienteRif: (r[10] || '').toString().trim(),
            clienteDireccion: (r[11] || '').toString().trim(),
            clienteContacto: (r[12] || '').toString().trim(),
            clienteTelefono: (r[13] || '').toString().trim(),
            clienteCorreo: (r[14] || '').toString().trim(),
            clienteCiudad: (r[15] || '').toString().trim(),
            sucursalNombre: (r[16] || '').toString().trim(),
            sucursalDireccion: (r[18] || '').toString().trim(),
            sucursalContacto: (r[19] || '').toString().trim(),
            sucursalTelefono: (r[20] || '').toString().trim(),
            sucursalCorreo: (r[21] || '').toString().trim(),
            sucursalCiudad: (r[22] || '').toString().trim(),
            tasaDia: parseFloat(r[31]) || 0, // Col AF
            usarTasa: (parseFloat(r[31]) > 0),
            aplicarIva: true,
            moneda: 'USD',
            aprobado: aprobadoVal,
            numeroFactura: numFacturaVal,
            fechaFactura: fechaFacturaStr,
            items: [],
            sincronizadoGoogleSheets: true,
            creadoEn: fechaStr
          };
        }

        grupos[num].items.push({
          id: 'item-' + (i + 1),
          producto: (r[25] || '').toString().trim(), // Col Z
          marca: (r[26] || '').toString().trim(),     // Col AA
          modelo: (r[27] || '').toString().trim(),    // Col AB
          descripcion: (r[28] || '').toString().trim(), // Col AC
          cantidad: parseFloat(r[29]) || 1,          // Col AD
          precioUnitario: parseFloat(r[30]) || 0     // Col AE
        });
      }

      var list = Object.keys(grupos).map(function(k) { return grupos[k]; });
      list.reverse();
      return createJsonResponse({ success: true, presupuestos: list });
    }

    // 4. Datos de cobranza y facturas directamente desde la hoja FACTURAS
    if (action === 'getFacturasCobro') {
      var sheetFac = ss.getSheetByName(HOJA_FACTURAS);
      if (!sheetFac || sheetFac.getLastRow() < 2) return createJsonResponse({ success: true, facturas: [] });

      var maxScanF = Math.min(sheetFac.getLastRow(), 3000);
      var maxCols = Math.max(sheetFac.getLastColumn(), 22);
      var rowsFac = sheetFac.getRange(2, 1, maxScanF - 1, maxCols).getValues();
      var facturasList = [];

      for (var f = 0; f < rowsFac.length; f++) {
        var rFac = rowsFac[f];
        // Columnas según estructura de la hoja FACTURAS:
        // Col B (1): # FACTURA
        // Col C (2): FECHA DE FACTURA
        // Col D (3): No. DE PRESUPUESTO
        // Col E (4): COMERCIO/CLIENTE
        // Col G (6): SUCURSAL
        // Col J (9): TOTAL US$
        // Col L (11): REFERENCIA
        // Col M (12): FECHA DE PAGO
        // Col N (13): TASA BSS
        // Col P (15): TOTAL BSS
        // Col Q (16): TIPO RETENCION
        // Col R (17): ISLR
        // Col S (18): IVA
        var numFac = (rFac[1] || '').toString().trim(); // Col B
        var numPres = (rFac[3] || '').toString().trim(); // Col D
        if (!numFac && !numPres) continue;

        var fechaFacRaw = rFac[2]; // Col C
        var fechaFacStr = fechaFacRaw instanceof Date ? Utilities.formatDate(fechaFacRaw, 'America/Caracas', 'yyyy-MM-dd') : (fechaFacRaw || '').toString().trim();

        var fechaPagoRaw = rFac[12]; // Col M (13)
        var fechaPagoStr = fechaPagoRaw instanceof Date ? Utilities.formatDate(fechaPagoRaw, 'America/Caracas', 'yyyy-MM-dd') : (fechaPagoRaw || '').toString().trim();

        facturasList.push({
          id: 'fac-' + (numFac || numPres || f),
          numeroFactura: numFac,
          fechaFactura: fechaFacStr,
          numeroPresupuesto: numPres,
          clienteNombre: (rFac[4] || '').toString().trim(),   // Col E
          sucursalNombre: (rFac[6] || '').toString().trim(),  // Col G
          totalUsd: parseFloat(rFac[9]) || 0,                 // Col J
          totalBs: parseFloat(rFac[15]) || 0,                 // Col P
          referencia: (rFac[11] || '').toString().trim(),      // Col L (12)
          fechaPago: fechaPagoStr,                              // Col M (13)
          tasaBss: parseFloat(rFac[13]) || 0,                   // Col N (14)
          tipoRetencion: (rFac[16] || '').toString().trim(),   // Col Q (17)
          islr: parseFloat(rFac[17]) || 0,                      // Col R (18)
          iva: parseFloat(rFac[18]) || 0                        // Col S (19)
        });
      }

      return createJsonResponse({ success: true, facturas: facturasList });
    }

    return createJsonResponse({ success: true, message: 'API Silocom lista' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  try {
    var data = null;

    if (e && e.postData && e.postData.contents) {
      var raw = e.postData.contents;
      try {
        data = JSON.parse(raw);
      } catch (errJson) {
        if (typeof raw === 'string' && raw.indexOf('data=') === 0) {
          try {
            var decoded = decodeURIComponent(raw.substring(5).replace(/\\+/g, ' '));
            data = JSON.parse(decoded);
          } catch(errDec) {}
        }
      }
    }

    if (!data && e && e.parameter) {
      if (e.parameter.data) {
        try {
          data = JSON.parse(e.parameter.data);
        } catch (errP) {
          data = e.parameter.data;
        }
      } else {
        data = e.parameter;
      }
    }

    if (!data) {
      return createJsonResponse({ success: false, error: 'No se recibieron datos legibles en la petición' });
    }

    var action = data.action || 'guardarPresupuesto';

    if (action === 'guardarPresupuesto') {
      var ss = getSpreadsheet();
      var sheetPresupuestos = ss.getSheetByName(HOJA_PRESUPUESTOS) || ss.insertSheet(HOJA_PRESUPUESTOS);

      var items = data.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        items = [{
          producto: data.producto || '',
          marca: data.marca || '',
          modelo: data.modelo || '',
          descripcion: data.descripcion || '',
          cantidad: parseFloat(data.cantidad) || 1,
          precio: parseFloat(data.precio || data.precioUnitario) || 0
        }];
      }

      var fechaVal = data.fecha ? new Date(data.fecha) : new Date();
      var fechaFormateada = Utilities.formatDate(fechaVal, 'America/Caracas', 'dd/MM/yyyy');
      var validoDias = data.validoDias || 30;
      var tasaDia = data.usarTasa && data.tasaDia ? parseFloat(data.tasaDia) : '';

      var numRows = items.length;
      
      // Encontrar la primera fila disponible real
      var startRow = getFirstAvailableRow(sheetPresupuestos);

      var colFecha = [];
      var colValido = [];
      var colCliente = [];
      var colSucursal = [];
      var colsItems = [];
      var colTasa = [];
      var colCheckbox = [];

      var esTildada = (data.aplicarIva === true || data.aplicarIva === 'true' || data.casillaVerificacion === true);

      for (var i = 0; i < numRows; i++) {
        var it = items[i];

        colFecha.push([fechaFormateada]);
        colValido.push([validoDias]);
        colCliente.push([data.cliente || data.clienteNombre || '']);
        colSucursal.push([data.sucursal || data.sucursalNombre || '']);

        colsItems.push([
          it.producto || '',                               // Z: Producto (26)
          it.marca || '',                                  // AA: Marca (27)
          it.modelo || '',                                 // AB: Modelo (28)
          it.descripcion || '',                            // AC: Descripción (29)
          parseFloat(it.cantidad) || 1,                    // AD: Cantidad (30)
          parseFloat(it.precio || it.precioUnitario) || 0  // AE: Precio Unitario (31)
        ]);

        colTasa.push([tasaDia]);
        colCheckbox.push([esTildada]);
      }

      // 1. Col F (6): Fecha
      sheetPresupuestos.getRange(startRow, 6, numRows, 1).setValues(colFecha);
      
      // 2. Col I (9): Días de validez
      sheetPresupuestos.getRange(startRow, 9, numRows, 1).setValues(colValido);
      
      // 3. Col J (10): Únicamente Nombre de Cliente (K-P quedan libres para sus fórmulas)
      sheetPresupuestos.getRange(startRow, 10, numRows, 1).setValues(colCliente);
      
      // 4. Col Q (17): Únicamente Nombre de Sucursal si aplica (R-X quedan libres para sus fórmulas)
      if (data.sucursal || data.sucursalNombre) {
        sheetPresupuestos.getRange(startRow, 17, numRows, 1).setValues(colSucursal);
      }
      
      // 5. Cols Z a AE (26 a 31): Items
      sheetPresupuestos.getRange(startRow, 26, numRows, 6).setValues(colsItems);
      
      // 6. Col AF (32): Tasa del Día
      sheetPresupuestos.getRange(startRow, 32, numRows, 1).setValues(colTasa);

      // 7. Col AG (33): Casilla de verificación (Checkbox booleano)
      sheetPresupuestos.getRange(startRow, 33, numRows, 1).setValues(colCheckbox);

      SpreadsheetApp.flush();

      return createJsonResponse({
        success: true,
        message: 'Presupuesto registrado exitosamente en Google Sheets',
        filasInsertadas: numRows,
        filaInicio: startRow
      });
    }

    // ACCIÓN: actualizarAprobacion (Escribe en Columnas AL, AM, AN de PRESUPUESTOS)
    if (action === 'actualizarAprobacion') {
      var ss2 = getSpreadsheet();
      var sheetPres2 = ss2.getSheetByName(HOJA_PRESUPUESTOS);
      if (!sheetPres2) {
        return createJsonResponse({ success: false, error: 'Hoja PRESUPUESTOS no encontrada' });
      }

      var numeroPresupuesto = (data.numeroPresupuesto || '').toString().trim();
      var aprobado = (data.aprobado || '').toString().trim();
      var numeroFactura = (data.numeroFactura || '').toString().trim();
      var fechaFactura = (data.fechaFactura || '').toString().trim();

      if (!numeroPresupuesto) {
        return createJsonResponse({ success: false, error: 'Número de presupuesto requerido' });
      }

      var maxScan2 = Math.min(sheetPres2.getLastRow(), 3000);
      if (maxScan2 < 2) {
        return createJsonResponse({ success: false, error: 'No hay presupuestos en la hoja' });
      }

      var colYValues = sheetPres2.getRange(2, 25, maxScan2 - 1, 1).getValues();
      var filasModificadas = 0;

      for (var f = 0; f < colYValues.length; f++) {
        var numFila = (colYValues[f][0] || '').toString().trim();
        if (numFila === numeroPresupuesto) {
          var targetRow = f + 2;
          sheetPres2.getRange(targetRow, 38, 1, 3).setValues([[
            aprobado,
            numeroFactura,
            fechaFactura
          ]]);
          filasModificadas++;
        }
      }

      SpreadsheetApp.flush();

      if (filasModificadas > 0) {
        return createJsonResponse({
          success: true,
          message: 'Estado de aprobación actualizado con éxito (' + filasModificadas + ' filas modificadas)',
          numeroPresupuesto: numeroPresupuesto,
          filasModificadas: filasModificadas
        });
      } else {
        return createJsonResponse({
          success: false,
          error: 'No se encontró el presupuesto ' + numeroPresupuesto + ' en la columna Y'
        });
      }
    }

    // ACCIÓN: guardarFacturaCobro (Escribe SOLO en Columnas L, M, N, Q, R, S de la hoja FACTURAS)
    if (action === 'guardarFacturaCobro') {
      var ss3 = getSpreadsheet();
      var sheetFac3 = ss3.getSheetByName(HOJA_FACTURAS);
      if (!sheetFac3) {
        return createJsonResponse({ success: false, error: 'Hoja FACTURAS no encontrada' });
      }

      var numeroFactura = (data.numeroFactura || '').toString().trim();
      var numeroPresupuesto = (data.numeroPresupuesto || '').toString().trim();
      var referencia = (data.referencia || '').toString().trim();
      var fechaPago = (data.fechaPago || '').toString().trim();
      var tasaBss = parseFloat(data.tasaBss) || '';
      var tipoRetencion = (data.tipoRetencion || '').toString().trim();
      var islr = parseFloat(data.islr) || 0;
      var iva = parseFloat(data.iva) || 0;

      if (!numeroFactura && !numeroPresupuesto) {
        return createJsonResponse({ success: false, error: 'Se requiere Nº de Factura o Nº de Presupuesto' });
      }

      var maxScan3 = Math.min(sheetFac3.getLastRow(), 3000);
      if (maxScan3 < 2) {
        return createJsonResponse({ success: false, error: 'No hay filas en la hoja FACTURAS' });
      }

      // Escaneamos Col B (Nº Factura, col 2) y Col D (Nº Presupuesto, col 4)
      var colB_D = sheetFac3.getRange(2, 1, maxScan3 - 1, 5).getValues();
      var targetRow = -1;

      for (var f = 0; f < colB_D.length; f++) {
        var numFilaFac = (colB_D[f][1] || '').toString().trim(); // Col B (2)
        var numFilaPres = (colB_D[f][3] || '').toString().trim(); // Col D (4)

        if ((numeroFactura && numFilaFac === numeroFactura) || (numeroPresupuesto && numFilaPres === numeroPresupuesto)) {
          targetRow = f + 2;
          break;
        }
      }

      if (targetRow === -1) {
        return createJsonResponse({ 
          success: false, 
          error: 'No se encontró el registro para ' + (numeroFactura || numeroPresupuesto) + ' en la hoja FACTURAS' 
        });
      }

      // Escribir estrictamente SOLO en las columnas solicitadas:
      // Columnas L, M, N (Cols 12, 13, 14): REFERENCIA, FECHA DE PAGO, TASA BSS
      sheetFac3.getRange(targetRow, 12, 1, 3).setValues([[
        referencia,
        fechaPago,
        tasaBss
      ]]);

      // Columnas Q, R, S (Cols 17, 18, 19): TIPO RETENCION, ISLR, IVA
      sheetFac3.getRange(targetRow, 17, 1, 3).setValues([[
        tipoRetencion,
        islr,
        iva
      ]]);

      SpreadsheetApp.flush();

      return createJsonResponse({
        success: true,
        message: 'Cobranza de ' + (numeroFactura || numeroPresupuesto) + ' guardada exitosamente en hoja FACTURAS (Fila ' + targetRow + ')',
        filaModificada: targetRow
      });
    }

    return createJsonResponse({ success: false, error: 'Acción no reconocida en POST' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onSaveConfig
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'general' | 'codigoGs' | 'mapping'>('general');
  const [formData, setFormData] = useState<AppConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().toLowerCase() === 'silocomca') {
      setIsUnlocked(true);
      setPasscodeError(null);
    } else {
      setPasscodeError('Identificador o clave incorrecta. Ingrese el código de acceso autorizado.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODIGO_GS_SOURCE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing' });
    try {
      const res = await fetch(`/api/sheets/get?action=getBDCompleta&scriptUrl=${encodeURIComponent(formData.scriptUrl)}`);
      const data = await res.json();
      if (data && data.success) {
        setTestResult({
          status: 'success',
          message: `Conexión exitosa. Clientes: ${data.clientes?.length || 0}, Productos: ${data.productos?.length || 0}`
        });
      } else {
        setTestResult({
          status: 'error',
          message: data.error || 'Respuesta no válida del script'
        });
      }
    } catch (e: any) {
      setTestResult({
        status: 'error',
        message: `Fallo de conexión: ${e?.message || 'Error de red'}`
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToDefault = () => {
    setFormData(DEFAULT_CONFIG);
    onSaveConfig(DEFAULT_CONFIG);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // If user has not entered 'silocomca', show security gate
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-8 text-center">
          
          <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-200/60 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-slate-900 mb-2">
            Ajustes Protegidos
          </h2>
          
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Esta sección contiene la configuración sensible del sistema y Google Apps Script. Ingrese el código de acceso autorizado para continuar.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  id="input-auth-silocomca"
                  type="password"
                  autoFocus
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (passcodeError) setPasscodeError(null);
                  }}
                  placeholder="Escriba el código de acceso..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {passcodeError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2 text-left justify-center">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passcodeError}</span>
                </div>
              )}
            </div>

            <button
              id="btn-unlock-settings"
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Desbloquear Ajustes</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-5">
            SILOCOM, C.A. • Control de Acceso
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Configuración y Conexión con Google Sheets
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Desbloqueado
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Parámetros de Silocom, C.A., script Apps Script y protección de columnas formuladas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuración Guardada</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setIsUnlocked(false);
              setPasscode('');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Bloquear pestaña de ajustes"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'general'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4 text-blue-400" />
          <span>Parámetros Generales</span>
        </button>

        <button
          onClick={() => setActiveTab('codigoGs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'codigoGs'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span>Código Apps Script (CODIGO.GS)</span>
        </button>

        <button
          onClick={() => setActiveTab('mapping')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'mapping'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Mapeo de Columnas (40 Cols) y Fórmulas</span>
        </button>
      </div>

      {/* TAB 1: PARAMETROS GENERALES */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Google Sheets & Apps Script Setup */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                  1. Conexión con Google Sheets y Google Apps Script
                </h2>
              </div>
              <a
                href={`https://docs.google.com/spreadsheets/d/${formData.spreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-cyan-300 hover:underline font-semibold"
              >
                <span>Abrir Hoja de Cálculo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  URL del Despliegue de Google Apps Script (Web App)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={formData.scriptUrl}
                    onChange={e => setFormData({ ...formData, scriptUrl: e.target.value })}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testResult.status === 'testing'}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Activity className={`w-4 h-4 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                    <span>{testResult.status === 'testing' ? 'Probando...' : 'Probar Conexión'}</span>
                  </button>
                </div>
                {testResult.status === 'success' && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {testResult.message}
                  </p>
                )}
                {testResult.status === 'error' && (
                  <p className="text-xs text-red-600 font-semibold mt-1">
                    ⚠️ {testResult.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  ID del Archivo Google Sheets (SPREADSHEET_ID)
                </label>
                <input
                  type="text"
                  required
                  value={formData.spreadsheetId}
                  onChange={e => setFormData({ ...formData, spreadsheetId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Corporate Branding Data */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                  2. Datos Corporativos del Emisor (Silocom, C.A.)
                </h2>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Razón Social</label>
                <input
                  type="text"
                  value={formData.nombreEmpresa}
                  onChange={e => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">RIF Empresa</label>
                <input
                  type="text"
                  value={formData.rifEmpresa}
                  onChange={e => setFormData({ ...formData, rifEmpresa: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">Dirección Fiscal y Oficinas</label>
                <input
                  type="text"
                  value={formData.direccionEmpresa}
                  onChange={e => setFormData({ ...formData, direccionEmpresa: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Teléfonos de Contacto</label>
                <input
                  type="text"
                  value={formData.telefonoEmpresa}
                  onChange={e => setFormData({ ...formData, telefonoEmpresa: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Redes Sociales / Contacto Web</label>
                <input
                  type="text"
                  value={formData.contactoEmpresa}
                  onChange={e => setFormData({ ...formData, contactoEmpresa: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* 3. Banking Details & Terms */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-yellow-400" />
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                  3. Cuentas Bancarias y Condiciones de Pago
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Cuentas Bancarias de Destino para Pagos
                </label>
                <textarea
                  rows={3}
                  value={formData.cuentasBancarias}
                  onChange={e => setFormData({ ...formData, cuentasBancarias: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Condiciones de la Oferta / Garantías
                </label>
                <textarea
                  rows={4}
                  value={formData.condicionesGenerales}
                  onChange={e => setFormData({ ...formData, condicionesGenerales: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Restablecer Valores Iniciales</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: CODIGO.GS VIEWER & COPIER */}
      {activeTab === 'codigoGs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Código Completo para Google Apps Script (`CODIGO.GS`)
                </h3>
                <p className="text-xs text-slate-500">
                  Copie y pegue este código directamente en el editor de Apps Script vinculado a su Google Sheets.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? '¡Copiado al Portapapeles!' : 'Copiar Código Completo'}</span>
              </button>
            </div>

            {/* Step-by-step installation instructions */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-xs space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Instrucciones de Despliegue en 4 Pasos:</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                <li>Abra su Google Sheet en <a href={`https://docs.google.com/spreadsheets/d/${formData.spreadsheetId}/edit`} target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">este enlace</a>.</li>
                <li>Vaya al menú superior: <strong>Extensiones &gt; Apps Script</strong>.</li>
                <li>Pegue el código de abajo reemplazando todo el archivo <code>Código.gs</code>.</li>
                <li>Haga clic en <strong>Implementar &gt; Administrar implementaciones (o Nueva implementación)</strong> como <strong>Aplicación Web</strong> con acceso para <strong>"Cualquier usuario"</strong> (Anyone).</li>
              </ol>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 font-mono text-[11px] p-4 rounded-xl overflow-x-auto max-h-[500px] border border-slate-800 leading-relaxed">
                {CODIGO_GS_SOURCE}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COLUMN MAPPING & FORMULA INTEGRITY */}
      {activeTab === 'mapping' && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 border border-emerald-500/20 shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-emerald-300">
                  Arquitectura de Escritura Dirigida y No Destructiva
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para no alterar fórmulas ni borrar celdas en tu Google Sheets, el script <strong>CODIGO.GS</strong> utiliza <strong>escritura de celdas estrictamente dirigida</strong>.
                  Solo escribe en los campos primarios de entrada (<strong>F, I, J, Q, Z-AE, AF, AG</strong>). Todas las columnas formuladas en Sheets (<strong>K-P, R-X, Y, AH-AK</strong>) y las columnas no utilizadas (<strong>A-E, G-H, AL-AN</strong>) son 100% omitidas e ignoradas para que Google Sheets autocalcule sin colisiones ni sobreescrituras.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-[11px]">
                  <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-lg font-semibold border border-blue-500/30">
                    ✍️ Columnas Escritas: F, I, J, Q, Z a AE, AF, AG (Checkbox)
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg font-semibold border border-emerald-500/30">
                    🛡️ Fórmulas Protegidas: K-P, R-X, Y, AH a AK
                  </span>
                  <span className="px-2.5 py-1 bg-slate-700/50 text-slate-300 rounded-lg font-semibold border border-slate-600">
                    ⏭️ Columnas Omitidas: A-E, G, H, AL-AN
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Mapeo de Columnas y Protección de Fórmulas en Hoja `PRESUPUESTOS`
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              A continuación tienes el mapa exacto de las 40 columnas de la hoja <strong>PRESUPUESTOS</strong> para validar cada dato antes de guardar:
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Columna</th>
                    <th className="py-2.5 px-3">Índice</th>
                    <th className="py-2.5 px-3">Campo / Información</th>
                    <th className="py-2.5 px-3">Origen en la App</th>
                    <th className="py-2.5 px-3">Estado de Escritura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-600">A a E</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">1 a 5</td>
                    <td className="py-2.5 px-3 text-slate-600">Columnas iniciales / reservadas</td>
                    <td className="py-2.5 px-3 text-slate-400">Sin datos en la app</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold rounded text-[10px]">⏭️ OMITIDAS (No se tocan)</span></td>
                  </tr>

                  <tr className="bg-blue-50/50 hover:bg-blue-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">F</td>
                    <td className="py-2.5 px-3 font-mono text-blue-900">6</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Fecha de Emisión</td>
                    <td className="py-2.5 px-3 text-slate-700">Campo "Fecha" del formulario (ej: 22/08/2026)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">✍️ SE GUARDA</span></td>
                  </tr>

                  <tr className="bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-600">G, H</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">7, 8</td>
                    <td className="py-2.5 px-3 text-slate-600">Columnas intermedias</td>
                    <td className="py-2.5 px-3 text-slate-400">Sin datos en la app</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold rounded text-[10px]">⏭️ OMITIDAS (No se tocan)</span></td>
                  </tr>

                  <tr className="bg-blue-50/50 hover:bg-blue-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">I</td>
                    <td className="py-2.5 px-3 font-mono text-blue-900">9</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Validez de la Oferta (Días)</td>
                    <td className="py-2.5 px-3 text-slate-700">Campo "Validez de la oferta" (ej: 30)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">✍️ SE GUARDA</span></td>
                  </tr>

                  <tr className="bg-emerald-50/50 hover:bg-emerald-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">J</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-900">10</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Cliente / Razón Social</td>
                    <td className="py-2.5 px-3 text-slate-700">Nombre del cliente seleccionado o escrito en el formulario</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">✍️ SE GUARDA (Solo Col J)</span></td>
                  </tr>

                  <tr className="bg-emerald-100/50 hover:bg-emerald-100/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-900">K a P</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-900">11 a 16</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div>K: RIF | L: Dirección Fiscal | M: Contacto</div>
                      <div>N: Teléfono | O: Correo | P: Ciudad</div>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-900 font-medium">
                      <strong>FÓRMULAS DE HOJA BD</strong> (VLOOKUP / XLOOKUP en Google Sheets)
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-emerald-700 text-white font-bold rounded text-[10px]">🛡️ 100% FORMULADAS (Ignoradas por script)</span>
                    </td>
                  </tr>

                  <tr className="bg-purple-50/50 hover:bg-purple-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-700">Q</td>
                    <td className="py-2.5 px-3 font-mono text-purple-900">17</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Nombre de Sucursal (Opcional)</td>
                    <td className="py-2.5 px-3 text-slate-700">Sucursal seleccionada en el formulario (si aplica)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[10px]">✍️ SE GUARDA (Solo Col Q)</span></td>
                  </tr>

                  <tr className="bg-purple-100/50 hover:bg-purple-100/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-900">R a X</td>
                    <td className="py-2.5 px-3 font-mono text-purple-900">18 a 24</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div>R: Reservada | S: Dirección | T: Contacto</div>
                      <div>U: Teléfono | V: Correo | W: Ciudad | X: Separador</div>
                    </td>
                    <td className="py-2.5 px-3 text-purple-900 font-medium">
                      <strong>FÓRMULAS DE SUCURSAL EN SHEETS</strong>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-purple-700 text-white font-bold rounded text-[10px]">🛡️ 100% FORMULADAS (Ignoradas por script)</span>
                    </td>
                  </tr>

                  <tr className="bg-blue-100/60 hover:bg-blue-100">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-900">Y</td>
                    <td className="py-2.5 px-3 font-mono text-blue-900">25</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">Nº de Presupuesto (Correlativo)</td>
                    <td className="py-2.5 px-3 text-blue-950 font-medium">
                      Fórmula secuencial en Google Sheets. La app lee el último correlativo para autoincrementar.
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2.5 py-1 bg-blue-800 text-white font-bold rounded text-[10px]">
                        👁️ SOLO LECTURA (Fórmula Protegida, No se escribe)
                      </span>
                    </td>
                  </tr>

                  <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">Z a AE</td>
                    <td className="py-2.5 px-3 font-mono text-indigo-900">26 a 31</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div>Z: Nombre del Producto</div>
                      <div>AA: Marca | AB: Modelo</div>
                      <div>AC: Descripción detallada del Item</div>
                      <div>AD: Cantidad | AE: Precio Unitario ($)</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Filas de la tabla de partidas/productos del presupuesto (1 fila por cada item).
                    </td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded text-[10px]">✍️ SE GUARDAN</span></td>
                  </tr>

                  <tr className="bg-amber-50/40 hover:bg-amber-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-700">AF</td>
                    <td className="py-2.5 px-3 font-mono text-amber-900">32</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Tasa del Día (BCV)</td>
                    <td className="py-2.5 px-3 text-slate-700">Tasa en Bs si está activa la casilla "Tasa del día"</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">✍️ SE GUARDA</span></td>
                  </tr>

                  <tr className="bg-emerald-50/60 hover:bg-emerald-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">AG</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-900">33</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-950">Casilla de Verificación (Checkbox)</td>
                    <td className="py-2.5 px-3 text-slate-700">Estado tildado/destildado del checkbox (ej: Aplicar IVA o Casilla)</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px]">
                        ☑️ CHECKBOX (TRUE / FALSE)
                      </span>
                    </td>
                  </tr>

                  <tr className="bg-emerald-100/70 hover:bg-emerald-100">
                    <td className="py-3 px-3 font-mono font-black text-emerald-900 text-sm">AH a AK</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-900">34 a 37</td>
                    <td className="py-3 px-3 font-bold text-emerald-950">
                      <div>AH: Subtotal General</div>
                      <div>AI: IVA</div>
                      <div>AJ: Total Bs</div>
                      <div>AK: Total $</div>
                    </td>
                    <td className="py-3 px-3 text-emerald-900">
                      <strong>FÓRMULAS DE TOTALES Y CÁLCULO EN SHEETS</strong>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 bg-emerald-800 text-white font-bold rounded text-[10px] shadow-sm">
                        🛡️ 100% FÓRMULAS INTACTAS Y REPLICADAS
                      </span>
                      <p className="text-[11px] text-emerald-900 mt-1">
                        El script nunca escribe valores ni texto en ellas. Si tienes fórmulas en la fila previa, se replican automáticamente; si usas <code>ARRAYFORMULA</code>, expande sin colisiones.
                      </p>
                    </td>
                  </tr>

                  <tr className="bg-emerald-50/60 hover:bg-emerald-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">AL</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-900">38</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">APROBADO</td>
                    <td className="py-2.5 px-3 text-slate-700">Pestaña "Aprobación": Estado SI / NO</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">✍️ SE ACTUALIZA</span></td>
                  </tr>

                  <tr className="bg-emerald-50/60 hover:bg-emerald-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">AM</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-900">39</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900"># FACTURA</td>
                    <td className="py-2.5 px-3 text-slate-700">Pestaña "Aprobación": Número correlativo de factura</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">✍️ SE ACTUALIZA</span></td>
                  </tr>

                  <tr className="bg-emerald-50/60 hover:bg-emerald-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">AN</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-900">40</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">FECHA DE FACTURA</td>
                    <td className="py-2.5 px-3 text-slate-700">Pestaña "Aprobación": Fecha de facturación</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">✍️ SE ACTUALIZA</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
