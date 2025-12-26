import { create } from 'zustand';
import { initializeAIProvider } from '../services/ai';

interface SettingsState {
    aiMode: 'direct' | 'proxy';
    aiApiKey: string;
    aiApiBaseUrl: string;
    proxyUrl: string;
    setAIMode: (mode: 'direct' | 'proxy') => void;
    setAIApiKey: (key: string) => void;
    setAIApiBaseUrl: (url: string) => void;
    setProxyUrl: (url: string) => void;
    loadSettings: () => void;
    saveSettings: () => void;
    reinitializeAI: () => void;
}

const STORAGE_KEY = 'uni-dashboard-settings';

// Get default proxy URL from environment or use relative path for dev
const getDefaultProxyUrl = () => {
    const apiBase = import.meta.env?.VITE_API_BASE_URL;
    if (apiBase) {
        // If API base URL is set, append /ai to it
        return `${apiBase}/ai`;
    }
    // Default to relative path for local development (works with Vite proxy)
    return '/api/ai';
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    aiMode: 'proxy',
    aiApiKey: (import.meta.env?.VITE_OPENAI_API_KEY as string) || (import.meta.env?.VITE_AI_API_KEY as string) || '',
    aiApiBaseUrl: (import.meta.env?.VITE_AI_API_BASE_URL as string) || 'https://api.openai.com/v1/chat/completions',
    proxyUrl: getDefaultProxyUrl(),

    setAIMode: (mode) => {
        set({ aiMode: mode });
        get().saveSettings();
        get().reinitializeAI();
    },

    setAIApiKey: (key) => {
        set({ aiApiKey: key });
        get().saveSettings();
        get().reinitializeAI();
    },

    setAIApiBaseUrl: (url) => {
        set({ aiApiBaseUrl: url });
        get().saveSettings();
        get().reinitializeAI();
    },

    setProxyUrl: (url) => {
        set({ proxyUrl: url });
        get().saveSettings();
        get().reinitializeAI();
    },

    loadSettings: () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                set(parsed);
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        get().reinitializeAI();
    },

    saveSettings: () => {
        try {
            const { aiMode, aiApiKey, aiApiBaseUrl, proxyUrl } = get();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                aiMode,
                aiApiKey,
                aiApiBaseUrl,
                proxyUrl,
            }));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    },

    reinitializeAI: () => {
        const { aiMode, aiApiKey, aiApiBaseUrl, proxyUrl } = get();
        try {
            initializeAIProvider(aiMode, aiApiKey, aiApiBaseUrl, proxyUrl);
        } catch (e) {
            console.error('Failed to initialize AI provider:', e);
        }
    },
}));

