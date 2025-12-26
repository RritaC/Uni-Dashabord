import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ColumnType } from '../types';
import { createColumn, fetchColumns } from '../services/api';

interface AddColumnModalProps {
    viewId: number;
    column?: any;
    onClose: () => void;
}

const SECTIONS = ['Basics', 'Academics', 'Admissions', 'Costs', 'Housing', 'Visa', 'Culture', 'Custom'];
const COLUMN_TYPES: ColumnType[] = ['text', 'number', 'date', 'link', 'boolean', 'select', 'long-text'];

// Predefined answer format templates
const ANSWER_FORMATS = [
    { value: '', label: 'Custom (use AI Instructions below)' },
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'yes_no_explanation', label: 'Yes/No with Explanation' },
    { value: 'number_only', label: 'Number Only' },
    { value: 'currency', label: 'Currency (number)' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'date_iso', label: 'Date (YYYY-MM-DD)' },
    { value: 'url', label: 'URL/Link' },
    { value: 'short_text', label: 'Short Text (1-2 sentences)' },
    { value: 'long_text', label: 'Long Text (paragraphs)' },
    { value: 'list', label: 'List (comma-separated)' },
];

export default function AddColumnModal({ viewId, column, onClose }: AddColumnModalProps) {
    const [label, setLabel] = useState(column?.label || '');
    const [key, setKey] = useState(column?.key || '');
    const [type, setType] = useState<ColumnType>(column?.type || 'text');
    const [section, setSection] = useState(column?.section || 'Basics');
    const [selectOptions, setSelectOptions] = useState(column?.select_options ? JSON.parse(column.select_options).join(', ') : '');
    const [answerFormat, setAnswerFormat] = useState('');
    const [aiInstructions, setAiInstructions] = useState(column?.ai_instructions || '');
    const [pinned, setPinned] = useState(column?.pinned || false);

    useEffect(() => {
        if (!column && label) {
            setKey(label.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
        }
    }, [label, column]);

    useEffect(() => {
        // Auto-fill AI instructions based on answer format
        if (answerFormat && answerFormat !== '') {
            switch (answerFormat) {
                case 'yes_no':
                    setAiInstructions('Answer with only "Yes" or "No". No explanation needed.');
                    break;
                case 'yes_no_explanation':
                    setAiInstructions('Answer with "Yes" or "No" followed by a brief explanation (1-2 sentences).');
                    break;
                case 'number_only':
                    setAiInstructions('Answer with a number only. No text, no units, no currency symbols.');
                    break;
                case 'currency':
                    setAiInstructions('Answer with a number only (no currency symbols, no commas). This represents the amount in USD.');
                    break;
                case 'percentage':
                    setAiInstructions('Answer with a number only (no % symbol). This represents a percentage.');
                    break;
                case 'date_iso':
                    setAiInstructions('Answer with a date in ISO format (YYYY-MM-DD).');
                    break;
                case 'url':
                    setAiInstructions('Answer with a full URL (https://...).');
                    break;
                case 'short_text':
                    setAiInstructions('Answer with 1-2 short sentences. Be concise.');
                    break;
                case 'long_text':
                    setAiInstructions('Answer with detailed information in paragraph form. Include all relevant details.');
                    break;
                case 'list':
                    setAiInstructions('Answer with a comma-separated list of items.');
                    break;
            }
        }
    }, [answerFormat]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!label || !key) return;

        try {
            // Get max order_index for this view
            const existingColumns = await fetchColumns(viewId);
            const maxOrder = existingColumns.length > 0 
                ? Math.max(...existingColumns.map((c: any) => c.order_index || 0))
                : -1;

            const columnData = {
                key,
                label,
                type,
                section,
                select_options: type === 'select' && selectOptions 
                    ? JSON.stringify(selectOptions.split(',').map(s => s.trim()).filter(Boolean))
                    : null,
                ai_instructions: aiInstructions || null,
                pinned,
                visible: true,
                order_index: maxOrder + 1,
            };

            if (column) {
                // Update existing column
                const { updateColumn } = await import('../services/api');
                await updateColumn(column.id, columnData);
            } else {
                // Create new column
                await createColumn(viewId, columnData);
            }

            onClose();
        } catch (error) {
            console.error('Failed to save column:', error);
            alert('Failed to save column. Please try again.');
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {column ? 'Edit Column' : 'Add Column'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Label *
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Financial Aid Available"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Key (internal identifier) *
                        </label>
                        <input
                            type="text"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            required
                            disabled={!!column}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="e.g., financial_aid_available"
                        />
                        <p className="mt-1 text-xs text-gray-500">Auto-generated from label if left empty</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type *
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as ColumnType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {COLUMN_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section *
                        </label>
                        <select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {SECTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {type === 'select' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Options (comma-separated) *
                            </label>
                            <input
                                type="text"
                                value={selectOptions}
                                onChange={(e) => setSelectOptions(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Public, Private, Hybrid"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Answer Format (for AI)
                        </label>
                        <select
                            value={answerFormat}
                            onChange={(e) => setAnswerFormat(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {ANSWER_FORMATS.map(fmt => (
                                <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Select a format template or use custom instructions below</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            AI Instructions
                        </label>
                        <textarea
                            value={aiInstructions}
                            onChange={(e) => setAiInstructions(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Special instructions for AI when refreshing this column. Examples: 'Answer with only Yes or No', 'Provide a number in USD', 'Include explanation if available'"
                        />
                        <p className="mt-1 text-xs text-gray-500">These instructions guide the AI on how to format the answer for this column</p>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="pinned"
                            checked={pinned}
                            onChange={(e) => setPinned(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <label htmlFor="pinned" className="ml-2 text-sm text-gray-700">
                            Pin column (show in left side of table)
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            {column ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
