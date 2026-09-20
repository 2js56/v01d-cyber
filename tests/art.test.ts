import { describe, it, expect } from 'vitest';
import { manifest } from '../src/lib/art';

// 视觉池：slug 决定文件名（${slug}_cover/banner.jpg），AniList 搜索词与
// slug 解耦（search 字段）——键名可以保持 URL 友好的短名
describe('art manifest（视觉池）', () => {
  it('每个条目的文件名与 slug 对应', () => {
    for (const [slug, info] of Object.entries(manifest)) {
      expect(info.cover, `${slug} cover`).toBe(`${slug}_cover.jpg`);
      expect(info.banner, `${slug} banner`).toBe(`${slug}_banner.jpg`);
    }
  });

  it('search 字段存在时必须是非空字符串', () => {
    for (const [slug, info] of Object.entries(manifest)) {
      if (info.search !== undefined) {
        expect(typeof info.search, `${slug} search`).toBe('string');
        expect(info.search.length, `${slug} search`).toBeGreaterThan(0);
      }
    }
  });

  it('EVA 系列条目齐全（TV / EOE / 新剧场版四部曲）', () => {
    for (const s of ['evangelion', 'eva_eoe', 'eva_10', 'eva_20', 'eva_30', 'eva_310']) {
      expect(manifest[s], s).toBeTruthy();
      expect(manifest[s].banner, `${s} banner`).toBe(`${s}_banner.jpg`);
    }
  });
});
