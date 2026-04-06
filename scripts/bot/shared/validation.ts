/**
 * Input validation schemas using Zod
 *
 * @module shared/validation
 *
 * Schemas for: commands, user input, blog posts, news items,
 * Gemini responses, file paths, edit instructions.
 */

import { z } from 'zod';

// --- Command Validation ---

export const TelegramCommandSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[\w/\s\-:]+$/, 'Invalid command characters')
  .transform(cmd => cmd.trim().toLowerCase());

// --- User Input ---

export const UserCommentSchema = z
  .string()
  .min(1, 'Comment cannot be empty')
  .max(2000, 'Comment too long (max 2000 characters)')
  .transform(text => text.trim())
  .refine(text => !containsInjectionPatterns(text), 'Invalid characters in comment');

// --- Paper ---

export const PaperSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  summary: z.string().max(10000).optional(),
  authors: z.array(z.string()).max(100),
  published: z.string().datetime().optional(),
  categories: z.array(z.string()),
  pdfUrl: z.string().url().optional(),
  absUrl: z.string().url().optional(),
});

// --- News Item ---

export const NewsItemSchema = z.object({
  title: z.string().min(1).max(500),
  link: z.string().url(),
  source: z.string().min(1).max(100),
  pubDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  categories: z.array(z.string()).default([]),
});

// --- Blog Post ---

export const BlogPostDataSchema = z.object({
  title: z
    .string()
    .min(5, 'Title too short')
    .max(200, 'Title too long')
    .regex(/^[\w\s\-:,.!?()]+$/, 'Invalid characters in title'),
  description: z.string().min(10).max(500),
  category: z.enum(['Research', 'Tutorial', 'Lab Notes', 'Industry']),
  tags: z.array(z.string().min(1).max(50)).min(1).max(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  content: z.string().min(100, 'Content too short').max(50000, 'Content too long'),
  featured: z.boolean().default(false),
});

// --- Gemini Response ---

export const GeminiClassificationSchema = z.array(
  z.object({
    paperId: z.string(),
    relevance: z.enum(['high', 'medium', 'low']),
    summary: z.string().max(1000),
    classification: z.enum([
      'control-theory',
      'robotics',
      'embedded',
      'power-systems',
      'ml-ai',
      'signal-processing',
      'other',
    ]),
  }),
);

export const GeminiBlogPostSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(500),
  category: z.enum(['Research', 'Tutorial', 'Lab Notes', 'Industry']),
  tags: z.array(z.string()).min(1).max(10),
  content: z.string().min(100).max(50000),
  imageQuery: z.string().min(2).max(100),
});

// --- File Path ---

export const FilePathSchema = z
  .string()
  .min(1)
  .max(500)
  .refine(path => !path.includes('..'), 'Path traversal not allowed')
  .refine(path => !containsShellMetacharacters(path), 'Invalid characters in path')
  .transform(path => path.replace(/[<>"|?*]/g, ''));

// --- Edit Instruction ---

export const EditInstructionSchema = z
  .string()
  .min(1)
  .max(500)
  .transform(text => text.trim())
  .refine(text => !containsInjectionPatterns(text), 'Invalid edit instruction');

// --- Helpers ---

function containsInjectionPatterns(text: string): boolean {
  const suspicious = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /data:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /[<>]/g,
  ];

  return suspicious.some(pattern => pattern.test(text));
}

function containsShellMetacharacters(path: string): boolean {
  const dangerous = /[;&|`$(){}[\]\\*?<>]/;
  return dangerous.test(path);
}

// --- Sanitization ---

export function sanitizeUserInput(input: string): string {
  return input.replace(/[<>]/g, '').replace(/javascript:/gi, '').replace(/data:/gi, '').slice(0, 2000);
}

import { slugify } from 'transliteration';

// Removed sanitizeForTelegram and escapeMarkdownV2 -> centralized to MarkdownFormatter.ts

export function sanitizeSlug(input: string): string {
  return slugify(input, { lowercase: true, separator: '-', trim: true }).substring(0, 60);
}

export const generateSlug = sanitizeSlug;

// --- Validation Result ---

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.issues.map(i => i.message),
    };
  }
}

