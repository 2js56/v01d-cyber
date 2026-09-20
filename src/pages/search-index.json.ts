import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

type Entry = CollectionEntry<'posts' | 'notes' | 'lab'>;

// 构建时生成全站纯文本索引，供终端 grep 命令搜索
const strip = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, ' ') // 代码块
    .replace(/`([^`]*)`/g, '$1') // 行内代码
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接 → 锚文本
    .replace(/^#{1,6}\s+/gm, '') // 标题井号
    .replace(/^>\s?/gm, '') // 引用
    .replace(/[*_~]{1,3}/g, '') // 强调/删除线
    .replace(/^---$/gm, ' ')
    // 只合并非换行空白：保留行结构，cat | grep 才有真实的“行”可过滤
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export async function GET() {
  const all: Entry[] = [
    ...(await getCollection('posts', (c) => !c.draft)),
    ...(await getCollection('notes', (c) => !c.draft)),
    ...(await getCollection('lab', (c) => !c.draft)),
  ];
  const data = all.map((e) => ({
    slug: e.id.replace(/\.md$/, ''),
    collection: e.collection,
    title: e.data.title,
    tags: e.data.tags ?? [],
    text: strip(e.body ?? ''),
  }));
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
