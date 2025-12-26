import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchUniversities } from '../services/api';

interface AddApplicationModalProps {
    onClose: () => void;
    onSave: (application: any) => void;
}

export default function AddApplicationModal({ onClose, onSave }: AddApplicationModalProps) {
    const [universities, setUniversities] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        type: 'university' as 'university' | 'program',
        universityId: '',
        status: 'to-do' as const,
        deadline: '',
        notes: '',
    });

    useEffect(() => {
        loadUniversities();
    }, []);

    async function loadUniversities() {
        try {
            const data = await fetchUniversities();
            setUniversities(data);
        } catch (error) {
            console.error('Failed to load universities:', error);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (formData.type === 'university' && !formData.universityId) return;
        if (formData.type === 'program' && !formData.name) return;

        const application = {
            id: Date.now().toString(),
            name: formData.type === 'program' ? formData.name : undefined,
            type: formData.type,
            universityId: formData.type === 'university' ? Number(formData.universityId) : undefined,
            status: formData.status,
            deadline: formData.deadline || null,
            notes: formData.notes || null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        onSave(application);
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Add Application</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="university">University</option>
                            <option value="program">Program (e.g., TechGirls)</option>
                        </select>
                    </div>

                    {formData.type === 'university' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                            <select
                                value={formData.universityId}
                                onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select university...</option>
                                {universities.map(uni => (
                                    <option key={uni.id} value={uni.id}>{uni.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., TechGirls"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="to-do">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="interview">Interview</option>
                            <option value="submitted">Submitted</option>
                            <option value="accepted">Accepted</option>
                            <option value="done">Done</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                        <input
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Add Application
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

