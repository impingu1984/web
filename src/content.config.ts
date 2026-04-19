// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/blogs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    date: z.date(),
    tags: z.array(z.string()).optional().default([]),
    toc: z.boolean().optional().default(false),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blogs };