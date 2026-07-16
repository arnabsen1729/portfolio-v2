import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    dek: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
    readingTimeOverride: z.number().optional(),
    numberedSections: z.boolean().default(false),
  }),
});

const papershelf = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/papershelf' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    year: z.number(),
    link: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    tldr: z.string(),
  }),
});

export const collections = { blog, papershelf };
