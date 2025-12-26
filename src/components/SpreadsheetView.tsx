import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Trash2, RefreshCw, Plus, Filter, X, Search, Download, ArrowUpDown } from 'lucide-react';
import { fetchViewData, updateValue, fetchUniversities, fetchCellFormats, saveCellFormat, deleteCellFormat } from '../services/api';
import AIRefreshModal from './AIRefreshModal';
import AddColumnModal from './AddColumnModal';
import CellContextMenu from './CellContextMenu';

interface SpreadsheetViewProps {
    viewId: number;
    viewName: string;
    onBack: () => void;
    onDelete: () => void;
}

export default function SpreadsheetView({ viewId, viewName, onBack, onDelete }: SpreadsheetViewProps) {
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCell, setEditingCell] = useState<{ rowId: number; colKey: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showAIRefresh, setShowAIRefresh] = useState(false);
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [universities, setUniversities] = useState<any[]>([]);
    const [filters, setFilters] = useState<Record<string, { type: string; value: any }>>({});
    const [showFilterMenu, setShowFilterMenu] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [cellFormats, setCellFormats] = useState<Record<string, any>>({});
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowId: number; colKey: string; isInput?: boolean } | null>(null);
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ rowId: number; colKey: string } | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [viewId]);

    // Close filter menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (showFilterMenu && tableRef.current && !tableRef.current.contains(event.target as Node)) {
                setShowFilterMenu(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFilterMenu]);

    // Filter and search data - MUST be before early returns
    const filteredData = useMemo(() => {
        let result = [...data];

        // Apply filters
        if (Object.keys(filters).length > 0) {
            result = result.filter(row => {
                return Object.entries(filters).every(([colKey, filter]) => {
                    if (!filter || !filter.value) return true;

                    const cellValue = String(row[colKey] || '').toLowerCase();
                    const filterValue = String(filter.value).toLowerCase();

                    switch (filter.type) {
                        case 'contains':
                            return cellValue.includes(filterValue);
                        case 'not_contains':
                            return !cellValue.includes(filterValue);
                        case 'equals':
                            return cellValue === filterValue;
                        case 'not_equals':
                            return cellValue !== filterValue;
                        case 'starts_with':
                            return cellValue.startsWith(filterValue);
                        case 'ends_with':
                            return cellValue.endsWith(filterValue);
                        case 'greater_than':
                            const num1 = parseFloat(cellValue);
                            const num2 = parseFloat(filterValue);
                            return !isNaN(num1) && !isNaN(num2) && num1 > num2;
                        case 'less_than':
                            const num3 = parseFloat(cellValue);
                            const num4 = parseFloat(filterValue);
                            return !isNaN(num3) && !isNaN(num4) && num3 < num4;
                        case 'greater_equal':
                            const num5 = parseFloat(cellValue);
                            const num6 = parseFloat(filterValue);
                            return !isNaN(num5) && !isNaN(num6) && num5 >= num6;
                        case 'less_equal':
                            const num7 = parseFloat(cellValue);
                            const num8 = parseFloat(filterValue);
                            return !isNaN(num7) && !isNaN(num8) && num7 <= num8;
                        case 'is_empty':
                            return !cellValue || cellValue.trim() === '';
                        case 'is_not_empty':
                            return cellValue && cellValue.trim() !== '';
                        default:
                            return true;
                    }
                });
            });
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(row => {
                return columns.some((col: any) => {
                    const value = String(row[col.key] || '').toLowerCase();
                    return value.includes(query);
                });
            });
        }

        // Apply sorting
        if (sortConfig) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';

                // Try numeric comparison first
                const aNum = parseFloat(String(aVal));
                const bNum = parseFloat(String(bVal));

                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
                }

                // String comparison
                const aStr = String(aVal).toLowerCase();
                const bStr = String(bVal).toLowerCase();

                if (sortConfig.direction === 'asc') {
                    return aStr.localeCompare(bStr);
                } else {
                    return bStr.localeCompare(aStr);
                }
            });
        }

        return result;
    }, [data, filters, searchQuery, sortConfig, columns]);

    // Only freeze the university name column (uni_name)
    const frozenColumn = useMemo(() => {
        return columns.find((c: any) =>
            c.key === 'uni_name' || c.key === 'Uni Name' || c.label === 'Uni Name'
        );
    }, [columns]);

    const regularColumns = useMemo(() => {
        // Return all columns except the frozen uni_name column
        return columns.filter((c: any) =>
            c.key !== 'uni_name' && c.key !== 'Uni Name' && c.label !== 'Uni Name'
        );
    }, [columns]);

    async function loadData() {
        setLoading(true);
        try {
            const [result, formats] = await Promise.all([
                fetchViewData(viewId),
                fetchCellFormats(viewId),
            ]);
            setColumns(result.columns.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)));
            setData(result.data);
            setCellFormats(formats);

            // Load universities for AI refresh
            const unis = await fetchUniversities();
            setUniversities(unis);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    function startEdit(rowId: number, colKey: string) {
        const row = data.find(r => r.id === rowId);
        setEditValue(row?.[colKey] || '');
        setEditingCell({ rowId, colKey });
    }

    async function handleSave() {
        if (!editingCell) return;
        try {
            await updateValue(editingCell.rowId, editingCell.colKey, viewId, editValue);
            setData(prev => prev.map(row =>
                row.id === editingCell.rowId ? { ...row, [editingCell.colKey]: editValue } : row
            ));
            setEditingCell(null);
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save value');
        }
    }

    function handleCancel() {
        setEditingCell(null);
        setEditValue('');
    }

    function getCellValue(row: any, colKey: string): string {
        return row[colKey] || '';
    }

    function getCellFormat(rowId: number, colKey: string) {
        const key = `${rowId}_${colKey}`;
        return cellFormats[key] || {};
    }

    function handleContextMenu(e: React.MouseEvent, rowId: number, colKey: string) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, rowId, colKey });
    }

    function getCellKey(rowId: number, colKey: string): string {
        return `${rowId}_${colKey}`;
    }

    function isCellSelected(rowId: number, colKey: string): boolean {
        return selectedCells.has(getCellKey(rowId, colKey));
    }

    function handleCellMouseDown(e: React.MouseEvent, rowId: number, colKey: string) {
        if (e.button !== 0) return; // Only handle left click

        if (e.ctrlKey || e.metaKey) {
            // Add to selection
            const key = getCellKey(rowId, colKey);
            setSelectedCells(prev => {
                const next = new Set(prev);
                if (next.has(key)) {
                    next.delete(key);
                } else {
                    next.add(key);
                }
                return next;
            });
        } else {
            // Start new selection
            setSelectionStart({ rowId, colKey });
            setSelectedCells(new Set([getCellKey(rowId, colKey)]));
            setIsSelecting(true);
        }
    }

    function handleCellMouseEnter(rowId: number, colKey: string) {
        if (isSelecting && selectionStart) {
            // Calculate range
            const startRowIndex = filteredData.findIndex(r => r.id === selectionStart.rowId);
            const endRowIndex = filteredData.findIndex(r => r.id === rowId);
            const allColumns = frozenColumn ? [frozenColumn, ...regularColumns] : regularColumns;
            const startColIndex = allColumns.findIndex(c => c.key === selectionStart.colKey);
            const endColIndex = allColumns.findIndex(c => c.key === colKey);

            const minRow = Math.min(startRowIndex, endRowIndex);
            const maxRow = Math.max(startRowIndex, endRowIndex);
            const minCol = Math.min(startColIndex, endColIndex);
            const maxCol = Math.max(startColIndex, endColIndex);

            const newSelection = new Set<string>();
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    const row = filteredData[r];
                    const col = allColumns[c];
                    if (row && col) {
                        newSelection.add(getCellKey(row.id, col.key));
                    }
                }
            }
            setSelectedCells(newSelection);
        }
    }

    useEffect(() => {
        function handleMouseUp() {
            setIsSelecting(false);
            setSelectionStart(null);
        }
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    async function handleFormatChange(rowId: number, colKey: string, format: any) {
        console.log('handleFormatChange called with:', { rowId, colKey, format });

        // If multiple cells are selected, apply to all
        const cellsToFormat = selectedCells.size > 1 && isCellSelected(rowId, colKey)
            ? Array.from(selectedCells).map(key => {
                const [rId, cKey] = key.split('_');
                return { rowId: parseInt(rId), colKey: cKey };
            })
            : [{ rowId, colKey }];

        console.log('Cells to format:', cellsToFormat);

        const updatedFormats = { ...cellFormats };

        for (const cell of cellsToFormat) {
            const key = getCellKey(cell.rowId, cell.colKey);
            const currentFormat = cellFormats[key] || {};
            // Merge formats - new format values override current ones
            const newFormat: any = { ...currentFormat };

            // Apply new format values
            Object.keys(format).forEach(k => {
                if (format[k] === null) {
                    // Explicitly set to null means clear this property
                    delete newFormat[k];
                } else if (format[k] !== undefined && format[k] !== false) {
                    // Set the value
                    newFormat[k] = format[k];
                } else if (format[k] === false) {
                    // false means explicitly disable (for boolean properties)
                    newFormat[k] = false;
                }
            });

            console.log(`Formatting cell ${key}:`, { currentFormat, format, newFormat });

            // If format is empty, delete it
            if (Object.keys(newFormat).length === 0) {
                try {
                    await deleteCellFormat(cell.rowId, cell.colKey, viewId);
                    delete updatedFormats[key];
                    console.log(`Deleted format for cell ${key}`);
                } catch (error) {
                    console.error('Failed to delete format:', error);
                    alert(`Failed to delete format: ${error}`);
                }
            } else {
                try {
                    const result = await saveCellFormat({
                        university_id: cell.rowId,
                        column_key: cell.colKey,
                        view_id: viewId,
                        background_color: newFormat.backgroundColor || null,
                        text_color: newFormat.textColor || null,
                        bold: newFormat.bold || false,
                        italic: newFormat.italic || false,
                        underline: newFormat.underline || false,
                        font_size: newFormat.fontSize || null,
                        text_align: newFormat.textAlign || null,
                        border_color: newFormat.borderColor || null,
                        border_style: newFormat.borderStyle || null,
                        border_width: newFormat.borderWidth || null,
                    });
                    console.log(`Saved format for cell ${key}:`, result);
                    updatedFormats[key] = newFormat;
                } catch (error) {
                    console.error('Failed to save format:', error);
                    alert(`Failed to save format: ${error}`);
                }
            }
        }

        // Update state immediately for visual feedback
        setCellFormats(updatedFormats);

        // Reload formats from server to ensure consistency
        try {
            const formats = await fetchCellFormats(viewId);
            console.log('Reloaded formats from server:', formats);
            setCellFormats(formats);
        } catch (error) {
            console.error('Failed to reload formats:', error);
        }
    }

    function renderCell(row: any, col: any) {
        const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
        const value = getCellValue(row, col.key);
        const isSelected = isCellSelected(row.id, col.key);

        if (isEditing) {
            if (col.type === 'boolean') {
                return (
                    <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        className="w-full h-full px-2 py-1 border-2 border-blue-500 focus:outline-none"
                        autoFocus
                    >
                        <option value="">—</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                );
            }
            if (col.type === 'select') {
                const options = col.select_options ? JSON.parse(col.select_options) : [];
                return (
                    <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        className="w-full h-full px-2 py-1 border-2 border-blue-500 focus:outline-none"
                        autoFocus
                    >
                        <option value="">—</option>
                        {options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            }
            return (
                <input
                    type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSave();
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            handleCancel();
                        }
                    }}
                    className="w-full h-full px-2 py-1 border-2 border-blue-500 focus:outline-none"
                    autoFocus
                />
            );
        }

        // Get cell formatting
        const format = getCellFormat(row.id, col.key);
        const hasBackground = format.backgroundColor;
        // When selected, show selection color but keep the background color if it exists
        const cellStyle: React.CSSProperties = {
            backgroundColor: isSelected
                ? (format.backgroundColor ? format.backgroundColor : '#BFDBFE')
                : (format.backgroundColor || undefined),
            color: format.textColor || undefined,
            fontWeight: format.bold ? 'bold' : undefined,
            fontStyle: format.italic ? 'italic' : undefined,
            textDecoration: format.underline ? 'underline' : undefined,
            fontSize: format.fontSize || undefined,
            textAlign: format.textAlign || undefined,
            border: format.borderColor && format.borderWidth && format.borderStyle
                ? `${format.borderWidth} ${format.borderStyle} ${format.borderColor}`
                : undefined,
        };

        // Format display value based on type
        let displayValue = value || '—';
        if (col.type === 'link' && value) {
            return (
                <div
                    onClick={() => startEdit(row.id, col.key)}
                    onMouseDown={(e) => handleCellMouseDown(e, row.id, col.key)}
                    onMouseEnter={() => handleCellMouseEnter(row.id, col.key)}
                    onContextMenu={(e) => handleContextMenu(e, row.id, col.key)}
                    className={`w-full h-full px-2 py-1 cursor-cell flex items-center ${isSelected ? 'ring-2 ring-blue-500' : ''} ${hasBackground && !isSelected ? 'hover:opacity-80' : 'hover:bg-blue-50'}`}
                    style={cellStyle}
                >
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                        {value}
                    </a>
                </div>
            );
        }
        if (col.type === 'boolean' && value !== null && value !== '') {
            const boolValue = typeof value === 'string' ? value === 'true' : Boolean(value);
            displayValue = boolValue ? 'Yes' : 'No';
        }

        return (
            <div
                onClick={() => {
                    if (!isSelecting) {
                        startEdit(row.id, col.key);
                    }
                }}
                onMouseDown={(e) => handleCellMouseDown(e, row.id, col.key)}
                onMouseEnter={() => handleCellMouseEnter(row.id, col.key)}
                onContextMenu={(e) => handleContextMenu(e, row.id, col.key)}
                className={`w-full h-full px-2 py-1 cursor-cell flex items-center text-sm ${isSelected ? 'ring-2 ring-blue-500' : ''} ${hasBackground && !isSelected ? 'hover:opacity-80' : 'hover:bg-blue-50'}`}
                style={cellStyle}
            >
                {displayValue}
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading spreadsheet...</div>;
    }

    function getFilterTypes(col: any) {
        if (col.type === 'number') {
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'not_equals', label: 'Not equals' },
                { value: 'greater_than', label: 'Greater than' },
                { value: 'less_than', label: 'Less than' },
                { value: 'greater_equal', label: 'Greater or equal' },
                { value: 'less_equal', label: 'Less or equal' },
                { value: 'is_empty', label: 'Is empty' },
                { value: 'is_not_empty', label: 'Is not empty' },
            ];
        } else if (col.type === 'boolean') {
            return [
                { value: 'equals', label: 'Equals' },
                { value: 'is_empty', label: 'Is empty' },
                { value: 'is_not_empty', label: 'Is not empty' },
            ];
        } else {
            return [
                { value: 'contains', label: 'Contains' },
                { value: 'not_contains', label: 'Does not contain' },
                { value: 'equals', label: 'Equals' },
                { value: 'not_equals', label: 'Not equals' },
                { value: 'starts_with', label: 'Starts with' },
                { value: 'ends_with', label: 'Ends with' },
                { value: 'is_empty', label: 'Is empty' },
                { value: 'is_not_empty', label: 'Is not empty' },
            ];
        }
    }

    function handleFilterChange(colKey: string, filterType: string, value: any) {
        setFilters(prev => {
            if (!value || value === '') {
                const newFilters = { ...prev };
                delete newFilters[colKey];
                return newFilters;
            }
            return {
                ...prev,
                [colKey]: { type: filterType, value }
            };
        });
        setShowFilterMenu(null);
    }

    function clearFilter(colKey: string) {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[colKey];
            return newFilters;
        });
    }

    function clearAllFilters() {
        setFilters({});
    }

    function renderFilterMenu(col: any) {
        if (showFilterMenu !== col.key) return null;

        const filterTypes = getFilterTypes(col);
        const currentFilter = filters[col.key];

        return (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[200px]">
                <div className="p-3 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Filter by {col.label}</span>
                        <button
                            onClick={() => setShowFilterMenu(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <select
                        value={currentFilter?.type || 'contains'}
                        onChange={(e) => {
                            const newFilter = { ...currentFilter, type: e.target.value };
                            if (currentFilter?.value) {
                                handleFilterChange(col.key, e.target.value, currentFilter.value);
                            } else {
                                setFilters(prev => ({ ...prev, [col.key]: newFilter }));
                            }
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                        {filterTypes.map(ft => (
                            <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                    </select>
                </div>
                <div className="p-3">
                    {currentFilter?.type !== 'is_empty' && currentFilter?.type !== 'is_not_empty' && (
                        <input
                            type={col.type === 'number' ? 'number' : 'text'}
                            value={currentFilter?.value || ''}
                            onChange={(e) => {
                                const value = col.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                                handleFilterChange(col.key, currentFilter?.type || 'contains', value);
                            }}
                            placeholder="Enter value..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            autoFocus
                        />
                    )}
                    {currentFilter && (
                        <button
                            onClick={() => clearFilter(col.key)}
                            className="mt-2 w-full px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                        >
                            Clear filter
                        </button>
                    )}
                </div>
            </div>
        );
    }

    function handleSort(colKey: string) {
        setSortConfig(prev => {
            if (prev?.key === colKey) {
                if (prev.direction === 'asc') {
                    return { key: colKey, direction: 'desc' };
                } else {
                    return null; // Remove sort
                }
            } else {
                return { key: colKey, direction: 'asc' };
            }
        });
    }

    function exportToCSV() {
        if (filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = columns.map((col: any) => col.label);
        const rows = filteredData.map(row =>
            columns.map((col: any) => {
                const value = row[col.key] || '';
                // Escape quotes and wrap in quotes if contains comma
                const str = String(value);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            })
        );

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${viewName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    function renderHeader(col: any, isFrozen: boolean) {
        const hasFilter = filters[col.key];
        const isSorted = sortConfig?.key === col.key;
        const sortDirection = isSorted && sortConfig ? sortConfig.direction : null;

        return (
            <th
                key={col.key}
                className={`px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase bg-gray-100 border-r border-gray-300 ${isFrozen ? 'sticky left-0 z-30' : ''}`}
                style={{ minWidth: '150px' }}
            >
                <div className="flex items-center justify-between gap-1">
                    <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 flex-1 hover:text-blue-600 group"
                    >
                        <span>{col.label}</span>
                        <ArrowUpDown className={`w-3 h-3 ${isSorted ? 'text-blue-600' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                        {sortDirection === 'asc' && <span className="text-blue-600 text-xs">↑</span>}
                        {sortDirection === 'desc' && <span className="text-blue-600 text-xs">↓</span>}
                    </button>
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterMenu(showFilterMenu === col.key ? null : col.key);
                            }}
                            className={`p-1 rounded hover:bg-gray-200 ${hasFilter ? 'text-blue-600' : 'text-gray-400'}`}
                            title="Filter"
                        >
                            <Filter className="w-3 h-3" />
                        </button>
                        {renderFilterMenu(col)}
                    </div>
                </div>
            </th>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{viewName}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Showing {filteredData.length} of {data.length} rows
                            {(searchQuery || Object.keys(filters).length > 0 || sortConfig) && ' (filtered/sorted)'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search all columns..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {Object.keys(filters).length > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Clear Filters ({Object.keys(filters).length})
                        </button>
                    )}
                    {sortConfig && (
                        <button
                            onClick={() => setSortConfig(null)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Clear Sort
                        </button>
                    )}
                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        title="Export to CSV"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button
                        onClick={() => setShowAddColumn(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Column
                    </button>
                    <button
                        onClick={() => setShowAIRefresh(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        AI Refresh
                    </button>
                    <button
                        onClick={onDelete}
                        className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto" ref={tableRef}>
                <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                {frozenColumn && renderHeader(frozenColumn, true)}
                                {regularColumns.map((col: any) => renderHeader(col, false))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                                        No rows match the current filters
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        {frozenColumn && (
                                            <td
                                                key={`${row.id}-${frozenColumn.key}`}
                                                className="px-0 py-0 border-r border-gray-300 h-10 sticky left-0 z-10 bg-white hover:bg-gray-50"
                                            >
                                                {renderCell(row, frozenColumn)}
                                            </td>
                                        )}
                                        {regularColumns.map((col: any) => (
                                            <td
                                                key={`${row.id}-${col.key}`}
                                                className="px-0 py-0 border-r border-gray-300 h-10"
                                            >
                                                {renderCell(row, col)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAIRefresh && (
                <AIRefreshModal
                    universities={data.map(row => {
                        const uni = universities.find(u => u.id === row.id);
                        return {
                            id: row.id,
                            name: row.uni_name || uni?.name || '',
                            country: row.cntr || uni?.country || null,
                            state: row.state || uni?.state || null,
                            city: row.city || uni?.city || null,
                            type: row.uni_type || uni?.type || null,
                            website: row.web || uni?.website || null,
                        };
                    })}
                    columns={columns}
                    viewId={viewId}
                    onClose={() => {
                        setShowAIRefresh(false);
                        loadData(); // Reload data after AI refresh
                    }}
                />
            )}

            {showAddColumn && (
                <AddColumnModal
                    viewId={viewId}
                    onClose={() => {
                        setShowAddColumn(false);
                        loadData(); // Reload to show new column
                    }}
                />
            )}

            {contextMenu && (
                <CellContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => {
                        console.log('Context menu closing');
                        setContextMenu(null);
                    }}
                    onFormatChange={(format) => {
                        console.log('Format change from context menu:', format, 'for cell:', contextMenu.rowId, contextMenu.colKey);
                        handleFormatChange(contextMenu.rowId, contextMenu.colKey, format);
                    }}
                    currentFormat={getCellFormat(contextMenu.rowId, contextMenu.colKey)}
                    isMultiSelect={selectedCells.size > 1 && isCellSelected(contextMenu.rowId, contextMenu.colKey)}
                />
            )}
        </div>
    );
}

