import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { fetchViews, createView, fetchViewData } from '../services/api';
import SpreadsheetGrid from './SpreadsheetGrid';
import AIRefreshModal from './AIRefreshModal';

interface UniversityGridProps {
    universityId: number;
    university: any;
    onBack: () => void;
}

export default function UniversityGrid({ universityId, university, onBack }: UniversityGridProps) {
    const [views, setViews] = useState<any[]>([]);
    const [activeViewId, setActiveViewId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [newViewName, setNewViewName] = useState('');
    const [showNewViewInput, setShowNewViewInput] = useState(false);
    const [showAIRefresh, setShowAIRefresh] = useState(false);
    const [columns, setColumns] = useState<any[]>([]);

    useEffect(() => {
        loadViews();
    }, [universityId]);

    useEffect(() => {
        if (activeViewId) {
            loadViewData();
        }
    }, [activeViewId]);

    async function loadViews() {
        try {
            const data = await fetchViews();
            setViews(data);
            // Find or create General view
            const generalView = data.find((v: any) => v.name === 'General');
            if (generalView) {
                setActiveViewId(generalView.id);
            } else if (data.length > 0) {
                setActiveViewId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load views:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadViewData() {
        if (!activeViewId) return;
        try {
            const result = await fetchViewData(activeViewId);
            setColumns(result.columns);
        } catch (error) {
            console.error('Failed to load view data:', error);
        }
    }

    async function handleCreateView() {
        if (!newViewName.trim()) return;
        try {
            const view = await createView(newViewName.trim());

            // Create default columns for new view
            const defaultCols = [
                { key: 'uni_name', label: 'Uni Name', type: 'text', section: 'Basics', pinned: true, visible: true, order_index: 0 },
                { key: 'country', label: 'Country', type: 'text', section: 'Basics', pinned: true, visible: true, order_index: 1 },
                { key: 'website', label: 'Website', type: 'link', section: 'Basics', pinned: false, visible: true, order_index: 2 },
            ];

            const { createColumn, fetchUniversities, updateValue } = await import('../services/api');

            // Create columns
            for (const col of defaultCols) {
                await createColumn(view.id, col);
            }

            // Set initial values for all universities
            const allUniversities = await fetchUniversities();
            for (const uni of allUniversities) {
                if (uni.name) await updateValue(uni.id, 'uni_name', view.id, uni.name);
                if (uni.country) await updateValue(uni.id, 'country', view.id, uni.country);
                if (uni.website) await updateValue(uni.id, 'website', view.id, uni.website);
            }

            setViews([...views, view]);
            setActiveViewId(view.id);
            setNewViewName('');
            setShowNewViewInput(false);
            loadViewData();
        } catch (error) {
            console.error('Failed to create view:', error);
            alert('Failed to create view');
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{university?.name}</h1>
                        <p className="text-sm text-gray-500">
                            {university?.city && `${university.city}, `}
                            {university?.country}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {showNewViewInput ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newViewName}
                                onChange={(e) => setNewViewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateView();
                                    if (e.key === 'Escape') setShowNewViewInput(false);
                                }}
                                placeholder="View name..."
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <button
                                onClick={handleCreateView}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewViewInput(false);
                                    setNewViewName('');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowAIRefresh(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                AI Refresh
                            </button>
                            <button
                                onClick={() => setShowNewViewInput(true)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New View
                            </button>
                        </>
                    )}
                </div>
            </div>

            {views.length > 0 && (
                <div className="mb-4 flex gap-2 border-b border-gray-200">
                    {views.map((view) => (
                        <button
                            key={view.id}
                            onClick={() => setActiveViewId(view.id)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeViewId === view.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {view.name}
                        </button>
                    ))}
                </div>
            )}

            {activeViewId && <SpreadsheetGrid viewId={activeViewId} />}

            {showAIRefresh && activeViewId && (
                <AIRefreshModal
                    universities={[university]}
                    columns={columns}
                    viewId={activeViewId}
                    onClose={() => {
                        setShowAIRefresh(false);
                        loadViewData();
                    }}
                />
            )}
        </div>
    );
}

