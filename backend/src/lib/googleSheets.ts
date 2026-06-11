import { google } from 'googleapis';

let _sheets: ReturnType<typeof google.sheets> | null = null;

export function getSheets() {
    if (_sheets) return _sheets;

    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set');

    const credentials = JSON.parse(raw);

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    _sheets = google.sheets({ version: 'v4', auth });
    return _sheets;
}