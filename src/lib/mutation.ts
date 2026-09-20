// 站点自我修改：纪念日当天整站悄悄变形 —— 窗口栏换人、ps 多出进程、
// /etc/motd 换内容、site.log 多一行。日期表与 countdown 共源（作品纪念日）。

import { EVENTS } from './countdown';

export interface SiteMutation {
  /** 作品 slug（与 hero 锁定一致） */
  slug: string;
  /** 窗口栏与提示符的用户名：v01d@nerv */
  user: string;
  /** ps 附加进程行 */
  psLine: string;
  /** /etc/motd 替换内容 */
  motd: string[];
  /** /var/log/site.log 附加行 */
  logLine: string;
}

/** 各纪念日的变形内容（key = EVENTS 的 slug） */
const MUTATIONS: Record<string, Omit<SiteMutation, 'slug'>> = {
  evangelion: {
    user: 'nerv',
    psLine: '  999 ?         00:00:00 angel --pattern-blue --approaching',
    motd: ['今日、使徒、襲来。', '这不是演习。也不是第一次了（第 31 次）。', 'pattern blue。祝你有美好的一天。'],
    logLine: 'Oct  4 00:00:00 v01d nerv[999]: PATTERN BLUE —— 使徒接近中。E 系統起動。',
  },
  gits: {
    user: 'sect9',
    psLine: '  909 ?         00:00:13 tachikoma --standalone-complex',
    motd: ['電脳化、標準化される。', '今天请格外注意自己的 ghost 是否还在原位。', '课长说：网络是广阔的。'],
    logLine: 'Nov 18 00:00:00 v01d sect9[909]: ghost 确认仍在 shell 内。松了一口气。',
  },
  paranoia: {
    user: 'maromi',
    psLine: '  777 ?         00:07:07 shonen-batt --rollin-rollin',
    motd: ['ま、まろみ〜。', '今天不要独自承担。把不行的自己交给不行的自己。', '少年バット会来的。来过了。'],
    logLine: 'Feb  2 00:00:00 v01d maromi[777]: 打ぐるま、回るぐるま。谎言开始旋转。',
  },
  bebop: {
    user: 'bebop',
    psLine: '  313 ?         00:42:00 swordfish-II --cruising',
    motd: ['See you, space cowboy…', '今天的垃圾 Stardust 咖啡免费。', ' Whatever happens happens.'],
    logLine: 'Apr  3 00:00:00 v01d bebop[313]: 30 年了。船还是漏气的。Session 开始。',
  },
  lain: {
    user: 'lain',
    psLine: '    7 ?         07:07:07 lain --present-day-present-time',
    motd: ['no matter where you go, everyone is connected.', '今天不需要别的公告。这一句就够了。', '（你已连接。你一直连接着。）'],
    logLine: 'Jul  6 00:00:00 v01d lain[7]: 30 年。线没有断过。断的是我们的注意力。',
  },
};

/** 当天是纪念日 → 变形；否则 null。按 月-日 匹配（年年如此） */
export function siteMutation(d: Date): SiteMutation | null {
  const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  for (const e of EVENTS) {
    if (e.date.slice(5) !== mmdd) continue;
    const m = MUTATIONS[e.slug];
    if (m) return { slug: e.slug, ...m };
  }
  return null;
}
