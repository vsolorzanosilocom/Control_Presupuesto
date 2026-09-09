export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdrJ1Y-TTmvye8A3SW8UyBnog0Kri8fjxWy607KtTDo4mPJZsQ1vPaHX7uRnsYc72Y/exec';

// Max execution time (s). Hobby: cappped at 10s; Pro+: applies this value.
export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    if (res.setHeader) res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s for cold-starts and writes

  try {
    const body = req.body || {};
    const scriptUrl = (body.scriptUrl as string) || DEFAULT_SCRIPT_URL;
    const payload = body.payload || body;

    console.log(`[SERVERLESS PROXY POST] Enviando presupuesto a Google Apps Script (${scriptUrl})...`);

    // Direct JSON body with text/plain avoids URL-encoding parse errors in Apps Script
    const jsonBody = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: jsonBody,
      signal: controller.signal,
      redirect: 'follow'
    });

    const responseText = await response.text();
    console.log('[SERVERLESS PROXY POST RESPONSE]', responseText);

    let result: any = { success: true, message: 'Operación enviada a Google Apps Script' };
    try {
      result = JSON.parse(responseText);
    } catch {
      // If Apps Script returns HTML error page
      if (responseText.includes('error') || responseText.includes('Error')) {
        return res.status(400).json({
          success: false,
          error: responseText.slice(0, 300)
        });
      }
    }

    if (result && result.success === false) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      console.warn('[SERVERLESS PROXY POST] Timeout de espera en Google Apps Script (>60s)');
      return res.status(504).json({
        success: false,
        error: 'El servicio de Google Sheets tardó demasiado en guardar. Por favor reintente.'
      });
    }
    console.error('Error in serverless proxy POST /api/sheets/post:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error al transmitir presupuesto a Google Sheets'
    });
  } finally {
    clearTimeout(timeout);
  }
}
