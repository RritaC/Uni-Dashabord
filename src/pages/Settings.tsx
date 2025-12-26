import { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settings';
import { Download, Upload } from 'lucide-react';
import { db } from '../db/database';

export default function Settings() {
    const {
        aiMode,
        aiApiKey,
        aiApiBaseUrl,
        proxyUrl,
        setAIMode,
        setAIApiKey,
        setAIApiBaseUrl,
        setProxyUrl,
    } = useSettingsStore();

    const [localApiKey, setLocalApiKey] = useState(aiApiKey);
    const [localApiBaseUrl, setLocalApiBaseUrl] = useState(aiApiBaseUrl);
    const [localProxyUrl, setLocalProxyUrl] = useState(proxyUrl);

    useEffect(() => {
        setLocalApiKey(aiApiKey);
        setLocalApiBaseUrl(aiApiBaseUrl);
        setLocalProxyUrl(proxyUrl);
    }, [aiApiKey, aiApiBaseUrl, proxyUrl]);

    function handleSave() {
        setAIApiKey(localApiKey);
        setAIApiBaseUrl(localApiBaseUrl);
        setProxyUrl(localProxyUrl);
        alert('Settings saved');
    }

    async function handleExport() {
        const universities = await db.universities.toArray();
        const columns = await db.columns.toArray();
        const values = await db.values.toArray();
        const history = await db.valuesHistory.toArray();

        const data = {
            universities,
            columns,
            values,
            history,
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `uni-dashboard-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const text = await file.text();
            const data = JSON.parse(text);

            if (confirm('This will replace all current data. Continue?')) {
                await db.universities.clear();
                await db.columns.clear();
                await db.values.clear();
                await db.valuesHistory.clear();

                await db.universities.bulkAdd(data.universities || []);
                await db.columns.bulkAdd(data.columns || []);
                await db.values.bulkAdd(data.values || []);
                await db.valuesHistory.bulkAdd(data.history || []);

                alert('Data imported successfully');
                window.location.reload();
            }
        };
        input.click();
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Configuration</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Provider Mode
                            </label>
                            <select
                                value={aiMode}
                                onChange={(e) => setAIMode(e.target.value as 'direct' | 'proxy')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="proxy">Proxy (Recommended)</option>
                                <option value="direct">Direct (Development Only)</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                {aiMode === 'proxy'
                                    ? 'Uses local proxy server to keep API keys secure'
                                    : 'WARNING: API keys will be exposed in client code. Use only for development.'}
                            </p>
                        </div>

                        {aiMode === 'direct' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        API Key
                                    </label>
                                    <input
                                        type="password"
                                        value={localApiKey}
                                        onChange={(e) => setLocalApiKey(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        API Base URL
                                    </label>
                                    <input
                                        type="text"
                                        value={localApiBaseUrl}
                                        onChange={(e) => setLocalApiBaseUrl(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </>
                        )}

                        {aiMode === 'proxy' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Proxy URL
                                </label>
                                <input
                                    type="text"
                                    value={localProxyUrl}
                                    onChange={(e) => setLocalProxyUrl(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-3">
                                Export all your data as a JSON backup file.
                            </p>
                            <button
                                onClick={handleExport}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export Backup
                            </button>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600 mb-3">
                                Import a previously exported backup file.
                            </p>
                            <button
                                onClick={handleImport}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Import Backup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

