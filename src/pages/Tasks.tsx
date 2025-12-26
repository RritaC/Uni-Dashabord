import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, X } from 'lucide-react';
import { fetchTasks, saveTask, updateTask, deleteTask } from '../services/api';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';

interface Task {
    id: string;
    title: string;
    completed: boolean;
    dueDate: string | null;
    priority: 'low' | 'medium' | 'high';
    createdAt: number;
}

const STATUS_COLUMNS = [
    { id: 'to-do', label: 'To Do', color: 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300' },
    { id: 'in-progress', label: 'In Progress', color: 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300' },
    { id: 'done', label: 'Done', color: 'bg-gradient-to-br from-green-100 to-green-200 border-green-300' },
];

export default function Tasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [draggedItem, setDraggedItem] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');

    useEffect(() => {
        loadTasks();
    }, []);

    async function loadTasks() {
        try {
            const data = await fetchTasks();
            setTasks(data.map((t: any) => ({
                id: t.id,
                title: t.title,
                completed: t.completed,
                dueDate: t.due_date,
                priority: t.priority,
                createdAt: t.created_at,
            })));
        } catch (error) {
            console.error('Failed to load tasks:', error);
            // Fallback to localStorage
            const stored = localStorage.getItem('tasks');
            if (stored) {
                setTasks(JSON.parse(stored));
            }
        }
    }

    async function handleSaveTask(task: Task) {
        const taskData = {
            id: task.id,
            title: task.title,
            completed: task.completed ? 1 : 0,
            due_date: task.dueDate,
            priority: task.priority,
            created_at: task.createdAt,
        };

        try {
            await saveTask(taskData);
            // Reload to get the saved data
            await loadTasks();
        } catch (error) {
            console.error('Failed to save to database:', error);
            const updated = [...tasks, task];
            setTasks(updated);
            localStorage.setItem('tasks', JSON.stringify(updated));
        }
    }

    async function handleUpdateTask(updatedTask: Task) {
        const taskData = {
            title: updatedTask.title,
            completed: updatedTask.completed ? 1 : 0,
            due_date: updatedTask.dueDate,
            priority: updatedTask.priority,
        };

        try {
            await updateTask(updatedTask.id, taskData);
            // Reload to get the updated data
            await loadTasks();
        } catch (error) {
            console.error('Failed to update in database:', error);
            const updated = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
            setTasks(updated);
            localStorage.setItem('tasks', JSON.stringify(updated));
        }
    }

    async function handleDelete(id: string) {
        if (confirm('Delete this task?')) {
            const updated = tasks.filter(t => t.id !== id);
            setTasks(updated);

            try {
                await deleteTask(id);
            } catch (error) {
                console.error('Failed to delete from database:', error);
                localStorage.setItem('tasks', JSON.stringify(updated));
            }
        }
    }

    function handleDragStart(e: React.DragEvent, task: Task) {
        setDraggedItem(task);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    }

    async function handleDrop(e: React.DragEvent, status: string) {
        e.preventDefault();
        e.stopPropagation();
        if (draggedItem) {
            const updatedTask = {
                ...draggedItem,
                completed: status === 'done',
            };
            const taskData = {
                title: updatedTask.title,
                completed: updatedTask.completed ? 1 : 0,
                due_date: updatedTask.dueDate,
                priority: updatedTask.priority,
            };

            try {
                await updateTask(draggedItem.id, taskData);
                // Reload to get the updated data
                await loadTasks();
            } catch (error) {
                console.error('Failed to update in database:', error);
                const updated = tasks.map(task =>
                    task.id === draggedItem.id ? updatedTask : task
                );
                setTasks(updated);
                localStorage.setItem('tasks', JSON.stringify(updated));
            }
        }
        setDraggedItem(null);
    }

    function getTaskStatus(task: Task): string {
        if (task.completed) return 'done';
        // You could add logic here to determine in-progress based on due date or other criteria
        return 'to-do';
    }

    const priorityColors = {
        low: 'text-green-600 bg-green-50 border-green-200',
        medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        high: 'text-red-600 bg-red-50 border-red-200',
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
            return matchesSearch && matchesPriority;
        });
    }, [tasks, searchQuery, priorityFilter]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Tasks</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                </button>
            </div>

            {/* Filter Header */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-purple-100 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white"
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
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white"
                        >
                            <option value="all">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
                {STATUS_COLUMNS.map((column) => {
                    const columnTasks = filteredTasks.filter(task => {
                        const status = getTaskStatus(task);
                        return status === column.id;
                    });
                    return (
                        <div
                            key={column.id}
                            className="flex-shrink-0 w-64"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            <div className={`${column.color} rounded-lg p-3 mb-2 border-2`}>
                                <h3 className="font-semibold text-gray-900">{column.label}</h3>
                                <span className="text-xs text-gray-600 font-medium">{columnTasks.length} items</span>
                            </div>
                            <div className="space-y-2 min-h-[200px]">
                                {columnTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, task)}
                                        className="bg-white rounded-lg shadow p-4 cursor-move hover:shadow-lg hover:border-purple-300 border-2 border-transparent transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-gray-900 text-sm flex-1">{task.title}</h4>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setEditingTask(task)}
                                                    className="p-1 text-gray-400 hover:text-blue-600"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        {task.dueDate && (
                                            <p className="text-xs text-gray-500 mb-2">
                                                Due: {new Date(task.dueDate).toLocaleDateString()}
                                            </p>
                                        )}
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showAddModal && (
                <AddTaskModal
                    onClose={() => setShowAddModal(false)}
                    onSave={handleSaveTask}
                />
            )}

            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onSave={handleUpdateTask}
                />
            )}
        </div>
    );
}
