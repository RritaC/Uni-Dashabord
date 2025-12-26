import { useEffect, useState } from 'react';
import { db, Column } from '../db/database';
import { X, Plus, Edit2, Trash2, Eye, EyeOff, Pin, PinOff } from 'lucide-react';
import AddColumnModal from './AddColumnModal';

interface ColumnManagerProps {
    onClose: () => void;
}

export default function ColumnManager({ onClose }: ColumnManagerProps) {
    const [columns, setColumns] = useState<Column[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingColumn, setEditingColumn] = useState<Column | null>(null);

    useEffect(() => {
        loadColumns();
    }, []);

    async function loadColumns() {
        const cols = await db.columns.orderBy('order').toArray();
        setColumns(cols);
    }

    async function toggleVisibility(col: Column) {
        await db.columns.update(col.id!, { visible: !col.visible });
        loadColumns();
    }

    async function togglePin(col: Column) {
        await db.columns.update(col.id!, { pinned: !col.pinned });
        loadColumns();
    }

    async function deleteColumn(col: Column) {
        if (confirm(`Delete column "${col.label}"? This will also delete all values for this column.`)) {
            await db.columns.delete(col.id!);
            await db.values.where('columnKey').equals(col.key).delete();
            loadColumns();
        }
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Manage Columns</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Column
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-2">
                        {columns.map((col) => (
                            <div
                                key={col.id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{col.label}</span>
                                        <span className="text-xs text-gray-500">{col.key} • {col.type} • {col.section}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => togglePin(col)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600"
                                        title={col.pinned ? 'Unpin' : 'Pin'}
                                    >
                                        {col.pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => toggleVisibility(col)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600"
                                        title={col.visible ? 'Hide' : 'Show'}
                                    >
                                        {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setEditingColumn(col)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteColumn(col)}
                                        className="p-1.5 text-gray-400 hover:text-red-600"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showAddModal && (
                <AddColumnModal
                    onClose={() => {
                        setShowAddModal(false);
                        loadColumns();
                    }}
                />
            )}

            {editingColumn && (
                <AddColumnModal
                    column={editingColumn}
                    onClose={() => {
                        setEditingColumn(null);
                        loadColumns();
                    }}
                />
            )}
        </div>
    );
}

