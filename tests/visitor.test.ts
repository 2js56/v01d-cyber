import { describe, it, expect } from 'vitest';
import { visit, whoamiLine, isNight, greeting, readFinger } from '../src/lib/visitor';

// 参数化存储：node 环境没有 localStorage，用 Map 模拟
const mkStore = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  };
};

describe('visit（会话计数）', () => {
  it('首次访问 n=1、无上次间隔', () => {
    const v = visit(mkStore(), mkStore(), Date.parse('2026-09-20T10:00:00'));
    expect(v.n).toBe(1);
    expect(v.sinceDays).toBeNull();
  });

  it('同一会话内不重复计数（防 F5 刷访问量）', () => {
    const ls = mkStore();
    const ss = mkStore();
    visit(ls, ss, 0);
    visit(ls, ss, 0);
    expect(visit(ls, ss, 0).n).toBe(1);
  });

  it('新会话计数 +1，距上次间隔按天算', () => {
    const ls = mkStore();
    const day = 864e5;
    visit(ls, mkStore(), day * 10);
    const v = visit(ls, mkStore(), day * 13); // 3 天后回来
    expect(v.n).toBe(2);
    expect(v.sinceDays).toBe(3);
  });
});

describe('whoamiLine（身份演化）', () => {
  it('0-2 次：guest', () => {
    expect(whoamiLine(0).text).toContain('guest');
    expect(whoamiLine(2).text).toContain('guest');
    expect(whoamiLine(2).text).not.toContain('?');
  });
  it('3-9 次：guest?（自我怀疑）', () => {
    expect(whoamiLine(3).text).toContain('guest?');
    expect(whoamiLine(9).text).toContain('guest?');
  });
  it('10 次+：身份消解，两句交替', () => {
    expect(whoamiLine(10).text).not.toBe(whoamiLine(11).text);
    const texts = [whoamiLine(10).text, whoamiLine(11).text].join(' ');
    expect(texts).toContain('v01d');
    expect(texts.toLowerCase()).toContain('are you');
  });
});

describe('isNight（深夜 0-5 点）', () => {
  it('边界正确', () => {
    expect(isNight(new Date('2026-09-20T00:30:00'))).toBe(true);
    expect(isNight(new Date('2026-09-20T04:59:00'))).toBe(true);
    expect(isNight(new Date('2026-09-20T05:00:00'))).toBe(false);
    expect(isNight(new Date('2026-09-20T23:00:00'))).toBe(false);
  });
});

describe('greeting（hero 副标题文案）', () => {
  const v = { n: 7, sinceDays: 3 };
  it('常昼：lain 台词 + 时刻 + 连接代数 + 间隔', () => {
    const g = greeting(v, new Date('2026-09-20T16:05:00'), false);
    expect(g).toContain('present day, present time');
    expect(g).toContain('16:05');
    expect(g).toContain('#7');
    expect(g).toContain('3d');
  });
  it('首次访问没有 last seen', () => {
    expect(greeting({ n: 1, sinceDays: null }, new Date('2026-09-20T16:05:00'), false)).not.toContain('last seen');
  });
  it('深夜变体：why are you awake', () => {
    const g = greeting(v, new Date('2026-09-20T02:13:00'), false);
    expect(g).toContain('why are you awake');
    expect(g).toContain('02:13');
  });
  it('连接态变体：everyone is connected', () => {
    expect(greeting(v, new Date('2026-09-20T16:05:00'), true)).toContain('connected');
  });
});

describe('readFinger（本地指纹）', () => {
  it('组装 agent/lang/tz/screen/cores 行', () => {
    const lines = readFinger(
      { userAgent: 'Mozilla/5.0 Test', language: 'zh-CN', hardwareConcurrency: 8 },
      { screen: { width: 1512, height: 982 }, devicePixelRatio: 2 },
      'Asia/Shanghai'
    ).join('\n');
    expect(lines).toContain('Mozilla/5.0 Test');
    expect(lines).toContain('zh-CN');
    expect(lines).toContain('Asia/Shanghai');
    expect(lines).toContain('1512x982');
    expect(lines).toContain('@2x');
    expect(lines).toContain('8');
  });
  it('带本地声明（不上传）', () => {
    const lines = readFinger(
      { userAgent: 'X', language: 'en' },
      { screen: { width: 1, height: 1 }, devicePixelRatio: 1 },
      'UTC'
    ).join('\n');
    expect(lines).toContain('本地');
    expect(lines).toContain('上传');
  });
});
