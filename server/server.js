import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import apiRouter from './api.js';
import { seedDatabase } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from server directory
dotenv.config({ path: join(__dirname, '.env') });

// Log environment variables (without exposing the key)
console.log('Environment check:');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'NOT SET');
console.log('- PORT:', process.env.PORT || '3001 (default)');

// Check if fetch is available (Node 18+)
const fetchFn = globalThis.fetch || (async () => {
    try {
        const nodeFetch = await import('node-fetch');
        return nodeFetch.default;
    } catch (e) {
        console.error('fetch is not available and node-fetch is not installed. Please use Node 18+ or install node-fetch.');
        throw new Error('fetch is not available');
    }
})();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', apiRouter);

// Auto-seed on startup (async) - only for non-serverless environments
// In serverless, seeding happens on first request or via /api/seed endpoint
if (process.env.VERCEL !== '1') {
    seedDatabase().catch(err => console.error('Error seeding database:', err));
}

app.post('/api/ai', async (req, res) => {
    try {
        console.log('AI request received');
        const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
        const apiBaseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1/chat/completions';

        if (!apiKey) {
            console.error('AI_API_KEY not configured');
            return res.status(500).json({ error: 'AI_API_KEY not configured. Please set OPENAI_API_KEY in your .env file.' });
        }

        console.log('API key found, proceeding with request');

        // Handle both old format and new AIRequest format
        const { university, columns, outputSchema } = req.body;

        if (!university || !columns || !Array.isArray(columns) || columns.length === 0) {
            console.error('Invalid request:', {
                hasUniversity: !!university,
                hasColumns: !!columns,
                isArray: Array.isArray(columns),
                length: columns?.length
            });
            return res.status(400).json({ error: 'Missing required fields: university and columns (must be non-empty array)' });
        }

        // Build the prompt
        const SYSTEM_PROMPT = `You are UniDataAgent, a meticulous research assistant that updates a personal university dashboard.
Hard rules:
1) Output ONLY valid JSON. No markdown, no prose.
2) Follow the exact schema provided. Do not add extra keys.
3) Never invent facts. If you cannot verify, set value to null and explain briefly in notes.
4) Prefer official university sources. If not available, use reputable sources and say so in source.
5) Provide confidence from 0 to 1 for every field you set.
6) Use ISO dates (YYYY-MM-DD). Use a plain number for money without currency symbols unless asked.
7) Keep notes short. No opinions. No motivational text.`;

        const columnsDesc = columns
            .filter(col => col && col.key) // Filter out invalid columns
            .map(col => {
                const label = col.label || col.key || 'Unknown';
                const type = col.type || 'text';
                const instructions = col.aiInstructions || '';
                return `- ${label} (${col.key}): ${type}${instructions ? ` - ${instructions}` : ''}`;
            })
            .join('\n');

        if (!columnsDesc) {
            return res.status(400).json({ error: 'No valid columns provided' });
        }

        const prompt = `Update the following university data:

University: ${university.name}
${university.country ? `Country: ${university.country}` : ''}
${university.city ? `City: ${university.city}` : ''}
${university.website ? `Website: ${university.website}` : ''}

Columns to update:
${columnsDesc}

Output format (JSON):
{
  "results": [
    {
      "columnKey": "string",
      "value": <appropriate type or null>,
      "source": "string (URL or source name)",
      "confidence": 0.0-1.0,
      "notes": "string or null"
    }
  ]
}

Return ONLY valid JSON matching the schema.`;

        // Use the correct OpenAI API endpoint
        const openaiUrl = apiBaseUrl.includes('openai.com')
            ? apiBaseUrl
            : 'https://api.openai.com/v1/chat/completions';

        console.log('Calling OpenAI API:', openaiUrl);
        console.log('Prompt length:', prompt.length);

        const requestBody = {
            model: 'gpt-4o-mini', // Use cheaper model for bulk operations
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        };

        let response;
        try {
            response = await fetch(openaiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            return res.status(500).json({
                error: `Failed to connect to OpenAI API: ${fetchError.message}`,
                details: 'Make sure you have internet connection and the API endpoint is correct. If using Node < 18, you may need to install node-fetch.'
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', response.status, errorText);
            return res.status(response.status).json({
                error: `AI API error: ${response.statusText}`,
                details: errorText
            });
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            return res.status(500).json({ error: 'No content in AI response' });
        }

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            return res.status(500).json({ error: `Failed to parse AI response: ${e.message}` });
        }

        const results = parsed.results || parsed;
        const finalResults = Array.isArray(results) ? results : [results];

        res.json(finalResults);
    } catch (error) {
        console.error('Proxy error:', error);
        console.error('Error details:', error.stack);
        console.error('Request body:', JSON.stringify(req.body, null, 2));
        res.status(500).json({
            error: error.message || 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            message: `AI proxy error: ${error.message}`
        });
    }
});

// Export for Vercel serverless
export default app;

// Start server for local development
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Proxy server running on http://localhost:${PORT}`);
        console.log(`AI API endpoint: POST /api/ai`);
    });
}

