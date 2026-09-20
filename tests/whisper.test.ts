import { describe, it, expect } from 'vitest';
import { WHISPERS, NIGHT_WHISPERS, whisperFor } from '../src/lib/whisper';

describe('idle 低语', () => {
  it('两个池都非空且句子够怪', () => {
    expect(WHISPERS.length).toBeGreaterThanOrEqual(4);
    expect(NIGHT_WHISPERS.length).toBeGreaterThanOrEqual(4);
    expect(NIGHT_WHISPERS.join('\n')).toMatch(/夜|线|睡|背/);
  });

  it('确定性：同 seed 同结果', () => {
    for (let s = 0; s < 50; s++) {
      expect(whisperFor(s, true)).toBe(whisperFor(s, true));
      expect(whisperFor(s, false)).toBe(whisperFor(s, false));
    }
  });

  it('池内取句或 null（说话概率夜 > 昼）', () => {
    const count = (night: boolean) => {
      let said = 0;
      for (let s = 0; s < 500; s++) if (whisperFor(s, night) !== null) said++;
      return said;
    };
    const day = count(false);
    const night = count(true);
    expect(day).toBeGreaterThan(0);
    expect(day).toBeLessThan(500);
    expect(night).toBeGreaterThan(day);
  });

  it('返回的句子一定来自对应池', () => {
    for (let s = 0; s < 200; s++) {
      const d = whisperFor(s, false);
      if (d !== null) expect(WHISPERS).toContain(d);
      const n = whisperFor(s, true);
      if (n !== null) expect(NIGHT_WHISPERS).toContain(n);
    }
  });
});
