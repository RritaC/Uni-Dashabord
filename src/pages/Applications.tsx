import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, X, Eye, Calendar, Clock, AlertCircle } from 'lucide-react';
import { fetchUniversities, fetchApplications, saveApplication, updateApplication, deleteApplication } from '../services/api';
import AddApplicationModal from '../components/AddApplicationModal';
import EditApplicationModal from '../components/EditApplicationModal';
import ApplicationDetailModal from '../components/ApplicationDetailModal';

interface Application {
    id: string;
    name: string;
    type: 'university' | 'program';
    universityId?: number;
    status: 'to-do' | 'in-progress' | 'interview' | 'submitted' | 'accepted' | 'done';
    deadline: string | null;
    description: string | null;
    notes: string | null;
    createdAt: number;
    updatedAt: number;
}

const STATUS_COLUMNS = [
    { id: 'to-do', label: 'To Do', color: 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300' },
    { id: 'in-progress', label: 'In Progress', color: 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300' },
    { id: 'interview', label: 'Interview', color: 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300' },
    { id: 'submitted', label: 'Submitted', color: 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300' },
    { id: 'accepted', label: 'Accepted', color: 'bg-gradient-to-br from-green-100 to-green-200 border-green-300' },
    { id: 'done', label: 'Done', color: 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400' },
];

export default function Applications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [universities, setUniversities] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingApp, setEditingApp] = useState<Application | null>(null);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [draggedItem, setDraggedItem] = useState<Application | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [apps, unis] = await Promise.all([
                fetchApplications(),
                fetchUniversities(),
            ]);
            console.log('Loaded applications:', apps);
            setApplications(apps.map((app: any) => ({
                id: String(app.id),
                name: app.name || '',
                type: app.type,
                universityId: app.university_id,
                status: app.status,
                deadline: app.deadline,
                description: app.description || null,
                notes: app.notes,
                createdAt: app.created_at || app.createdAt,
                updatedAt: app.updated_at || app.updatedAt,
            })));
            setUniversities(unis);
        } catch (error) {
            console.error('Failed to load data:', error);
            // Fallback to localStorage
            const stored = localStorage.getItem('applications');
            if (stored) {
                setApplications(JSON.parse(stored));
            }
            try {
                const unis = await fetchUniversities();
                setUniversities(unis);
            } catch (e) {
                console.error('Failed to load universities:', e);
            }
        }
    }

    async function handleSaveApplication(application: Application) {
        const appData = {
            id: application.id,
            name: application.name,
            type: application.type,
            university_id: application.universityId,
            status: application.status,
            deadline: application.deadline,
            description: application.description || null,
            notes: application.notes,
            created_at: application.createdAt,
            updated_at: application.updatedAt,
        };

        try {
            await saveApplication(appData);
            // Reload to get the saved data
            await loadData();
        } catch (error) {
            console.error('Failed to save to database:', error);
            const updated = [...applications, application];
            setApplications(updated);
            localStorage.setItem('applications', JSON.stringify(updated));
        }
    }

    async function handleUpdateApplication(updatedApp: Application) {
        const appData = {
            name: updatedApp.name,
            type: updatedApp.type,
            university_id: updatedApp.universityId,
            status: updatedApp.status,
            deadline: updatedApp.deadline,
            description: updatedApp.description || null,
            notes: updatedApp.notes,
            updated_at: updatedApp.updatedAt,
        };

        try {
            await updateApplication(updatedApp.id, appData);
            // Reload to get the updated data
            await loadData();
        } catch (error) {
            console.error('Failed to update in database:', error);
            const updated = applications.map(app => app.id === updatedApp.id ? updatedApp : app);
            setApplications(updated);
            localStorage.setItem('applications', JSON.stringify(updated));
        }
    }

    async function handleDelete(id: string) {
        if (confirm('Delete this application?')) {
            const updated = applications.filter(app => app.id !== id);
            setApplications(updated);

            try {
                await deleteApplication(id);
            } catch (error) {
                console.error('Failed to delete from database:', error);
                localStorage.setItem('applications', JSON.stringify(updated));
            }
        }
    }

    function handleDragStart(e: React.DragEvent, app: Application) {
        setDraggedItem(app);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    async function handleDrop(e: React.DragEvent, status: string) {
        e.preventDefault();
        if (draggedItem && draggedItem.status !== status) {
            const updatedApp = { ...draggedItem, status: status as any, updatedAt: Date.now() };
            const updated = applications.map(app =>
                app.id === draggedItem.id ? updatedApp : app
            );
            setApplications(updated);

            try {
                await updateApplication(draggedItem.id, updatedApp);
            } catch (error) {
                console.error('Failed to update in database:', error);
                localStorage.setItem('applications', JSON.stringify(updated));
            }
        }
        setDraggedItem(null);
    }

    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (app.universityId && universities.find(u => u.id === app.universityId)?.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesType = typeFilter === 'all' || app.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [applications, searchQuery, typeFilter, universities]);

    // Calculate KPIs
    const kpis = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Find upcoming applications (not completed/accepted)
        const upcomingApps = applications.filter(app => {
            if (!app.deadline) return false;
            const deadline = new Date(app.deadline);
            deadline.setHours(0, 0, 0, 0);
            const isNotCompleted = !['accepted', 'done'].includes(app.status);
            return isNotCompleted && deadline >= today;
        });

        // Find the closest deadline
        let closestApp: Application | null = null;
        let daysLeft: number | null = null;
        
        if (upcomingApps.length > 0) {
            closestApp = upcomingApps.reduce((closest, app) => {
                const appDeadline = new Date(app.deadline!);
                appDeadline.setHours(0, 0, 0, 0);
                const closestDeadline = closest ? new Date(closest.deadline!) : null;
                closestDeadline?.setHours(0, 0, 0, 0);
                
                if (!closestDeadline || appDeadline < closestDeadline) {
                    return app;
                }
                return closest;
            });

            if (closestApp?.deadline) {
                const deadline = new Date(closestApp.deadline);
                deadline.setHours(0, 0, 0, 0);
                const diffTime = deadline.getTime() - today.getTime();
                daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        return {
            currentDate: today,
            closestApp,
            daysLeft,
        };
    }, [applications]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getApplicationName = (app: Application) => {
        if (app.type === 'university' && app.universityId) {
            const uni = universities.find(u => u.id === app.universityId);
            return uni?.name || 'Unknown University';
        }
        return app.name;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Applications</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Application
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Current Date */}
                <div className="bg-white rounded-lg shadow-sm border-2 border-blue-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Today's Date</p>
                            <p className="text-lg font-semibold text-gray-900">{formatDate(kpis.currentDate)}</p>
                        </div>
                    </div>
                </div>

                {/* Closest Application */}
                <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Next Deadline</p>
                            {kpis.closestApp ? (
                                <p className="text-lg font-semibold text-gray-900 truncate" title={getApplicationName(kpis.closestApp)}>
                                    {getApplicationName(kpis.closestApp)}
                                </p>
                            ) : (
                                <p className="text-lg font-semibold text-gray-400">No upcoming deadlines</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Days Left */}
                <div className={`rounded-lg shadow-sm border-2 p-4 ${
                    kpis.daysLeft !== null && kpis.daysLeft <= 7 
                        ? 'bg-red-50 border-red-200' 
                        : kpis.daysLeft !== null && kpis.daysLeft <= 14
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-green-50 border-green-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                            kpis.daysLeft !== null && kpis.daysLeft <= 7 
                                ? 'bg-red-100' 
                                : kpis.daysLeft !== null && kpis.daysLeft <= 14
                                ? 'bg-yellow-100'
                                : 'bg-green-100'
                        }`}>
                            <Clock className={`w-5 h-5 ${
                                kpis.daysLeft !== null && kpis.daysLeft <= 7 
                                    ? 'text-red-600' 
                                    : kpis.daysLeft !== null && kpis.daysLeft <= 14
                                    ? 'text-yellow-600'
                                    : 'text-green-600'
                            }`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Days Remaining</p>
                            {kpis.daysLeft !== null ? (
                                <p className={`text-2xl font-bold ${
                                    kpis.daysLeft <= 7 
                                        ? 'text-red-600' 
                                        : kpis.daysLeft <= 14
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                }`}>
                                    {kpis.daysLeft === 0 ? 'Due Today!' : `${kpis.daysLeft} ${kpis.daysLeft === 1 ? 'day' : 'days'}`}
                                </p>
                            ) : (
                                <p className="text-2xl font-bold text-gray-400">—</p>
                            )}
                        </div>
                    </div>
                    {kpis.closestApp?.deadline && (
                        <p className="text-xs text-gray-500 mt-2">
                            Due: {new Date(kpis.closestApp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    )}
                </div>
            </div>

            {/* Filter Header */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-blue-100 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search applications..."
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                        >
                            <option value="all">All Types</option>
                            <option value="university">University</option>
                            <option value="program">Program</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
                {STATUS_COLUMNS.map((column) => {
                    const columnApps = filteredApplications.filter(app => app.status === column.id);
                    return (
                        <div
                            key={column.id}
                            className="flex-shrink-0 w-64"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            <div className={`${column.color} rounded-lg p-3 mb-2 border-2`}>
                                <h3 className="font-semibold text-gray-900">{column.label}</h3>
                                <span className="text-xs text-gray-600 font-medium">{columnApps.length} items</span>
                            </div>
                            <div className="space-y-2 min-h-[200px]">
                                {columnApps.map((app) => (
                                    <div
                                        key={app.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, app)}
                                        className="bg-white rounded-lg shadow p-4 cursor-move hover:shadow-lg hover:border-blue-300 border-2 border-transparent transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-gray-900 text-sm">{getApplicationName(app)}</h4>
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedApp(app);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-blue-600"
                                                    title="View details"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingApp(app);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-blue-600"
                                                    title="Edit application"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(app.id);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                    title="Delete application"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        {app.description && (
                                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                {app.description}
                                            </p>
                                        )}
                                        {app.deadline && (
                                            <p className="text-xs text-gray-500 mb-1">
                                                Due: {new Date(app.deadline).toLocaleDateString()}
                                            </p>
                                        )}
                                        {app.notes && (
                                            <p className="text-xs text-gray-600 line-clamp-2">{app.notes}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showAddModal && (
                <AddApplicationModal
                    onClose={() => setShowAddModal(false)}
                    onSave={handleSaveApplication}
                />
            )}

            {editingApp && (
                <EditApplicationModal
                    application={editingApp}
                    onClose={() => setEditingApp(null)}
                    onSave={handleUpdateApplication}
                />
            )}

            {selectedApp && (
                <ApplicationDetailModal
                    application={selectedApp}
                    universityName={selectedApp.universityId ? universities.find(u => u.id === selectedApp.universityId)?.name : undefined}
                    onClose={() => setSelectedApp(null)}
                    onEdit={() => {
                        setSelectedApp(null);
                        setEditingApp(selectedApp);
                    }}
                />
            )}
        </div>
    );
}
