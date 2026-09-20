import { describe, it, expect } from 'vitest';
import { siteMutation } from '../src/lib/mutation';

describe('站点自我修改', () => {
  it('10-04 EVA 周年：nerv 变形', () => {
    const m = siteMutation(new Date(2026, 9, 4, 12, 0));
    expect(m?.user).toBe('nerv');
    expect(m?.psLine).toMatch(/angel|pattern/i);
    expect(m?.motd.join('\n')).toMatch(/使徒|襲来/);
    expect(m?.logLine).toMatch(/pattern blue/i);
  });

  it('11-18 GITS：sect9 变形', () => {
    const m = siteMutation(new Date(2026, 10, 18, 3, 0));
    expect(m?.user).toBe('sect9');
    expect(m?.motd.length).toBeGreaterThan(0);
  });

  it(' lain 07-06：lain 变形', () => {
    const m = siteMutation(new Date(2028, 6, 6, 23, 0));
    expect(m?.user).toBe('lain');
  });

  it('普通日：null（站点保持原样）', () => {
    expect(siteMutation(new Date(2026, 8, 20, 12, 0))).toBeNull();
    expect(siteMutation(new Date(2026, 11, 25, 12, 0))).toBeNull();
  });

  it('变形内容完整：ps/motd/log 都有货', () => {
    for (const [mo, d] of [[9, 4], [10, 18], [1, 2], [3, 3], [6, 6]] as const) {
      const m = siteMutation(new Date(2027, mo, d));
      if (!m) continue;
      expect(m.psLine.length).toBeGreaterThan(5);
      expect(m.motd.length).toBeGreaterThan(0);
      expect(m.logLine.length).toBeGreaterThan(5);
      expect(m.slug.length).toBeGreaterThan(0);
    }
  });
});
