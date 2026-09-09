import { Cliente, Sucursal, ProductoItem, AppConfig } from '../types';

export const DEFAULT_CONFIG: AppConfig = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxdrJ1Y-TTmvye8A3SW8UyBnog0Kri8fjxWy607KtTDo4mPJZsQ1vPaHX7uRnsYc72Y/exec',
  spreadsheetId: '1KBpl5KQH9R2LS2o6phmTCWAJwnWbVJrEqSikOMW5WNg',
  nombreEmpresa: 'Silocom, C.A.',
  rifEmpresa: 'J-30725192-1',
  direccionEmpresa: 'Calle El Carmen, Centro Dos Caminos Piso 7, Ofic. 7-D, Los Dos Caminos, Caracas.',
  telefonoEmpresa: '(0212) 239-2663',
  contactoEmpresa: '@silocomintl',
  cuentasBancarias: `Procesar el pago a nombre de Silocom, C.A. , RIF: J-30725192-1 a las siguientes cuentas:
• Banco Banesco cuenta corriente No. 0134-0350-31-3501001901
• Banco Mercantil cuenta corriente No. 0105-0079-66-1079496912`,
  condicionesGenerales: `1.- Los precios arriba indicados incluyen el IVA 
2.- Propuesta válida segun indicado en la parte superior derecha. 
3.- El pago debe recibirse antes del vencimiento de la propuesta o al momento de generar la factura.`,
  tasaDefecto: 785.40,
  diasValidezDefecto: 30,
  ivaPorDefecto: 16
};

export const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli-1',
    nombre: 'DISTR Y LIC LA VICTORIA C',
    rif: '',
    direccion: 'AVENIDA NRO 4 CASA 27-57 SECTOR EL ROSADO LA CONCEPCION EDO ZULIA',
    contacto: '',
    telefono: '',
    correo: '',
    ciudad: 'LA CONCEPCION ZULIA'
  },
  {
    id: 'cli-2',
    nombre: 'HYPER LIDER FLOR AMARILLO',
    rif: 'J401131530',
    direccion: 'PB,A, EDF. HYPER LIDER,73 NACIONAL VALENCIA GUIGUE,73 NACION',
    contacto: '',
    telefono: '414-4482902 / 412-4388438',
    correo: '',
    ciudad: 'VALENCIA CARABOBO'
  },
  {
    id: 'cli-3',
    nombre: 'HYPER LIDER SAN DIEGO',
    rif: 'J401131670',
    direccion: 'SIN,D1, EDF. HYPER LIDER,DON JULIO CENTENO',
    contacto: '',
    telefono: '243-27205220 / 414-4589372',
    correo: '',
    ciudad: 'SAN DIEGO CARABOBO'
  },
  {
    id: 'cli-4',
    nombre: 'AUTOMERCADO EL VENADO',
    rif: 'J000689253',
    direccion: 'PB,8, EDF. AUTOMERCADO EL VENADO C.A.,EL PLACER,URB BARUTA',
    contacto: '',
    telefono: '212-96212580 / 212-09621258',
    correo: '',
    ciudad: 'CARACAS MIRANDA'
  },
  {
    id: 'cli-5',
    nombre: 'AUTOMERCADOS SUPER REY C.A',
    rif: 'J316324311',
    direccion: 'PB,UNICO, EDF. 19 DE ABRIL,SOUBLETTE CON BOYACA,CASCO CENT',
    contacto: '',
    telefono: '243-24708680 / 414-45559240',
    correo: '',
    ciudad: 'MARACAY ARAGUA'
  },
  {
    id: 'cli-6',
    nombre: 'HIPER LIDER CABUDARE',
    rif: 'J405521040',
    direccion: 'PB,33Y 35, EDF. HIPER LIDER CABUDARE,INTER BARQUISIMETO ACA',
    contacto: '',
    telefono: '243-2720572',
    correo: '',
    ciudad: 'CABUDARE LARA'
  },
  {
    id: 'cli-7',
    nombre: 'SUPER MARKET ORIENTE, C.A',
    rif: 'J401118542',
    direccion: 'PB,N° 1, EDF. SUPER MARKET ORIENTE, C.A,CARUPANO,ZONA PARQ',
    contacto: '',
    telefono: '293-43327650 / 414-7773272',
    correo: '',
    ciudad: 'CUMANA SUCRE'
  },
  {
    id: 'cli-8',
    nombre: 'HIPERMERCADO PLAZA GUATIRE',
    rif: 'J306725024',
    direccion: 'PB,PARCELA 3, EDF. HEPERMERCADO PLAZA,PPAL DE CASTELLEJO',
    contacto: '',
    telefono: '414-1168430',
    correo: '',
    ciudad: 'GUATIRE MIRANDA'
  },
  {
    id: 'cli-9',
    nombre: 'EUROMAXX PLUS SAN DIEGO (CARAB',
    rif: 'J298473290',
    direccion: 'PB,PAC 16-A, EDF. EUROMAXX PLUS,PARCELA 16-A URB MONTESERI',
    contacto: '',
    telefono: '243-2699104 / 243-511624',
    correo: '',
    ciudad: 'SAN DIEGO CARABOBO'
  },
  {
    id: 'cli-10',
    nombre: 'GARZON HIPERMERCADO PUEBLO NL',
    rif: 'J305269300',
    direccion: 'UNICO,01, EDF. GARZON,ESPAÑA CRUCE CON REDOMA BATIDOS EL',
    contacto: '',
    telefono: '276-5108407 / 276-3477239',
    correo: '',
    ciudad: 'SAN CRISTOBAL TACHIRA'
  },
  {
    id: 'cli-11',
    nombre: 'HIPER MODELO',
    rif: 'J308102520',
    direccion: 'PB,1, EDF. MODELO,VICTOR BATISTA',
    contacto: '',
    telefono: '212-3219908',
    correo: '',
    ciudad: 'LOS TEQUES MIRANDA'
  },
  {
    id: 'cli-12',
    nombre: 'EL FAMOSO 2005,C.A',
    rif: 'J313276588',
    direccion: 'PB,45, EDF. EL FAMOSO 2005,BERMUDEZ',
    contacto: '',
    telefono: '293-4410857',
    correo: '',
    ciudad: 'CUMANA SUCRE'
  },
  {
    id: 'cli-13',
    nombre: 'FRIGORIFICO LOS TAVARES DE MA',
    rif: 'J300344797',
    direccion: 'PB,UNICO, EDF. FRIGORIFICO LOS TAVARES DE M,JOAQUIN MANEIR',
    contacto: '',
    telefono: '295-2622141',
    correo: '',
    ciudad: 'PORLAMAR NUEVA ESPARTA'
  },
  {
    id: 'cli-14',
    nombre: 'PANADERIA PASTELERIA EL PAN DE',
    rif: 'J308582832',
    direccion: 'PB,S/N, EDF. EL PAN DEL PARAISO,MORON CORO,EST. DE SERV. EL P',
    contacto: '',
    telefono: '268-2770568',
    correo: '',
    ciudad: 'LA VELA DE CORO FALCON'
  },
  {
    id: 'cli-15',
    nombre: 'CARNICERIA PAEZ C.A',
    rif: 'J305705100',
    direccion: 'PB,S/N, EDF. CARNICERIA PAEZ (I1215).OMNI,28 E/ CLL 30 Y CLL 31 C',
    contacto: '',
    telefono: '255-62148860 / 255-7204770 / 418-75891840',
    correo: '',
    ciudad: 'ACARIGUA PORTUGUESA'
  },
  {
    id: 'cli-16',
    nombre: 'CECOSESOLA LARA',
    rif: 'J085030140',
    direccion: 'S/N,S/N, EDF. CECOSESOLA RUIZ PINEDA,FINAL AV. LOS HORCONES',
    contacto: '',
    telefono: '251-26665530 / 251-2669560',
    correo: '',
    ciudad: 'BARQUISIMETO LARA'
  },
  {
    id: 'cli-17',
    nombre: 'SUPER LIDER CHARALLAVE',
    rif: 'J299102695',
    direccion: 'PB,MADOSA, EDF. SUPER LIDER CHARALLAVE, C. A.,CHARALLAVE',
    contacto: '',
    telefono: '243-2720522112',
    correo: '',
    ciudad: 'CHARALLAVE MIRANDA'
  },
  {
    id: 'cli-18',
    nombre: 'FRUTERIA BELLO HORIZONTE',
    rif: 'J303336213',
    direccion: 'PB,S/N, EDF. BELLO HORIZONTE,LA ENCRUCIJADA,TURMERO',
    contacto: '',
    telefono: '244-39557720 / 244-3955772',
    correo: '',
    ciudad: 'LA ENCRUCIJADA ARAGUA'
  },
  {
    id: 'cli-19',
    nombre: 'SUPERMERCADO LUXOR SANTA RITA',
    rif: 'J075259912',
    direccion: 'S/N,S/N, EDF. SUPERMERCADO LUXOR SANTA RITA,MARACAY,URB.S',
    contacto: '',
    telefono: '243-51116260 / 243-51116240 / 412-44516300',
    correo: '',
    ciudad: 'MARACAY ARAGUA'
  },
  {
    id: 'cli-20',
    nombre: 'AUTOMERCADOS PLAZAS, C.A',
    rif: 'J306725024',
    direccion: 'PB,NRO 4, EDF. AUTOMERCADO PLAZAS, LOS NISPE,AV. CUATRECEN',
    contacto: '',
    telefono: '212-90314110 / 414-2391070 / 412-90314400',
    correo: '',
    ciudad: 'VALENCIA CARABOBO'
  },
  {
    id: 'cli-21',
    nombre: 'HIPER LIDER TAMACA C.A.',
    rif: 'J406004766',
    direccion: 'PB,1, EDF. SUPER LIDER,INTERCOMUNAL BGTO-DUACA,DUACA',
    contacto: '',
    telefono: '414-4822902 / 243-2377858',
    correo: '',
    ciudad: 'BARQUISIMETO LARA'
  },
  {
    id: 'cli-22',
    nombre: 'GARZON CC. PASO REAL MERIDA',
    rif: 'J311311564',
    direccion: 'PB,GARZON, EDF. PASO REAL,ANDRES BELLO,ANDRES BELLO,ALTO',
    contacto: '',
    telefono: '276-5108441 / 276-5108404',
    correo: '',
    ciudad: 'MERIDA MERIDA'
  },
  {
    id: 'cli-23',
    nombre: 'CECOSESOLA DEL ESTE',
    rif: 'J085030140',
    direccion: 'PB,1, EDF. CECOCESOLA DEL ESTE,MENCA DE LEONI',
    contacto: '',
    telefono: '251-2375435',
    correo: '',
    ciudad: 'BARQUISIMETO LARA'
  },
  {
    id: 'cli-24',
    nombre: 'AUTOMERCADO PLAZA S BUENAVENT',
    rif: 'J306725024',
    direccion: 'PB,SUPERMERCADO, EDF. BUENAVENTURA,INTERC.GUARENAS-GUA',
    contacto: '',
    telefono: '212-9445439',
    correo: '',
    ciudad: 'GUARENAS MIRANDA'
  },
  {
    id: 'cli-25',
    nombre: 'HIPER VERDURAS DE ARAGUA,C.A',
    rif: 'J400755239',
    direccion: 'PB,2, EDF. HIPER VERDURAS DE ARAGUA,C.A,LA CEIBA,BARRIO 19 D',
    contacto: '',
    telefono: '244-66189580 / 414-49012960',
    correo: '',
    ciudad: 'TURMERO ARAGUA'
  },
  {
    id: 'cli-26',
    nombre: 'TODOHOGAR VISTA MAR LAS GARZAS',
    rif: 'J311876103',
    direccion: 'PB,17, EDF. VISTA MAR,,ANDRES BELLO',
    contacto: '',
    telefono: '281-3178077 / 281-2863742',
    correo: '',
    ciudad: 'LECHERIAS ANZOATEGUI'
  },
  {
    id: 'cli-27',
    nombre: 'TODOHOGAR COLINAS',
    rif: 'J311876103',
    direccion: 'PB,UNICO, EDF. TODOHOGAR COLINAS,GUZMAN LANDER,RUIZ PINEI',
    contacto: '',
    telefono: '281-41974104 / 414-8069472',
    correo: '',
    ciudad: 'BARCELONA ANZOATEGUI'
  },
  {
    id: 'cli-28',
    nombre: 'LA NUEVA COLMENA DE VENEZUELA',
    rif: 'J500745587',
    direccion: 'AV MIRANDA, LOCAL NRO 4-92 SECTOR CASCO CENTRAL',
    contacto: '',
    telefono: '',
    correo: '',
    ciudad: 'ANACO ANZOATEGUI'
  },
  {
    id: 'cli-29',
    nombre: 'SUPER LIDER LOS SAMANES C.A.',
    rif: 'J311865501',
    direccion: 'PB,UNICO, EDF. MADRE MA.SAN JOSE.FRENTE,FINAL,LOS SAMANES',
    contacto: '',
    telefono: '243-2720522',
    correo: '',
    ciudad: 'MARACAY ARAGUA'
  },
  {
    id: 'cli-30',
    nombre: 'SUPER LIDER PALO NEGRO',
    rif: 'J293611547',
    direccion: 'S/N,GALPON A, EDF. SUPER LIDER PALO NEGRO C.A,CRT NACIONAL',
    contacto: '',
    telefono: '243-272052114 / 243-7722880',
    correo: '',
    ciudad: 'MARACAY ARAGUA'
  },
  {
    id: 'cli-31',
    nombre: 'SUPER TIENDA LATINO DELICIAS,',
    rif: 'J311840680',
    direccion: 'PB,UNICO, EDF. LAS DELICIAS,15 DELICIAS,2',
    contacto: '',
    telefono: '261-7416973',
    correo: '',
    ciudad: 'MARACAIBO ZULIA'
  },
  {
    id: 'cli-32',
    nombre: 'NETUNO',
    rif: 'J301083350',
    direccion: 'CALLE 7. EDIF INSENICA II. PISO 2. URB. LA URBINA',
    contacto: 'CARLOS RODRIGUEZ',
    telefono: '0212-772-0244 / 0414-1412773',
    correo: 'CRODRIGUEZ@netuno.net',
    ciudad: 'CARACAS MIRANDA'
  }
];

export const INITIAL_SUCURSALES: Sucursal[] = [
  {
    id: 'suc-1',
    clienteNombre: 'NETUNO',
    nombre: 'NETUNO (COLONIA TOVAR)',
    rif: 'J301083350 / 6',
    direccion: 'COLONIA TOVAR',
    contacto: 'CARLOS RODRIGUEZ',
    telefono: '0212-7720400',
    correo: 'crodriguez@netuno.net',
    ciudad: 'COLONIA TOVAR ARAGUA'
  },
  {
    id: 'suc-2',
    clienteNombre: 'NETUNO',
    nombre: 'NETUNO (GUARENAS - GUATIRE)',
    rif: 'J301083350 / 2',
    direccion: 'AV. INTERCOMUNAL GUARENAS GUATIRE, CENTRO EMPRESARIAL',
    contacto: 'HECTOR SALAZAR',
    telefono: '0212-361-8899',
    correo: 'hsalazar@netuno.net',
    ciudad: 'GUATIRE MIRANDA'
  },
  {
    id: 'suc-3',
    clienteNombre: 'NETUNO',
    nombre: 'NETUNO (VALENCIA)',
    rif: 'J301083350 / 4',
    direccion: 'AV. BOLIVAR NORTE, CENTRO COMERCIAL CAMORUCO',
    contacto: 'MARIA FERNANDA GIL',
    telefono: '0241-825-9900',
    correo: 'mgil@netuno.net',
    ciudad: 'VALENCIA CARABOBO'
  },
  {
    id: 'suc-4',
    clienteNombre: 'AUTOMERCADOS PLAZAS, C.A',
    nombre: 'AUTOMERCADOS PLAZAS (SUCURSAL LOS NISPES)',
    rif: 'J306725024',
    direccion: 'PB,NRO 4, EDF. AUTOMERCADO PLAZAS, LOS NISPE,AV. CUATRECEN',
    contacto: 'GERENCIA DE TIENDA',
    telefono: '212-90314110',
    correo: 'contacto@plazas.com',
    ciudad: 'VALENCIA CARABOBO'
  },
  {
    id: 'suc-5',
    clienteNombre: 'HYPER LIDER FLOR AMARILLO',
    nombre: 'HYPER LIDER (SEDE VALENCIA GUIGUE)',
    rif: 'J401131530',
    direccion: 'PB,A, EDF. HYPER LIDER,73 NACIONAL VALENCIA GUIGUE,73 NACION',
    contacto: 'GERENCIA DE OPERACIONES',
    telefono: '414-4482902',
    correo: 'operaciones@hyperlider.com',
    ciudad: 'VALENCIA CARABOBO'
  }
];

export const INITIAL_PRODUCTOS: ProductoItem[] = [
  {
    id: 'prod-1',
    producto: 'SENSOR CORRIENTE AC',
    marca: 'DRAGINO',
    modelo: 'SCT013G-D-100',
    descripcionSugerida: 'SENSOR DE CORRIENTE NO INVASIVO AC',
    precioSugerido: 45.00
  },
  {
    id: 'prod-2',
    producto: 'BATTERY CHARGER LSN50V2',
    marca: 'DRAGINO',
    modelo: 'LSN50V2-BAT',
    descripcionSugerida: 'CARGADOR DE BATERIA EXTERNA LORAWAN',
    precioSugerido: 35.00
  },
  {
    id: 'prod-3',
    producto: 'PILAS ALKALINE EMTOP',
    marca: 'EMTOP',
    modelo: 'TRIPLE A',
    descripcionSugerida: 'PILAS ALCALINAS AAA ALTO RENDIMIENTO',
    precioSugerido: 6.00
  },
  {
    id: 'prod-4',
    producto: 'TRANSFORMADOR CORRIENTE',
    marca: 'SHELLY',
    modelo: 'CT120A',
    descripcionSugerida: 'TRANSFORMADOR DE CORRIENTE 120A SPLIT CORE',
    precioSugerido: 28.00
  },
  {
    id: 'prod-5',
    producto: 'PILAS ALKALINE GP',
    marca: 'SUPER GP',
    modelo: 'TRIPLE A',
    descripcionSugerida: 'PILAS ALCALINAS AAA',
    precioSugerido: 5.50
  },
  {
    id: 'prod-6',
    producto: 'BANDEJA PARA RACK',
    marca: 'N/A',
    modelo: 'N/A',
    descripcionSugerida: 'BANDEJA METALICA FIJA PARA GABINETE / RACK 19 PULGADAS',
    precioSugerido: 38.00
  },
  {
    id: 'prod-7',
    producto: 'CAJA DE MEDIDOR',
    marca: 'ANDELLI',
    modelo: 'SHELLY PRO 3EM',
    descripcionSugerida: 'CAJA DE MONTAJE Y PROTECCION DE MEDIDOR DIN RAIL',
    precioSugerido: 25.00
  },
  {
    id: 'prod-8',
    producto: 'CAJA PARA EQUIPOS (NEMA)',
    marca: 'VITRON',
    modelo: '12CMx10CM',
    descripcionSugerida: 'CAJA DE PASO Y PROTECCION TERMOPLASTICA NEMA',
    precioSugerido: 91.00
  },
  {
    id: 'prod-9',
    producto: 'CABLES DE RED',
    marca: 'N/A',
    modelo: 'N/A',
    descripcionSugerida: 'PATCH CORD Y TRAMO DE CABLE UTP CATEGORIA 6',
    precioSugerido: 31.40
  },
  {
    id: 'prod-10',
    producto: 'LI-ION BATTERY',
    marca: 'DRAGINO',
    modelo: 'LI-ION BATTERY CHARGER',
    descripcionSugerida: 'BATERIA RECARGABLE DE LITIO-ION CON CARGADOR',
    precioSugerido: 42.00
  },
  {
    id: 'prod-11',
    producto: 'FUENTE DE PODER RUT',
    marca: 'TELTONIKA',
    modelo: 'RUT2XX',
    descripcionSugerida: 'FUENTE DE PODER COMPATIBLE ROUTERS TELTONIKA',
    precioSugerido: 24.00
  },
  {
    id: 'prod-12',
    producto: 'EXTENSION CABLE FOR LHT65N',
    marca: 'DRAGINO',
    modelo: 'NE2',
    descripcionSugerida: 'CABLE DE EXTENSION PARA SENSOR TEMPERATURA',
    precioSugerido: 18.00
  },
  {
    id: 'prod-13',
    producto: 'TOMACORRIENTES',
    marca: 'EAGLE',
    modelo: 'DOBLE TOMA',
    descripcionSugerida: 'TOMACORRIENTE POLARIZADO DUPLEX',
    precioSugerido: 8.50
  },
  {
    id: 'prod-14',
    producto: 'ENCHUFES',
    marca: 'EAGLE',
    modelo: 'REDONDO',
    descripcionSugerida: 'ENCHUFE MACHO INDUSTRIAL REFORZADO',
    precioSugerido: 6.00
  },
  {
    id: 'prod-15',
    producto: 'CABLE DATO/CORRIENTE',
    marca: 'HEA TEL',
    modelo: 'HEA TEL 4 EN 1',
    descripcionSugerida: 'CABLE MULTIFUNCIONAL DATOS Y ENERGIA',
    precioSugerido: 19.50
  },
  {
    id: 'prod-16',
    producto: 'CONECTORES PLUG RJ45',
    marca: 'BE CONNECT',
    modelo: 'CAT 6',
    descripcionSugerida: 'CONECTORES MODULARES RJ45 CAT 6 (PAQUETE / UNIDAD)',
    precioSugerido: 5.30
  },
  {
    id: 'prod-17',
    producto: 'RAMPLUG',
    marca: 'INVERSIONES HJ',
    modelo: 'PARED DRYWALL',
    descripcionSugerida: 'RAMPLUG ESPECIAL PARA YESO / DRYWALL CON TORNILLO',
    precioSugerido: 12.00
  },
  {
    id: 'prod-18',
    producto: 'AMARRE DE NYLON (TIE RAP)',
    marca: 'ANDELLI',
    modelo: 'B-5 x 200',
    descripcionSugerida: 'TIRRAPS DE NYLON NEGRO RESISTENTE A RAYOS UV (PAQUETE)',
    precioSugerido: 7.50
  },
  {
    id: 'prod-19',
    producto: 'CONSUMIBLES',
    marca: 'VARIOS',
    modelo: 'VARIOS',
    descripcionSugerida: 'RAMPLUG, TIE RAP, CINTA ADHESIVA',
    precioSugerido: 22.00
  },
  {
    id: 'prod-20',
    producto: 'CABLE DE CORRIENTE ELECTRICO',
    marca: 'SPT-R',
    modelo: 'TIPO #16 X 2',
    descripcionSugerida: 'CABLE ELECTRICO BIFILAR SPT-R 16AWG',
    precioSugerido: 15.00
  },
  {
    id: 'prod-21',
    producto: 'GATEWAY',
    marca: 'DRAGINO',
    modelo: 'LPS8N',
    descripcionSugerida: 'GATEWAY LORAWAN INDOOR 8 CANALES',
    precioSugerido: 260.00
  },
  {
    id: 'prod-22',
    producto: 'TEMPERATURA / HUMEDAD',
    marca: 'DRAGINO',
    modelo: 'LHT65N',
    descripcionSugerida: 'SENSOR INALAMBRICO LORAWAN TEMP / HUMEDAD',
    precioSugerido: 75.00
  },
  {
    id: 'prod-23',
    producto: 'NIVEL DE LIQUIDO',
    marca: 'DRAGINO',
    modelo: 'DDS20-LB',
    descripcionSugerida: 'SENSOR DE DISTANCIA Y NIVEL POR ULTRASONIDO LORAWAN',
    precioSugerido: 140.00
  },
  {
    id: 'prod-24',
    producto: 'DETENCION DE DISTANCIA',
    marca: 'DRAGINO',
    modelo: 'LDDS75-8',
    descripcionSugerida: 'SENSOR DE MEDICION DE DISTANCIA LORAWAN',
    precioSugerido: 135.00
  },
  {
    id: 'prod-25',
    producto: 'CONTROLADOR',
    marca: 'DRAGINO',
    modelo: 'LT-22222-L',
    descripcionSugerida: 'CONTROLADOR DE ENTRADAS/SALIDAS DIGITALES Y ANALOGICAS',
    precioSugerido: 110.00
  },
  {
    id: 'prod-26',
    producto: 'PUERTA',
    marca: 'DRAGINO',
    modelo: 'LDS02',
    descripcionSugerida: 'SENSOR DE APERTURA MAGNETICA DE PUERTAS Y VENTANAS',
    precioSugerido: 48.00
  },
  {
    id: 'prod-27',
    producto: 'ROUTER',
    marca: 'MIKROTIK',
    modelo: 'L41G',
    descripcionSugerida: 'INSTALACION Y CONFIGURACION ROUTERBOARD',
    precioSugerido: 135.00
  },
  {
    id: 'prod-28',
    producto: 'ROUTER',
    marca: 'MIKROTIK',
    modelo: 'RB750Gr3 HEX',
    descripcionSugerida: 'ROUTER GIGABIT 5 PUERTOS BALANCEO DE CARGA',
    precioSugerido: 95.00
  },
  {
    id: 'prod-29',
    producto: 'SWITCH GIGABIT',
    marca: 'MIKROTIK',
    modelo: 'CRS326-24G-2S+RM',
    descripcionSugerida: 'SWITCH ADMINISTRABLE 24 PUERTOS GBE + 2 SFP+ 10G',
    precioSugerido: 340.00
  },
  {
    id: 'prod-30',
    producto: 'SERVICIOS DE VISITA TECNICA',
    marca: 'SILOCOM',
    modelo: 'COMPLEJA / REINSTALACION MAYOR CIUDAD PRINCIPAL',
    descripcionSugerida: 'DESPLIEGUE TECNICO ESPECIALIZADO Y PRUEBAS EN SITIO',
    precioSugerido: 120.00
  },
  {
    id: 'prod-31',
    producto: 'SERVICIOS DE INSTALACION',
    marca: 'SILOCOM',
    modelo: 'INSTALACION Y CONFIGURACION',
    descripcionSugerida: 'INSTALACION, CABLEADO Y PUESTA EN MARCHA',
    precioSugerido: 90.00
  },
  {
    id: 'prod-32',
    producto: 'ANTENA DE RADIOENLACE',
    marca: 'UBIQUITI',
    modelo: 'LITEBEAM 5AC GEN2',
    descripcionSugerida: 'ANTENA CPE 23DBI 5GHZ 450+ MBPS',
    precioSugerido: 98.00
  }
];

export const PLANTILLAS_PRESUPUESTO = [
  {
    nombre: 'Instalación y Configuración Router Mikrotik (Netuno)',
    items: [
      { producto: 'ROUTER', marca: 'MIKROTIK', modelo: 'L41G', descripcion: 'INSTALACION', cantidad: 1, precioUnitario: 135.00 },
      { producto: 'CAJA PARA EQUIPOS (NEMA)', marca: 'VITRON', modelo: '12CMx10CM', descripcion: 'GABINETE PROTECTOR', cantidad: 1, precioUnitario: 91.00 },
      { producto: 'CABLE DE CORRIENTE ELECTRICO', marca: 'SPT-R', modelo: 'TIPO #16 X 2', descripcion: 'ACOMETIDA ELECTRICA', cantidad: 1, precioUnitario: 15.00 },
      { producto: 'CABLES DE RED', marca: 'N/A', modelo: 'N/A', descripcion: 'PATCH CORDS CERTIFICADOS', cantidad: 1, precioUnitario: 31.40 },
      { producto: 'CONECTORES PLUG RJ45', marca: 'BE CONNECT', modelo: 'CAT 6', descripcion: 'TERMINALES DE RED', cantidad: 1, precioUnitario: 5.30 },
      { producto: 'CONSUMIBLES', marca: 'VARIOS', modelo: 'VARIOS', descripcion: 'RAMPLUG, TIE RAP, CINTA ADHESIVA', cantidad: 1, precioUnitario: 22.00 },
      { producto: 'SERVICIOS DE VISITA TECNICA', marca: 'SILOCOM', modelo: 'COMPLEJA / REINSTALACION MAYOR CIUDAD PRINCIPAL', descripcion: 'LABOR TECNICA Y PUESTA EN MARCHA', cantidad: 1, precioUnitario: 120.00 }
    ]
  },
  {
    nombre: 'Monitoreo IoT Dragino (Gateway + Sensores)',
    items: [
      { producto: 'GATEWAY', marca: 'DRAGINO', modelo: 'LPS8N', descripcion: 'GATEWAY PRINCIPAL DE MONITOREO', cantidad: 1, precioUnitario: 260.00 },
      { producto: 'TEMPERATURA / HUMEDAD', marca: 'DRAGINO', modelo: 'LHT65N', descripcion: 'MONITOREO DE AMBIENTE', cantidad: 2, precioUnitario: 75.00 },
      { producto: 'SENSOR CORRIENTE AC', marca: 'DRAGINO', modelo: 'SCT013G-D-100', descripcion: 'MONITOREO DE CONSUMO ELECTRICO', cantidad: 3, precioUnitario: 45.00 },
      { producto: 'SERVICIOS DE INSTALACION', marca: 'SILOCOM', modelo: 'INSTALACION Y CONFIGURACION', descripcion: 'PUESTA EN MARCHA Y VINCULACION A PLATAFORMA', cantidad: 1, precioUnitario: 150.00 }
    ]
  },
  {
    nombre: 'Enlace Punto a Punto Inalámbrico 5GHz Ubiquiti',
    items: [
      { producto: 'ANTENA DE RADIOENLACE', marca: 'UBIQUITI', modelo: 'LITEBEAM 5AC GEN2', descripcion: 'PAR DE RADIOS ENLACE PRINCIPAL Y REMOTO', cantidad: 2, precioUnitario: 98.00 },
      { producto: 'CABLES DE RED', marca: 'N/A', modelo: 'N/A', descripcion: 'TIRADA 50 METROS EXTERIOR', cantidad: 2, precioUnitario: 31.40 },
      { producto: 'CONECTORES PLUG RJ45', marca: 'BE CONNECT', modelo: 'CAT 6', descripcion: 'CONECTORES BLINDADOS', cantidad: 4, precioUnitario: 5.30 },
      { producto: 'CAJA PARA EQUIPOS (NEMA)', marca: 'VITRON', modelo: '12CMx10CM', descripcion: 'CAJA ESTANCA PARA MASTIL', cantidad: 1, precioUnitario: 91.00 },
      { producto: 'SERVICIOS DE VISITA TECNICA', marca: 'SILOCOM', modelo: 'COMPLEJA / REINSTALACION MAYOR CIUDAD PRINCIPAL', descripcion: 'ALINEACION Y CERTIFICACION DE ENLACE', cantidad: 1, precioUnitario: 120.00 }
    ]
  }
];
