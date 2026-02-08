import OpenAI from 'openai';

/**
 * Featherless AI Provider
 * OpenAI-compatible API wrapper for Featherless AI
 * 
 * Base URL: https://api.featherless.ai/v1
 * Set FEATHERLESS_API_KEY in environment
 */

const FEATHERLESS_BASE_URL = 'https://api.featherless.ai/v1';
const DEFAULT_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';

let client: OpenAI | null = null;

function getClient(): OpenAI {
    if (!client) {
        const apiKey = process.env.FEATHERLESS_API_KEY;
        if (!apiKey) {
            throw new Error('FEATHERLESS_API_KEY environment variable is not set');
        }
        client = new OpenAI({
            apiKey,
            baseURL: FEATHERLESS_BASE_URL
        });
    }
    return client;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

/**
 * Generate a chat completion using Featherless AI
 */
export async function generateCompletion(
    messages: ChatMessage[],
    options: CompletionOptions = {}
): Promise<string> {
    const openai = getClient();

    const response = await openai.chat.completions.create({
        model: options.model || DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024
    });

    return response.choices[0]?.message?.content || '';
}

/**
 * Analyze sentiment of text
 * Returns a score from -1 (negative) to 1 (positive)
 */
export async function analyzeSentiment(text: string): Promise<{
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    reasoning: string;
}> {
    const prompt = `Analyze the sentiment of the following text. Respond with JSON only:
{
  "score": <number from -1 to 1>,
  "label": "<positive|neutral|negative>",
  "reasoning": "<brief explanation>"
}

Text: "${text.substring(0, 500)}"`;

    const response = await generateCompletion([
        { role: 'system', content: 'You are a sentiment analysis expert. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
    ], { temperature: 0.3 });

    try {
        const parsed = JSON.parse(response);
        return {
            score: Math.max(-1, Math.min(1, parsed.score || 0)),
            label: parsed.label || 'neutral',
            reasoning: parsed.reasoning || ''
        };
    } catch {
        return { score: 0, label: 'neutral', reasoning: 'Failed to parse response' };
    }
}

/**
 * Batch analyze multiple texts for efficiency
 */
export async function batchAnalyzeSentiment(texts: string[]): Promise<Array<{
    score: number;
    label: 'positive' | 'neutral' | 'negative';
}>> {
    if (texts.length === 0) return [];

    // Limit batch size to avoid token limits
    const limitedTexts = texts.slice(0, 10).map(t => t.substring(0, 200));

    const prompt = `Analyze the sentiment of these ${limitedTexts.length} messages. Respond with a JSON array only:
[
  { "score": <-1 to 1>, "label": "<positive|neutral|negative>" },
  ...
]

Messages:
${limitedTexts.map((t, i) => `${i + 1}. "${t}"`).join('\n')}`;

    const response = await generateCompletion([
        { role: 'system', content: 'You are a sentiment analysis expert. Respond only with valid JSON array.' },
        { role: 'user', content: prompt }
    ], { temperature: 0.3, maxTokens: 512 });

    try {
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed)) {
            return parsed.map(p => ({
                score: Math.max(-1, Math.min(1, p.score || 0)),
                label: p.label || 'neutral'
            }));
        }
    } catch {
        // Fallback
    }

    return texts.map(() => ({ score: 0, label: 'neutral' as const }));
}

export default {
    generateCompletion,
    analyzeSentiment,
    batchAnalyzeSentiment
};
