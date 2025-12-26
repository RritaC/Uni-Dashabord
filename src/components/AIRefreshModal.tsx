import { useState, useEffect } from 'react';
import { generateAIValues } from '../services/ai';
import { AIRequest } from '../types';
import { updateValue } from '../services/api';
import { useSettingsStore } from '../store/settings';
import { X, RefreshCw } from 'lucide-react';

interface AIRefreshModalProps {
    universities: any[];
    columns: any[];
    viewId?: number;
    onClose: () => void;
}

export default function AIRefreshModal({ universities, columns, viewId, onClose }: AIRefreshModalProps) {
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const settings = useSettingsStore();

    useEffect(() => {
        // Ensure AI is initialized
        settings.loadSettings();
    }, []);

    async function handleRefresh() {
        if (selectedColumns.length === 0 || universities.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            for (const uni of universities) {
                const colsToRefresh = columns.filter(c => selectedColumns.includes(c.key));

                const request: AIRequest = {
                    university: {
                        name: uni.name,
                        country: uni.country,
                        state: uni.state,
                        city: uni.city,
                        type: uni.type,
                        website: uni.website,
                    },
                    columns: colsToRefresh
                        .filter(c => c && c.key) // Filter out invalid columns
                        .map(c => ({
                            key: c.key,
                            label: c.label || c.key,
                            type: c.type || 'text',
                            section: c.section || 'Basics',
                            aiInstructions: c.ai_instructions || c.aiInstructions || null,
                        })),
                    outputSchema: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                columnKey: { type: 'string' },
                                value: {},
                                source: { type: 'string' },
                                confidence: { type: 'number' },
                                notes: { type: ['string', 'null'] },
                            },
                            required: ['columnKey', 'value', 'source', 'confidence'],
                        },
                    },
                };

                const results = await generateAIValues(request);

                // Save all updates using API
                if (viewId) {
                    for (const result of results) {
                        if (uni.id) {
                            await updateValue(uni.id, result.columnKey, viewId, result.value);
                        }
                    }
                }
            }

            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to refresh data');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">AI Refresh</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-3">
                            Refreshing {universities.length} universit{universities.length === 1 ? 'y' : 'ies'}
                        </p>
                        <p className="text-sm font-medium text-gray-700 mb-2">Select columns to refresh:</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {columns.map(col => (
                                <label key={col.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedColumns.includes(col.key)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedColumns([...selectedColumns, col.key]);
                                            } else {
                                                setSelectedColumns(selectedColumns.filter(k => k !== col.key));
                                            }
                                        }}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={loading || selectedColumns.length === 0}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Refreshing...
                                </>
                            ) : (
                                'Refresh'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

