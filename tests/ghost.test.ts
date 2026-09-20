import { describe, it, expect } from 'vitest';
import { ghostEpoch, ghostSighting, GHOST_LINES } from '../src/lib/ghost';

describe('幽灵访客', () => {
  it('epoch：10 分钟一格，格内一致', () => {
    expect(ghostEpoch(new Date('2026-09-20T12:00:00'))).toBe(ghostEpoch(new Date('2026-09-20T12:09:59')));
    expect(ghostEpoch(new Date('2026-09-20T12:00:00'))).toBeLessThan(ghostEpoch(new Date('2026-09-20T12:10:00')));
  });

  it('确定性：同 epoch 同结果', () => {
    const t = new Date('2026-09-20T12:00:00');
    for (let i = 0; i < 50; i++) {
      const a = ghostSighting(new Date(t.getTime() + i * 600000), false);
      const b = ghostSighting(new Date(t.getTime() + i * 600000), false);
      expect(a?.kind).toBe(b?.kind);
      expect(a?.line).toBe(b?.line);
    }
  });

  it('深夜出没率 > 白天；wired 再翻倍', () => {
    // 采样要锁在目标时段内：深夜 0:00–4:50（29 个 epoch/天），白天取 14 点档
    const rate = (night: boolean, wired: boolean) => {
      let seen = 0;
      const n = 2000;
      for (let i = 0; i < n; i++) {
        const dayOffset = Math.floor(i / 29);
        const epochInDay = night ? i % 29 : 14 * 6; // 深夜扫 29 格，白天锁 14:00 那格
        const t = new Date(2026, 8, 21, 0, 0, 0).getTime() + dayOffset * 86400000 + epochInDay * 600000;
        if (ghostSighting(new Date(t), wired)) seen++;
      }
      return seen / n;
    };
    const day = rate(false, false);
    const night = rate(true, false);
    const wiredDay = rate(false, true);
    expect(night).toBeGreaterThan(day);
    expect(wiredDay).toBeGreaterThan(day);
    expect(day).toBeGreaterThan(0);
    expect(day).toBeLessThan(0.5);
  });

  it('二态演出：cursor 或 line（line 必有台词且来自池）', () => {
    for (let i = 0; i < 500; i++) {
      const t = new Date(2026, 8, 21, 2, 0, 0).getTime() + i * 600000;
      const g = ghostSighting(new Date(t), false);
      if (!g) continue;
      if (g.kind === 'line') {
        expect(g.line).toBeDefined();
        expect(GHOST_LINES).toContain(g.line);
      } else {
        expect(g.kind).toBe('cursor');
      }
    }
  });

  it('台词池非空且够意识流', () => {
    expect(GHOST_LINES.length).toBeGreaterThanOrEqual(4);
  });
});
