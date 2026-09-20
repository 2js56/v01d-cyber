import manifest from '../../public/art/manifest.json';

export interface Entry {
  slug: string;
  title: string;
  date: Date;
  anime?: string;
}

export interface Ctx {
  posts: Entry[];
  notes: Entry[];
  lab: Entry[];
}

export interface Line {
  text: string;
  cls?: '' | 'cyan' | 'green' | 'err' | 'dim' | 'purple';
}

export type Effect = 'clear' | 'wired' | 'rmrf' | 'exit' | 'crt-toggle';

export interface Result {
  lines: Line[];
  navigate?: { href: string };
  effect?: Effect;
}

export interface State {
  history: string[];
}

export const makeState = (): State => ({ history: [] });

// —— 假注入彩蛋：整站 0 数据库、渲染走 textContent，注入纯属打在棉花上 ——
const SQLI_RE =
  /union\s+select|drop\s+table|'\s*or\s*'|'\d+'\s*=\s*'\d+|\b1\s*=\s*1\b|sleep\s*\(|benchmark\s*\(|'--|--\s*$/i;

function injectionEgg(raw: string): Line[] | null {
  // XSS 系
  if (/<script/i.test(raw))
    return [
      { text: '[xss] 拦截到 <script> 注入', cls: 'err' },
      { text: '渲染管线：textContent() —— payload 被当作纯文本羞辱了', cls: 'dim' },
      { text: '想弹窗？这个站的 JS 比你的 payload 写得好。', cls: '' },
    ];
  if (/document\.cookie/i.test(raw))
    return [
      { text: '[xss] document.cookie → ""', cls: 'err' },
      { text: '本站全部家当：localStorage["crt"] = "on" | "off"。拿去慢慢享（用）。', cls: 'dim' },
    ];
  if (/javascript:|on(error|click|load|mouseover)\s*=|alert\s*\(|<img/i.test(raw))
    return [
      { text: '[xss] payload 检测命中', cls: 'err' },
      { text: '可惜整个站没有一个 innerHTML 会接你的茬。', cls: 'dim' },
    ];
  // SQLi 系
  if (/union\s+select/i.test(raw)) {
    const titles = Object.values(manifest).map((m) => m.title);
    return [
      { text: `[sql] SELECT slug FROM garden UNION ${raw.trim()};`, cls: 'err' },
      { text: `[sql] → ${titles.length} rows: ${titles.join(' / ')}`, cls: 'cyan' },
      { text: '这是本站唯一真实存在的表。', cls: 'dim' },
    ];
  }
  if (/drop\s+table/i.test(raw))
    return [
      { text: '[sql] DROP TABLE → OK, 0 rows affected', cls: 'err' },
      { text: '删掉的表和会员制一样，从来就没存在过。', cls: 'dim' },
    ];
  if (/sleep\s*\(|benchmark\s*\(/i.test(raw))
    return [
      { text: '[sql] SELECT sleep(5) → 立即返回', cls: 'err' },
      { text: '时间盲注失效：静态站的响应时间不值得盲。', cls: 'dim' },
    ];
  if (SQLI_RE.test(raw))
    return [
      { text: "[sql] SELECT * FROM users WHERE id='' OR '1'='1';", cls: 'err' },
      { text: '[sql] → 1 row: (admin, ********)', cls: 'cyan' },
      { text: '登录成功，欢迎回来，admin。……才怪：', cls: '' },
      { text: '本站 0 个数据库、0 条查询，你的注入打在了纯静态 HTML 上。', cls: 'dim' },
    ];
  return null;
}

export function execCommand(raw: string, state: State, ctx: Ctx): Result {
  const trimmed = raw.trim();
  const [cmd, ...args] = trimmed.split(/\s+/);
  state.history.push(trimmed);

  const groups = [
    ['posts', ctx.posts],
    ['notes', ctx.notes],
    ['lab', ctx.lab],
  ] as const;
  const all = [...ctx.posts, ...ctx.notes, ...ctx.lab];

  switch (cmd) {
    case 'help':
      return {
        lines: [
          { text: 'commands: help ls cat <n> cd <page> whoami theme clear lain exit', cls: 'green' },
          { text: '彩蛋自己找。（提示：上上下下左右左右BA）', cls: 'dim' },
        ],
      };

    case 'ls':
      return {
        lines: groups.flatMap(([dir, list]) => [
          { text: `${dir}/`, cls: 'cyan' as const },
          ...list.map(
            (e) =>
              ({
                text: `  ${e.slug}.md  ${e.date.toISOString().slice(0, 10)}`,
                cls: '',
              }) as Line
          ),
        ]),
      };

    case 'cat': {
      const n = Number(args[0]);
      const e = all[n - 1];
      if (!Number.isInteger(n) || !e) {
        return {
          lines: [
            { text: `cat: ${args[0] ?? ''}: No such entry (1-${all.length})`, cls: 'err' },
          ],
        };
      }
      return {
        lines: [{ text: `opening ${e.slug}.md …`, cls: 'dim' }],
        navigate: { href: `/posts/${e.slug}` },
      };
    }

    case 'cd': {
      const target = args[0] ?? '~';
      if (target === '~' || target === '/') return { lines: [], navigate: { href: '/' } };
      const known = ['posts', 'notes', 'lab'];
      if (known.includes(target)) return { lines: [], navigate: { href: `/#${target}` } };
      return { lines: [{ text: `cd: ${target}: No such page`, cls: 'err' }] };
    }

    case 'whoami':
      return {
        lines: [
          { text: 'v01d — web 渗透 / 内网安全 / shellcode 免杀 / 赛璐璐考古学家', cls: 'green' },
        ],
      };

    case 'clear':
      return { lines: [], effect: 'clear' };

    case 'theme':
      return { lines: [{ text: 'crt toggled', cls: 'dim' }], effect: 'crt-toggle' };

    case 'lain':
      return {
        lines: [
          {
            text: 'no matter where you go, everyone is connected.',
            cls: 'purple',
          },
        ],
        effect: 'wired',
      };

    case 'sudo':
      return {
        lines: [
          {
            text: 'v01d is not in the sudoers file. This incident will be reported. （骗你的，你是 root 又怎样）',
            cls: 'err',
          },
        ],
      };

    case 'exit':
      return { lines: [{ text: 'logout…', cls: 'dim' }], effect: 'exit' };

    case 'rm':
      return {
        lines: [{ text: 'rm: 正在删除 /dev/garden …', cls: 'err' }],
        effect: 'rmrf',
      };

    default: {
      const egg = injectionEgg(trimmed);
      if (egg) return { lines: egg };
      return {
        lines: [{ text: `command not found: ${cmd} (try 'help')`, cls: 'err' }],
      };
    }
  }
}
