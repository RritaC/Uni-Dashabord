import { useEffect, useRef, useState } from 'react';
import { Palette, Type, X, AlignLeft, AlignCenter, AlignRight, Minus, Maximize2 } from 'lucide-react';

interface CellContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onFormatChange: (format: {
        backgroundColor?: string | null;
        textColor?: string | null;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        fontSize?: string | null;
        textAlign?: string | null;
        borderColor?: string | null;
        borderStyle?: string | null;
        borderWidth?: string | null;
    }) => void;
    currentFormat?: {
        backgroundColor?: string | null;
        textColor?: string | null;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        fontSize?: string | null;
        textAlign?: string | null;
        borderColor?: string | null;
        borderStyle?: string | null;
        borderWidth?: string | null;
    };
    isMultiSelect?: boolean;
}

const PRESET_COLORS = [
    { name: 'Yellow', value: '#FEF3C7' },
    { name: 'Green', value: '#D1FAE5' },
    { name: 'Blue', value: '#DBEAFE' },
    { name: 'Red', value: '#FEE2E2' },
    { name: 'Purple', value: '#E9D5FF' },
    { name: 'Orange', value: '#FED7AA' },
    { name: 'Pink', value: '#FCE7F3' },
    { name: 'Gray', value: '#F3F4F6' },
    { name: 'None', value: null },
];

const TEXT_COLORS = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#DC2626' },
    { name: 'Blue', value: '#2563EB' },
    { name: 'Green', value: '#16A34A' },
    { name: 'Purple', value: '#9333EA' },
    { name: 'Orange', value: '#EA580C' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'None', value: null },
];

const FONT_SIZES = ['10px', '12px', '14px', '16px', '18px', '20px', '24px'];
const BORDER_STYLES = ['solid', 'dashed', 'dotted'];
const BORDER_WIDTHS = ['1px', '2px', '3px', '4px'];

export default function CellContextMenu({ x, y, onClose, onFormatChange, currentFormat = {}, isMultiSelect = false }: CellContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [showBgColors, setShowBgColors] = useState(false);
    const [showTextColors, setShowTextColors] = useState(false);
    const [showFontSizes, setShowFontSizes] = useState(false);
    const [showAlignments, setShowAlignments] = useState(false);
    const [showBorders, setShowBorders] = useState(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        // Add listener after a brief delay to allow menu to render
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 10);

        document.addEventListener('keydown', handleEscape);
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    function handleBackgroundColor(e: React.MouseEvent, color: string | null) {
        e.stopPropagation();
        e.preventDefault();
        console.log('handleBackgroundColor called with:', color);
        onFormatChange({ backgroundColor: color });
        setShowBgColors(false);
    }

    function handleTextColor(e: React.MouseEvent, color: string | null) {
        e.stopPropagation();
        e.preventDefault();
        onFormatChange({ textColor: color });
        setShowTextColors(false);
    }

    function toggleBold(e: React.MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        onFormatChange({ bold: !currentFormat.bold });
    }

    function toggleItalic(e: React.MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        onFormatChange({ italic: !currentFormat.italic });
    }

    function toggleUnderline(e: React.MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        onFormatChange({ underline: !currentFormat.underline });
    }

    function handleFontSize(e: React.MouseEvent, size: string) {
        e.stopPropagation();
        e.preventDefault();
        onFormatChange({ fontSize: size });
        setShowFontSizes(false);
    }

    function handleTextAlign(e: React.MouseEvent, align: string) {
        e.stopPropagation();
        e.preventDefault();
        onFormatChange({ textAlign: align });
        setShowAlignments(false);
    }

    function handleBorder(e: React.MouseEvent, color: string | null, style?: string, width?: string) {
        e.stopPropagation();
        e.preventDefault();
        onFormatChange({
            borderColor: color,
            borderStyle: style || 'solid',
            borderWidth: width || '1px',
        });
        setShowBorders(false);
    }

    function clearFormat(e: React.MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        onFormatChange({
            backgroundColor: null,
            textColor: null,
            bold: false,
            italic: false,
            underline: false,
            fontSize: null,
            textAlign: null,
            borderColor: null,
            borderStyle: null,
            borderWidth: null,
        });
        onClose();
    }

    return (
        <div
            ref={menuRef}
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-2 min-w-[220px] max-h-[80vh] overflow-y-auto"
            style={{ left: `${x}px`, top: `${y}px` }}
            onClick={(e) => e.stopPropagation()}
        >
            {isMultiSelect && (
                <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium border-b border-gray-200">
                    Formatting {isMultiSelect ? 'multiple cells' : 'cell'}
                </div>
            )}
            <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setShowBgColors(!showBgColors); }}>
                <Palette className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Background Color</span>
                {currentFormat.backgroundColor && (
                    <div
                        className="w-4 h-4 rounded border border-gray-300 ml-auto"
                        style={{ backgroundColor: currentFormat.backgroundColor }}
                    />
                )}
            </div>
            {showBgColors && (
                <div className="px-2 py-2 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-2">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color.name}
                                onClick={(e) => handleBackgroundColor(e, color.value)}
                                className="px-2 py-1 text-xs rounded hover:bg-gray-100 flex items-center gap-1"
                                title={color.name}
                            >
                                {color.value ? (
                                    <div
                                        className="w-4 h-4 rounded border border-gray-300"
                                        style={{ backgroundColor: color.value }}
                                    />
                                ) : (
                                    <X className="w-4 h-4 text-gray-400" />
                                )}
                                <span className="text-xs">{color.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setShowTextColors(!showTextColors); }}>
                <Type className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Text Color</span>
                {currentFormat.textColor && (
                    <div
                        className="w-4 h-4 rounded border border-gray-300 ml-auto"
                        style={{ backgroundColor: currentFormat.textColor }}
                    />
                )}
            </div>
            {showTextColors && (
                <div className="px-2 py-2 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                        {TEXT_COLORS.map((color) => (
                            <button
                                key={color.name}
                                onClick={(e) => handleTextColor(e, color.value)}
                                className="px-2 py-1 text-xs rounded hover:bg-gray-100 flex items-center gap-1"
                                title={color.name}
                            >
                                {color.value ? (
                                    <div
                                        className="w-4 h-4 rounded border border-gray-300"
                                        style={{ backgroundColor: color.value }}
                                    />
                                ) : (
                                    <X className="w-4 h-4 text-gray-400" />
                                )}
                                <span className="text-xs">{color.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="border-t border-gray-200 my-1" />

            <div
                className={`px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${currentFormat.bold ? 'bg-blue-50' : ''}`}
                onClick={toggleBold}
            >
                <span className="text-sm font-bold">Bold</span>
            </div>

            <div
                className={`px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${currentFormat.italic ? 'bg-blue-50' : ''}`}
                onClick={toggleItalic}
            >
                <span className="text-sm italic">Italic</span>
            </div>

            <div
                className={`px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${currentFormat.underline ? 'bg-blue-50' : ''}`}
                onClick={toggleUnderline}
            >
                <span className="text-sm underline">Underline</span>
            </div>

            <div className="border-t border-gray-200 my-1" />

            {/* Font Size */}
            <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setShowFontSizes(!showFontSizes); }}>
                <Maximize2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Font Size</span>
                {currentFormat.fontSize && (
                    <span className="text-xs text-gray-500 ml-auto">{currentFormat.fontSize}</span>
                )}
            </div>
            {showFontSizes && (
                <div className="px-2 py-2 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-1">
                        {FONT_SIZES.map((size) => (
                            <button
                                key={size}
                                onClick={(e) => handleFontSize(e, size)}
                                className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${currentFormat.fontSize === size ? 'bg-blue-50' : ''}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Text Alignment */}
            <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setShowAlignments(!showAlignments); }}>
                <AlignLeft className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Alignment</span>
                {currentFormat.textAlign && (
                    <span className="text-xs text-gray-500 ml-auto capitalize">{currentFormat.textAlign}</span>
                )}
            </div>
            {showAlignments && (
                <div className="px-2 py-2 border-t border-gray-200">
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => handleTextAlign(e, 'left')}
                            className={`px-3 py-1 text-sm rounded hover:bg-gray-100 flex items-center gap-1 ${currentFormat.textAlign === 'left' ? 'bg-blue-50' : ''}`}
                        >
                            <AlignLeft className="w-4 h-4" />
                            Left
                        </button>
                        <button
                            onClick={(e) => handleTextAlign(e, 'center')}
                            className={`px-3 py-1 text-sm rounded hover:bg-gray-100 flex items-center gap-1 ${currentFormat.textAlign === 'center' ? 'bg-blue-50' : ''}`}
                        >
                            <AlignCenter className="w-4 h-4" />
                            Center
                        </button>
                        <button
                            onClick={(e) => handleTextAlign(e, 'right')}
                            className={`px-3 py-1 text-sm rounded hover:bg-gray-100 flex items-center gap-1 ${currentFormat.textAlign === 'right' ? 'bg-blue-50' : ''}`}
                        >
                            <AlignRight className="w-4 h-4" />
                            Right
                        </button>
                    </div>
                </div>
            )}

            {/* Borders */}
            <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center gap-2" onClick={() => setShowBorders(!showBorders)}>
                <Minus className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Border</span>
                {currentFormat.borderColor && (
                    <div
                        className="w-4 h-4 rounded border border-gray-300 ml-auto"
                        style={{ backgroundColor: currentFormat.borderColor }}
                    />
                )}
            </div>
            {showBorders && (
                <div className="px-2 py-2 border-t border-gray-200">
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-gray-600 mb-1 block">Border Color</label>
                            <div className="grid grid-cols-4 gap-1">
                                {PRESET_COLORS.slice(0, 8).map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={(e) => handleBorder(e, color.value, currentFormat.borderStyle || 'solid', currentFormat.borderWidth || '1px')}
                                        className="p-1 rounded hover:bg-gray-100"
                                        title={color.name}
                                    >
                                        {color.value ? (
                                            <div
                                                className="w-full h-4 rounded border border-gray-300"
                                                style={{ backgroundColor: color.value }}
                                            />
                                        ) : (
                                            <div className="w-full h-4 rounded border-2 border-dashed border-gray-400 flex items-center justify-center">
                                                <X className="w-3 h-3 text-gray-400" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-600 mb-1 block">Style</label>
                            <div className="flex gap-1">
                                {BORDER_STYLES.map((style) => (
                                    <button
                                        key={style}
                                        onClick={(e) => handleBorder(e, currentFormat.borderColor || '#000000', style, currentFormat.borderWidth || '1px')}
                                        className={`px-2 py-1 text-xs rounded hover:bg-gray-100 capitalize ${currentFormat.borderStyle === style ? 'bg-blue-50' : ''}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-600 mb-1 block">Width</label>
                            <div className="flex gap-1">
                                {BORDER_WIDTHS.map((width) => (
                                    <button
                                        key={width}
                                        onClick={(e) => handleBorder(e, currentFormat.borderColor || '#000000', currentFormat.borderStyle || 'solid', width)}
                                        className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${currentFormat.borderWidth === width ? 'bg-blue-50' : ''}`}
                                    >
                                        {width}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="border-t border-gray-200 my-1" />

            <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm text-red-600" onClick={clearFormat}>
                Clear Formatting
            </div>
        </div>
    );
}

