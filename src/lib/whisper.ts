// idle 低语：60 秒没人动，终端自言自语一句，你一动它就闭嘴。
// 深夜（0:00–4:59）更想说话，说的话也更怪。

export const WHISPERS: string[] = [
  'still there?',
  'signal ok. you ok?',
  '终端不介意你发呆。它也会。',
  '（没有人打字的时候，光标眨得更慢。）',
  'uptime 在走。你不用。',
];

export const NIGHT_WHISPERS: string[] = [
  '这个点还没断开的人，都见过一些东西。',
  '你背后没有东西。我确认过了。',
  '线还连着。睡不睡是你自己的事。',
  '夜里还在 grep 的人，找的都不是文件。',
  '刚才那一下不是风。是本站的风。',
];

/** 乘法哈希（Knuth）：seed 打散后按概率阈值决定说不说，再选句 */
export function whisperFor(seed: number, night: boolean): string | null {
  const h = (Math.imul(seed ^ 0x9e3779b9, 2654435761) >>> 0) % 10000;
  const threshold = night ? 7500 : 4000;
  if (h >= threshold) return null;
  const pool = night ? NIGHT_WHISPERS : WHISPERS;
  return pool[h % pool.length]!;
}
