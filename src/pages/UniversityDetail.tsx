import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchUniversity, fetchViewData, fetchViews, fetchApplications } from '../services/api';
import { ArrowLeft, RefreshCw, History, Star, ExternalLink, DollarSign, MapPin, Calendar, TrendingUp } from 'lucide-react';
import AIRefreshModal from '../components/AIRefreshModal';
import HistoryDrawer from '../components/HistoryDrawer';

export default function UniversityDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [university, setUniversity] = useState<any>(null);
    const [columns, setColumns] = useState<any[]>([]);
    const [rowData, setRowData] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [favorite, setFavorite] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('Basics');
    const [showAIRefresh, setShowAIRefresh] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData();
        }
        // Load favorite from localStorage
        const favorites = JSON.parse(localStorage.getItem('favoriteUniversities') || '[]');
        setFavorite(favorites.includes(Number(id)));
    }, [id]);

    async function loadData() {
        if (!id) return;
        setLoading(true);
        try {
            const [uni, views, apps] = await Promise.all([
                fetchUniversity(Number(id)),
                fetchViews(),
                fetchApplications(),
            ]);
            setUniversity(uni);

            // Load General view data to show university details
            const generalView = views.find((v: any) => v.name === 'General');
            if (generalView) {
                const data = await fetchViewData(generalView.id);
                setColumns(data.columns.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)));
                setRowData(data.data.find((r: any) => r.id === Number(id)));
            }

            setApplications(apps.filter((app: any) => app.university_id === Number(id)));
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    function toggleFavorite() {
        const favorites = JSON.parse(localStorage.getItem('favoriteUniversities') || '[]');
        if (favorite) {
            const newFavorites = favorites.filter((fid: number) => fid !== Number(id));
            localStorage.setItem('favoriteUniversities', JSON.stringify(newFavorites));
        } else {
            favorites.push(Number(id));
            localStorage.setItem('favoriteUniversities', JSON.stringify(favorites));
        }
        setFavorite(!favorite);
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    if (!university) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">University not found</p>
            </div>
        );
    }

    const sections = Array.from(new Set(columns.map((c: any) => c.section)));
    const sectionColumns = columns.filter((c: any) => c.section === activeSection);

    function getValue(columnKey: string): any {
        return rowData?.[columnKey] || null;
    }

    const keyStats = {
        tuition: getValue('tuition_fees_yearly'),
        acceptanceRate: getValue('acceptance_rate'),
        financialAid: getValue('financial_aid_available'),
        deadline: getValue('application_deadlines'),
        website: getValue('web') || university.website,
    };

    function renderValue(col: any, value: any) {
        if (value === null || value === undefined) {
            return <span className="text-gray-400">—</span>;
        }

        switch (col.type) {
            case 'link':
                return (
                    <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        {String(value)}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                );
            case 'boolean':
                return <span className={value === 'true' || value === true ? 'text-green-600 font-medium' : 'text-gray-500'}>{value === 'true' || value === true ? 'Yes' : 'No'}</span>;
            case 'date':
                return <span>{new Date(value).toLocaleDateString()}</span>;
            case 'long-text':
                return <p className="whitespace-pre-wrap text-sm leading-relaxed">{String(value)}</p>;
            case 'number':
                if (col.key === 'tuition_fees_yearly') {
                    return <span className="font-semibold">${Number(value).toLocaleString()}</span>;
                }
                if (col.key === 'acceptance_rate') {
                    return <span className="font-semibold">{Number(value)}%</span>;
                }
                return <span>{Number(value).toLocaleString()}</span>;
            default:
                return <span>{String(value)}</span>;
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            // Check if we came from cards view
                            const returnTo = sessionStorage.getItem('universitiesReturnTo') || 'spreadsheets';
                            const returnViewId = sessionStorage.getItem('universitiesViewId');

                            if (returnTo === 'cards') {
                                navigate('/universities?tab=cards');
                            } else if (returnViewId) {
                                navigate(`/universities?tab=spreadsheets&view=${returnViewId}`);
                            } else {
                                navigate('/universities');
                            }
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">{university.name}</h1>
                            <button
                                onClick={toggleFavorite}
                                className="text-yellow-400 hover:text-yellow-500 transition-colors"
                            >
                                <Star className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {university.city && `${university.city}, `}
                            {university.country}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {keyStats.website && (
                        <a
                            href={keyStats.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Website
                        </a>
                    )}
                    <Link
                        to={`/compare?ids=${id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Compare
                    </Link>
                    <button
                        onClick={() => setShowHistory(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <History className="w-4 h-4 mr-2" />
                        History
                    </button>
                    <button
                        onClick={() => setShowAIRefresh(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        AI Refresh
                    </button>
                </div>
            </div>

            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {keyStats.tuition && (
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Tuition (Yearly)</p>
                                <p className="text-lg font-bold text-gray-900">${Number(keyStats.tuition).toLocaleString()}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-500 opacity-20" />
                        </div>
                    </div>
                )}
                {keyStats.acceptanceRate && (
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Acceptance Rate</p>
                                <p className="text-lg font-bold text-gray-900">{keyStats.acceptanceRate}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
                        </div>
                    </div>
                )}
                {keyStats.financialAid && (
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Financial Aid</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {keyStats.financialAid === 'true' || keyStats.financialAid === true ? 'Available' : 'Not Available'}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-purple-500 opacity-20" />
                        </div>
                    </div>
                )}
                {keyStats.deadline && (
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Application Deadline</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {new Date(keyStats.deadline).toLocaleDateString()}
                                </p>
                            </div>
                            <Calendar className="w-8 h-8 text-orange-500 opacity-20" />
                        </div>
                    </div>
                )}
            </div>

            {/* Applications */}
            {applications.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications</h2>
                    <div className="space-y-2">
                        {applications.map((app: any) => (
                            <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{app.name}</p>
                                    <p className="text-sm text-gray-500">Status: {app.status}</p>
                                </div>
                                {app.deadline && (
                                    <p className="text-sm text-gray-500">
                                        {new Date(app.deadline).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        {sections.map(section => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`px-6 py-4 text-sm font-medium border-b-2 ${activeSection === section
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {section}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {sectionColumns.length === 0 ? (
                        <p className="text-gray-500">No columns in this section</p>
                    ) : (
                        <dl className="space-y-4">
                            {sectionColumns.map((col: any) => (
                                <div key={col.id} className="border-b border-gray-100 pb-4 last:border-0">
                                    <dt className="text-sm font-medium text-gray-500 mb-1">{col.label}</dt>
                                    <dd className="text-sm text-gray-900">
                                        {renderValue(col, getValue(col.key))}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </div>
            </div>

            {showAIRefresh && (
                <AIRefreshModal
                    universities={[university]}
                    columns={columns}
                    viewId={undefined}
                    onClose={() => {
                        setShowAIRefresh(false);
                        loadData();
                    }}
                />
            )}

            {showHistory && university.id && (
                <HistoryDrawer
                    universityId={university.id}
                    onClose={() => setShowHistory(false)}
                />
            )}
        </div>
    );
}
