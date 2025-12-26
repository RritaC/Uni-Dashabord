import { useState, useEffect } from 'react';
import { Upload, Search, File, Download, X, Eye } from 'lucide-react';

interface Document {
    id: string;
    name: string;
    type: string;
    size: number;
    tags: string[];
    uploadedAt: number;
    fileData?: string; // Base64 encoded file data
}

export default function Documents() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

    useEffect(() => {
        loadDocuments();
    }, []);

    async function loadDocuments() {
        try {
            const { fetchDocuments } = await import('../services/api');
            const data = await fetchDocuments();
            console.log('Loaded documents:', data);
            setDocuments(data.map((d: any) => ({
                id: String(d.id),
                name: d.name,
                type: d.type,
                size: d.size,
                tags: d.tags ? (typeof d.tags === 'string' ? JSON.parse(d.tags) : d.tags) : [],
                uploadedAt: d.uploaded_at || d.uploadedAt,
                fileData: d.file_data || d.fileData,
            })));
        } catch (error) {
            console.error('Failed to load documents:', error);
            // Fallback to localStorage
            const stored = localStorage.getItem('documents');
            if (stored) {
                setDocuments(JSON.parse(stored));
            }
        }
    }


    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const fileData = event.target?.result as string;

            const document: Document = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size,
                tags: [],
                uploadedAt: Date.now(),
                fileData: fileData,
            };

            const updated = [...documents, document];
            setDocuments(updated);

            try {
                const { createDocument } = await import('../services/api');
                await createDocument({
                    ...document,
                    tags: JSON.stringify(document.tags),
                });
            } catch (error) {
                console.error('Failed to save to database:', error);
                localStorage.setItem('documents', JSON.stringify(updated));
            }
        };

        reader.readAsDataURL(file);
        e.target.value = '';
    }

    async function handleDelete(id: string) {
        if (confirm('Delete this document?')) {
            const updated = documents.filter(d => d.id !== id);
            setDocuments(updated);

            try {
                const { deleteDocument } = await import('../services/api');
                await deleteDocument(Number(id));
            } catch (error) {
                console.error('Failed to delete from database:', error);
                localStorage.setItem('documents', JSON.stringify(updated));
            }
        }
    }

    function handleDownload(doc: Document) {
        if (doc.fileData) {
            const link = document.createElement('a');
            link.href = doc.fileData;
            link.download = doc.name;
            link.click();
        }
    }

    function handleView(doc: Document) {
        setViewingDoc(doc);
    }

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </label>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    {filteredDocs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No documents yet</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDocs.map((doc) => (
                                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                            <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="text-gray-400 hover:text-red-600 flex-shrink-0 ml-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">
                                        {doc.type} • {(doc.size / 1024).toFixed(1)} KB
                                    </p>
                                    {doc.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {doc.tags.map((tag, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleView(doc)}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {viewingDoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-900">{viewingDoc.name}</h2>
                            <button
                                onClick={() => setViewingDoc(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            {viewingDoc.fileData ? (
                                viewingDoc.type.startsWith('image/') ? (
                                    <img src={viewingDoc.fileData} alt={viewingDoc.name} className="max-w-full h-auto" />
                                ) : viewingDoc.type === 'application/pdf' ? (
                                    <iframe
                                        src={viewingDoc.fileData}
                                        className="w-full h-full min-h-[600px]"
                                        title={viewingDoc.name}
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                                        <button
                                            onClick={() => handleDownload(viewingDoc)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download to View
                                        </button>
                                    </div>
                                )
                            ) : (
                                <p className="text-gray-500">File data not available</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
