import { z } from 'zod';

export const AIRequestSchema = z.object({
    university: z.object({
        name: z.string(),
        country: z.string().nullable(),
        state: z.string().nullable(),
        city: z.string().nullable(),
        type: z.string().nullable(),
        website: z.string().nullable(),
    }),
    columns: z.array(
        z.object({
            key: z.string(),
            label: z.string(),
            type: z.enum(['text', 'number', 'date', 'link', 'boolean', 'select', 'long-text']),
            section: z.string(),
            aiInstructions: z.string().nullable(),
        })
    ),
    outputSchema: z.object({
        type: z.literal('array'),
        items: z.object({
            type: z.literal('object'),
            properties: z.object({
                columnKey: z.object({ type: z.literal('string') }),
                value: z.any(),
                source: z.object({ type: z.literal('string') }),
                confidence: z.object({ type: z.literal('number') }),
                notes: z.object({ type: z.array(z.union([z.literal('string'), z.literal('null')])) }),
            }),
            required: z.array(z.string()),
        }),
    }),
});

export const AIResultSchema = z.array(
    z.object({
        columnKey: z.string(),
        value: z.any().nullable(),
        source: z.string(),
        confidence: z.number().min(0).max(1),
        notes: z.string().nullable(),
    })
);

