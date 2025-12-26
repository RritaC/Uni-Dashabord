import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    GraduationCap,
    Calendar,
    Clock,
    Globe,
    DollarSign,
    TrendingUp,
    FileText,
    CheckCircle,
    XCircle,
    Clock as ClockIcon,
    MapPin,
    Building2
} from 'lucide-react';
import { fetchUniversities, fetchApplications, fetchViewData, fetchViews } from '../services/api';

interface DashboardStats {
    totalUniversities: number;
    countries: Record<string, number>;
    types: Record<string, number>;
    totalApplications: number;
    applicationsByStatus: Record<string, number>;
    upcomingDeadlines: number;
    averageTuition: number;
    universitiesWithAid: number;
}

export default function Dashboard() {
    const [universities, setUniversities] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [viewData, setViewData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [unis, apps, views] = await Promise.all([
                fetchUniversities(),
                fetchApplications(),
                fetchViews().then(async (viewsList: any[]) => {
                    const generalView = viewsList.find((v: any) => v.name === 'General');
                    if (generalView) {
                        return await fetchViewData(generalView.id);
                    }
                    return null;
                })
            ]);
            setUniversities(unis);
            setApplications(apps);
            setViewData(views);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    const stats = useMemo((): DashboardStats => {
        const countries: Record<string, number> = {};
        const types: Record<string, number> = {};
        let totalTuition = 0;
        let tuitionCount = 0;
        let aidCount = 0;

        universities.forEach(uni => {
            if (uni.country) {
                countries[uni.country] = (countries[uni.country] || 0) + 1;
            }
            if (uni.type) {
                types[uni.type] = (types[uni.type] || 0) + 1;
            }
        });

        // Calculate stats from view data if available
        if (viewData?.data) {
            viewData.data.forEach((row: any) => {
                const tuition = parseFloat(row.tuition_fees_yearly);
                if (!isNaN(tuition) && tuition > 0) {
                    totalTuition += tuition;
                    tuitionCount++;
                }
                if (row.financial_aid_available === 'true' || row.financial_aid_available === true) {
                    aidCount++;
                }
            });
        }

        const applicationsByStatus: Record<string, number> = {};
        let upcomingDeadlines = 0;
        const now = new Date();

        applications.forEach(app => {
            applicationsByStatus[app.status] = (applicationsByStatus[app.status] || 0) + 1;
            if (app.deadline) {
                const deadline = new Date(app.deadline);
                if (deadline > now && deadline.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
                    upcomingDeadlines++;
                }
            }
        });

        return {
            totalUniversities: universities.length,
            countries,
            types,
            totalApplications: applications.length,
            applicationsByStatus,
            upcomingDeadlines,
            averageTuition: tuitionCount > 0 ? totalTuition / tuitionCount : 0,
            universitiesWithAid: aidCount,
        };
    }, [universities, applications, viewData]);

    const topCountries = useMemo(() => {
        return Object.entries(stats.countries)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
    }, [stats.countries]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <Link
                    to="/universities"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                >
                    View All Universities →
                </Link>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Universities</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUniversities}</p>
                        </div>
                        <GraduationCap className="w-12 h-12 text-blue-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Applications</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalApplications}</p>
                        </div>
                        <FileText className="w-12 h-12 text-green-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingDeadlines}</p>
                        </div>
                        <Calendar className="w-12 h-12 text-purple-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Avg. Tuition</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats.averageTuition > 0
                                    ? `$${Math.round(stats.averageTuition).toLocaleString()}`
                                    : '—'
                                }
                            </p>
                        </div>
                        <DollarSign className="w-12 h-12 text-orange-500 opacity-20" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Universities by Country */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Globe className="w-5 h-5 mr-2 text-blue-500" />
                            Universities by Country
                        </h2>
                    </div>
                    <div className="p-6">
                        {topCountries.length > 0 ? (
                            <div className="space-y-4">
                                {topCountries.map(([country, count]) => {
                                    const percentage = (count / stats.totalUniversities) * 100;
                                    return (
                                        <div key={country}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-gray-700">{country}</span>
                                                <span className="text-sm text-gray-600">{count}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No data available</p>
                        )}
                    </div>
                </div>

                {/* Universities by Type */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Building2 className="w-5 h-5 mr-2 text-purple-500" />
                            Universities by Type
                        </h2>
                    </div>
                    <div className="p-6">
                        {Object.keys(stats.types).length > 0 ? (
                            <div className="space-y-4">
                                {Object.entries(stats.types)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([type, count]) => {
                                        const percentage = (count / stats.totalUniversities) * 100;
                                        return (
                                            <div key={type}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-medium text-gray-700">{type}</span>
                                                    <span className="text-sm text-gray-600">{count}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-purple-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Application Status */}
            {stats.totalApplications > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                            Application Status
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            {Object.entries(stats.applicationsByStatus).map(([status, count]) => {
                                const getStatusIcon = () => {
                                    switch (status.toLowerCase()) {
                                        case 'accepted':
                                            return <CheckCircle className="w-5 h-5 text-green-500" />;
                                        case 'rejected':
                                            return <XCircle className="w-5 h-5 text-red-500" />;
                                        case 'submitted':
                                            return <FileText className="w-5 h-5 text-blue-500" />;
                                        default:
                                            return <ClockIcon className="w-5 h-5 text-gray-500" />;
                                    }
                                };

                                const getStatusColor = () => {
                                    switch (status.toLowerCase()) {
                                        case 'accepted':
                                            return 'bg-green-50 border-green-200';
                                        case 'rejected':
                                            return 'bg-red-50 border-red-200';
                                        case 'submitted':
                                            return 'bg-blue-50 border-blue-200';
                                        default:
                                            return 'bg-gray-50 border-gray-200';
                                    }
                                };

                                return (
                                    <div
                                        key={status}
                                        className={`p-4 rounded-lg border-2 ${getStatusColor()}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            {getStatusIcon()}
                                            <span className="text-2xl font-bold text-gray-900">{count}</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-600 capitalize">{status}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-700">Universities with Financial Aid</p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.universitiesWithAid}</p>
                            <p className="text-xs text-blue-600 mt-1">
                                {stats.totalUniversities > 0
                                    ? `${Math.round((stats.universitiesWithAid / stats.totalUniversities) * 100)}% of total`
                                    : '—'
                                }
                            </p>
                        </div>
                        <DollarSign className="w-12 h-12 text-blue-500 opacity-30" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-700">Countries Represented</p>
                            <p className="text-3xl font-bold text-green-900 mt-2">{Object.keys(stats.countries).length}</p>
                            <p className="text-xs text-green-600 mt-1">Unique locations</p>
                        </div>
                        <MapPin className="w-12 h-12 text-green-500 opacity-30" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-700">Application Rate</p>
                            <p className="text-3xl font-bold text-purple-900 mt-2">
                                {stats.totalUniversities > 0
                                    ? `${Math.round((stats.totalApplications / stats.totalUniversities) * 10) / 10}`
                                    : '0'
                                }
                            </p>
                            <p className="text-xs text-purple-600 mt-1">Applications per university</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-purple-500 opacity-30" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        to="/universities"
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                    >
                        <GraduationCap className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">View Universities</p>
                    </Link>
                    <Link
                        to="/applications"
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
                    >
                        <FileText className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Applications</p>
                    </Link>
                    <Link
                        to="/grades"
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center"
                    >
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Grades</p>
                    </Link>
                    <Link
                        to="/tasks"
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center"
                    >
                        <Clock className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Tasks</p>
                    </Link>
                    <Link
                        to="/compare"
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
                    >
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Compare</p>
                    </Link>
                    <Link
                        to="/timeline"
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors text-center"
                    >
                        <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Timeline</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
