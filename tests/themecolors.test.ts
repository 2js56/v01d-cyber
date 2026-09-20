import { describe, it, expect } from 'vitest';
import { THEMECOLORS, themeColors } from '../src/lib/themecolors';
import { manifest } from '../src/lib/art';

const HEX = /^#[0-9a-f]{6}$/i;
const GLOW = /^rgba?\([\d\s,./]+\)$/i;

describe('主题色渗透', () => {
  it('manifest 每个 slug 都有色（漏一个都不行）', () => {
    for (const slug of Object.keys(manifest)) {
      expect(THEMECOLORS[slug], `THEMECOLORS 缺 ${slug}`).toBeDefined();
    }
  });

  it('色值格式合法：accent 是 hex，glow 是 rgba', () => {
    for (const [slug, t] of Object.entries(THEMECOLORS)) {
      expect(t.accent, `${slug}.accent`).toMatch(HEX);
      expect(t.glow, `${slug}.glow`).toMatch(GLOW);
    }
  });

  it('themeColors：命中 / 未命中 / 空参', () => {
    expect(themeColors('lain')?.accent).toBe(THEMECOLORS['lain']!.accent);
    expect(themeColors('nope')).toBeNull();
    expect(themeColors(undefined)).toBeNull();
  });

  it('works 之间色不重复（每个作品有独立身份）', () => {
    const accents = Object.values(THEMECOLORS).map((t) => t.accent.toLowerCase());
    expect(new Set(accents).size).toBe(accents.length);
  });
});
