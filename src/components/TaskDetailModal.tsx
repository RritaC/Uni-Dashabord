import { X, Calendar, Flag, CheckCircle2, Circle } from 'lucide-react';

interface TaskDetailModalProps {
    task: {
        id: string;
        title: string;
        description: string | null;
        completed: boolean;
        dueDate: string | null;
        priority: 'low' | 'medium' | 'high';
        createdAt: number;
    };
    onClose: () => void;
    onEdit: () => void;
}

const priorityColors = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-red-600 bg-red-50 border-red-200',
};

const priorityLabels = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
};

export default function TaskDetailModal({ task, onClose, onEdit }: TaskDetailModalProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No due date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCreatedDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            {task.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                                <Circle className="w-6 h-6 text-gray-400" />
                            )}
                            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                        </div>
                        <div className="flex items-center gap-2 ml-9">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${priorityColors[task.priority]}`}>
                                <Flag className="w-3 h-3 mr-1" />
                                {priorityLabels[task.priority]}
                            </span>
                            {task.completed && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Completed
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
                        {task.description ? (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 border-dashed">
                                <p className="text-gray-400 italic">No description provided</p>
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Due Date</h3>
                            </div>
                            <p className={`text-lg font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatDate(task.dueDate)}
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
                                {formatCreatedDate(task.createdAt)}
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
                        Edit Task
                    </button>
                </div>
            </div>
        </div>
    );
}

