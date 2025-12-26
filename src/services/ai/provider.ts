import { AIRequest, AIResult, SYSTEM_PROMPT } from '../../types';
import { AIResultSchema } from '../../schemas/ai';

export interface AIProvider {
    generateValues(request: AIRequest): Promise<AIResult[]>;
}

export class DirectAIProvider implements AIProvider {
    private apiKey: string;
    private apiBaseUrl: string;

    constructor(apiKey: string, apiBaseUrl: string) {
        this.apiKey = apiKey;
        this.apiBaseUrl = apiBaseUrl;
    }

    async generateValues(request: AIRequest): Promise<AIResult[]> {
        const prompt = this.buildPrompt(request);

        const response = await fetch(this.apiBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
            }),
        });

        if (!response.ok) {
            throw new Error(`AI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No content in AI response');
        }

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            throw new Error(`Failed to parse AI response: ${e}`);
        }

        const results = parsed.results || parsed;
        const parsedResults = Array.isArray(results) ? results : [results];
        // Ensure all results have required fields
        const validatedResults = parsedResults.map((r: any) => {
            const val = 'value' in r ? r.value : null;
            return {
                columnKey: r.columnKey || '',
                value: val,
                source: r.source || '',
                confidence: r.confidence ?? 0,
                notes: r.notes ?? null,
            };
        });
        return AIResultSchema.parse(validatedResults) as AIResult[];
    }

    private buildPrompt(request: AIRequest): string {
        const columnsDesc = request.columns
            .map(col => `- ${col.label} (${col.key}): ${col.type}${col.aiInstructions ? ` - ${col.aiInstructions}` : ''}`)
            .join('\n');

        return `Update the following university data:

University: ${request.university.name}
${request.university.country ? `Country: ${request.university.country}` : ''}
${request.university.city ? `City: ${request.university.city}` : ''}
${request.university.website ? `Website: ${request.university.website}` : ''}

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
    }
}

export class ProxyAIProvider implements AIProvider {
    private proxyUrl: string;

    constructor(proxyUrl: string = '/api/ai') {
        this.proxyUrl = proxyUrl;
    }

    async generateValues(request: AIRequest): Promise<AIResult[]> {
        const response = await fetch(this.proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`Proxy error: ${response.statusText}`);
        }

        const results = await response.json();
        const parsedResults = Array.isArray(results) ? results : [results];
        // Ensure all results have required fields
        const validatedResults = parsedResults.map((r: any) => {
            const val = 'value' in r ? r.value : null;
            return {
                columnKey: r.columnKey || '',
                value: val,
                source: r.source || '',
                confidence: r.confidence ?? 0,
                notes: r.notes ?? null,
            };
        });
        return AIResultSchema.parse(validatedResults) as AIResult[];
    }
}

