export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdrJ1Y-TTmvye8A3SW8UyBnog0Kri8fjxWy607KtTDo4mPJZsQ1vPaHX7uRnsYc72Y/exec';
export const DEFAULT_SPREADSHEET_ID = '1KBpl5KQH9R2LS2o6phmTCWAJwnWbVJrEqSikOMW5WNg';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (res.setHeader) res.setHeader('Allow', ['GET', 'HEAD']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return res.status(200).json({
    status: 'ok',
    scriptUrl: DEFAULT_SCRIPT_URL,
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    timestamp: new Date().toISOString()
  });
}
