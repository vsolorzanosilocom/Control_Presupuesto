# Silocom - Control de Presupuestos

Sistema corporativo de gestión de presupuestos, catálogos (clientes, sucursales, productos), aprobaciones y facturación por cobrar para Silocom, C.A., sincronizado en tiempo real con Google Sheets.

---

## 🚀 Arquitectura Serverless (Vercel)

- **Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS 4.
- **Backend:** Funciones Serverless de Vercel en la carpeta `/api`:
  - `GET /api/health`: Estado del servicio y metadatos del backend.
  - `GET /api/config`: Configuración de conexión (Google Apps Script y Hoja de Cálculo).
  - `GET /api/sheets/get`: Proxy GET seguro con control de tiempo de espera (60s) hacia Google Apps Script.
  - `POST /api/sheets/post`: Proxy POST para persistencia de presupuestos y registros en Google Sheets.
- **Configuración centralizada:** La URL del script y el ID de la hoja de cálculo están preconfigurados directamente en el backend serverless.

---

## 💻 Desarrollo y Compilación Local

### 1. Instalación de dependencias
```bash
npm install
```

### 2. Probar localmente
Inicia el servidor de desarrollo de Vite (incluye middleware local para las funciones serverless de `/api`):
```bash
npm run dev
```
Abre en tu navegador `http://localhost:3000`.

### 3. Compilar para producción
Para generar el build estático optimizado en la carpeta `dist/`:
```bash
npm run build
```

---

## 🌐 Despliegue en Vercel (Paso a Paso)

1. **Subir los cambios a tu repositorio de GitHub:**
   ```bash
   git add .
   git commit -m "Migración a Vercel Serverless"
   git push origin main
   ```

2. **Importar el proyecto en Vercel:**
   - Inicia sesión en [Vercel](https://vercel.com).
   - Haz clic en **"Add New..."** y selecciona **"Project"**.
   - Conecta tu cuenta de GitHub y elige tu repositorio `Control_Presupuesto`.

3. **Configuración de Vercel (automática):**
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:** **Ninguna.** La aplicación no requiere variables de entorno en Vercel (todas las conexiones ya están integradas de fábrica).

4. **Desplegar:**
   - Haz clic en **"Deploy"**.
   - En menos de un minuto, tu aplicación estará en línea con su dominio `*.vercel.app` completamente operativo con frontend y backend serverless.
