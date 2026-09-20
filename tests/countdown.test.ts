import { describe, it, expect } from 'vitest';
import { EVENTS, daysUntil, nextEvent, hudLabel } from '../src/lib/countdown';

describe('无解释倒计时', () => {
  it('daysUntil：当天 0、明天 1、昨天 -1', () => {
    expect(daysUntil('2026-10-04', new Date(2026, 9, 4, 15, 30))).toBe(0);
    expect(daysUntil('2026-10-04', new Date(2026, 9, 3, 23, 59))).toBe(1);
    expect(daysUntil('2026-10-04', new Date(2026, 9, 5, 0, 1))).toBe(-1);
  });

  it('daysUntil：跨月边界只算整天', () => {
    expect(daysUntil('2026-10-01', new Date(2026, 8, 30))).toBe(1);
    expect(daysUntil('2026-09-30', new Date(2026, 8, 30))).toBe(0);
  });

  it('nextEvent：取最近未来事件', () => {
    const r = nextEvent(new Date(2026, 8, 20));
    expect(r?.event.slug).toBe('evangelion');
    expect(r?.days).toBe(14);
  });

  it('nextEvent：EVA 周年过后轮到 GITS', () => {
    const r = nextEvent(new Date(2026, 9, 5));
    expect(r?.event.slug).toBe('gits');
  });

  it('nextEvent：当天命中 days=0（data-doom）', () => {
    const r = nextEvent(new Date(2026, 9, 4));
    expect(r?.days).toBe(0);
    expect(r?.event.slug).toBe('evangelion');
  });

  it('nextEvent：全部过期返回 null', () => {
    expect(nextEvent(new Date(2030, 0, 1), [])).toBeNull();
    expect(
      nextEvent(new Date(2030, 0, 1), [{ date: '2029-12-31', slug: 'x', line: '' }])
    ).toBeNull();
  });

  it('hudLabel：T-0 / T-14', () => {
    expect(hudLabel(0)).toBe('T-0');
    expect(hudLabel(14)).toBe('T-14');
  });

  it('事件表：日期格式合法且 line 非空', () => {
    for (const e of EVENTS) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.line.length).toBeGreaterThan(0);
    }
  });
});
