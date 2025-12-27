import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use persistent volume on Fly.io (/data), otherwise use local directory
// Fly.io mounts the volume at /data as specified in fly.toml
const dataDir = existsSync('/data') ? '/data' : __dirname;
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'uni-dashboard.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS universities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT,
    state TEXT,
    city TEXT,
    type TEXT,
    website TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "values" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id INTEGER NOT NULL,
    column_key TEXT NOT NULL,
    view_id INTEGER,
    value TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE,
    UNIQUE(university_id, column_key, view_id)
  );

  CREATE TABLE IF NOT EXISTS "values_history" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id INTEGER NOT NULL,
    column_key TEXT NOT NULL,
    view_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    source TEXT,
    confidence REAL,
    notes TEXT,
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cell_formats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE,
    UNIQUE(university_id, column_key, view_id)
  );

  CREATE INDEX IF NOT EXISTS idx_values_lookup ON "values"(university_id, column_key, view_id);
  CREATE INDEX IF NOT EXISTS idx_columns_view ON columns(view_id);
  CREATE INDEX IF NOT EXISTS idx_cell_formats_lookup ON cell_formats(university_id, column_key, view_id);

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    size INTEGER,
    file_data TEXT,
    tags TEXT,
    uploaded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
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
`);

// Migration: Add description column to applications table if it doesn't exist
try {
    const columns = db.prepare("PRAGMA table_info(applications)").all();
    const columnNames = columns.map(c => c.name);
    if (!columnNames.includes('description')) {
        db.exec('ALTER TABLE applications ADD COLUMN description TEXT');
        console.log('Added description column to applications table');
    }
} catch (error) {
    console.log('Migration check for applications.description:', error.message);
}

// Migration: Add description column to tasks table if it doesn't exist
try {
    const columns = db.prepare("PRAGMA table_info(tasks)").all();
    const columnNames = columns.map(c => c.name);
    if (!columnNames.includes('description')) {
        db.exec('ALTER TABLE tasks ADD COLUMN description TEXT');
        console.log('Added description column to tasks table');
    }
} catch (error) {
    console.log('Migration check for tasks.description:', error.message);
}

export default db;

