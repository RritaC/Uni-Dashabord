-- Supabase PostgreSQL Schema for Uni Dashboard
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Views table
CREATE TABLE IF NOT EXISTS views (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
);

-- Universities table
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

-- Columns table
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

-- Values table (quoted because "values" is a reserved word)
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

-- Values history table
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

-- Cell formats table
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

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    size INTEGER,
    file_data TEXT,
    tags TEXT,
    uploaded_at INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
);

-- Applications table
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

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    due_date TEXT,
    priority TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    course TEXT NOT NULL,
    grade TEXT NOT NULL,
    credits REAL NOT NULL,
    semester TEXT NOT NULL,
    school TEXT NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_values_lookup ON "values"(university_id, column_key, view_id);
CREATE INDEX IF NOT EXISTS idx_columns_view ON columns(view_id);
CREATE INDEX IF NOT EXISTS idx_cell_formats_lookup ON cell_formats(university_id, column_key, view_id);

