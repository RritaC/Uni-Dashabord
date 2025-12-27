// Database helper that works with both SQLite (sync) and PostgreSQL (async)
import { initDB, getDB, isPostgres } from './db-adapter.js';

let dbInitialized = false;

// Initialize database on first use
export async function getDatabase() {
    if (!dbInitialized) {
        await initDB();
        dbInitialized = true;
    }
    return getDB();
}

// Helper to execute database operations (handles both sync and async)
export async function dbQuery(sql, params = []) {
    const db = await getDatabase();

    if (isPostgres()) {
        // PostgreSQL - async
        const pgSql = convertSQLiteToPostgres(sql);
        const result = await db.pool.query(pgSql, params);
        return result.rows;
    } else {
        // SQLite - sync
        return db.prepare(sql).all(params);
    }
}

export async function dbGet(sql, params = []) {
    const db = await getDatabase();

    if (isPostgres()) {
        const pgSql = convertSQLiteToPostgres(sql);
        const result = await db.pool.query(pgSql, params);
        return result.rows[0] || null;
    } else {
        return db.prepare(sql).get(params);
    }
}

export async function dbRun(sql, params = []) {
    const db = await getDatabase();

    if (isPostgres()) {
        const pgSql = convertSQLiteToPostgres(sql);
        const result = await db.pool.query(pgSql, params);

        // For INSERT, get the returned id
        if (pgSql.match(/INSERT INTO/i) && result.rows && result.rows.length > 0 && result.rows[0]?.id) {
            return {
                lastInsertRowid: result.rows[0].id,
                changes: result.rowCount || 0
            };
        }

        return {
            lastInsertRowid: null,
            changes: result.rowCount || 0
        };
    } else {
        return db.prepare(sql).run(params);
    }
}

// Convert SQLite syntax to PostgreSQL
function convertSQLiteToPostgres(sql) {
    let pgSql = sql;

    // strftime('%s', 'now') -> EXTRACT(EPOCH FROM NOW())::INTEGER
    pgSql = pgSql.replace(/strftime\('%s',\s*'now'\)/gi, "EXTRACT(EPOCH FROM NOW())::INTEGER");

    // INSERT OR IGNORE -> INSERT ... ON CONFLICT DO NOTHING
    if (pgSql.match(/INSERT OR IGNORE INTO/i)) {
        pgSql = pgSql.replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO');
        // For tables with id as primary key, add ON CONFLICT
        if (pgSql.match(/INSERT INTO\s+grades/i)) {
            pgSql = pgSql.replace(/;?\s*$/, ' ON CONFLICT (id) DO NOTHING;');
        } else {
            pgSql = pgSql.replace(/;?\s*$/, ' ON CONFLICT DO NOTHING;');
        }
    }

    // Handle INSERT with RETURNING for PostgreSQL (only if no ON CONFLICT)
    if (pgSql.match(/INSERT INTO/i) && !pgSql.match(/RETURNING/i) && !pgSql.match(/ON CONFLICT/i)) {
        const tableMatch = pgSql.match(/INSERT INTO\s+(\w+)/i);
        if (tableMatch) {
            const tableName = tableMatch[1];
            // Only add RETURNING for tables with id column
            if (['views', 'universities', 'columns', 'documents', 'cell_formats'].includes(tableName)) {
                pgSql = pgSql.replace(/;?\s*$/, ' RETURNING id;');
            }
        }
    }

    return pgSql;
}

