import { describe, it, expect } from 'vitest';
import { scrambleFrame } from '../src/lib/scramble';

describe('解码动画 scrambleFrame', () => {
  const T = 'present day, present time';

  it('progress=1 落定为原文', () => {
    expect(scrambleFrame(T, 1)).toBe(T);
  });

  it('progress=0 全乱码（空格保留）', () => {
    const f = scrambleFrame(T, 0);
    expect(f).not.toBe(T);
    expect(f.length).toBe(T.length);
    for (let i = 0; i < T.length; i++) {
      if (T[i] === ' ') expect(f[i]).toBe(' ');
      else expect(f[i]).not.toBe(T[i]);
    }
  });

  it('中点：前半已落定，后半仍乱', () => {
    const f = scrambleFrame(T, 0.5);
    expect(f.startsWith(T.slice(0, Math.floor(T.length / 2)))).toBe(true);
    expect(f.endsWith(T.slice(-1))).toBe(false);
  });

  it('确定性：同参数同输出', () => {
    expect(scrambleFrame(T, 0.4, 7)).toBe(scrambleFrame(T, 0.4, 7));
    expect(scrambleFrame(T, 0.4, 7)).not.toBe(scrambleFrame(T, 0.4, 8));
  });

  it('空串安全', () => {
    expect(scrambleFrame('', 0.5)).toBe('');
  });
});
