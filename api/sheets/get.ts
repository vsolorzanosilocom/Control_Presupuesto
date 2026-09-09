export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdrJ1Y-TTmvye8A3SW8UyBnog0Kri8fjxWy607KtTDo4mPJZsQ1vPaHX7uRnsYc72Y/exec';

// Max execution time (s). Hobby: cappped at 10s; Pro+: applies this value.
export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (res.setHeader) res.setHeader('Allow', ['GET', 'HEAD']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s for Google Apps Script cold starts

  try {
    const action = (req.query?.action as string) || 'getBDCompleta';
    const scriptUrl = (req.query?.scriptUrl as string) || DEFAULT_SCRIPT_URL;

    const targetUrl = new URL(scriptUrl);
    targetUrl.searchParams.set('action', action);

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow'
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Error HTTP desde Google Apps Script: ${response.statusText}`
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      console.warn('[SERVERLESS PROXY GET] Timeout de espera en Google Apps Script (>60s)');
      return res.status(504).json({
        success: false,
        error: 'El servicio de Google Sheets tardó demasiado en responder. Por favor reintente.'
      });
    }
    console.error('Error in serverless proxy GET /api/sheets/get:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error de conexión con Google Sheets'
    });
  } finally {
    clearTimeout(timeout);
  }
}
