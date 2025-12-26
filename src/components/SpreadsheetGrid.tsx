import { useState, useEffect, useRef } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { fetchViewData, updateValue } from '../services/api';
import UniversityEditModal from './UniversityEditModal';

interface SpreadsheetGridProps {
    viewId: number;
}

export default function SpreadsheetGrid({ viewId }: SpreadsheetGridProps) {
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCell, setEditingCell] = useState<{ rowId: number; colKey: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editingUniversity, setEditingUniversity] = useState<any | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [viewId]);

    async function loadData() {
        setLoading(true);
        try {
            const result = await fetchViewData(viewId);
            setColumns(result.columns);
            setData(result.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCellSave(rowId: number, colKey: string) {
        try {
            await updateValue(rowId, colKey, viewId, editValue);
            setData(prev => prev.map(row =>
                row.id === rowId ? { ...row, [colKey]: editValue } : row
            ));
            setEditingCell(null);
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save value');
        }
    }

    function startEdit(rowId: number, colKey: string) {
        const row = data.find(r => r.id === rowId);
        setEditValue(row?.[colKey] || '');
        setEditingCell({ rowId, colKey });
    }

    function renderCell(row: any, col: any) {
        const value = row[col.key];
        const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;

        if (isEditing) {
            return (
                <div className="flex items-center gap-1">
                    <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave(row.id, col.key);
                            if (e.key === 'Escape') setEditingCell(null);
                        }}
                        className="w-full px-2 py-1 border border-blue-500 rounded text-sm"
                        autoFocus
                    />
                    <button
                        onClick={() => handleCellSave(row.id, col.key)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setEditingCell(null)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        let displayValue = value === null || value === undefined ? '' : String(value);

        if (col.type === 'link' && value) {
            return (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {displayValue}
                </a>
            );
        }
        if (col.type === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
        }
        if (col.type === 'date' && value) {
            try {
                displayValue = new Date(value).toLocaleDateString();
            } catch (e) {
                // Keep original value
            }
        }

        return (
            <div className="flex items-center justify-between group">
                <span className="truncate text-sm">{displayValue}</span>
                <button
                    onClick={() => startEdit(row.id, col.key)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded"
                >
                    <Edit2 className="w-3 h-3" />
                </button>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    const visibleColumns = columns.filter((c: any) => c.visible);

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto" ref={gridRef}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16 sticky left-0 bg-gray-50 z-20 border-r">
                                <button
                                    onClick={() => { }}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Actions"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </th>
                            {visibleColumns.map((col: any) => (
                                <th
                                    key={col.id}
                                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${col.pinned ? 'sticky left-16 bg-gray-50 z-20 border-r' : ''
                                        }`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 sticky left-0 bg-white z-10 border-r">
                                    <button
                                        onClick={() => setEditingUniversity(row)}
                                        className="text-gray-400 hover:text-blue-600"
                                        title="Edit University"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </td>
                                {visibleColumns.map((col: any) => (
                                    <td
                                        key={col.id}
                                        className={`px-4 py-2 text-sm text-gray-900 ${col.pinned ? 'sticky left-16 bg-white z-10 border-r' : ''
                                            }`}
                                    >
                                        {renderCell(row, col)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingUniversity && (
                <UniversityEditModal
                    university={editingUniversity}
                    onClose={() => {
                        setEditingUniversity(null);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}

