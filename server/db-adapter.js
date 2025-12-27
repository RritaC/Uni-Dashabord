// Database adapter that works with both SQLite (local) and PostgreSQL (production)
// Automatically detects which to use based on DATABASE_URL environment variable

let db = null;
let isPostgres = false;

export async function initDB() {
    if (db) return db;
    
    // Check if we should use PostgreSQL
    if (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL) {
        isPostgres = true;
        const pgModule = await import('./database-pg.js');
        db = await pgModule.default();
        console.log('Using PostgreSQL database');
    } else {
        // Use SQLite for local development
        const sqliteModule = await import('./database.js');
        db = sqliteModule.default;
        console.log('Using SQLite database');
    }
    
    return db;
}

// Get database instance (call initDB first)
export function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call initDB() first.');
    }
    return db;
}

export { isPostgres };

