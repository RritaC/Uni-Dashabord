import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Copy, Trash2, Grid, List, Table2 } from 'lucide-react';
import { fetchViews, createView, deleteView, fetchColumns, fetchUniversities, fetchViewData } from '../services/api';
import SpreadsheetView from '../components/SpreadsheetView';
import CreateViewModal from '../components/CreateViewModal';
import UniversityCard from '../components/UniversityCard';
import SpreadsheetPreview from '../components/SpreadsheetPreview';

export default function Universities() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [views, setViews] = useState<any[]>([]);
    const [activeViewId, setActiveViewId] = useState<number | null>(null);
    const [universities, setUniversities] = useState<any[]>([]);
    const [viewData, setViewData] = useState<any>(null);
    const [viewPreviews, setViewPreviews] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'spreadsheets' | 'cards'>(() => {
        const tab = searchParams.get('tab') as 'spreadsheets' | 'cards' | null;
        return tab || 'spreadsheets';
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Only open a view if explicitly requested via URL parameter
        const viewIdParam = searchParams.get('view');
        if (viewIdParam) {
            const viewId = parseInt(viewIdParam, 10);
            if (!isNaN(viewId)) {
                setActiveViewId(viewId);
            }
        } else {
            // Don't auto-open any view - show the spreadsheet views grid/list instead
            setActiveViewId(null);
        }
    }, [searchParams]);

    async function loadData() {
        try {
            const [viewsData, unis, viewsList] = await Promise.all([
                fetchViews(),
                fetchUniversities(),
                fetchViews(),
            ]);
            setViews(viewsData);
            setUniversities(unis);

            const generalView = viewsList.find((v: any) => v.name === 'General');
            if (generalView) {
                const data = await fetchViewData(generalView.id);
                setViewData(data);
            }

            // Load previews for all views
            const previews: Record<number, any> = {};
            for (const view of viewsData) {
                try {
                    const previewData = await fetchViewData(view.id);
                    previews[view.id] = previewData;
                } catch (error) {
                    console.error(`Failed to load preview for view ${view.id}:`, error);
                }
            }
            setViewPreviews(previews);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }


    function getUniversityData(uni: any) {
        if (!viewData) return {};
        const row = viewData.data.find((r: any) => r.id === uni.id);
        return row || {};
    }

    const [favorites, setFavorites] = useState<number[]>(() => {
        return JSON.parse(localStorage.getItem('favoriteUniversities') || '[]');
    });

    function toggleFavorite(universityId: number) {
        const newFavorites = favorites.includes(universityId)
            ? favorites.filter(id => id !== universityId)
            : [...favorites, universityId];
        setFavorites(newFavorites);
        localStorage.setItem('favoriteUniversities', JSON.stringify(newFavorites));
    }

    const filteredUniversities = universities.filter(uni => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            uni.name?.toLowerCase().includes(query) ||
            uni.country?.toLowerCase().includes(query) ||
            uni.city?.toLowerCase().includes(query)
        );
    });

    async function handleCreateView(name: string, copyFromViewId?: number) {
        try {
            const newView = await createView(name);
            const { createColumn, fetchUniversities, updateValue } = await import('../services/api');

            if (copyFromViewId) {
                const sourceColumns = await fetchColumns(copyFromViewId);
                const { fetchViewData } = await import('../services/api');
                const sourceData = await fetchViewData(copyFromViewId);

                for (const col of sourceColumns) {
                    await createColumn(newView.id, {
                        key: col.key,
                        label: col.label,
                        type: col.type,
                        section: col.section,
                        select_options: col.select_options,
                        pinned: col.pinned,
                        visible: col.visible,
                        order_index: col.order_index,
                        ai_instructions: col.ai_instructions,
                    });
                }

                const allUniversities = await fetchUniversities();
                for (const uni of allUniversities) {
                    const sourceRow = sourceData.data.find((r: any) => r.id === uni.id);
                    if (sourceRow) {
                        for (const col of sourceColumns) {
                            if (sourceRow[col.key] !== null && sourceRow[col.key] !== undefined) {
                                await updateValue(uni.id, col.key, newView.id, sourceRow[col.key]);
                            }
                        }
                    }
                }
            } else {
                const defaultColumns = [
                    { key: 'nr', label: 'Nr', type: 'number', section: 'Basics', pinned: true, order_index: 0 },
                    { key: 'uni_name', label: 'Uni Name', type: 'text', section: 'Basics', pinned: true, order_index: 1 },
                    { key: 'cntr', label: 'Country', type: 'text', section: 'Basics', pinned: true, order_index: 2 },
                    { key: 'uni_type', label: 'Type', type: 'select', section: 'Basics', select_options: JSON.stringify(['Public', 'Private']), pinned: false, order_index: 3 },
                    { key: 'web', label: 'Web', type: 'link', section: 'Basics', pinned: false, order_index: 4 },
                ];

                for (const col of defaultColumns) {
                    await createColumn(newView.id, {
                        key: col.key,
                        label: col.label,
                        type: col.type,
                        section: col.section,
                        select_options: col.select_options,
                        pinned: col.pinned,
                        visible: true,
                        order_index: col.order_index,
                    });
                }

                const allUniversities = await fetchUniversities();
                for (let index = 0; index < allUniversities.length; index++) {
                    const uni = allUniversities[index];
                    await updateValue(uni.id, 'nr', newView.id, index + 1);
                    await updateValue(uni.id, 'uni_name', newView.id, uni.name);
                    await updateValue(uni.id, 'cntr', newView.id, uni.country);
                    await updateValue(uni.id, 'uni_type', newView.id, uni.type);
                    await updateValue(uni.id, 'web', newView.id, uni.website);
                }
            }

            await loadData();
            setActiveViewId(newView.id);
            setShowCreateModal(false);
        } catch (error) {
            console.error('Failed to create view:', error);
        }
    }

    async function handleDeleteView(id: number) {
        if (!confirm('Delete this spreadsheet view? This cannot be undone.')) return;
        try {
            await deleteView(id);
            await loadData();
            if (activeViewId === id) {
                const remaining = views.filter(v => v.id !== id);
                setActiveViewId(remaining.length > 0 ? remaining[0].id : null);
            }
        } catch (error) {
            console.error('Failed to delete view:', error);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    if (activeViewId && activeTab === 'spreadsheets') {
        return (
            <SpreadsheetView
                viewId={activeViewId}
                viewName={views.find(v => v.id === activeViewId)?.name || 'Spreadsheet'}
                onBack={() => setActiveViewId(null)}
                onDelete={() => handleDeleteView(activeViewId)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
            {/* Tabs */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Universities</h1>
                    <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <button
                            onClick={() => {
                                setActiveTab('spreadsheets');
                                setSearchParams({ tab: 'spreadsheets' });
                                setActiveViewId(null); // Don't auto-open any view - show the grid/list
                            }}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'spreadsheets'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Table2 className="w-4 h-4" />
                                Spreadsheets
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('cards');
                                setSearchParams({ tab: 'cards' });
                                sessionStorage.setItem('universitiesReturnTo', 'cards');
                            }}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'cards'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Grid className="w-4 h-4" />
                                Browse Cards
                            </div>
                        </button>
                    </div>
                </div>
                {activeTab === 'spreadsheets' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Spreadsheet
                    </button>
                )}
            </div>

            {activeTab === 'spreadsheets' ? (
                <>
                    {/* Spreadsheet Views Grid */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Spreadsheet Views</h2>
                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                            </button>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {views.map((view) => (
                                    <div
                                        key={view.id}
                                        onClick={() => {
                                            setActiveViewId(view.id);
                                            setSearchParams({ tab: 'spreadsheets', view: view.id.toString() });
                                            sessionStorage.setItem('universitiesReturnTo', 'spreadsheets');
                                            sessionStorage.setItem('universitiesViewId', view.id.toString());
                                        }}
                                        className="bg-white rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group bg-gradient-to-br from-white to-blue-50/30"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                                {view.name}
                                            </h3>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCreateView(`${view.name} (Copy)`, view.id);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-blue-600"
                                                    title="Copy"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteView(view.id);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mb-2">
                                            {new Date(view.created_at * 1000).toLocaleDateString()}
                                        </div>
                                        <SpreadsheetPreview viewId={view.id} previewData={viewPreviews[view.id]} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {views.map((view) => (
                                            <tr
                                                key={view.id}
                                                onClick={() => {
                                                    setActiveViewId(view.id);
                                                    setSearchParams({ tab: 'spreadsheets', view: view.id.toString() });
                                                    sessionStorage.setItem('universitiesReturnTo', 'spreadsheets');
                                                    sessionStorage.setItem('universitiesViewId', view.id.toString());
                                                }}
                                                className="hover:bg-gray-50 cursor-pointer"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{view.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(view.created_at * 1000).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCreateView(`${view.name} (Copy)`, view.id);
                                                            }}
                                                            className="text-gray-400 hover:text-blue-600"
                                                            title="Copy"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteView(view.id);
                                                            }}
                                                            className="text-gray-400 hover:text-red-600"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* University Cards */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">Browse Universities</h2>
                            <div className="flex-1 max-w-md ml-4">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search universities..."
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredUniversities.map((uni, index) => {
                                const uniData = getUniversityData(uni);
                                const isFavorite = favorites.includes(uni.id);

                                return (
                                    <div
                                        key={uni.id}
                                        onClick={() => {
                                            // Store navigation state
                                            sessionStorage.setItem('universitiesReturnTo', 'cards');
                                        }}
                                    >
                                        <UniversityCard
                                            university={uni}
                                            universityData={uniData}
                                            isFavorite={isFavorite}
                                            onToggleFavorite={toggleFavorite}
                                            ranking={index + 1}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {filteredUniversities.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                                <p className="text-gray-500">No universities found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {showCreateModal && (
                <CreateViewModal
                    views={views}
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateView}
                />
            )}
        </div>
    );
}
