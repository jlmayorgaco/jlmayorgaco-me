/**
 * Gemini AI integration with retry logic and circuit breaker
 *
 * @module infrastructure/external/GeminiService
 */

import { logError, logInfo, logWarn } from '../logging/Logger';
import { withRetry, withTimeout, CircuitBreaker } from '../../shared/utils';
import {
  safeValidate,
  GeminiClassificationSchema,
  GeminiBlogPostSchema,
  sanitizeUserInput,
} from '../../shared/validation';
import type { BotConfig } from '../../config/index';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

// Circuit breaker for Gemini API
const geminiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
});

export async function callGemini(
  config: BotConfig,
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  return withTimeout(
    () => geminiCircuitBreaker.execute(() => makeGeminiCall(config, prompt, systemInstruction)),
    config.geminiTimeoutMs,
    'Gemini API call timed out',
  );
}

async function makeGeminiCall(
  config: BotConfig,
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;

  const body: {
    contents: Array<{ parts: Array<{ text: string }> }>;
    systemInstruction?: { parts: Array<{ text: string }> };
    generationConfig: {
      temperature: number;
      maxOutputTokens: number;
      topP: number;
      topK: number;
    };
  } = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      topP: 0.95,
      topK: 40,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    logError('Gemini API error', new Error(errText), { status: res.status });
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data: GeminiResponse = await res.json();

  if (data.promptFeedback?.blockReason) {
    throw new Error(`Content blocked: ${data.promptFeedback.blockReason}`);
  }

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Empty response from Gemini');
  }

  const candidate = data.candidates[0];

  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    logWarn('Gemini response incomplete', { reason: candidate.finishReason });
  }

  return candidate.content?.parts?.[0]?.text ?? '';
}

// --- Paper Classification ---

export interface PaperClassification {
  paperId: string;
  relevance: 'high' | 'medium' | 'low';
  summary: string;
  classification: string;
}

export async function classifyAndSummarizePapers(
  config: BotConfig,
  papers: Array<{
    id: string;
    title: string;
    summary?: string;
    categories?: string[];
  }>,
): Promise<PaperClassification[]> {
  if (papers.length === 0) {
    return [];
  }

  const systemPrompt = `Research assistant. Analyze papers. Return JSON array:
[{ "paperId": "id", "relevance": "high|medium|low", "summary": "short summary", "classification": "control-theory|robotics|embedded|power-systems|ml-ai|signal-processing|other" }]
Relevance based on: distributed control, robotics, FPGA, power systems, embedded systems.
Return ONLY JSON array.`;

  const papersText = papers
    .map(
      (p, i) =>
        `ID:${p.id}\nTitle:${sanitizeUserInput(p.title)}\nAbstract:${sanitizeUserInput(p.summary?.substring(0, 1500) || '')}\nCat:${p.categories?.join(',') || ''}`,
    )
    .join('\n---\n');

  const prompt = `Classify:\n${papersText}`;

  try {
    const response = await withRetry(() => callGemini(config, prompt, systemPrompt), {
      maxRetries: config.retryAttempts,
      baseDelay: config.retryBaseDelayMs,
      onRetry: (error, attempt) => {
        logWarn(`Retrying paper classification (attempt ${attempt})`, { error: error.message });
      },
    });

    const cleaned = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    const validation = safeValidate(GeminiClassificationSchema, parsed);

    if (!validation.success) {
      throw new Error(`Invalid classification format: ${validation.errors?.join(', ')}`);
    }

    return validation.data!;
  } catch (error) {
    logError('Failed to classify papers', error as Error);

    return papers.map(p => ({
      paperId: p.id,
      relevance: 'medium' as const,
      summary: p.summary?.substring(0, 200) || 'No summary available',
      classification: 'other',
    }));
  }
}

// --- Blog Post Generation ---

export interface GeneratedBlogPost {
  title: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  imageQuery: string;
}

export async function generateBlogPost(
  config: BotConfig,
  data: {
    title: string;
    newsItems: string[];
    userComment: string;
    context: string;
  },
): Promise<GeneratedBlogPost> {
  const systemPrompt = `Tech blog writer. Generate JSON:
{ "title": "5-100 chars", "description": "1-2 sentences", "category": "Research|Tutorial|Lab Notes|Industry", "tags": ["tag1", "tag2"], "content": "markdown post 300 words", "imageQuery": "2-4 words" }
Based on news & context. No emojis. Professional. Return ONLY JSON object.`;

  const prompt = `Generate post from:
NEWS:
${data.newsItems.slice(0, 5).map(item => sanitizeUserInput(item)).join('\n')}

INSIGHT:
${sanitizeUserInput(data.userComment)}

CONTEXT:
${data.context}`;

  try {
    const response = await withRetry(() => callGemini(config, prompt, systemPrompt), {
      maxRetries: config.retryAttempts,
      baseDelay: config.retryBaseDelayMs,
      onRetry: (error, attempt) => {
        logWarn(`Retrying blog post generation (attempt ${attempt})`, { error: error.message });
      },
    });

    const cleaned = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    const validation = safeValidate(GeminiBlogPostSchema, parsed);

    if (!validation.success) {
      throw new Error(`Invalid blog post format: ${validation.errors?.join(', ')}`);
    }

    return validation.data!;
  } catch (error) {
    logError('Failed to generate blog post', error as Error);
    throw error;
  }
}

// --- Circuit Breaker Status ---

export function getGeminiCircuitStatus(): {
  state: string;
  failureCount: number;
  lastFailureTime?: number;
} {
  return geminiCircuitBreaker.metrics;
}

