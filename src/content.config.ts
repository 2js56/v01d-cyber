import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const entry = z.object({
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  anime: z.string().optional(),
  mood: z.string().optional(),
  /** 镜像层：只在连接态（html.wired）渲染显示的补充文本 */
  mirror: z.string().optional(),
  draft: z.boolean().default(false),
});

export const collections = {
  posts: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
    schema: entry,
  }),
  notes: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
    schema: entry,
  }),
  lab: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/lab' }),
    schema: entry,
  }),
};
