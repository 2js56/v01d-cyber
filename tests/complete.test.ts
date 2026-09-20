import { describe, it, expect } from 'vitest';
import { tabComplete } from '../src/lib/complete';
import type { Ctx } from '../src/lib/commands';

const ctx: Ctx = {
  posts: [
    { slug: 'alpha', title: 'Alpha', date: '2026-01-02' },
    { slug: 'beta', title: 'Beta', date: '2026-01-01' },
  ],
  notes: [{ slug: 'n1', title: 'Note', date: '2026-02-01' }],
  lab: [{ slug: 'l1', title: 'Lab', date: '2026-03-01' }],
};

describe('tabComplete', () => {
  it('命令位置：唯一前缀命中补全命令名', () => {
    const r = tabComplete('gr', ctx, '');
    expect(r.insert).toBe('grep');
  });

  it('命令位置：多命中列出候选，公共前缀无增益时不替换（同 bash）', () => {
    const r = tabComplete('s', ctx, '');
    expect(r.matches.length).toBeGreaterThan(1); // ss/ssh/sudo/sqlmap…
    expect(r.insert).toBeNull();
  });

  it('参数位置：多命中且公共前缀有增益时补到前缀', () => {
    const r = tabComplete('cat l', ctx, '');
    expect(r.matches.slice().sort()).toEqual(['lab/', 'lab/l1.md']);
    expect(r.insert).toBe('cat lab/');
  });

  it('参数位置：目录候选补全尾随斜杠', () => {
    const r = tabComplete('cd po', ctx, '');
    expect(r.insert).toBe('cd posts/');
  });

  it('参数位置：文件路径唯一命中补全到 .md', () => {
    const r = tabComplete('cat posts/al', ctx, '');
    expect(r.insert).toBe('cat posts/alpha.md');
  });

  it('cwd 下裸文件名也能补全', () => {
    const r = tabComplete('cat be', ctx, 'posts');
    expect(r.insert).toBe('cat beta.md');
  });

  it('多候选返回列表不整体插入', () => {
    const r = tabComplete('cat posts/', ctx, '');
    expect(r.matches.length).toBe(2); // alpha.md / beta.md
    expect(r.insert).toBeNull();
  });

  it('无命中返回空列表', () => {
    const r = tabComplete('cat zzz', ctx, '');
    expect(r.matches).toHaveLength(0);
    expect(r.insert).toBeNull();
  });
});
