import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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
}

export default function Timeline() {
    const [applications, setApplications] = useState<any[]>([]);
    const [universities, setUniversities] = useState<any[]>([]);
    const [viewData, setViewData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

        // Add application deadlines
        applications.forEach(app => {
            if (app.deadline) {
                const deadline = new Date(app.deadline);
                const now = new Date();
                const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                let color = 'blue';
                if (daysUntil < 0) color = 'gray';
                else if (daysUntil <= 7) color = 'red';
                else if (daysUntil <= 30) color = 'orange';
                else color = 'green';

                timelineEvents.push({
                    id: `app-${app.id}`,
                    type: 'application',
                    title: app.name,
                    date: deadline,
                    status: app.status,
                    universityId: app.university_id,
                    color,
                });
            }
        });

        // Add university application deadlines from spreadsheet
        if (viewData?.data) {
            viewData.data.forEach((row: any) => {
                if (row.application_deadlines) {
                    try {
                        const deadline = new Date(row.application_deadlines);
                        if (!isNaN(deadline.getTime())) {
                            const uni = universities.find(u => u.id === row.id);
                            if (uni) {
                                const now = new Date();
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

    const upcomingEvents = events.filter(e => e.date >= new Date()).slice(0, 10);
    const pastEvents = events.filter(e => e.date < new Date()).slice(-10);

    function getStatusIcon(status?: string) {
        switch (status?.toLowerCase()) {
            case 'accepted':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    }

    function getColorClasses(color: string) {
        switch (color) {
            case 'red':
                return 'border-red-500 bg-red-50';
            case 'orange':
                return 'border-orange-500 bg-orange-50';
            case 'green':
                return 'border-green-500 bg-green-50';
            case 'gray':
                return 'border-gray-400 bg-gray-50';
            default:
                return 'border-blue-500 bg-blue-50';
        }
    }

    function formatDate(date: Date): string {
        const now = new Date();
        const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) {
            return `${Math.abs(daysUntil)} days ago`;
        } else if (daysUntil === 0) {
            return 'Today';
        } else if (daysUntil === 1) {
            return 'Tomorrow';
        } else if (daysUntil <= 7) {
            return `In ${daysUntil} days`;
        } else {
            return date.toLocaleDateString();
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading timeline...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-blue-500" />
                    Timeline & Deadlines
                </h1>
            </div>

            {/* Upcoming Events */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
                <div className="space-y-4">
                    {upcomingEvents.length > 0 ? (
                        upcomingEvents.map(event => (
                            <div
                                key={event.id}
                                className={`border-l-4 rounded-lg p-4 ${getColorClasses(event.color)}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {event.status && getStatusIcon(event.status)}
                                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                        </div>
                                        {event.universityName && (
                                            <p className="text-sm text-gray-600 mb-2">
                                                {event.universityName}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>{event.date.toLocaleDateString()}</span>
                                            <span className="ml-2 font-medium">{formatDate(event.date)}</span>
                                        </div>
                                    </div>
                                    {event.universityId && (
                                        <Link
                                            to={`/universities/${event.universityId}`}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            View →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No upcoming deadlines</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Past Events */}
            {pastEvents.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Past</h2>
                    <div className="space-y-4">
                        {pastEvents.map(event => (
                            <div
                                key={event.id}
                                className="border-l-4 rounded-lg p-4 bg-gray-50 border-gray-300 opacity-75"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {event.status && getStatusIcon(event.status)}
                                            <h3 className="font-medium text-gray-700">{event.title}</h3>
                                        </div>
                                        {event.universityName && (
                                            <p className="text-sm text-gray-500 mb-2">
                                                {event.universityName}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(event.date)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

