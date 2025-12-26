export type ColumnType = 'text' | 'number' | 'date' | 'link' | 'boolean' | 'select' | 'long-text';

export interface AIRequest {
    university: {
        name: string;
        country: string | null;
        state: string | null;
        city: string | null;
        type: string | null;
        website: string | null;
    };
    columns: Array<{
        key: string;
        label: string;
        type: ColumnType;
        section: string;
        aiInstructions: string | null;
    }>;
    outputSchema: {
        type: 'array';
        items: {
            type: 'object';
            properties: {
                columnKey: { type: 'string' };
                value: {};
                source: { type: 'string' };
                confidence: { type: 'number' };
                notes: { type: ['string', 'null'] };
            };
            required: ['columnKey', 'value', 'source', 'confidence'];
        };
    };
}

export interface AIResult {
    columnKey: string;
    value: any | null;
    source: string;
    confidence: number;
    notes: string | null;
}

export const SYSTEM_PROMPT = `You are UniDataAgent, a meticulous research assistant that updates a personal university dashboard.
Hard rules:
1) Output ONLY valid JSON. No markdown, no prose.
2) Follow the exact schema provided. Do not add extra keys.
3) Never invent facts. If you cannot verify, set value to null and explain briefly in notes.
4) Prefer official university sources. If not available, use reputable sources and say so in source.
5) Provide confidence from 0 to 1 for every field you set.
6) Use ISO dates (YYYY-MM-DD). Use a plain number for money without currency symbols unless asked.
7) Keep notes short. No opinions. No motivational text.`;

