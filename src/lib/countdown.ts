// 无解释倒计时：footer HUD 只显示 T-n，不说明在数什么。
// 点击才把话说完 —— 懂的人自然懂，不懂的人看到一句没头没尾的话。
// 全是作品的纪念日：站点替你记着这些日期。

export interface CountdownEvent {
  /** 'YYYY-MM-DD' 当地时区 */
  date: string;
  /** T-0 当天 hero 锁定的作品 slug */
  slug: string;
  /** 点击 HUD 输出到终端的台词 */
  line: string;
}

export const EVENTS: CountdownEvent[] = [
  {
    date: '2026-10-04',
    slug: 'evangelion',
    line: '1995-10-04 — 使徒、襲来。31 年前的今天，第三新东京市上空很晴。',
  },
  {
    date: '2026-11-18',
    slug: 'gits',
    line: '1995-11-18 — ghost 与 shell 从此可以分开谈论。31 年。',
  },
  {
    date: '2027-02-02',
    slug: 'paranoia',
    line: '2004-02-02 — 少年バット还没有来。來る。',
  },
  {
    date: '2028-04-03',
    slug: 'bebop',
    line: "1998-04-03 — See you, space cowboy… 30 年。",
  },
  {
    date: '2028-07-06',
    slug: 'lain',
    line: "1998-07-06 — no matter where you go, everyone's connected. 30 年。",
  },
];

const DAY = 864e5;

/** 到目标日的整天数（当地时区，目标日当天为 0，过完为负） */
export function daysUntil(date: string, now: Date): number {
  const [y, m, d] = date.split('-').map(Number);
  const target = new Date(y!, m! - 1, d!).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / DAY);
}

export interface NextEvent {
  event: CountdownEvent;
  days: number;
}

/** 最近的未来事件（含当天）；全部过期为 null */
export function nextEvent(now: Date, events: CountdownEvent[] = EVENTS): NextEvent | null {
  return events
    .map((event) => ({ event, days: daysUntil(event.date, now) }))
    .filter(({ days }) => days >= 0)
    .sort((a, b) => a.days - b.days)[0] ?? null;
}

/** HUD 标签：T-0 当天，其余 T-n */
export function hudLabel(days: number): string {
  return `T-${days}`;
}
