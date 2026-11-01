import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const screenshotSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number(),
  height: z.number(),
  caption: z.string().optional(),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
    isPlaceholder: z.boolean(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    period: z.string().optional(),
    order: z.number().optional(),
    role: z.string(),
    stack: z.array(z.string()),
    summary: z.string(),
    background: z.string(),
    responsibilities: z.array(z.string()),
    outcomes: z.array(z.string()),
    links: z.array(linkSchema).optional(),
    screenshots: z.array(screenshotSchema).optional(),
    liveUrl: z.url().optional(),
    isPlaceholder: z.boolean(),
  }),
});

export const collections = { posts, projects };
