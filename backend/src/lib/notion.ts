// backend/src/lib/notion.ts
import { Client } from '@notionhq/client';

let _notion: Client | null = null;

export function getNotion() {
    if (_notion) return _notion;
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) throw new Error('NOTION_API_KEY is not set');
    _notion = new Client({ auth: apiKey });
    return _notion;
}