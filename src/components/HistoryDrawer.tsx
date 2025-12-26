import { useEffect, useState } from 'react';
import { db, ValueHistory } from '../db/database';
import { X } from 'lucide-react';

interface HistoryDrawerProps {
    universityId: number;
    onClose: () => void;
}

export default function HistoryDrawer({ universityId, onClose }: HistoryDrawerProps) {
    const [history, setHistory] = useState<ValueHistory[]>([]);

    useEffect(() => {
        loadHistory();
    }, [universityId]);

    async function loadHistory() {
        const hist = await db.valuesHistory
            .where('universityId')
            .equals(universityId)
            .toArray();
        hist.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(hist);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
            <div className="bg-white h-full w-full max-w-2xl shadow-xl flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Change History</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {history.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No history available</p>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.columnKey}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-gray-700">
                                                Confidence: {(item.confidence * 100).toFixed(0)}%
                                            </p>
                                            <p className="text-xs text-gray-500">{item.source}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1">
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs font-medium text-red-600 w-12">Old:</span>
                                            <span className="text-xs text-gray-700 flex-1">
                                                {item.oldValue === null ? 'null' : String(item.oldValue)}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs font-medium text-green-600 w-12">New:</span>
                                            <span className="text-xs text-gray-700 flex-1">
                                                {item.newValue === null ? 'null' : String(item.newValue)}
                                            </span>
                                        </div>
                                        {item.notes && (
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <p className="text-xs text-gray-600">{item.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

