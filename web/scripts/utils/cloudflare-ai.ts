/**
 * AI utilities for image generation.
 * Uses OpenAI for prompt generation and Cloudflare Workers AI for image generation.
 */

import { getConfig } from '../config/image-gen.js';

interface OpenAIChatResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
    error?: {
        message: string;
    };
}

/**
 * Generate an abstract image prompt from content using OpenAI.
 */
export async function generateImagePrompt(content: string): Promise<string> {
    const config = getConfig();

    const systemPrompt = `You are an abstract art director. Given the following blog post content,
create a prompt for an AI image generator that will produce an abstract,
artistic image that captures the essence and mood of the content.

Requirements:
- Abstract and artistic, not literal
- Should evoke the emotional tone of the content
- Use colors, shapes, and textures rather than concrete objects
- Keep the prompt under 100 words
- Do not include text or words in the image

Respond with only the image generation prompt, nothing else.`;

    // Truncate content to avoid token limits (roughly 4000 chars for efficiency)
    const truncatedContent = content.length > 4000
        ? content.slice(0, 4000) + '...'
        : content;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.openaiApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: config.imageGeneration.promptModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: truncatedContent },
            ],
            max_tokens: 200,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate image prompt: ${response.status} ${errorText}`);
    }

    const data = await response.json() as OpenAIChatResponse;

    if (data.error) {
        throw new Error(`OpenAI request failed: ${data.error.message}`);
    }

    const promptText = data.choices[0]?.message?.content;
    if (!promptText) {
        throw new Error('No response from OpenAI');
    }

    return promptText.trim();
}

/**
 * Generate an image using Stable Diffusion XL.
 */
export async function generateImage(prompt: string): Promise<Buffer> {
    const config = getConfig();

    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/ai/run/${config.imageGeneration.imageModel}`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.cloudflareApiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                // Stable Diffusion XL generates 1024x1024 by default
                // We'll resize later for our specific needs
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate image: ${response.status} ${errorText}`);
    }

    // The response is the raw image bytes
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Generate an image from content (combines prompt generation and image generation).
 */
export async function generateImageFromContent(content: string): Promise<{
    imageBuffer: Buffer;
    prompt: string;
}> {
    console.log('    Generating image prompt...');
    const prompt = await generateImagePrompt(content);
    console.log(`    Prompt: "${prompt.slice(0, 60)}..."`);

    console.log('    Generating image...');
    const imageBuffer = await generateImage(prompt);
    console.log(`    Generated ${imageBuffer.length} bytes`);

    return { imageBuffer, prompt };
}
