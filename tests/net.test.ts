import { describe, it, expect } from 'vitest';
import { netWanted, netSet } from '../src/lib/net';

const mkStore = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  };
};

describe('net（连接态状态机）', () => {
  it('默认断开（null / 未知值都视为 off）', () => {
    expect(netWanted(null)).toBe(false);
    expect(netWanted('off')).toBe(false);
    expect(netWanted('garbage')).toBe(false);
  });

  it('connect 后持久化，wired 判定成立', () => {
    const s = mkStore();
    netSet(s, true);
    expect(s.getItem('net')).toBe('wired');
    expect(netWanted(s.getItem('net'))).toBe(true);
    netSet(s, false);
    expect(netWanted(s.getItem('net'))).toBe(false);
  });
});
