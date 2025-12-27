// PostgreSQL database adapter for Vercel/Supabase
// This replaces SQLite when DATABASE_URL is set (production)
import pg from 'pg';
const { Pool } = pg;

let pool = null;

// Initialize PostgreSQL connection
function initPostgres() {
    if (pool) return pool;

    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL or SUPABASE_DB_URL must be set for PostgreSQL');
    }

    pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        // Connection pool settings for serverless
        max: 1, // Limit connections for serverless
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

    // Handle connection errors
    pool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
    });

    return pool;
}

// SQLite-compatible interface using PostgreSQL
class PostgresDB {
    constructor() {
        this.pool = initPostgres();
    }

    // Execute a query and return results (like SQLite's .all())
    async query(sql, params = []) {
        // Convert SQLite syntax to PostgreSQL
        const pgSql = this.convertSQLiteToPostgres(sql);
        const result = await this.pool.query(pgSql, params);
        return result.rows;
    }

    // Execute a query and return first result (like SQLite's .get())
    async get(sql, params = []) {
        const rows = await this.query(sql, params);
        return rows[0] || null;
    }

    // Execute a query and return result with lastInsertRowid (like SQLite's .run())
    async run(sql, params = []) {
        const pgSql = this.convertSQLiteToPostgres(sql);
        const result = await this.pool.query(pgSql, params);

        // Return SQLite-compatible result
        return {
            lastInsertRowid: result.rows[0]?.id || result.insertId || null,
            changes: result.rowCount || 0,
        };
    }

    // Prepare statement (returns a prepared query object)
    prepare(sql) {
        const pgSql = this.convertSQLiteToPostgres(sql);

        return {
            all: async (params) => await this.query(pgSql, params),
            get: async (params) => await this.get(pgSql, params),
            run: async (params) => await this.run(pgSql, params),
        };
    }

    // Execute multiple statements
    async exec(sql) {
        // Split by semicolon and execute each
        const statements = sql.split(';').filter(s => s.trim());
        for (const statement of statements) {
            if (statement.trim()) {
                await this.pool.query(statement.trim());
            }
        }
    }

    // Convert SQLite syntax to PostgreSQL
    convertSQLiteToPostgres(sql) {
        let pgSql = sql;

        // INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL PRIMARY KEY
        pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');

        // INTEGER -> INTEGER (same)
        // TEXT -> TEXT (same)
        // REAL -> REAL (same)

        // strftime('%s', 'now') -> EXTRACT(EPOCH FROM NOW())
        pgSql = pgSql.replace(/strftime\('%s',\s*'now'\)/gi, "EXTRACT(EPOCH FROM NOW())::INTEGER");

        // Handle INSERT with RETURNING
        if (pgSql.match(/INSERT INTO/i) && !pgSql.match(/RETURNING/i)) {
            // Add RETURNING id for tables with id column
            const tableMatch = pgSql.match(/INSERT INTO\s+(\w+)/i);
            if (tableMatch) {
                pgSql = pgSql.replace(/;?\s*$/, ' RETURNING id;');
            }
        }

        return pgSql;
    }

    // Initialize database schema
    async initSchema() {
        try {
            const schema = `
            CREATE TABLE IF NOT EXISTS views (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                created_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
            );

            CREATE TABLE IF NOT EXISTS universities (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                country TEXT,
                state TEXT,
                city TEXT,
                type TEXT,
                website TEXT,
                notes TEXT,
                created_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER,
                updated_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
            );

            CREATE TABLE IF NOT EXISTS columns (
                id SERIAL PRIMARY KEY,
                view_id INTEGER,
                key TEXT NOT NULL,
                label TEXT NOT NULL,
                type TEXT NOT NULL,
                section TEXT,
                select_options TEXT,
                ai_instructions TEXT,
                pinned INTEGER DEFAULT 0,
                visible INTEGER DEFAULT 1,
                order_index INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER,
                FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "values" (
                id SERIAL PRIMARY KEY,
                university_id INTEGER NOT NULL,
                column_key TEXT NOT NULL,
                view_id INTEGER,
                value TEXT,
                created_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER,
                updated_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER,
                FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
                FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE,
                UNIQUE(university_id, column_key, view_id)
            );

            CREATE TABLE IF NOT EXISTS values_history (
                id SERIAL PRIMARY KEY,
                university_id INTEGER NOT NULL,
                column_key TEXT NOT NULL,
                view_id INTEGER,
                old_value TEXT,
                new_value TEXT,
                source TEXT,
                confidence REAL,
                notes TEXT,
                timestamp INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER,
                FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
                FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS cell_formats (
                id SERIAL PRIMARY KEY,
                university_id INTEGER NOT NULL,
                column_key TEXT NOT NULL,
                view_id INTEGER NOT NULL,
                background_color TEXT,
                text_color TEXT,
                bold INTEGER DEFAULT 0,
                italic INTEGER DEFAULT 0,
                underline INTEGER DEFAULT 0,
                font_size TEXT,
                text_align TEXT,
                border_color TEXT,
                border_style TEXT,
                border_width TEXT,
                created_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER,
                updated_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER,
                FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
                FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE,
                UNIQUE(university_id, column_key, view_id)
            );

            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT,
                size INTEGER,
                file_data TEXT,
                tags TEXT,
                uploaded_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
            );

            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                name TEXT,
                type TEXT NOT NULL,
                university_id INTEGER,
                status TEXT NOT NULL,
                deadline TEXT,
                description TEXT,
                notes TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                completed INTEGER DEFAULT 0,
                due_date TEXT,
                priority TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS grades (
                id TEXT PRIMARY KEY,
                course TEXT NOT NULL,
                grade TEXT NOT NULL,
                credits REAL NOT NULL,
                semester TEXT NOT NULL,
                school TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_values_lookup ON "values"(university_id, column_key, view_id);
            CREATE INDEX IF NOT EXISTS idx_columns_view ON columns(view_id);
            CREATE INDEX IF NOT EXISTS idx_cell_formats_lookup ON cell_formats(university_id, column_key, view_id);
        `;

            await this.exec(schema);
        } catch (error) {
            // Schema might already exist, that's okay
            if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
                console.error('Error initializing schema:', error.message);
                // Don't throw - schema might already be set up
            }
        }
    }
}

// Export singleton instance
let dbInstance = null;

export default async function getDB() {
    if (dbInstance) return dbInstance;

    // Use PostgreSQL if DATABASE_URL is set, otherwise use SQLite
    if (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL) {
        dbInstance = new PostgresDB();
        // Initialize schema on first use (don't fail if it already exists)
        try {
            await dbInstance.initSchema();
        } catch (error) {
            console.error('Schema initialization error (may be safe to ignore):', error.message);
            // Continue anyway - schema might already exist
        }
    } else {
        // Fall back to SQLite for local development
        const sqliteDB = await import('./database.js');
        dbInstance = sqliteDB.default;
    }

    return dbInstance;
}

