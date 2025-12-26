import { Link, useLocation } from 'react-router-dom';
import { Home, GraduationCap, FileText, Award, CheckSquare, Settings, GitCompare, Calendar } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/universities', icon: GraduationCap, label: 'Universities' },
        { path: '/compare', icon: GitCompare, label: 'Compare' },
        { path: '/timeline', icon: Calendar, label: 'Timeline' },
        { path: '/applications', icon: FileText, label: 'Applications' },
        { path: '/grades', icon: Award, label: 'Grades' },
        { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-xl font-semibold text-gray-900 mb-4">Uni Dashboard</h1>
                        <GlobalSearch />
                    </div>
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto py-6 px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

