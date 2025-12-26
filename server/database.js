import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'uni-dashboard.db'));

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
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
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

export default db;

