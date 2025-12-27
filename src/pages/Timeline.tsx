import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { fetchApplications, fetchUniversities, fetchViewData, fetchViews } from '../services/api';
import { Link } from 'react-router-dom';

interface TimelineEvent {
    id: string;
    type: 'deadline' | 'application';
    title: string;
    date: Date;
    status?: string;
    universityId?: number;
    universityName?: string;
    color: string;
    daysUntil: number;
}

export default function Timeline() {
    const [applications, setApplications] = useState<any[]>([]);
    const [universities, setUniversities] = useState<any[]>([]);
    const [viewData, setViewData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'month' | 'quarter' | 'year'>('quarter');
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [apps, unis, views] = await Promise.all([
                fetchApplications(),
                fetchUniversities(),
                fetchViews(),
            ]);
            setApplications(apps);
            setUniversities(unis);

            const generalView = views.find((v: any) => v.name === 'General');
            if (generalView) {
                const data = await fetchViewData(generalView.id);
                setViewData(data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    const events = useMemo((): TimelineEvent[] => {
        const timelineEvents: TimelineEvent[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Add application deadlines
        applications.forEach(app => {
            if (app.deadline) {
                const deadline = new Date(app.deadline);
                deadline.setHours(0, 0, 0, 0);
                const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                let color = 'blue';
                if (daysUntil < 0) color = 'gray';
                else if (daysUntil <= 7) color = 'red';
                else if (daysUntil <= 30) color = 'orange';
                else color = 'green';

                timelineEvents.push({
                    id: `app-${app.id}`,
                    type: 'application',
                    title: app.name || 'Application',
                    date: deadline,
                    status: app.status,
                    universityId: app.university_id,
                    color,
                    daysUntil,
                });
            }
        });

        // Add university application deadlines from spreadsheet
        if (viewData?.data) {
            viewData.data.forEach((row: any) => {
                if (row.application_deadlines) {
                    try {
                        const deadline = new Date(row.application_deadlines);
                        deadline.setHours(0, 0, 0, 0);
                        if (!isNaN(deadline.getTime())) {
                            const uni = universities.find(u => u.id === row.id);
                            if (uni) {
                                const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                                let color = 'blue';
                                if (daysUntil < 0) color = 'gray';
                                else if (daysUntil <= 7) color = 'red';
                                else if (daysUntil <= 30) color = 'orange';
                                else color = 'green';

                                timelineEvents.push({
                                    id: `uni-${row.id}`,
                                    type: 'deadline',
                                    title: `${uni.name} Application Deadline`,
                                    date: deadline,
                                    universityId: uni.id,
                                    universityName: uni.name,
                                    color,
                                    daysUntil,
                                });
                            }
                        }
                    } catch (e) {
                        // Invalid date, skip
                    }
                }
            });
        }

        return timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [applications, viewData, universities]);

    // Calculate date range based on view mode
    const dateRange = useMemo(() => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        switch (viewMode) {
            case 'month':
                start.setDate(1);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0); // Last day of current month
                break;
            case 'quarter':
                const quarter = Math.floor(start.getMonth() / 3);
                start.setMonth(quarter * 3, 1);
                end.setMonth((quarter + 1) * 3, 0);
                break;
            case 'year':
                start.setMonth(0, 1);
                end.setMonth(11, 31);
                break;
        }

        return { start, end };
    }, [currentDate, viewMode]);

    // Filter events in range
    const visibleEvents = useMemo(() => {
        return events.filter(event => {
            return event.date >= dateRange.start && event.date <= dateRange.end;
        });
    }, [events, dateRange]);

    // Calculate position on timeline (0-100%)
    function getEventPosition(event: TimelineEvent): number {
        const totalDays = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
        const daysFromStart = (event.date.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
    }

    function getStatusIcon(status?: string) {
        switch (status?.toLowerCase()) {
            case 'accepted':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected':
            case 'done':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    }

    function getColorClasses(color: string) {
        switch (color) {
            case 'red':
                return 'bg-red-500 border-red-600';
            case 'orange':
                return 'bg-orange-500 border-orange-600';
            case 'green':
                return 'bg-green-500 border-green-600';
            case 'gray':
                return 'bg-gray-400 border-gray-500';
            default:
                return 'bg-blue-500 border-blue-600';
        }
    }

    function formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatDateShort(date: Date): string {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function navigateDate(direction: 'prev' | 'next') {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else if (viewMode === 'quarter') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
        } else {
            newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    }

    function goToToday() {
        setCurrentDate(new Date());
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosition = getEventPosition({
        id: 'today',
        type: 'deadline',
        title: '',
        date: today,
        color: 'blue',
        daysUntil: 0
    });

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading timeline...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
                    <Calendar className="w-6 h-6 mr-2" />
                    Timeline & Deadlines
                </h1>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigateDate('prev')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => navigateDate('next')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="ml-2 border-l border-gray-200 pl-4">
                            <span className="text-sm font-semibold text-gray-900">
                                {dateRange.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - {dateRange.end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'month'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setViewMode('quarter')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'quarter'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Quarter
                        </button>
                        <button
                            onClick={() => setViewMode('year')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'year'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Year
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline Visualization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
                <div className="relative" style={{ minHeight: '350px' }}>
                    {/* Timeline Line */}
                    <div className="absolute left-0 right-0 top-24 h-0.5 bg-gray-200"></div>
                    <div className="absolute left-0 right-0 top-24 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>

                    {/* Today Marker */}
                    {today >= dateRange.start && today <= dateRange.end && (
                        <div
                            className="absolute top-20 transform -translate-x-1/2 z-20"
                            style={{ left: `${todayPosition}%` }}
                        >
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-md"></div>
                                <div className="w-0.5 h-4 bg-red-500 mt-0.5"></div>
                                <span className="text-xs font-medium text-gray-600 mt-1 whitespace-nowrap bg-white px-2 py-0.5 rounded border border-gray-200">Today</span>
                            </div>
                        </div>
                    )}

                    {/* Events */}
                    {visibleEvents.map((event, index) => {
                        const position = getEventPosition(event);
                        const isPast = event.date < today;
                        const alternatePosition = index % 2 === 0; // Alternate between top and bottom

                        return (
                            <div
                                key={event.id}
                                className="absolute transform -translate-x-1/2 z-10"
                                style={{ left: `${position}%`, top: alternatePosition ? '40px' : '200px' }}
                            >
                                <div className={`flex flex-col items-center group ${alternatePosition ? '' : 'flex-col-reverse'}`}>
                                    {/* Event Dot */}
                                    <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md transition-all group-hover:scale-125 ${getColorClasses(event.color)} ${isPast ? 'opacity-50' : ''}`}></div>

                                    {/* Connecting Line */}
                                    <div className={`w-0.5 ${alternatePosition ? 'h-16 mt-1' : 'h-16 mb-1'} bg-gray-200 group-hover:bg-gray-300 transition-colors`}></div>

                                    {/* Event Card */}
                                    <div className={`w-56 bg-white rounded-lg shadow-md border p-3 transform transition-all group-hover:shadow-xl group-hover:-translate-y-1 ${isPast
                                        ? 'border-gray-200 opacity-70'
                                        : event.color === 'red'
                                            ? 'border-red-200 bg-red-50/30'
                                            : event.color === 'orange'
                                                ? 'border-orange-200 bg-orange-50/30'
                                                : event.color === 'green'
                                                    ? 'border-green-200 bg-green-50/30'
                                                    : 'border-blue-200 bg-blue-50/30'
                                        }`}>
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                                                        {event.title}
                                                    </h3>
                                                    {event.universityName && (
                                                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{event.universityName}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                {event.status && (
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {getStatusIcon(event.status)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span className="font-medium">{formatDateShort(event.date)}</span>
                                                </div>
                                                {event.daysUntil >= 0 && (
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${event.daysUntil <= 7
                                                        ? 'bg-red-100 text-red-700'
                                                        : event.daysUntil <= 30
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {event.daysUntil === 0 ? 'Today' : `${event.daysUntil}d`}
                                                    </span>
                                                )}
                                            </div>

                                            {event.universityId && (
                                                <Link
                                                    to={`/universities/${event.universityId}`}
                                                    className="block text-xs text-blue-600 hover:text-blue-700 font-medium text-center pt-1"
                                                >
                                                    View Details →
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Date Labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 font-medium pt-6">
                        <span className="bg-white px-2">{formatDate(dateRange.start)}</span>
                        <span className="bg-white px-2">{formatDate(dateRange.end)}</span>
                    </div>
                </div>
            </div>

            {/* Event List (Compact View) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleEvents.length > 0 ? (
                    visibleEvents.map(event => {
                        const isPast = event.date < today;
                        return (
                            <div
                                key={event.id}
                                className={`border-l-4 rounded-lg p-4 bg-white shadow-sm border transition-all hover:shadow-md ${isPast
                                    ? 'border-gray-300 opacity-70'
                                    : event.color === 'red'
                                        ? 'border-red-500 bg-red-50/50'
                                        : event.color === 'orange'
                                            ? 'border-orange-500 bg-orange-50/50'
                                            : event.color === 'green'
                                                ? 'border-green-500 bg-green-50/50'
                                                : 'border-blue-500 bg-blue-50/50'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2 mb-2">
                                            {event.status && (
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {getStatusIcon(event.status)}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 text-sm mb-1">{event.title}</h3>
                                                {event.universityName && (
                                                    <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {event.universityName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatDate(event.date)}</span>
                                            </div>
                                            {event.daysUntil >= 0 && (
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${event.daysUntil <= 7
                                                    ? 'bg-red-100 text-red-700'
                                                    : event.daysUntil <= 30
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {event.daysUntil === 0 ? 'Today' : `${event.daysUntil} days`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {event.universityId && (
                                        <Link
                                            to={`/universities/${event.universityId}`}
                                            className="text-blue-600 hover:text-blue-700 text-xs font-medium flex-shrink-0"
                                        >
                                            →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No events in this time period</p>
                    </div>
                )}
            </div>
        </div>
    );
}
