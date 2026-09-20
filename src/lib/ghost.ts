// 幽灵访客：偶尔有一个"别的访客"在站上出没 —— 一个不属于任何人的光标
// 缓缓划过，或终端里半句话。确定性调度：10 分钟一个 epoch，同 epoch
// 同结果；深夜更频繁，连接态再翻倍（everyone is connected）。

export const GHOST_LINES: string[] = [
  '……你也看得到这条线吗',
  '（别人刚离开。椅子还是热的。）',
  'hi。没吓到你吧。我路过。',
  '这里不止你一个。只是大家都很有礼貌。',
];

export interface GhostSighting {
  kind: 'cursor' | 'line';
  /** kind=line 时终端里打的半句话 */
  line?: string;
}

/** 10 分钟一格的 epoch 号 */
export function ghostEpoch(now: Date): number {
  return Math.floor(now.getTime() / 600000);
}

function knuth(n: number): number {
  return (Math.imul(n ^ 0x9e3779b9, 2654435761) >>> 0) % 1000;
}

/** 本 epoch 是否出没、以什么形态。wired 概率翻倍 */
export function ghostSighting(now: Date, wired: boolean): GhostSighting | null {
  const h = knuth(ghostEpoch(now));
  const night = now.getHours() < 5;
  const base = night ? 250 : 90; // 每 epoch 25% / 9%
  const p = wired ? Math.min(base * 2, 700) : base;
  if (h >= p) return null;
  if (h % 2 === 0) return { kind: 'cursor' };
  return { kind: 'line', line: GHOST_LINES[h % GHOST_LINES.length]! };
}
