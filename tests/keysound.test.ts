import { describe, it, expect } from 'vitest';
import { keysoundOn, keysoundSetEnabled, keyClick } from '../src/lib/keysound';

const mkStore = (init: Record<string, string> = {}) => {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  };
};

describe('打字机音效', () => {
  it('默认开；显式 off 才关', () => {
    const s = mkStore();
    expect(keysoundOn(s)).toBe(true);
    expect(keysoundOn(mkStore({ keysound: 'off' }))).toBe(false);
  });

  it('开关往返持久化', () => {
    const s = mkStore({ keysound: 'off' });
    keysoundSetEnabled(false, s);
    expect(s.getItem('keysound')).toBe('off');
    keysoundSetEnabled(true, s);
    expect(s.getItem('keysound')).toBe('on');
  });

  it('无 AudioContext 环境 keyClick 不炸（node 测试环境）', () => {
    expect(() => keyClick()).not.toThrow();
  });
});
