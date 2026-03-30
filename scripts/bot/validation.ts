/**
 * Input validation schemas using Zod
 * Production-ready: validates all external inputs, prevents injection attacks
 */

import { z } from 'zod';

// Command validation
export const TelegramCommandSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[\w\/\s\-:]+$/, 'Invalid command characters')
  .transform(cmd => cmd.trim().toLowerCase());

// User comment validation
export const UserCommentSchema = z.string()
  .min(1, 'Comment cannot be empty')
  .max(2000, 'Comment too long (max 2000 characters)')
  .transform(text => text.trim())
  .refine(
    text => !containsInjectionPatterns(text),
    'Invalid characters in comment'
  );

// Paper data validation
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

// News item validation
export const NewsItemSchema = z.object({
  title: z.string().min(1).max(500),
  link: z.string().url(),
  source: z.string().min(1).max(100),
  pubDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  categories: z.array(z.string()).default([]),
});

// Blog post data validation
export const BlogPostDataSchema = z.object({
  title: z.string()
    .min(5, 'Title too short')
    .max(200, 'Title too long')
    .regex(/^[\w\s\-:,.!?()]+$/, 'Invalid characters in title'),
  description: z.string()
    .min(10)
    .max(500),
  category: z.enum(['Research', 'Tutorial', 'Lab Notes', 'Industry']),
  tags: z.array(z.string().min(1).max(50)).min(1).max(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  content: z.string()
    .min(100, 'Content too short')
    .max(50000, 'Content too long'),
  featured: z.boolean().default(false),
});

// Gemini response validation
export const GeminiClassificationSchema = z.array(z.object({
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
    'other'
  ]),
}));

export const GeminiBlogPostSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(500),
  category: z.enum(['Research', 'Tutorial', 'Lab Notes', 'Industry']),
  tags: z.array(z.string()).min(1).max(10),
  content: z.string().min(100).max(50000),
  imageQuery: z.string().min(2).max(100),
});

// File path validation
export const FilePathSchema = z.string()
  .min(1)
  .max(500)
  .refine(
    path => !path.includes('..'),
    'Path traversal not allowed'
  )
  .refine(
    path => !containsShellMetacharacters(path),
    'Invalid characters in path'
  )
  .transform(path => path.replace(/[<>"|?*]/g, ''));

// Edit instruction validation
export const EditInstructionSchema = z.string()
  .min(1)
  .max(500)
  .transform(text => text.trim())
  .refine(
    text => !containsInjectionPatterns(text),
    'Invalid edit instruction'
  );

// Helper functions
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

// Safe sanitization helpers
export function sanitizeUserInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .slice(0, 2000);
}

export function sanitizeForTelegram(text: string): string {
  // Escape markdown special characters
  return text
    .replace(/\\/g, '\\\\')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
    .replace(/^-|-$/g, '');
}

// Alias for backward compatibility
export const generateSlug = sanitizeSlug;

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// Safe validation wrapper
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
