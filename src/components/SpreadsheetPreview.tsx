import { useMemo } from 'react';

interface SpreadsheetPreviewProps {
    viewId: number;
    previewData: any;
}

export default function SpreadsheetPreview({ viewId, previewData }: SpreadsheetPreviewProps) {
    const preview = useMemo(() => {
        if (!previewData || !previewData.columns || !previewData.data) {
            return null;
        }

        // Get first 3-4 visible columns (prioritize uni_name if available)
        const visibleColumns = previewData.columns
            .filter((col: any) => col.visible !== 0)
            .sort((a: any, b: any) => {
                // Put uni_name first
                if (a.key === 'uni_name') return -1;
                if (b.key === 'uni_name') return 1;
                return (a.order_index || 0) - (b.order_index || 0);
            })
            .slice(0, 4);

        // Get first 3 rows
        const previewRows = previewData.data.slice(0, 3);

        return { columns: visibleColumns, rows: previewRows };
    }, [previewData]);

    if (!preview || preview.columns.length === 0 || preview.rows.length === 0) {
        return (
            <div className="mt-3 h-32 bg-gray-50 rounded border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                No data available
            </div>
        );
    }

    return (
        <div className="mt-3 h-32 bg-white rounded border border-gray-200 overflow-hidden">
            <div className="h-full overflow-auto">
                <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            {preview.columns.map((col: any) => (
                                <th
                                    key={col.key}
                                    className="px-2 py-1 text-left font-semibold text-gray-700 border-r border-gray-200"
                                    style={{ minWidth: '80px', maxWidth: '100px' }}
                                >
                                    <div className="truncate" title={col.label}>
                                        {col.label}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {preview.rows.map((row: any, rowIndex: number) => (
                            <tr key={row.id || rowIndex} className="border-b border-gray-100">
                                {preview.columns.map((col: any) => {
                                    const value = row[col.key];
                                    let displayValue = value || '—';
                                    
                                    if (col.type === 'boolean') {
                                        displayValue = value === 'true' || value === true ? 'Yes' : 'No';
                                    } else if (col.type === 'number' && value) {
                                        displayValue = Number(value).toLocaleString();
                                    } else if (typeof value === 'string' && value.length > 15) {
                                        displayValue = value.substring(0, 15) + '...';
                                    }

                                    return (
                                        <td
                                            key={col.key}
                                            className="px-2 py-1 text-gray-600 border-r border-gray-200"
                                            style={{ minWidth: '80px', maxWidth: '100px' }}
                                        >
                                            <div className="truncate" title={String(value || '')}>
                                                {displayValue}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

