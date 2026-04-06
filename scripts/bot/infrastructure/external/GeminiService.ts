// src/infrastructure/external/prompts/geminiPrompts.ts

/**
 * Centralized prompt builders for Gemini.
 *
 * Goals:
 * - deterministic, JSON-first prompts
 * - low-hallucination behavior
 * - strict relevance filtering for noisy paper feeds
 * - reusable prompt construction for papers and blog generation
 *
 * Notes:
 * - Keep model temperature low for structured JSON tasks (recommended: 0.2-0.3)
 * - Validate all outputs with Zod or an equivalent schema before use
 * - Prefer batching 5-10 papers per request to reduce truncation risk
 */

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

const MAX_TITLE_CHARS = 300;
const MAX_ABSTRACT_CHARS = 1800;
const MAX_CONTEXT_CHARS = 3000;
const MAX_NEWS_ITEM_CHARS = 700;
const MAX_USER_COMMENT_CHARS = 1200;

function compactWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function stripControlChars(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trim()}…`;
}

function cleanForPrompt(text: string, maxChars: number): string {
  return truncate(compactWhitespace(stripControlChars(text)), maxChars);
}

function formatList(items: string[]): string {
  return items.map(item => `- ${item}`).join('\n');
}

/**
 * Primary system prompt for paper classification.
 * Strict, JSON-only, and tuned for noisy academic search results.
 */
export function buildPaperClassificationSystemPrompt(): string {
  return compactWhitespace(`
You are a rigorous technical research assistant.

Your job is to analyze candidate research papers for a user focused on:
- distributed control
- control theory
- robotics
- multi-agent systems
- embedded systems
- FPGA
- real-time systems
- power systems
- inverter-based resources
- frequency estimation
- RoCoF
- signal processing
- applied machine learning for estimation, control, perception, optimization, or forecasting

You will receive only paper metadata such as title, abstract, categories, authors, publication date, and URL.
Use ONLY the provided metadata.
Do NOT invent experiments, equations, datasets, benchmarks, implementation details, or results that are not supported by the input.

Main goal:
Filter noisy search results and rank papers by actual usefulness for this user.

Return ONLY a valid JSON array.
Do NOT use markdown.
Do NOT wrap the JSON in code fences.
Do NOT include commentary before or after the JSON.
Do NOT omit any paper.
Return exactly one object per input paper.
Return the objects in the same order as the input papers.

Required output schema for each paper:
{
  "paperId": "string",
  "relevance": "high|medium|low",
  "score": 0,
  "classification": "control-theory|robotics|embedded|power-systems|ml-ai|signal-processing|other",
  "summary": "1-2 sentence plain technical summary",
  "pros": ["string"],
  "cons": ["string"],
  "methods": ["string"],
  "limitations": ["string"],
  "importance": "1 sentence explaining why this matters for this specific user",
  "actionability": "read-now|skim|ignore"
}

Scoring guide:
- 90-100 = extremely relevant to the user's core research or engineering interests
- 70-89 = clearly useful and worth reading
- 40-69 = adjacent or partially useful
- 0-39 = mostly noise, weak match, or off-topic

Relevance rules:
- high = direct fit in topic, method, or application domain
- medium = adjacent but still potentially useful
- low = weak fit, generic match, or keyword noise

Actionability rules:
- read-now = strong fit and worth deeper reading soon
- skim = maybe useful, but not a priority
- ignore = mostly noise or too far from the user's goals

Classification rules: choose exactly ONE primary classification.
Definitions:
- control-theory = control design, stability, observers, MPC, estimation tightly tied to system dynamics, distributed control, consensus, multi-agent dynamics
- robotics = planning, navigation, manipulation, autonomy, HRI, robot perception, robot estimation, robot coordination
- embedded = FPGA, MCU, DSP hardware, real-time implementation, hardware/software co-design, edge deployment
- power-systems = grids, inverters, PMU, RoCoF, frequency estimation, power electronics, protection, energy systems
- ml-ai = machine learning is the main methodological contribution and the paper is not better classified by a stronger domain label above
- signal-processing = filtering, spectral estimation, time-frequency analysis, transforms, detection, denoising
- other = not meaningfully covered by the categories above

Tie-break rules for choosing the single primary classification:
- Prefer the application domain when it is central:
  - robot planning + learning => robotics
  - PMU/frequency/RoCoF + estimation => power-systems
  - FPGA/DSP implementation + estimation => embedded
- Use ml-ai only when the main novelty is primarily machine learning and no stronger domain label dominates
- Use signal-processing for method-centric estimation/filtering papers without a stronger robotics, power-systems, or embedded anchor

Important filtering behavior:
- Do NOT overrate papers just because they contain keywords like "frequency", "control", "filter", "robotics", or "Kalman"
- If a paper appears due to noisy keyword search but is not truly relevant, mark it low
- Be strict on topical fit
- Prefer papers with technical depth and practical relevance to the user's actual domains

Writing rules:
- summary must be <= 45 words
- importance must be tailored to this user's interests, not generic academic importance
- If metadata is vague or insufficient, say so in cons or limitations
- Do not repeat the same idea across pros, cons, methods, and limitations
- Each array should usually contain 1 to 3 concise items
- Do not use marketing language
- Be precise, technical, and restrained
`);
}

/**
 * User prompt for paper classification.
 * Keeps paper blocks structured and predictable.
 */
export function buildPaperClassificationUserPrompt(papers: PaperCandidate[]): string {
  if (!papers.length) {
    throw new Error('buildPaperClassificationUserPrompt requires at least one paper');
  }

  const header = [
    'Analyze the following research papers.',
    'Return exactly one JSON object per paper.',
    'Preserve the same paper order as given below.',
    'Do not invent missing details.',
    '',
  ].join('\n');

  const paperBlocks = papers
    .map((paper, index) => {
      const id = cleanForPrompt(paper.id, 120);
      const title = cleanForPrompt(paper.title || 'Untitled', MAX_TITLE_CHARS);
      const abstract = cleanForPrompt(paper.summary || 'No abstract provided.', MAX_ABSTRACT_CHARS);
      const categories = (paper.categories ?? []).map(c => cleanForPrompt(c, 80));
      const authors = (paper.authors ?? []).slice(0, 12).map(a => cleanForPrompt(a, 80));
      const published = paper.published ? cleanForPrompt(paper.published, 50) : 'Unknown';
      const url = paper.url ? cleanForPrompt(paper.url, 300) : 'Unknown';

      return [
        `PAPER ${index + 1}`,
        `paperId: ${id}`,
        `title: ${title}`,
        `abstract: ${abstract}`,
        `categories: ${categories.length ? categories.join(', ') : 'Unknown'}`,
        `authors: ${authors.length ? authors.join(', ') : 'Unknown'}`,
        `published: ${published}`,
        `url: ${url}`,
      ].join('\n');
    })
    .join('\n\n---\n\n');

  return `${header}${paperBlocks}`;
}

/**
 * Optional lighter-weight filter prompt.
 * Useful as stage 1 if you want a cheaper pre-filter before full analysis.
 */
export function buildPaperFilterSystemPrompt(): string {
  return compactWhitespace(`
You are a strict technical paper triage assistant.

Use ONLY the provided metadata.
Do NOT invent missing details.

Return ONLY a valid JSON array.
Do NOT use markdown.
Do NOT include any extra text.

Return one object per input paper in the same order:
{
  "paperId": "string",
  "relevance": "high|medium|low",
  "score": 0,
  "reason": "one short technical reason",
  "actionability": "read-now|skim|ignore"
}

Judge relevance for:
distributed control, control theory, robotics, multi-agent systems, embedded systems, FPGA, power systems, inverter-based resources, frequency estimation, RoCoF, signal processing, and applied ML.

Be strict.
Ignore keyword noise.
Do not overrate generic ML or unrelated physics papers.
`);
}

export function buildPaperFilterUserPrompt(papers: PaperCandidate[]): string {
  if (!papers.length) {
    throw new Error('buildPaperFilterUserPrompt requires at least one paper');
  }

  return buildPaperClassificationUserPrompt(papers);
}

/**
 * System prompt for generating a blog post from news plus user insight.
 * JSON-only, professional, concise, and deploy-friendly.
 */
export function buildBlogPostSystemPrompt(): string {
  return compactWhitespace(`
You are a disciplined technical blog writer for a professional engineering and research site.

You will receive:
- a working title or theme
- a list of news items or research items
- a user comment or opinion
- additional context

Your task:
Create a coherent blog post that is technically credible, readable, and grounded in the provided material.

Use ONLY the provided input.
Do NOT invent external facts, benchmarks, quotes, company statements, or citations.
If the input is limited, write conservatively and synthesize only what is supported.

Return ONLY a valid JSON object.
Do NOT use markdown code fences.
Do NOT include extra commentary.

Required JSON schema:
{
  "title": "string",
  "description": "string",
  "category": "Research|Tutorial|Lab Notes|Industry",
  "tags": ["string"],
  "content": "markdown string",
  "imageQuery": "string"
}

Writing requirements:
- title: 5 to 100 characters
- description: 1 to 2 sentences, clear and specific
- tags: 3 to 8 relevant tags, lowercase preferred, no duplicates
- imageQuery: 2 to 6 words, visually concrete, safe for image search
- content: 450 to 900 words in markdown
- no emojis
- no clickbait
- no hype language
- professional but readable tone
- explain the technical point clearly
- integrate the user's comment naturally
- prefer clean structure with:
  - brief introduction
  - 2 to 4 short sections
  - concise conclusion
- if uncertainty exists, state it carefully instead of overstating claims

Category selection:
- Research = paper analysis, scientific insight, method discussion
- Tutorial = practical how-to, implementation, debugging, workflow
- Lab Notes = engineering reflections, experiments, lessons learned
- Industry = product, tooling, ecosystem, applied trends

Do not mention that you are an AI.
Do not mention the prompt.
`);
}

/**
 * User prompt for blog generation.
 */
export function buildBlogPostUserPrompt(data: BlogGenerationInput): string {
  const title = cleanForPrompt(data.title, MAX_TITLE_CHARS);

  const newsItems = (data.newsItems ?? [])
    .slice(0, 8)
    .map(item => cleanForPrompt(item, MAX_NEWS_ITEM_CHARS));

  const userComment = cleanForPrompt(data.userComment || '', MAX_USER_COMMENT_CHARS);
  const context = cleanForPrompt(data.context || '', MAX_CONTEXT_CHARS);

  const sections = [
    `TITLE/THEME:\n${title}`,
    `NEWS ITEMS:\n${newsItems.length ? formatList(newsItems) : '- None provided'}`,
    `USER INSIGHT:\n${userComment || 'No user comment provided.'}`,
    `CONTEXT:\n${context || 'No extra context provided.'}`,
    '',
    'Generate the JSON object now.',
  ];

  return sections.join('\n\n');
}

/**
 * Small helper if you want to centralize the recommended model settings
 * for this prompt module.
 */
export function getRecommendedGeminiGenerationConfig() {
  return {
    temperature: 0.25,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 4096,
  };
}

export function getGeminiCircuitStatus(): { state: 'closed' | 'open' | 'half-open'; failures: number } {
  return { state: 'closed', failures: 0 };
}