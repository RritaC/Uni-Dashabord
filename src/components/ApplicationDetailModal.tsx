import { X, Calendar, Building2, FileText, CheckCircle2, Circle } from 'lucide-react';

interface ApplicationDetailModalProps {
    application: {
        id: string;
        name: string | null;
        type: 'university' | 'program';
        universityId?: number;
        status: 'to-do' | 'in-progress' | 'interview' | 'submitted' | 'accepted' | 'done';
        deadline: string | null;
        description: string | null;
        notes: string | null;
        createdAt: number;
        updatedAt: number;
    };
    universityName?: string;
    onClose: () => void;
    onEdit: () => void;
}

const statusColors = {
    'to-do': 'bg-gray-100 text-gray-800 border-gray-200',
    'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'interview': 'bg-purple-100 text-purple-800 border-purple-200',
    'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
    'accepted': 'bg-green-100 text-green-800 border-green-200',
    'done': 'bg-gray-200 text-gray-900 border-gray-300',
};

const statusLabels = {
    'to-do': 'To Do',
    'in-progress': 'In Progress',
    'interview': 'Interview',
    'submitted': 'Submitted',
    'accepted': 'Accepted',
    'done': 'Done',
};

export default function ApplicationDetailModal({ application, universityName, onClose, onEdit }: ApplicationDetailModalProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No deadline set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const isOverdue = application.deadline && 
        !['accepted', 'done'].includes(application.status) && 
        new Date(application.deadline) < new Date();

    const getApplicationName = () => {
        if (application.type === 'university' && universityName) {
            return universityName;
        }
        return application.name || 'Unnamed Application';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            {application.status === 'accepted' || application.status === 'done' ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                                <Circle className="w-6 h-6 text-gray-400" />
                            )}
                            <h2 className="text-2xl font-bold text-gray-900">{getApplicationName()}</h2>
                        </div>
                        <div className="flex items-center gap-2 ml-9">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[application.status]}`}>
                                {statusLabels[application.status]}
                            </span>
                            {application.type === 'university' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    University
                                </span>
                            )}
                            {application.type === 'program' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
                                    <FileText className="w-3 h-3 mr-1" />
                                    Program
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                    {/* Description */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Description</h3>
                        {application.description ? (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{application.description}</p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 border-dashed">
                                <p className="text-gray-400 italic">No description provided</p>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {application.notes && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Notes</h3>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{application.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Deadline */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Deadline</h3>
                            </div>
                            <p className={`text-lg font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatDate(application.deadline)}
                            </p>
                            {isOverdue && (
                                <p className="text-xs text-red-600 mt-1 font-medium">Overdue</p>
                            )}
                        </div>

                        {/* Created Date */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-gray-600" />
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Created</h3>
                            </div>
                            <p className="text-lg font-medium text-gray-900">
                                {formatTimestamp(application.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        Edit Application
                    </button>
                </div>
            </div>
        </div>
    );
}

