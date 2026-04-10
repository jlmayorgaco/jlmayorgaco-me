// Simplified, production-focused Gemini integration surface
// This module provides typed adapters to Gemini for the bot pipeline.

import type { BotConfig } from '../../config/index';
import { GoogleGenAI } from '@google/genai';

export const PAPER_CLASSIFICATIONS = [
  'control-theory',
  'robotics',
  'embedded',
  'power-systems',
  'ml-ai',
  'signal-processing',
  'other',
] as const;

export const PAPER_RELEVANCE = ['high', 'medium', 'low'] as const;
export const PAPER_ACTIONABILITY = ['read-now', 'skim', 'ignore'] as const;

export type PaperClassificationType = (typeof PAPER_CLASSIFICATIONS)[number];
export type PaperRelevance = (typeof PAPER_RELEVANCE)[number];
export type PaperActionability = (typeof PAPER_ACTIONABILITY)[number];

export interface PaperCandidate {
  id: string;
  title: string;
  summary?: string;
  categories?: string[];
  authors?: string[];
  published?: string;
  url?: string;
}

export interface PaperClassificationOutput {
  paperId: string;
  relevance: PaperRelevance;
  score: number;
  classification: PaperClassificationType;
  summary: string;
  pros: string[];
  cons: string[];
  methods: string[];
  limitations: string[];
  importance: string;
  actionability: PaperActionability;
}

export interface BlogGenerationInput {
  title: string;
  newsItems: string[];
  userComment: string;
  context: string;
}

export interface GeneratedBlogPost {
  title: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  imageQuery: string;
}

export function getGeminiCircuitStatus(): { state: 'open' | 'closed' | 'half-open'; failures: number } {
  return { state: 'closed', failures: 0 };
}

export async function callGemini(
  config: BotConfig,
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  const response = await ai.models.generateContent({
    model: config.gemini.model || 'gemini-2.0-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
    }
  });
  return response.text || '';
}

export async function classifyPapers(
  config: BotConfig | any,
  papers: Array<{ id: string; title: string; summary?: string; categories?: string[] }>,
): Promise<{success: boolean, data?: Array<PaperClassificationOutput>, error?: Error}> {
  // Config passed from Adapter might be empty, so we just use process environment if needed or wait,
  // The adapter actually passes `papers as any`. No, the legacy gemini.ts signature wasn't taking config in classifyPapers!
  return await classifyAndSummarizePapers(config, papers);
}

export async function classifyAndSummarizePapers(
  config: BotConfig | any,
  papers: Array<{ id: string; title: string; summary?: string; categories?: string[] }>,
): Promise<any> {
  if (!papers.length) return [];
  
  // Actually, GeminiServiceAdapter.ts passes: await legacyClassifyPapers(papers as any);
  // So the first argument is papers! Let's handle both cases:
  let actualPapers = Array.isArray(config) ? config : papers;
  
  const systemPrompt = `You are a strict JSON-producing assistant for a research lab.
Analyze the provided papers. Respond strictly with a JSON array of objects. Do not use markdown wrappers like \`\`\`json.
Each object must have:
- "paperId": (string) The ID of the paper.
- "relevance": (string) One of "high", "medium", "low".
- "score": (number) 0-100 score of relevance.
- "classification": (string) A short topic category.
- "summary": (string) A beautiful, concise 2-sentence summary.
- "pros": (array of strings)
- "cons": (array of strings)
- "methods": (array of strings)
- "limitations": (array of strings)
- "importance": (string)
- "actionability": (string) One of "read-now", "skim", "ignore".`;

  const userPrompt = JSON.stringify(actualPapers.map(p => ({
    id: p.id,
    title: p.title,
    summary: p.summary
  })));

  // If no config passed, fallback to process.env
  const apiKey = (config && config.gemini && config.gemini.apiKey) || process.env.GEMINI_API_KEY;
  const model = (config && config.gemini && config.gemini.model) || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      }
    });
    
    const text = response.text || '[]';
    // Clean potential markdown blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);
    return { success: true, data: data };
  } catch (error) {
    console.error('Gemini Classification Error:', error);
    return { success: false, error: error as Error };
  }
}

export async function generateBlogPost(
  config: BotConfig | any,
  data: BlogGenerationInput,
): Promise<{success: boolean, data?: GeneratedBlogPost, error?: Error}> {
  const systemPrompt = `You are an expert technical blog writer for an engineering and research blog.
Write an SEO-optimized blog post in Astro MDX/Markdown format.
Output strictly as a JSON object with no markdown wrappers around the JSON.
The JSON must contain:
- "title": (string) An attractive SEO title
- "description": (string) A concise SEO description for the frontmatter
- "category": (string) E.g., "Research", "Engineering"
- "tags": (array of strings) lowercase, hyphenated e.g. ["robotics", "control-systems"]
- "content": (string) The full markdown content of the post. MUST include headings, lists, and formatted text explaining the user's opinion and the papers. Do not include frontmatter block in this string, only the body.
- "imageQuery": (string) An image generation prompt string for a cover image`;

  const userPrompt = `Context: ${data.context}\n\nSelected Papers/News: ${JSON.stringify(data.newsItems)}\n\nUser Opinion: ${data.userComment}\n\nTitle requested: ${data.title}`;

  const apiKey = (config && config.gemini && config.gemini.apiKey) || process.env.GEMINI_API_KEY;
  const model = (config && config.gemini && config.gemini.model) || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const postData = JSON.parse(cleanText);
    
    return { success: true, data: postData };
  } catch (error) {
    console.error('Gemini Blog Generation Error:', error);
    return { success: false, error: error as Error };
  }
}
