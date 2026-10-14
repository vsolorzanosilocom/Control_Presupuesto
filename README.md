# Silocom — Control de Presupuestos

Aplicación web para gestionar presupuestos, catálogos de clientes, sucursales y productos, aprobaciones y facturas por cobrar de Silocom, C.A. El frontend usa React 19, TypeScript, Vite 6 y Tailwind CSS 4. La persistencia y sincronización se realizan con Google Sheets a través de Google Apps Script (GAS).

## Arquitectura

- **Frontend:** aplicación React/Vite en `src/`, con servicios en `src/services/`, componentes en `src/components/` y catálogos iniciales en `src/data/`.
- **Backend de desarrollo:** las funciones de `api/` implementan endpoints compatibles con Vercel. `vite.config.ts` incluye middleware para que esos endpoints estén disponibles al ejecutar Vite localmente.
- **Endpoints:** `GET /api/health`, `GET /api/config`, `GET /api/sheets/get` y `POST /api/sheets/post`.
- **Integración de datos:** los endpoints proxy envían solicitudes a la Web App de GAS. `src/services/apiService.ts` también permite una solicitud directa a GAS cuando falla el proxy.
- **Configuración:** `api/config.ts`, `api/health.ts` y los handlers de Sheets incluyen valores predeterminados de conexión. La aplicación también permite administrar la configuración desde su interfaz y conservarla en el navegador.
- **Backend GAS:** `CODIGO.GS` contiene la copia local del código de Apps Script; no se ejecuta como parte del build de Vite.

## Requisitos y desarrollo local

Se requiere Node.js y npm.

```bash
npm install
npm run dev
```

El middleware local de Vite expone las rutas `/api/`; el servidor de desarrollo se configura en el puerto `3000`. Para validar tipos y compilar:

```bash
npm run lint
npm run build
```

La salida de producción se genera en `dist/`.

## Despliegue en Vercel

Importa el proyecto en Vercel y configura:

- **Framework:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`

Vercel detecta los handlers de `api/` como funciones serverless. La configuración predeterminada de conexión está en el backend; no se requieren variables de entorno para usar esos valores predeterminados. La aplicación también permite configurar otra conexión desde la interfaz. En ese caso, verifica que la URL de GAS y la hoja de cálculo seleccionadas sean válidas y accesibles.

## Estructura principal

```text
├── api/
│   ├── config.ts
│   ├── health.ts
│   └── sheets/
│       ├── get.ts
│       └── post.ts
├── src/
│   ├── components/
│   ├── data/
│   ├── services/
│   ├── utils/
│   ├── App.tsx
│   ├── types.ts
│   └── main.tsx
├── CODIGO.GS
├── package.json
├── vercel.json
└── vite.config.ts
```

## Notas de configuración

- Las funciones proxy usan valores predeterminados definidos en el backend; el cliente consulta `/api/config` y puede guardar sus preferencias localmente.
- La configuración guardada en el navegador es local a ese navegador y no reemplaza la configuración predeterminada del backend para otros usuarios.
- El despliegue del código de Apps Script es independiente del despliegue de Vercel. Mantén el backend publicado y con permisos adecuados para acceder a Google Sheets.
