// Use environment variable for API base URL, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

export async function fetchViews() {
    const res = await fetch(`${API_BASE}/views`);
    return res.json();
}

export async function createView(name: string) {
    const res = await fetch(`${API_BASE}/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    return res.json();
}

export async function deleteView(id: number) {
    const res = await fetch(`${API_BASE}/views/${id}`, { method: 'DELETE' });
    return res.json();
}

export async function fetchViewData(viewId: number) {
    const res = await fetch(`${API_BASE}/views/${viewId}/data`);
    return res.json();
}

export async function fetchUniversity(id: number) {
    const res = await fetch(`${API_BASE}/universities/${id}`);
    return res.json();
}

export async function createUniversity(data: any) {
    const res = await fetch(`${API_BASE}/universities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function updateUniversity(id: number, data: any) {
    const res = await fetch(`${API_BASE}/universities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteUniversity(id: number) {
    const res = await fetch(`${API_BASE}/universities/${id}`, { method: 'DELETE' });
    return res.json();
}

export async function fetchColumns(viewId: number) {
    const res = await fetch(`${API_BASE}/views/${viewId}/columns`);
    return res.json();
}

export async function createColumn(viewId: number, data: any) {
    const res = await fetch(`${API_BASE}/views/${viewId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function fetchUniversities() {
    const res = await fetch(`${API_BASE}/universities`);
    return res.json();
}

export async function updateColumn(id: number, data: any) {
    const res = await fetch(`${API_BASE}/columns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteColumn(id: number) {
    const res = await fetch(`${API_BASE}/columns/${id}`, { method: 'DELETE' });
    return res.json();
}

export async function updateValue(universityId: number, columnKey: string, viewId: number, value: any) {
    const res = await fetch(`${API_BASE}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ university_id: universityId, column_key: columnKey, view_id: viewId, value }),
    });
    return res.json();
}

// Documents
export async function fetchDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    return res.json();
}

export async function createDocument(data: any) {
    const res = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteDocument(id: number) {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    return res.json();
}

// Applications
export async function fetchApplications() {
    const res = await fetch(`${API_BASE}/applications`);
    return res.json();
}

export async function saveApplication(data: any) {
    const res = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function updateApplication(id: string, data: any) {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteApplication(id: string) {
    const res = await fetch(`${API_BASE}/applications/${id}`, { method: 'DELETE' });
    return res.json();
}

// Tasks
export async function fetchTasks() {
    const res = await fetch(`${API_BASE}/tasks`);
    return res.json();
}

export async function saveTask(data: any) {
    const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function updateTask(id: string, data: any) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteTask(id: string) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    return res.json();
}

// Grades
export async function fetchGrades() {
    const res = await fetch(`${API_BASE}/grades`);
    return res.json();
}

export async function saveGrade(data: any) {
    const res = await fetch(`${API_BASE}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function updateGrade(id: string, data: any) {
    const res = await fetch(`${API_BASE}/grades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteGrade(id: string) {
    const res = await fetch(`${API_BASE}/grades/${id}`, { method: 'DELETE' });
    return res.json();
}

// Cell Formats
export async function fetchCellFormats(viewId: number) {
    const res = await fetch(`${API_BASE}/cell-formats/${viewId}`);
    return res.json();
}

export async function saveCellFormat(data: {
    university_id: number;
    column_key: string;
    view_id: number;
    background_color?: string | null;
    text_color?: string | null;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    font_size?: string | null;
    text_align?: string | null;
    border_color?: string | null;
    border_style?: string | null;
    border_width?: string | null;
}) {
    const res = await fetch(`${API_BASE}/cell-formats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteCellFormat(universityId: number, columnKey: string, viewId: number) {
    const res = await fetch(`${API_BASE}/cell-formats?university_id=${universityId}&column_key=${columnKey}&view_id=${viewId}`, {
        method: 'DELETE',
    });
    return res.json();
}

