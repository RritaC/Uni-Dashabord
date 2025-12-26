import Dexie, { Table } from 'dexie';

export interface University {
    id?: number;
    name: string;
    country: string | null;
    state: string | null;
    city: string | null;
    type: string | null;
    website: string | null;
    createdAt: number;
    updatedAt: number;
}

export interface Column {
    id?: number;
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'link' | 'boolean' | 'select' | 'long-text';
    section: string;
    selectOptions?: string[];
    aiInstructions?: string | null;
    pinned: boolean;
    visible: boolean;
    order: number;
    createdAt: number;
}

export interface Value {
    id?: number;
    universityId: number;
    columnKey: string;
    value: any;
    createdAt: number;
    updatedAt: number;
}

export interface ValueHistory {
    id?: number;
    universityId: number;
    columnKey: string;
    oldValue: any;
    newValue: any;
    source: string;
    confidence: number;
    notes: string | null;
    timestamp: number;
}

class UniDashboardDB extends Dexie {
    universities!: Table<University>;
    columns!: Table<Column>;
    values!: Table<Value>;
    valuesHistory!: Table<ValueHistory>;

    constructor() {
        super('UniDashboardDB');
        this.version(1).stores({
            universities: '++id, name, country, city, type, createdAt, updatedAt',
            columns: '++id, key, section, order, pinned, visible',
            values: '++id, [universityId+columnKey], universityId, columnKey, updatedAt',
            valuesHistory: '++id, universityId, columnKey, timestamp'
        });
    }
}

export const db = new UniDashboardDB();

