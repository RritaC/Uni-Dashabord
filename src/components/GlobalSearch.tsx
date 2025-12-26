import { useState, useEffect, useRef } from 'react';
import { Search, X, GraduationCap, FileText, Award, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchUniversities, fetchApplications, fetchViewData, fetchViews } from '../services/api';

interface SearchResult {
    type: 'university' | 'application' | 'grade' | 'task';
    id: string;
    title: string;
    subtitle?: string;
    url: string;
}

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (query.trim().length > 0) {
            performSearch(query);
        } else {
            setResults([]);
        }
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setIsOpen(true);
            }
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    async function performSearch(searchQuery: string) {
        setLoading(true);
        const queryLower = searchQuery.toLowerCase();
        const searchResults: SearchResult[] = [];

        try {
            // Search universities
            const universities = await fetchUniversities();
            universities.forEach((uni: any) => {
                if (
                    uni.name?.toLowerCase().includes(queryLower) ||
                    uni.country?.toLowerCase().includes(queryLower) ||
                    uni.city?.toLowerCase().includes(queryLower)
                ) {
                    searchResults.push({
                        type: 'university',
                        id: String(uni.id),
                        title: uni.name,
                        subtitle: `${uni.city || ''}, ${uni.country || ''}`.trim(),
                        url: `/universities/${uni.id}`,
                    });
                }
            });

            // Search applications
            const applications = await fetchApplications();
            applications.forEach((app: any) => {
                if (app.name?.toLowerCase().includes(queryLower)) {
                    searchResults.push({
                        type: 'application',
                        id: String(app.id),
                        title: app.name,
                        subtitle: `Status: ${app.status}`,
                        url: '/applications',
                    });
                }
            });

            // Search in spreadsheet data
            const views = await fetchViews();
            const generalView = views.find((v: any) => v.name === 'General');
            if (generalView) {
                const viewData = await fetchViewData(generalView.id);
                viewData.data.forEach((row: any) => {
                    Object.entries(row).forEach(([key, value]) => {
                        if (String(value).toLowerCase().includes(queryLower) && key !== 'id') {
                            const uni = universities.find((u: any) => u.id === row.id);
                            if (uni && !searchResults.find(r => r.type === 'university' && r.id === String(uni.id))) {
                                searchResults.push({
                                    type: 'university',
                                    id: String(uni.id),
                                    title: uni.name,
                                    subtitle: `Found in: ${key}`,
                                    url: `/universities/${uni.id}`,
                                });
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }

        setResults(searchResults.slice(0, 10)); // Limit to 10 results
    }

    function handleResultClick(result: SearchResult) {
        navigate(result.url);
        setIsOpen(false);
        setQuery('');
    }

    function getIcon(type: string) {
        switch (type) {
            case 'university':
                return <GraduationCap className="w-4 h-4" />;
            case 'application':
                return <FileText className="w-4 h-4" />;
            case 'grade':
                return <Award className="w-4 h-4" />;
            case 'task':
                return <CheckSquare className="w-4 h-4" />;
            default:
                return <Search className="w-4 h-4" />;
        }
    }

    return (
        <div ref={searchRef} className="relative">
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors w-full md:w-auto"
            >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Search...</span>
                <span className="hidden md:inline text-xs text-gray-400 ml-auto">⌘K</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                        <div className="flex items-center border-b border-gray-200 p-4">
                            <Search className="w-5 h-5 text-gray-400 mr-3" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search universities, applications, and more..."
                                className="flex-1 outline-none text-lg"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setQuery('');
                                }}
                                className="ml-4 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Searching...</div>
                            ) : results.length > 0 ? (
                                <div className="py-2">
                                    {results.map((result) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            onClick={() => handleResultClick(result)}
                                            className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                                        >
                                            <div className="text-gray-400">{getIcon(result.type)}</div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{result.title}</p>
                                                {result.subtitle && (
                                                    <p className="text-sm text-gray-500">{result.subtitle}</p>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 capitalize">{result.type}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : query.trim().length > 0 ? (
                                <div className="p-8 text-center text-gray-500">No results found</div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    Start typing to search...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

