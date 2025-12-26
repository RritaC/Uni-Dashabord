import express from 'express';
import db from './database.js';
import { seedDatabase } from './seed.js';

const router = express.Router();

// Seed endpoint
router.post('/seed', (req, res) => {
    try {
        seedDatabase();
        res.json({ success: true, message: 'Database seeded' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Views
router.get('/views', (req, res) => {
    try {
        const views = db.prepare('SELECT * FROM views ORDER BY created_at').all();
        res.json(views);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/views', (req, res) => {
    try {
        const { name } = req.body;
        const result = db.prepare('INSERT INTO views (name) VALUES (?)').run(name);
        res.json({ id: result.lastInsertRowid, name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/views/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM views WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Universities
router.get('/universities', (req, res) => {
    try {
        const unis = db.prepare('SELECT * FROM universities ORDER BY id').all();
        res.json(unis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/universities/:id', (req, res) => {
    try {
        const uni = db.prepare('SELECT * FROM universities WHERE id = ?').get(req.params.id);
        if (!uni) return res.status(404).json({ error: 'Not found' });
        res.json(uni);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/universities', (req, res) => {
    try {
        const { name, country, state, city, type, website, notes } = req.body;
        const result = db.prepare(`
      INSERT INTO universities (name, country, state, city, type, website, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, country, state, city, type, website, notes);
        res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/universities/:id', (req, res) => {
    try {
        const { name, country, state, city, type, website, notes } = req.body;
        db.prepare(`
      UPDATE universities 
      SET name = ?, country = ?, state = ?, city = ?, type = ?, website = ?, notes = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(name, country, state, city, type, website, notes, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/universities/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM universities WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Columns
router.get('/views/:viewId/columns', (req, res) => {
    try {
        const cols = db.prepare('SELECT * FROM columns WHERE view_id = ? ORDER BY order_index').all(req.params.viewId);
        res.json(cols);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/views/:viewId/columns', (req, res) => {
    try {
        const { key, label, type, section, select_options, pinned, visible, order_index, ai_instructions } = req.body;
        const result = db.prepare(`
      INSERT INTO columns (view_id, key, label, type, section, select_options, ai_instructions, pinned, visible, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            req.params.viewId,
            key,
            label,
            type,
            section || 'Basics',
            select_options || null,
            ai_instructions || null,
            pinned ? 1 : 0,
            visible !== undefined ? (visible ? 1 : 0) : 1,
            order_index || 0
        );
        res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/columns/:id', (req, res) => {
    try {
        const { label, type, section, select_options, pinned, visible, order_index } = req.body;
        db.prepare(`
      UPDATE columns 
      SET label = ?, type = ?, section = ?, select_options = ?, pinned = ?, visible = ?, order_index = ?
      WHERE id = ?
    `).run(label, type, section, select_options || null, pinned ? 1 : 0, visible ? 1 : 0, order_index, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/columns/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM columns WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Values
router.get('/views/:viewId/data', (req, res) => {
    try {
        const { viewId } = req.params;
        const unis = db.prepare('SELECT * FROM universities ORDER BY id').all();
        const cols = db.prepare('SELECT * FROM columns WHERE view_id = ? AND visible = 1 ORDER BY order_index').all(viewId);
        const values = db.prepare('SELECT * FROM "values" WHERE view_id = ?').all(viewId);

        const data = unis.map(uni => {
            const row = { id: uni.id, ...uni };
            cols.forEach(col => {
                const val = values.find(v => v.university_id === uni.id && v.column_key === col.key);
                row[col.key] = val ? val.value : null;
            });
            return row;
        });

        res.json({ universities: unis, columns: cols, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/values', (req, res) => {
    try {
        const { university_id, column_key, view_id, value } = req.body;
        const result = db.prepare(`
      INSERT OR REPLACE INTO "values" (university_id, column_key, view_id, value, updated_at)
      VALUES (?, ?, ?, ?, strftime('%s', 'now'))
    `).run(university_id, column_key, view_id, value);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/values', (req, res) => {
    try {
        const { university_id, column_key, view_id, value } = req.body;
        db.prepare(`
      UPDATE "values" 
      SET value = ?, updated_at = strftime('%s', 'now')
      WHERE university_id = ? AND column_key = ? AND view_id = ?
    `).run(value, university_id, column_key, view_id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Documents
router.get('/documents', (req, res) => {
    try {
        const docs = db.prepare('SELECT * FROM documents ORDER BY uploaded_at DESC').all();
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/documents', (req, res) => {
    try {
        const { name, type, size, file_data, tags } = req.body;
        const result = db.prepare(`
      INSERT INTO documents (name, type, size, file_data, tags)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, type, size, file_data || null, tags ? JSON.stringify(tags) : null);
        res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/documents/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Applications
router.get('/applications', (req, res) => {
    try {
        const apps = db.prepare('SELECT * FROM applications ORDER BY created_at DESC').all();
        res.json(apps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/applications', (req, res) => {
    try {
        const { id, name, type, university_id, status, deadline, notes, created_at, updated_at } = req.body;
        db.prepare(`
      INSERT OR REPLACE INTO applications (id, name, type, university_id, status, deadline, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, type, university_id, status, deadline, notes, created_at, updated_at);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/applications/:id', (req, res) => {
    try {
        const { name, type, university_id, status, deadline, notes, updated_at } = req.body;
        db.prepare(`
      UPDATE applications 
      SET name = ?, type = ?, university_id = ?, status = ?, deadline = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).run(name, type, university_id, status, deadline, notes, updated_at, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/applications/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tasks
router.get('/tasks', (req, res) => {
    try {
        const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
        res.json(tasks.map(t => ({ ...t, completed: t.completed === 1 })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/tasks', (req, res) => {
    try {
        const { id, title, completed, due_date, priority, created_at } = req.body;
        db.prepare(`
      INSERT OR REPLACE INTO tasks (id, title, completed, due_date, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, completed ? 1 : 0, due_date, priority, created_at);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/tasks/:id', (req, res) => {
    try {
        const { title, completed, due_date, priority } = req.body;
        db.prepare(`
      UPDATE tasks 
      SET title = ?, completed = ?, due_date = ?, priority = ?
      WHERE id = ?
    `).run(title, completed ? 1 : 0, due_date, priority, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/tasks/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Grades
router.get('/grades', (req, res) => {
    try {
        const grades = db.prepare('SELECT * FROM grades ORDER BY semester, course').all();
        res.json(grades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/grades', (req, res) => {
    try {
        const { id, course, grade, credits, semester, school } = req.body;
        db.prepare(`
      INSERT OR REPLACE INTO grades (id, course, grade, credits, semester, school)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, course, grade, credits, semester, school);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/grades/:id', (req, res) => {
    try {
        const { course, grade, credits, semester, school } = req.body;
        db.prepare(`
      UPDATE grades 
      SET course = ?, grade = ?, credits = ?, semester = ?, school = ?
      WHERE id = ?
    `).run(course, grade, credits, semester, school, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/grades/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM grades WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cell Formats
router.get('/cell-formats/:viewId', (req, res) => {
    try {
        const { viewId } = req.params;
        console.log('Fetching cell formats for view:', viewId);

        // Ensure table exists and has all columns (migration)
        try {
            db.exec(`
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
            `);

            // Add missing columns if they don't exist (migration)
            const columns = db.prepare("PRAGMA table_info(cell_formats)").all();
            const columnNames = columns.map(c => c.name);

            if (!columnNames.includes('font_size')) {
                db.exec('ALTER TABLE cell_formats ADD COLUMN font_size TEXT');
            }
            if (!columnNames.includes('text_align')) {
                db.exec('ALTER TABLE cell_formats ADD COLUMN text_align TEXT');
            }
            if (!columnNames.includes('border_color')) {
                db.exec('ALTER TABLE cell_formats ADD COLUMN border_color TEXT');
            }
            if (!columnNames.includes('border_style')) {
                db.exec('ALTER TABLE cell_formats ADD COLUMN border_style TEXT');
            }
            if (!columnNames.includes('border_width')) {
                db.exec('ALTER TABLE cell_formats ADD COLUMN border_width TEXT');
            }
        } catch (tableError) {
            console.log('Table creation/migration check:', tableError.message);
        }

        const formats = db.prepare(`
            SELECT university_id, column_key, background_color, text_color, bold, italic, underline,
                   font_size, text_align, border_color, border_style, border_width
            FROM cell_formats
            WHERE view_id = ?
        `).all(viewId);

        console.log('Found formats:', formats.length);

        // Convert to a map for easy lookup
        const formatMap = {};
        formats.forEach((f) => {
            const key = `${f.university_id}_${f.column_key}`;
            formatMap[key] = {
                backgroundColor: f.background_color,
                textColor: f.text_color,
                bold: f.bold === 1,
                italic: f.italic === 1,
                underline: f.underline === 1,
                fontSize: f.font_size,
                textAlign: f.text_align,
                borderColor: f.border_color,
                borderStyle: f.border_style,
                borderWidth: f.border_width,
            };
        });
        res.json(formatMap);
    } catch (error) {
        console.error('Error fetching cell formats:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

router.post('/cell-formats', (req, res) => {
    try {
        const { university_id, column_key, view_id, background_color, text_color, bold, italic, underline,
            font_size, text_align, border_color, border_style, border_width } = req.body;

        console.log('Saving cell format:', { university_id, column_key, view_id, background_color });

        // Ensure table exists and has all columns (migration)
        try {
            db.exec(`
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
            `);

            // Add missing columns if they don't exist (migration)
            const columns = db.prepare("PRAGMA table_info(cell_formats)").all();
            const columnNames = columns.map(c => c.name);

            if (!columnNames.includes('font_size')) {
                db.exec('ALTER TABLE cell_formats ADD COLUMN font_size TEXT');
            }
            if (!columnNames.includes('text_align')) {
                db.exec('ALTER TABLE cell_formats ADD COLUMN text_align TEXT');
            }
            if (!columnNames.includes('border_color')) {
                db.exec('ALTER TABLE cell_formats ADD COLUMN border_color TEXT');
            }
            if (!columnNames.includes('border_style')) {
                db.exec('ALTER TABLE cell_formats ADD COLUMN border_style TEXT');
            }
            if (!columnNames.includes('border_width')) {
                db.exec('ALTER TABLE cell_formats ADD COLUMN border_width TEXT');
            }
        } catch (tableError) {
            console.log('Table creation/migration check:', tableError.message);
        }

        const result = db.prepare(`
            INSERT OR REPLACE INTO cell_formats 
            (university_id, column_key, view_id, background_color, text_color, bold, italic, underline,
             font_size, text_align, border_color, border_style, border_width, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `).run(
            university_id,
            column_key,
            view_id,
            background_color || null,
            text_color || null,
            bold ? 1 : 0,
            italic ? 1 : 0,
            underline ? 1 : 0,
            font_size || null,
            text_align || null,
            border_color || null,
            border_style || null,
            border_width || null
        );

        console.log('Cell format saved successfully:', result);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving cell format:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

router.delete('/cell-formats', (req, res) => {
    try {
        const { university_id, column_key, view_id } = req.query;
        db.prepare(`
            DELETE FROM cell_formats 
            WHERE university_id = ? AND column_key = ? AND view_id = ?
        `).run(university_id, column_key, view_id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

