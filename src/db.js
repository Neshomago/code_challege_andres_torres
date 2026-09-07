import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

mkdirSync('./data', { recursive: true });

export const db = new DatabaseSync('./db/audit.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_url TEXT NOT NULL
    filter_type TEXT NOT NULL
    filter_params TEXT NOT NULL
    result_count INTEGER NOT NULL
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
`);

export const saveAudit = (filtertype, params, count, utl) => {
    db.prepare(`
        INSERT INTO audit (source_url, filter_type, filter_params, result_count)
        VALUES (?, ?, ?, ?)
    `).run(url, filtertype, JSON.stringify(params), count)
}

export const getRecentAudit = (limit = 20) => db.prepare(`SELECT * FROM audit ORDER BY create_at DESC LIMIT ?`, all(limit));