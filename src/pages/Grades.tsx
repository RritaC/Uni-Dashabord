import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Save, X, Copy, Edit2, Search } from 'lucide-react';

interface Grade {
    id: string;
    course: string;
    grade: string;
    credits: number;
    semester: string;
    school: string;
}

export default function Grades() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<string>('astra-nova');
    const [selectedSemester, setSelectedSemester] = useState<string>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newRow, setNewRow] = useState<Partial<Grade> | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadGrades();
    }, []);

    async function loadGrades() {
        try {
            const { fetchGrades } = await import('../services/api');
            const data = await fetchGrades();
            console.log('Loaded grades:', data);
            setGrades(data.map((g: any) => ({
                id: String(g.id),
                course: g.course,
                grade: g.grade,
                credits: Number(g.credits) || 0,
                semester: g.semester,
                school: g.school,
            })));
        } catch (error) {
            console.error('Failed to load grades:', error);
            // Fallback to localStorage
            const stored = localStorage.getItem('grades');
            if (stored) {
                setGrades(JSON.parse(stored));
            }
        }
    }


    function getGradeOptions(school: string): string[] {
        if (school === 'm3') {
            return ['5', '4', '3', '2', '1'];
        } else {
            return ['T*', 'T', 'DEV', 'U', 'S'];
        }
    }

    function calculateGPA(gradeList: Grade[]): number {
        if (gradeList.length === 0) return 0;

        const school = gradeList[0]?.school || 'astra-nova';

        // M3 grade points: 5=5.0, 4=4.0, 3=3.0, 2=2.0, 1=1.0
        // Astra Nova: T*=4.0, T=3.0, DEV=2.0, U=1.0, S=0.0
        const gradePoints: Record<string, Record<string, number>> = {
            'm3': {
                '5': 5.0,
                '4': 4.0,
                '3': 3.0,
                '2': 2.0,
                '1': 1.0,
            },
            'astra-nova': {
                'T*': 4.0,
                'T': 3.0,
                'DEV': 2.0,
                'U': 1.0,
                'S': 0.0,
            },
        };

        const pointsMap = gradePoints[school] || gradePoints['astra-nova'];
        let totalPoints = 0;
        let count = 0;

        gradeList.forEach(grade => {
            const points = pointsMap[grade.grade] || 0;
            totalPoints += points;
            count += 1;
        });

        return count > 0 ? totalPoints / count : 0;
    }

    function handleAddRow() {
        setNewRow({
            course: '',
            grade: '',
            credits: 0,
            semester: '',
            school: selectedSchool,
        });
    }

    async function handleSaveNewRow() {
        if (!newRow?.course || !newRow?.grade || !newRow?.semester) return;

        const grade: Grade = {
            id: Date.now().toString(),
            course: newRow.course,
            grade: newRow.grade,
            credits: 0, // Keep for database compatibility but not displayed
            semester: newRow.semester,
            school: newRow.school || selectedSchool,
        };

        const updated = [...grades, grade];
        setGrades(updated);
        setNewRow(null);

        try {
            const { saveGrade } = await import('../services/api');
            await saveGrade({
                id: grade.id,
                course: grade.course,
                grade: grade.grade,
                credits: grade.credits,
                semester: grade.semester,
                school: grade.school,
            });
        } catch (error) {
            console.error('Failed to save to database:', error);
            localStorage.setItem('grades', JSON.stringify(updated));
        }
    }

    async function handleUpdateGrade(id: string, field: keyof Grade, value: any) {
        const updated = grades.map(g =>
            g.id === id ? { ...g, [field]: value } : g
        );
        setGrades(updated);

        try {
            const { updateGrade } = await import('../services/api');
            const grade = updated.find(g => g.id === id);
            if (grade) {
                await updateGrade(id, {
                    course: grade.course,
                    grade: grade.grade,
                    credits: grade.credits,
                    semester: grade.semester,
                    school: grade.school,
                });
            }
        } catch (error) {
            console.error('Failed to update in database:', error);
            localStorage.setItem('grades', JSON.stringify(updated));
        }
    }

    async function handleDelete(id: string) {
        if (confirm('Delete this grade?')) {
            const updated = grades.filter(g => g.id !== id);
            setGrades(updated);

            try {
                const { deleteGrade } = await import('../services/api');
                await deleteGrade(id);
            } catch (error) {
                console.error('Failed to delete from database:', error);
                localStorage.setItem('grades', JSON.stringify(updated));
            }
        }
    }

    async function handleCopyGrade(grade: Grade) {
        const newGrade: Grade = {
            id: Date.now().toString(),
            course: grade.course + ' (Copy)',
            grade: grade.grade,
            credits: grade.credits,
            semester: grade.semester,
            school: grade.school,
        };

        const updated = [...grades, newGrade];
        setGrades(updated);

        try {
            const { saveGrade } = await import('../services/api');
            await saveGrade({
                id: newGrade.id,
                course: newGrade.course,
                grade: newGrade.grade,
                credits: newGrade.credits,
                semester: newGrade.semester,
                school: newGrade.school,
            });
        } catch (error) {
            console.error('Failed to save to database:', error);
            localStorage.setItem('grades', JSON.stringify(updated));
        }
    }

    const schoolGrades = useMemo(() => grades.filter((g: Grade) => g.school === selectedSchool), [grades, selectedSchool]);

    // Default semesters for each school
    const defaultSemesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4'];
    const existingSemesters = Array.from(new Set(schoolGrades.map((g: Grade) => g.semester).filter(Boolean)));
    const semesters = existingSemesters.length > 0 ? existingSemesters.sort() : defaultSemesters;

    const filteredGrades = useMemo(() => {
        let filtered = selectedSemester === 'all'
            ? schoolGrades
            : schoolGrades.filter((g: Grade) => g.semester === selectedSemester);

        if (searchQuery) {
            filtered = filtered.filter((g: Grade) =>
                g.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.grade.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [schoolGrades, selectedSemester, searchQuery]);

    const semesterGPA = useMemo(() => calculateGPA(filteredGrades), [filteredGrades]);
    const allGPA = useMemo(() => calculateGPA(schoolGrades), [schoolGrades]);

    function renderCell(grade: Grade, field: keyof Grade) {
        const isEditing = editingId === grade.id;
        const value = grade[field];

        if (isEditing) {
            if (field === 'grade') {
                const gradeOptions = getGradeOptions(grade.school);
                return (
                    <select
                        value={String(value)}
                        onChange={(e) => {
                            handleUpdateGrade(grade.id, field, e.target.value);
                        }}
                        onBlur={(e) => {
                            // Only close if not clicking on another cell in the same row
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            if (!relatedTarget || !relatedTarget.closest('tr')?.contains(relatedTarget)) {
                                setEditingId(null);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setEditingId(null);
                            }
                        }}
                        className="w-full h-full px-4 py-3 border-2 border-blue-500 rounded-none text-sm focus:outline-none focus:ring-0"
                        autoFocus
                    >
                        <option value="">Select...</option>
                        {gradeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            }
            if (field === 'semester') {
                const defaultSemesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4'];
                return (
                    <select
                        value={String(value || '')}
                        onChange={(e) => {
                            handleUpdateGrade(grade.id, field, e.target.value);
                        }}
                        onBlur={(e) => {
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            if (!relatedTarget || !relatedTarget.closest('tr')?.contains(relatedTarget)) {
                                setEditingId(null);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setEditingId(null);
                            }
                        }}
                        className="w-full h-full px-4 py-3 border-2 border-blue-500 rounded-none text-sm focus:outline-none focus:ring-0"
                        autoFocus
                    >
                        <option value="">Select...</option>
                        {defaultSemesters.map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                        ))}
                    </select>
                );
            }
            return (
                <input
                    type="text"
                    value={String(value || '')}
                    onChange={(e) => handleUpdateGrade(grade.id, field, e.target.value)}
                    onBlur={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget || !relatedTarget.closest('tr')?.contains(relatedTarget)) {
                            setEditingId(null);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            setEditingId(null);
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditingId(null);
                        }
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            setEditingId(null);
                        }
                    }}
                    className="w-full h-full px-4 py-3 border-2 border-blue-500 rounded-none text-sm focus:outline-none focus:ring-0"
                    autoFocus
                />
            );
        }

        return (
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(grade.id);
                }}
                className="w-full h-full px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center"
            >
                {value || '—'}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/20 to-teal-50/20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Grades</h1>
            </div>

            {/* Filter Header */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-emerald-100 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search courses or grades..."
                                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white"
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
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                        <select
                            value={selectedSchool}
                            onChange={(e) => {
                                setSelectedSchool(e.target.value);
                                setSelectedSemester('all');
                            }}
                            className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white"
                        >
                            <option value="astra-nova">Astra Nova</option>
                            <option value="m3">M3</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedSemester('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedSemester === 'all'
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                                    }`}
                            >
                                All
                            </button>
                            {semesters.map((sem: string) => (
                                <button
                                    key={sem}
                                    onClick={() => setSelectedSemester(sem)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedSemester === sem
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                                        }`}
                                >
                                    {sem}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-600 mb-1">Overall GPA</p>
                    <p className="text-3xl font-bold text-gray-900">{allGPA.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {schoolGrades.length} courses
                    </p>
                </div>
                {semesters.slice(0, 3).map((sem: string) => {
                    const semGrades = schoolGrades.filter((g: Grade) => g.semester === sem);
                    const gpa = calculateGPA(semGrades);
                    return (
                        <div key={sem} className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm font-medium text-gray-600 mb-1">{sem}</p>
                            <p className="text-3xl font-bold text-gray-900">{gpa.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {semGrades.length} courses
                            </p>
                        </div>
                    );
                }).concat(
                    Array(Math.max(0, 3 - semesters.length)).fill(null).map((_, idx) => (
                        <div key={`empty-${idx}`} className="bg-gray-50 rounded-lg shadow p-6 border-2 border-dashed border-gray-200">
                            <p className="text-sm font-medium text-gray-400 mb-1">No data</p>
                            <p className="text-3xl font-bold text-gray-300">—</p>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Grades Table</h2>
                    <button
                        onClick={handleAddRow}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Row
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {newRow && (
                                <tr className="bg-blue-50">
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={newRow.course || ''}
                                            onChange={(e) => setNewRow({ ...newRow, course: e.target.value })}
                                            placeholder="Course name"
                                            className="w-full px-2 py-1 border border-blue-500 rounded text-sm"
                                            autoFocus
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={newRow.grade || ''}
                                            onChange={(e) => setNewRow({ ...newRow, grade: e.target.value })}
                                            className="w-full px-2 py-1 border border-blue-500 rounded text-sm"
                                        >
                                            <option value="">Select...</option>
                                            {getGradeOptions(newRow.school || selectedSchool).map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={newRow.semester || ''}
                                            onChange={(e) => setNewRow({ ...newRow, semester: e.target.value })}
                                            className="w-full px-2 py-1 border border-blue-500 rounded text-sm"
                                        >
                                            <option value="">Select semester...</option>
                                            {selectedSchool === 'astra-nova' ? (
                                                <>
                                                    <option value="Semester 1">Semester 1</option>
                                                    <option value="Semester 2">Semester 2</option>
                                                    <option value="Semester 3">Semester 3</option>
                                                    <option value="Semester 4">Semester 4</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Semester 1">Semester 1</option>
                                                    <option value="Semester 2">Semester 2</option>
                                                    <option value="Semester 3">Semester 3</option>
                                                    <option value="Semester 4">Semester 4</option>
                                                </>
                                            )}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveNewRow}
                                                className="text-green-600 hover:text-green-700"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setNewRow(null)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filteredGrades.length === 0 && !newRow ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No grades entered yet
                                    </td>
                                </tr>
                            ) : (
                                filteredGrades.map((grade: Grade) => (
                                    <tr key={grade.id} className="hover:bg-gray-50">
                                        <td className="p-0 whitespace-nowrap text-sm h-12">
                                            {renderCell(grade, 'course')}
                                        </td>
                                        <td className="p-0 whitespace-nowrap text-sm h-12">
                                            {renderCell(grade, 'grade')}
                                        </td>
                                        <td className="p-0 whitespace-nowrap text-sm h-12">
                                            {renderCell(grade, 'semester')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (editingId === grade.id) {
                                                            setEditingId(null);
                                                        } else {
                                                            setEditingId(grade.id);
                                                        }
                                                    }}
                                                    className={`text-gray-400 hover:text-blue-600 ${editingId === grade.id ? 'text-blue-600' : ''}`}
                                                    title={editingId === grade.id ? "Stop editing" : "Edit grade"}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopyGrade(grade);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-600"
                                                    title="Copy grade"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(grade.id);
                                                    }}
                                                    className="text-gray-400 hover:text-red-600"
                                                    title="Delete grade"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
