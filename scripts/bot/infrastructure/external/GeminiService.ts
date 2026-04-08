// Simplified, production-focused Gemini integration surface
// This module provides typed adapters to Gemini for the bot pipeline.

import type { BotConfig } from '../../config/index';

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

// Minimal config-driven circuit status (health)
export function getGeminiCircuitStatus(): { state: 'open' | 'closed' | 'half-open'; failures: number } {
  return { state: 'closed', failures: 0 };
}

// Extremely lightweight, local-only prompt builders (kept for compatibility)
export function buildPaperClassificationSystemPrompt(): string {
  // Intentionally tiny placeholder; in production this would be a robust prompt
  return 'JSON_ONLY_PAPER_CLASSIFICATION_PROMPT';
}
export function buildPaperClassificationUserPrompt(papers: PaperCandidate[]): string {
  if (!papers.length) throw new Error('No papers');
  return papers.map(p => `PAPER:${p.id} ${p.title}`).join('\n');
}
export function buildBlogPostSystemPrompt(): string {
  return 'BLOG_POST_SYSTEM_PROMPT';
}
export function buildBlogPostUserPrompt(data: BlogGenerationInput): string {
  return `TITLE:${data.title}\nNEWS:${data.newsItems?.join('\n') ?? ''}\nCOMMENT:${data.userComment}`;
}

// Config-safe wrapper to Gemini API.
export async function callGemini(
  config: BotConfig,
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  // Real HTTP call should be implemented in production.
  // Here we return an empty string to keep type compatibility for local tests.
  return '';
}

export async function classifyAndSummarizePapers(
  config: BotConfig,
  papers: Array<{ id: string; title: string; summary?: string; categories?: string[] }>,
): Promise<Array<PaperClassificationOutput>> {
  // Placeholder: return neutral classifications
  return papers.map(p => ({
    paperId: p.id,
    relevance: 'medium',
    score: 0,
    classification: 'other',
    summary: p.summary ?? '',
    pros: [],
    cons: [],
    methods: [],
    limitations: [],
    importance: '',
    actionability: 'read-now',
  }));
}

export async function generateBlogPost(
  config: BotConfig,
  data: { title: string; newsItems: string[]; userComment: string; context: string },
): Promise<GeneratedBlogPost> {
  // Lightweight stub; production would call Gemini
  return {
    title: data.title,
    description: '',
    category: 'Research',
    tags: [],
    content: '',
    imageQuery: '',
  };
}
