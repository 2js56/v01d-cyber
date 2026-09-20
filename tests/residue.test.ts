import { describe, it, expect } from 'vitest';
import { residueFor, residuePool } from '../src/lib/residue';

describe('residueFor（grep 无匹配时的信号残留）', () => {
  it('同一个词结果确定（世界有一致性）', () => {
    for (const w of ['lain', 'ghost', '免杀', 'protocol', 'asdf']) {
      expect(residueFor(w)).toBe(residueFor(w));
    }
  });

  it('大小写与首尾空白不影响结果', () => {
    expect(residueFor('  Lain ')).toBe(residueFor('lain'));
  });

  it('词群中既有命中的也有沉默的（不是全有/全无）', () => {
    const words = Array.from({ length: 60 }, (_, i) => `w${i}`);
    const results = words.map((w) => residueFor(w));
    expect(results.some((r) => r !== null)).toBe(true);
    expect(results.some((r) => r === null)).toBe(true);
  });

  it('命中的句子来自残留池', () => {
    const words = Array.from({ length: 100 }, (_, i) => `w${i}`);
    for (const r of words.map((w) => residueFor(w))) {
      if (r !== null) expect(residuePool).toContain(r);
    }
  });

  it('空词/纯空白不触发', () => {
    expect(residueFor('')).toBeNull();
    expect(residueFor('   ')).toBeNull();
  });
});
