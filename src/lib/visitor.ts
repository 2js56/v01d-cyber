// 访客记忆与身份演化：全部本地（localStorage 计数 / sessionStorage 防重），
// 零后端零上传 —— 站点"认识你"是它自己的错觉，不是数据库

export interface Store {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

/** 浏览器胶水：真实 storage；隐私模式等异常退化为内存（不持久但不炸） */
export function webStores(): { ls: Store; ss: Store } {
  const mem = (): Store => {
    const m = new Map<string, string>();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
  };
  try {
    return { ls: localStorage, ss: sessionStorage };
  } catch {
    return { ls: mem(), ss: mem() };
  }
}

export interface Visit {
  /** 第几次会话（连接代数） */
  n: number;
  /** 距上次会话天数；首次为 null */
  sinceDays: number | null;
}

const DAY = 864e5;

/** 每个浏览器会话计一次（sessStore 挡住 F5），返回当前代数与间隔 */
export function visit(store: Store, sessStore: Store, now: number): Visit {
  if (sessStore.getItem('seen') !== null) {
    const n = Number(store.getItem('visits')) || 1;
    const last = Number(store.getItem('last-seen'));
    return { n, sinceDays: last ? Math.floor((now - last) / DAY) : null };
  }
  try {
    sessStore.setItem('seen', '1');
  } catch {}
  const prev = Number(store.getItem('visits')) || 0;
  const last = Number(store.getItem('last-seen'));
  const v: Visit = { n: prev + 1, sinceDays: prev && last ? Math.floor((now - last) / DAY) : null };
  try {
    store.setItem('visits', String(v.n));
    store.setItem('last-seen', String(now));
  } catch {}
  return v;
}

/** 深夜 0:00–4:59 */
export function isNight(d: Date): boolean {
  return d.getHours() < 5;
}

/** hero 副标题：lain 台词 + 活的时刻 + 连接代数；深夜/连接态各有变体 */
export function greeting(v: Visit, d: Date, wired: boolean): string {
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (isNight(d)) return `why are you awake — ${hhmm} · connect #${v.n}`;
  if (wired) return `connected. everyone is connected. · #${v.n}`;
  const seen = v.sinceDays !== null ? ` · last seen ${v.sinceDays}d` : '';
  return `present day, present time — ${hhmm} · connect #${v.n}${seen}`;
}

/** whoami 按访问代数演化：guest → guest? → 身份消解 */
export function whoamiLine(n: number): { text: string; cls: string } {
  if (n < 3) return { text: 'guest — 未验证的连接', cls: 'green' };
  if (n < 10) return { text: 'guest? —— 这个名字，你确定吗', cls: 'cyan' };
  return n % 2 === 0
    ? { text: 'you are not v01d.', cls: 'purple' }
    : { text: '…are you?', cls: 'purple' };
}

export interface Nav {
  userAgent: string;
  language: string;
  hardwareConcurrency?: number;
}

/** 本地指纹：全部当场采样当场展示，不发任何请求 */
export function readFinger(
  nav: Nav,
  win: { screen: { width: number; height: number }; devicePixelRatio: number },
  tz: string
): string[] {
  const lines = [
    `agent:    ${nav.userAgent}`,
    `lang:     ${nav.language}`,
    `tz:       ${tz}`,
    `screen:   ${win.screen.width}x${win.screen.height} @${win.devicePixelRatio}x`,
  ];
  if (nav.hardwareConcurrency) lines.push(`cores:    ${nav.hardwareConcurrency}`);
  lines.push('identity: unverified —— 以上只在你本地显示，本站没有后端，不上传任何东西');
  return lines;
}
