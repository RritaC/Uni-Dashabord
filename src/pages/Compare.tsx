import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, GraduationCap } from 'lucide-react';
import { fetchUniversities, fetchViewData, fetchViews } from '../services/api';

export default function Compare() {
    const [universities, setUniversities] = useState<any[]>([]);
    const [selectedUnis, setSelectedUnis] = useState<number[]>([]);
    const [viewData, setViewData] = useState<any>(null);
    const [columns, setColumns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [unis, views] = await Promise.all([
                fetchUniversities(),
                fetchViews(),
            ]);
            setUniversities(unis);

            const generalView = views.find((v: any) => v.name === 'General');
            if (generalView) {
                const data = await fetchViewData(generalView.id);
                setViewData(data);
                setColumns(data.columns.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)));
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    function toggleUniversity(id: number) {
        setSelectedUnis(prev => {
            if (prev.includes(id)) {
                return prev.filter(uid => uid !== id);
            } else if (prev.length < 3) {
                return [...prev, id];
            } else {
                return prev;
            }
        });
    }

    function getValue(uniId: number, colKey: string): any {
        if (!viewData) return null;
        const row = viewData.data.find((r: any) => r.id === uniId);
        return row?.[colKey] || null;
    }

    function renderValue(value: any, col: any): string {
        if (value === null || value === undefined) return '—';
        if (col.type === 'boolean') {
            return value === 'true' || value === true ? 'Yes' : 'No';
        }
        if (col.type === 'link' && value) {
            return value;
        }
        return String(value);
    }

    const selectedUniversities = universities.filter(u => selectedUnis.includes(u.id));
    const comparisonColumns = columns.filter((c: any) => 
        ['uni_name', 'cntr', 'state', 'city', 'uni_type', 'web', 'tuition_fees_yearly', 
         'acceptance_rate', 'financial_aid_available', 'on_campus_housing', 
         'application_deadlines'].includes(c.key)
    );

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/universities')}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Compare Universities</h1>
                </div>
            </div>

            {/* Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Universities to Compare (up to 3)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {universities.map(uni => {
                        const isSelected = selectedUnis.includes(uni.id);
                        return (
                            <button
                                key={uni.id}
                                onClick={() => toggleUniversity(uni.id)}
                                disabled={!isSelected && selectedUnis.length >= 3}
                                className={`p-4 border-2 rounded-lg text-left transition-all ${
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : selectedUnis.length >= 3
                                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap className={`w-5 h-5 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                                        <div>
                                            <p className="font-medium text-gray-900">{uni.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {uni.city && `${uni.city}, `}
                                                {uni.country}
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">✓</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Comparison Table */}
            {selectedUniversities.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                                        Property
                                    </th>
                                    {selectedUniversities.map(uni => (
                                        <th
                                            key={uni.id}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]"
                                        >
                                            <div>
                                                <p className="font-semibold">{uni.name}</p>
                                                <p className="text-xs text-gray-400 font-normal">
                                                    {uni.city && `${uni.city}, `}
                                                    {uni.country}
                                                </p>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {comparisonColumns.map(col => (
                                    <tr key={col.key} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                                            {col.label}
                                        </td>
                                        {selectedUniversities.map(uni => (
                                            <td
                                                key={uni.id}
                                                className="px-6 py-4 text-sm text-gray-500 min-w-[200px]"
                                            >
                                                {renderValue(getValue(uni.id, col.key), col)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedUniversities.length === 0 && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select up to 3 universities to compare</p>
                </div>
            )}
        </div>
    );
}

