import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const portfolio = defineCollection({
  loader: glob({ base: './src/content/portfolio', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    year: z.number(),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().default(false),
    status: z.enum(['published', 'wip', 'archived']).default('published'),
    order: z.number().default(0),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      slug: z.string().optional(),
      cover: image().optional(),
      status: z.enum(['published', 'wip', 'archived']).default('published'),
      year: z.number(),
      tags: z.array(z.string()),
      stack: z.array(z.string()),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      links: z
        .object({
          demo: z.string().url().optional(),
          repo: z.string().url().optional(),
          pdf: z.string().url().optional(),
        })
        .optional(),
    }),
});

const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      excerpt: z.string(),
      slug: z.string().optional(),
      date: z.coerce.date(),
      tags: z.array(z.string()),
      category: z.string(),
      readingTime: z.number().optional(),
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),
      cover: image().optional(),
    }),
});

const papers = defineCollection({
  loader: glob({ base: './src/content/papers', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    venue: z.string(),
    year: z.number(),
    authors: z.array(z.string()),
    abstract: z.string(),
    pdf: z.string().url().optional(),
    slides: z.string().url().optional(),
    doi: z.string().optional(),
    status: z.enum(['published', 'under-review', 'preprint']).default('published'),
    featured: z.boolean().default(false),
  }),
});

const tutorials = defineCollection({
  loader: glob({ base: './src/content/tutorials', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    duration: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    category: z.string(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

export const collections = { portfolio, projects, research, papers, tutorials };