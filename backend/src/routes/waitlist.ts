// backend/src/routes/waitlist.ts
import { Router, Request, Response } from 'express';
import { getNotion } from '../lib/notion.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── In-memory rate limiter ────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return false;
    }
    if (entry.count >= RATE_LIMIT) return true;
    entry.count++;
    return false;
}

// ── POST /waitlist ────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
    const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
        req.socket.remoteAddress ??
        'unknown';

    if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { email } = req.body as { email?: string };

    if (!email || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }

    const normalised = email.trim().toLowerCase();

    try {
        const notion = getNotion();
        const databaseId = process.env.NOTION_DATABASE_ID!;

        // ── Duplicate check ───────────────────────────────────────────────────────
        const existing = await notion.dataSources.query({
            data_source_id: databaseId,
            filter: {
                property: 'Email',
                email: { equals: normalised },
            },
        });

        if (existing.results.length > 0) {
            return res.status(409).json({ error: 'This email is already on the waitlist.' });
        }

        // ── Insert ────────────────────────────────────────────────────────────────
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                Email: {
                    email: normalised,
                },
                'Created At': {
                    date: { start: new Date().toISOString() },
                },
            },
        });

        return res.status(201).json({ message: "You're on the waitlist!" });
    } catch (err) {
        console.error('[waitlist]', err);
        return res.status(500).json({ error: 'Failed to save. Please try again.' });
    }
});

export default router;