import type { AIService, TransformAction } from './types.js';

const SYSTEM_PROMPTS: Record<TransformAction, string> = {
    rewrite:
        'You are a writing assistant. Rewrite the given text to improve clarity, flow, and readability while preserving the original meaning and tone. Return only the rewritten text.',
    explain:
        'You are a technical writing assistant. Explain the given text in simpler terms, making it accessible to a broader audience. Return only the explanation.',
    define:
        'You are a technical writing assistant. Provide a clear, concise definition or explanation of the given term or concept. Return only the definition.',
    shorten:
        'You are a concise writing assistant. Shorten the given text while preserving the key information and meaning. Return only the shortened text.',
    expand:
        'You are a detailed writing assistant. Expand the given text with more detail, examples, or explanation while maintaining the same style and tone. Return only the expanded text.',
};

export class OpenAIService implements AIService {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model?: string) {
        this.apiKey = apiKey;
        this.model = model || 'gpt-4o-mini';
    }

    async transform(text: string, action: TransformAction): Promise<string> {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                temperature: 0.7,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPTS[action] },
                    { role: 'user', content: text },
                ],
            }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`OpenAI API error: ${res.status} - ${errBody}`);
        }

        const data = (await res.json()) as {
            choices: Array<{ message: { content: string } }>;
        };

        return data.choices[0].message.content;
    }
}
