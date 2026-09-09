/**
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

/**
 * Manejador de peticiones GET (Lectura de datos)
 */
function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action || 'getBDCompleta';

    var ss = getSpreadsheet();

    // 1. Obtener catálogo completo de la hoja BD
    if (action === 'getBDCompleta') {
      var sheetBD = ss.getSheetByName(HOJA_BD);
      if (!sheetBD) {
        return createJsonResponse({ success: false, error: 'Hoja BD no encontrada' });
      }

      var lastRow = sheetBD.getLastRow();
      if (lastRow < 2) {
        return createJsonResponse({ success: true, clientes: [], sucursales: [], productos: [] });
      }

      var lastCol = Math.max(sheetBD.getLastColumn(), 15);
      var headers = sheetBD.getRange(1, 1, 1, lastCol).getValues()[0];

      // Detección dinámica de índices de columna por encabezado con fallback a posiciones estándar:
      // A(0): COMERCIO/CLIENTE, B(1): CEDULA/RIF, C(2): IDEM/CODIGO, D(3): DIRECCION,
      // E(4): CONTACTO, F(5): TELEFONO, G(6): CORREO, H(7): CIUDAD, I(8): ESTADO,
      // K(10): PRODUCTO, L(11): MARCA, M(12): MODELO
      function findCol(keyword, fallbackIdx) {
        for (var h = 0; h < headers.length; h++) {
          var hText = (headers[h] || '').toString().toUpperCase().trim();
          if (hText.indexOf(keyword.toUpperCase()) !== -1) {
            return h;
          }
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

        // CLIENTES: Columnas A a I
        var nombreCli = (row[idxCli] || '').toString().trim();
        var rifVal = (row[idxRif] || '').toString().trim();
        var codigoVal = (row[idxCod] || '').toString().trim(); // IDEM/CODIGO (Columna C)
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

        // SUCURSALES (tomadas también de la BD con su IDEM/CODIGO individual)
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

        // PRODUCTOS: Col K(10), L(11), M(12)
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

      var clientesList = Object.keys(clientesMap).map(function(k) { return clientesMap[k]; });
      var productosList = Object.keys(productosMap).map(function(k) { return productosMap[k]; });

      return createJsonResponse({
        success: true,
        clientes: clientesList,
        sucursales: sucursalesList,
        productos: productosList
      });
    }

    // 2. Obtener correlativo secuencial de presupuestos (Columna Y de PRESUPUESTOS)
    if (action === 'getLastPresupuesto') {
      var sheetPresupuestos = ss.getSheetByName(HOJA_PRESUPUESTOS);
      if (!sheetPresupuestos || sheetPresupuestos.getLastRow() < 2) {
        var now = new Date();
        var ym = Utilities.formatDate(now, 'America/Caracas', 'yyyyMM');
        return createJsonResponse({ success: true, lastNumber: 0, lastCode: '', nextCode: 'CP-' + ym + '001' });
      }

      var maxR = Math.min(sheetPresupuestos.getLastRow(), 2000);
      var values = sheetPresupuestos.getRange(2, 25, maxR - 1, 1).getValues();
      var lastRawCode = '';

      for (var j = values.length - 1; j >= 0; j--) {
        var val = (values[j][0] || '').toString().trim();
        if (val) {
          lastRawCode = val;
          break;
        }
      }

      var nextCode = '';
      if (lastRawCode) {
        var match = lastRawCode.match(/^(.*?)(\d+)$/);
        if (match) {
          var prefix = match[1];
          var numStr = match[2];
          var nextNum = (parseInt(numStr, 10) + 1).toString();
          while (nextNum.length < numStr.length) {
            nextNum = '0' + nextNum;
          }
          nextCode = prefix + nextNum;
        } else {
          var digits = lastRawCode.replace(/\D/g, '');
          if (digits) {
            var n = parseInt(digits, 10) + 1;
            nextCode = 'CP-' + n;
          }
        }
      }

      if (!nextCode) {
        var now2 = new Date();
        var ym2 = Utilities.formatDate(now2, 'America/Caracas', 'yyyyMM');
        nextCode = 'CP-' + ym2 + '001';
      }

      return createJsonResponse({
        success: true,
        lastCode: lastRawCode,
        nextCode: nextCode
      });
    }

    // 3. Historial de presupuestos existentes en la hoja PRESUPUESTOS
    if (action === 'getPresupuestosHistory') {
      var sheetPres = ss.getSheetByName(HOJA_PRESUPUESTOS);
      if (!sheetPres || sheetPres.getLastRow() < 2) {
        return createJsonResponse({ success: true, presupuestos: [] });
      }

      var maxScan = Math.min(sheetPres.getLastRow(), 3000);
      var rows = sheetPres.getRange(2, 1, maxScan - 1, 41).getValues();
      var grupos = {};

      for (var k = 0; k < rows.length; k++) {
        var r = rows[k];
        var num = (r[24] || '').toString().trim(); // Col Y (25)
        var fechaRaw = r[5]; // Col F (6)
        var cliNom = (r[9] || '').toString().trim(); // Col J (10)

        // Si no hay correlativo ni cliente en la fila, se ignora
        if (!num && !cliNom) continue;
        if (!num) num = 'S/N-' + (k + 2);

        var fechaStr = fechaRaw instanceof Date ? Utilities.formatDate(fechaRaw, 'America/Caracas', 'yyyy-MM-dd') : (fechaRaw || '').toString();
        var tasaNum = parseFloat(r[31]) || 0; // Col AF (32)
        var aplicarIvaVal = (r[32] === true || r[32] === 'TRUE' || r[32] === 'true'); // Col AG (33)

        // Columnas AL (38), AM (39), AN (40)
        var aprobadoVal = (r[37] || '').toString().trim(); // Col AL (38)
        var numFacturaVal = (r[38] || '').toString().trim(); // Col AM (39)
        var fechaFacturaRaw = r[39]; // Col AN (40)
        var fechaFacturaStr = fechaFacturaRaw instanceof Date ? Utilities.formatDate(fechaFacturaRaw, 'America/Caracas', 'yyyy-MM-dd') : (fechaFacturaRaw || '').toString();

        if (!grupos[num]) {
          grupos[num] = {
            id: 'cp-' + num,
            numeroPresupuesto: num,
            fecha: fechaStr,
            validoDias: parseInt(r[8], 10) || 30,
            clienteNombre: cliNom,
            clienteRif: (r[10] || '').toString().trim(),
            clienteDireccion: (r[11] || '').toString().trim(),
            clienteContacto: (r[12] || '').toString().trim(),
            clienteTelefono: (r[13] || '').toString().trim(),
            clienteCorreo: (r[14] || '').toString().trim(),
            clienteCiudad: (r[15] || '').toString().trim(),
            sucursalNombre: (r[16] || '').toString().trim(),
            sucursalRif: (r[10] || '').toString().trim(),
            sucursalDireccion: (r[18] || '').toString().trim(),
            sucursalContacto: (r[19] || '').toString().trim(),
            sucursalTelefono: (r[20] || '').toString().trim(),
            sucursalCorreo: (r[21] || '').toString().trim(),
            sucursalCiudad: (r[22] || '').toString().trim(),
            tasaDia: tasaNum,
            usarTasa: (tasaNum > 0),
            aplicarIva: aplicarIvaVal,
            porcentajeIva: 16,
            subtotalUsd: 0,
            ivaUsd: 0,
            totalUsd: 0,
            subtotalBs: 0,
            ivaBs: 0,
            totalBs: 0,
            aprobado: aprobadoVal,
            numeroFactura: numFacturaVal,
            fechaFactura: fechaFacturaStr,
            items: [],
            sincronizadoGoogleSheets: true,
            creadoEn: fechaStr
          };
        }

        var itemCant = parseFloat(r[29]) || 1; // Col AD (30)
        var itemPrecio = parseFloat(r[30]) || 0; // Col AE (31)

        grupos[num].items.push({
          id: 'item-' + (k + 1),
          producto: (r[25] || '').toString().trim(), // Col Z (26)
          marca: (r[26] || '').toString().trim(),     // Col AA (27)
          modelo: (r[27] || '').toString().trim(),    // Col AB (28)
          descripcion: (r[28] || '').toString().trim(), // Col AC (29)
          cantidad: itemCant,
          precioUnitario: itemPrecio
        });

        grupos[num].subtotalUsd += (itemCant * itemPrecio);
      }

      var list = Object.keys(grupos).map(function(grpKey) { 
        var g = grupos[grpKey];
        if (g.aplicarIva) {
          g.ivaUsd = g.subtotalUsd * (g.porcentajeIva / 100);
        } else {
          g.ivaUsd = 0;
        }
        g.totalUsd = g.subtotalUsd + g.ivaUsd;

        if (g.usarTasa && g.tasaDia > 0) {
          g.subtotalBs = g.subtotalUsd * g.tasaDia;
          g.ivaBs = g.ivaUsd * g.tasaDia;
          g.totalBs = g.totalUsd * g.tasaDia;
        }

        return g; 
      });

      list.reverse();
      return createJsonResponse({ success: true, presupuestos: list });
    }

    return createJsonResponse({ success: true, message: 'Silocom API activa' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Manejador de peticiones POST (Escritura / Guardado de presupuestos)
 */
function doPost(e) {
  try {
    var data = null;

    // 1. Intentar parsear e.postData.contents
    if (e && e.postData && e.postData.contents) {
      var raw = e.postData.contents;
      try {
        data = JSON.parse(raw);
      } catch (errJson) {
        // Si viene como url-encoded 'data=...'
        if (typeof raw === 'string' && raw.indexOf('data=') === 0) {
          try {
            var decoded = decodeURIComponent(raw.substring(5).replace(/\\+/g, ' '));
            data = JSON.parse(decoded);
          } catch(errDec) {}
        }
      }
    }

    // 2. Intentar parsear e.parameter.data o e.parameter
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
      
      // BUSCAR LA PRIMERA FILA REALMENTE DISPONIBLE
      var startRow = getFirstAvailableRow(sheetPresupuestos);

      // =========================================================================
      // MAPEO EXACTO Y PROTECCIÓN DE FÓRMULAS EN 'PRESUPUESTOS':
      // - Col F (6): Fecha de Emisión
      // - Col I (9): Días de Validez
      // - Col J (10): ÚNICAMENTE Nombre Comercio / Cliente (K-P son fórmulas: no se tocan)
      // - Col Q (17): ÚNICAMENTE Nombre Sucursal si aplica (R-X son fórmulas: no se tocan)
      // - Col Y (25): FÓRMULA del correlativo secuencial (NO se sobreescribe)
      // - Cols Z a AE (26 a 31): Detalle de Items (Producto, Marca, Modelo, Descrip, Cant, Precio)
      // - Col AF (32): Tasa del Día (si aplica)
      // - Col AG (33): Casilla de Verificación (Checkbox Booleano TRUE / FALSE)
      // - Cols AH a AK (34 a 37): FÓRMULAS DE TOTALES (100% protegidas e intactas)
      // =========================================================================

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
      
      // 3. Col J (10): Comercio / Cliente
      sheetPresupuestos.getRange(startRow, 10, numRows, 1).setValues(colCliente);

      // 4. Col Q (17): Sucursal / Destino (si aplica)
      if (data.sucursal || data.sucursalNombre) {
        sheetPresupuestos.getRange(startRow, 17, numRows, 1).setValues(colSucursal);
      }

      // 5. Cols Z a AE (26 a 31): Items
      sheetPresupuestos.getRange(startRow, 26, numRows, 6).setValues(colsItems);

      // 6. Col AF (32): Tasa del Día
      sheetPresupuestos.getRange(startRow, 32, numRows, 1).setValues(colTasa);

      // 7. Col AG (33): Casilla de Verificación (Checkbox)
      sheetPresupuestos.getRange(startRow, 33, numRows, 1).setValues(colCheckbox);

      SpreadsheetApp.flush();

      return createJsonResponse({
        success: true,
        message: 'Presupuesto registrado exitosamente en Google Sheets',
        filasInsertadas: numRows,
        filaInicio: startRow
      });
    }

    // =========================================================================
    // ACCIÓN: actualizarAprobacion (Escribe en Columnas AL, AM, AN)
    // AL (38): APROBADO ('SI' / 'NO')
    // AM (39): # FACTURA
    // AN (40): FECHA DE FACTURA
    // =========================================================================
    if (action === 'actualizarAprobacion') {
      var ss2 = getSpreadsheet();
      var sheetPres2 = ss2.getSheetByName(HOJA_PRESUPUESTOS);
      if (!sheetPres2) {
        return createJsonResponse({ success: false, error: 'Hoja PRESUPUESTOS no encontrada' });
      }

      var numeroPresupuesto = (data.numeroPresupuesto || '').toString().trim();
      var aprobado = (data.aprobado || '').toString().trim(); // 'SI' o 'NO'
      var numeroFactura = (data.numeroFactura || '').toString().trim();
      var fechaFactura = (data.fechaFactura || '').toString().trim();

      if (!numeroPresupuesto) {
        return createJsonResponse({ success: false, error: 'Número de presupuesto requerido' });
      }

      var maxScan2 = Math.min(sheetPres2.getLastRow(), 3000);
      if (maxScan2 < 2) {
        return createJsonResponse({ success: false, error: 'No hay presupuestos en la hoja' });
      }

      // Leemos la columna Y (25) de números de presupuesto
      var colYValues = sheetPres2.getRange(2, 25, maxScan2 - 1, 1).getValues();
      var filasModificadas = 0;

      for (var f = 0; f < colYValues.length; f++) {
        var numFila = (colYValues[f][0] || '').toString().trim();
        if (numFila === numeroPresupuesto) {
          var targetRow = f + 2; // +2 por encabezado y base 1
          
          // Escribir en Col AL (38), AM (39), AN (40)
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

    return createJsonResponse({ success: false, error: 'Acción no reconocida en POST' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Función auxiliar para respuestas JSON con CORS
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
