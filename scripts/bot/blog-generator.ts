/**
 * Blog post generation with proper slug handling and frontmatter
 * Fixed: Date format, slug generation for Spanish chars, input validation
 */

import { promises as fs } from 'fs';
import path from 'path';
import { transliterate } from 'transliteration';
import { logError, logInfo } from './logger';
import { safeValidate, BlogPostDataSchema } from './validation';

export interface BlogPostData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  date: string;
  content: string;
  featured?: boolean;
}

/**
 * Generate frontmatter for Astro
 * Fixed: Proper date format for Astro
 */
export function generateFrontmatter(data: BlogPostData): string {
  // Validate data first
  const validation = safeValidate(BlogPostDataSchema, data);
  if (!validation.success) {
    throw new Error(`Invalid blog post data: ${validation.errors?.join(', ')}`);
  }

  const tagsYaml = data.tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(', ');
  const escapedTitle = data.title.replace(/"/g, '\\"');
  const escapedDescription = data.description.replace(/"/g, '\\"');

  return `---
title: "${escapedTitle}"
description: "${escapedDescription}"
date: "${data.date}"
author: "Jorge Mayorga"
category: "${data.category}"
tags: [${tagsYaml}]
featured: ${data.featured || false}
---

${data.content}`;
}

/**
 * Generate SEO-friendly slug from title
 * Fixed: Proper handling of Spanish characters (á, é, í, ó, ú, ñ)
 */
export function generateSlug(title: string): string {
  // Transliterate Spanish chars to ASCII
  let slug = transliterate(title, { unknown: '' });
  
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
    .replace(/^-|-$/g, '');

  return slug || 'untitled-post';
}

/**
 * Save blog post to file system
 * Fixed: Proper path validation, async operations
 */
export async function saveBlogPost(data: BlogPostData): Promise<string> {
  const validation = safeValidate(BlogPostDataSchema, data);
  if (!validation.success) {
    throw new Error(`Cannot save invalid blog post: ${validation.errors?.join(', ')}`);
  }

  const slug = generateSlug(data.title);
  const filename = `${slug}.md`;
  const postsDir = path.join(process.cwd(), 'src', 'content', 'blog');
  const filePath = path.join(postsDir, filename);

  // Ensure directory exists
  await fs.mkdir(postsDir, { recursive: true });

  try {
    // Check if file exists
    await fs.access(filePath);
    
    // File exists, append timestamp
    const ts = Date.now().toString(36);
    const altFilename = `${slug}-${ts}.md`;
    const altPath = path.join(postsDir, altFilename);
    
    const content = generateFrontmatter(data);
    await fs.writeFile(altPath, content, 'utf-8');
    
    logInfo('Saved blog post with timestamp (duplicate title)', { 
      path: altPath,
      title: data.title 
    });
    
    return altPath;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it
      const content = generateFrontmatter(data);
      await fs.writeFile(filePath, content, 'utf-8');
      
      logInfo('Saved blog post', { path: filePath, title: data.title });
      return filePath;
    }
    
    throw error;
  }
}

/**
 * Preview blog post for Telegram
 * Fixed: Better formatting, word count accuracy
 */
export async function previewBlogPost(data: BlogPostData): Promise<string> {
  // Count words more accurately (handles multiple spaces and newlines)
  const wordCount = data.content
    .replace(/[#*_`\[\]]/g, '') // Remove markdown
    .split(/\s+/)
    .filter(w => w.length > 0)
    .length;
  
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Sanitize for Telegram Markdown
  const escape = (text: string) => text
    .replace(/\\/g, '\\\\')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');

  let preview = `*Blog Post Preview*
━━━━━━━━━━━━━━━━━━━

`;
  preview += `*Title:* ${escape(data.title)}\n`;
  preview += `*Category:* ${escape(data.category)}\n`;
  preview += `*Tags:* ${escape(data.tags.join(', '))}\n`;
  preview += `*Words:* ${wordCount} | *Reading time:* ~${readingTime} min\n\n`;
  preview += `*Description:*\n${escape(data.description)}\n\n`;
  preview += `*Content Preview:*\n${escape(data.content.substring(0, 250))}...\n\n`;
  preview += `━━━━━━━━━━━━━━━━━━━`;

  return preview;
}

/**
 * Validate that a blog post can be saved
 */
export async function validateBlogPost(data: BlogPostData): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const validation = safeValidate(BlogPostDataSchema, data);
  
  if (!validation.success) {
    return { valid: false, errors: validation.errors || [] };
  }

  // Check if directory is writable
  const postsDir = path.join(process.cwd(), 'src', 'content', 'blog');
  try {
    await fs.access(postsDir);
  } catch {
    try {
      await fs.mkdir(postsDir, { recursive: true });
    } catch (error) {
      return { 
        valid: false, 
        errors: [`Cannot write to blog directory: ${(error as Error).message}`] 
      };
    }
  }

  return { valid: true, errors: [] };
}
