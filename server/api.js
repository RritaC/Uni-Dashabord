import express from 'express';
import { dbQuery, dbGet, dbRun } from './db-helper.js';
import { seedDatabase } from './seed.js';

const router = express.Router();

// Seed endpoint
router.post('/seed', async (req, res) => {
    try {
        await seedDatabase();
        res.json({ success: true, message: 'Database seeded' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Views
router.get('/views', async (req, res) => {
    try {
        const views = await dbQuery('SELECT * FROM views ORDER BY created_at');
        res.json(views);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/views', async (req, res) => {
    try {
        const { name } = req.body;
        const result = await dbRun('INSERT INTO views (name) VALUES (?)', [name]);
        res.json({ id: result.lastInsertRowid, name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/views/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM views WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Universities
router.get('/universities', async (req, res) => {
    try {
        const unis = await dbQuery('SELECT * FROM universities ORDER BY id');
        res.json(unis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/universities/:id', async (req, res) => {
    try {
        const uni = await dbGet('SELECT * FROM universities WHERE id = ?', [req.params.id]);
        if (!uni) return res.status(404).json({ error: 'Not found' });
        res.json(uni);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/universities', async (req, res) => {
    try {
        const { name, country, state, city, type, website, notes } = req.body;
        const result = await dbRun(`
      INSERT INTO universities (name, country, state, city, type, website, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, country, state, city, type, website, notes]);
        res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/universities/:id', async (req, res) => {
    try {
        const { name, country, state, city, type, website, notes } = req.body;
        await dbRun(`
      UPDATE universities 
      SET name = ?, country = ?, state = ?, city = ?, type = ?, website = ?, notes = ?, updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
      WHERE id = ?
    `, [name, country, state, city, type, website, notes, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/universities/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM universities WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Columns
router.get('/views/:viewId/columns', async (req, res) => {
    try {
        const cols = await dbQuery('SELECT * FROM columns WHERE view_id = ? ORDER BY order_index', [req.params.viewId]);
        res.json(cols);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/views/:viewId/columns', async (req, res) => {
    try {
        const { key, label, type, section, select_options, pinned, visible, order_index, ai_instructions } = req.body;
        const result = await dbRun(`
      INSERT INTO columns (view_id, key, label, type, section, select_options, ai_instructions, pinned, visible, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
        ]);
        res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/columns/:id', async (req, res) => {
    try {
        const { label, type, section, select_options, pinned, visible, order_index } = req.body;
        await dbRun(`
      UPDATE columns 
      SET label = ?, type = ?, section = ?, select_options = ?, pinned = ?, visible = ?, order_index = ?
      WHERE id = ?
    `, [label, type, section, select_options || null, pinned ? 1 : 0, visible ? 1 : 0, order_index, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/columns/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM columns WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Values
router.get('/views/:viewId/data', async (req, res) => {
    try {
        const { viewId } = req.params;
        const unis = await dbQuery('SELECT * FROM universities ORDER BY id');
        const cols = await dbQuery('SELECT * FROM columns WHERE view_id = ? AND visible = 1 ORDER BY order_index', [viewId]);
        const values = await dbQuery('SELECT * FROM "values" WHERE view_id = ?', [viewId]);

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

router.post('/values', async (req, res) => {
    try {
        const { university_id, column_key, view_id, value } = req.body;
        await dbRun(`
      INSERT INTO "values" (university_id, column_key, view_id, value, updated_at)
      VALUES (?, ?, ?, ?, EXTRACT(EPOCH FROM NOW())::INTEGER)
      ON CONFLICT (university_id, column_key, view_id) 
      DO UPDATE SET value = EXCLUDED.value, updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
    `, [university_id, column_key, view_id, value]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/values', async (req, res) => {
    try {
        const { university_id, column_key, view_id, value } = req.body;
        await dbRun(`
      UPDATE "values" 
      SET value = ?, updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
      WHERE university_id = ? AND column_key = ? AND view_id = ?
    `, [value, university_id, column_key, view_id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Documents
router.get('/documents', async (req, res) => {
    try {
        const docs = await dbQuery('SELECT * FROM documents ORDER BY uploaded_at DESC');
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/documents', async (req, res) => {
    try {
        const { name, type, size, file_data, tags } = req.body;
        const result = await dbRun(`
      INSERT INTO documents (name, type, size, file_data, tags)
      VALUES (?, ?, ?, ?, ?)
    `, [name, type, size, file_data || null, tags ? JSON.stringify(tags) : null]);
        res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/documents/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM documents WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Applications
router.get('/applications', async (req, res) => {
    try {
        const apps = await dbQuery('SELECT * FROM applications ORDER BY created_at DESC');
        res.json(apps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/applications', async (req, res) => {
    try {
        const { id, name, type, university_id, status, deadline, description, notes, created_at, updated_at } = req.body;
        await dbRun(`
      INSERT INTO applications (id, name, type, university_id, status, deadline, description, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) 
      DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, university_id = EXCLUDED.university_id, 
                    status = EXCLUDED.status, deadline = EXCLUDED.deadline, description = EXCLUDED.description, 
                    notes = EXCLUDED.notes, updated_at = EXCLUDED.updated_at
    `, [id, name, type, university_id, status, deadline, description || null, notes, created_at, updated_at]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/applications/:id', async (req, res) => {
    try {
        const { name, type, university_id, status, deadline, description, notes, updated_at } = req.body;
        await dbRun(`
      UPDATE applications 
      SET name = ?, type = ?, university_id = ?, status = ?, deadline = ?, description = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `, [name, type, university_id, status, deadline, description || null, notes, updated_at, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/applications/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM applications WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tasks
router.get('/tasks', async (req, res) => {
    try {
        const tasks = await dbQuery('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json(tasks.map(t => ({ ...t, completed: t.completed === 1 })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/tasks', async (req, res) => {
    try {
        const { id, title, description, completed, due_date, priority, created_at } = req.body;
        await dbRun(`
      INSERT INTO tasks (id, title, description, completed, due_date, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) 
      DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, completed = EXCLUDED.completed, 
                    due_date = EXCLUDED.due_date, priority = EXCLUDED.priority
    `, [id, title, description || null, completed ? 1 : 0, due_date, priority, created_at]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/tasks/:id', async (req, res) => {
    try {
        const { title, description, completed, due_date, priority } = req.body;
        await dbRun(`
      UPDATE tasks 
      SET title = ?, description = ?, completed = ?, due_date = ?, priority = ?
      WHERE id = ?
    `, [title, description || null, completed ? 1 : 0, due_date, priority, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/tasks/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Grades
router.get('/grades', async (req, res) => {
    try {
        const grades = await dbQuery('SELECT * FROM grades ORDER BY semester, course');
        res.json(grades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/grades', async (req, res) => {
    try {
        const { id, course, grade, credits, semester, school } = req.body;
        await dbRun(`
      INSERT INTO grades (id, course, grade, credits, semester, school)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) 
      DO UPDATE SET course = EXCLUDED.course, grade = EXCLUDED.grade, credits = EXCLUDED.credits, 
                    semester = EXCLUDED.semester, school = EXCLUDED.school
    `, [id, course, grade, credits, semester, school]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/grades/:id', async (req, res) => {
    try {
        const { course, grade, credits, semester, school } = req.body;
        await dbRun(`
      UPDATE grades 
      SET course = ?, grade = ?, credits = ?, semester = ?, school = ?
      WHERE id = ?
    `, [course, grade, credits, semester, school, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/grades/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM grades WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cell Formats
router.get('/cell-formats/:viewId', async (req, res) => {
    try {
        const { viewId } = req.params;
        console.log('Fetching cell formats for view:', viewId);

        const formats = await dbQuery(`
            SELECT university_id, column_key, background_color, text_color, bold, italic, underline,
                   font_size, text_align, border_color, border_style, border_width
            FROM cell_formats
            WHERE view_id = ?
        `, [viewId]);

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

router.post('/cell-formats', async (req, res) => {
    try {
        const { university_id, column_key, view_id, background_color, text_color, bold, italic, underline,
            font_size, text_align, border_color, border_style, border_width } = req.body;

        console.log('Saving cell format:', { university_id, column_key, view_id, background_color });

        await dbRun(`
            INSERT INTO cell_formats 
            (university_id, column_key, view_id, background_color, text_color, bold, italic, underline,
             font_size, text_align, border_color, border_style, border_width, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, EXTRACT(EPOCH FROM NOW())::INTEGER)
            ON CONFLICT (university_id, column_key, view_id) 
            DO UPDATE SET background_color = EXCLUDED.background_color, text_color = EXCLUDED.text_color,
                          bold = EXCLUDED.bold, italic = EXCLUDED.italic, underline = EXCLUDED.underline,
                          font_size = EXCLUDED.font_size, text_align = EXCLUDED.text_align,
                          border_color = EXCLUDED.border_color, border_style = EXCLUDED.border_style,
                          border_width = EXCLUDED.border_width, updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
        `, [
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
        ]);

        console.log('Cell format saved successfully');
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving cell format:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

router.delete('/cell-formats', async (req, res) => {
    try {
        const { university_id, column_key, view_id } = req.query;
        await dbRun(`
            DELETE FROM cell_formats 
            WHERE university_id = ? AND column_key = ? AND view_id = ?
        `, [university_id, column_key, view_id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

