import { AIRequest, AIResult } from '../../types';
import { AIProvider, DirectAIProvider, ProxyAIProvider } from './provider';

let currentProvider: AIProvider | null = null;

export function initializeAIProvider(mode: 'direct' | 'proxy', apiKey?: string, apiBaseUrl?: string, proxyUrl?: string): void {
    if (mode === 'direct') {
        if (!apiKey || !apiBaseUrl) {
            throw new Error('API key and base URL required for direct mode');
        }
        currentProvider = new DirectAIProvider(apiKey, apiBaseUrl);
    } else {
        currentProvider = new ProxyAIProvider(proxyUrl);
    }
}

export async function generateAIValues(request: AIRequest): Promise<AIResult[]> {
    if (!currentProvider) {
        throw new Error('AI provider not initialized. Please configure in Settings.');
    }
    return currentProvider.generateValues(request);
}

