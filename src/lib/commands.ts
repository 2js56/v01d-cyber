export interface Entry {
  slug: string;
  title: string;
  date: Date;
  anime?: string;
}

/** /search-index.json 的条目结构（构建时生成） */
export interface SearchEntry {
  slug: string;
  collection: string;
  title: string;
  tags: string[];
  text: string;
}

export interface Ctx {
  posts: Entry[];
  notes: Entry[];
  lab: Entry[];
  search?: SearchEntry[];
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

// serial experiments lain 首播日（1998-07-06，JST）—— uptime 从这天起算
const LAIN_EPOCH = Date.parse('1998-07-06T00:00:00+09:00');

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
          {
            text: 'commands: help ls cat <n> cd <page> grep <kw> whoami theme clear lain exit',
            cls: 'green',
          },
          { text: 'installed: ps netstat ss uptime history nmap sqlmap ssh hydra', cls: 'cyan' },
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

    case 'grep': {
      if (!args.length)
        return { lines: [{ text: 'usage: grep <关键词> …（搜标题 / tags / 正文）', cls: 'err' }] };
      if (!ctx.search)
        return {
          lines: [
            { text: 'grep: 索引未就绪 —— /search-index.json 还没到手（静态站也会堵车）', cls: 'err' },
          ],
        };
      const terms = args.map((a) => a.toLowerCase());
      const hits = ctx.search.filter((e) => {
        const hay = `${e.title} ${e.tags.join(' ')} ${e.text}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
      if (!hits.length)
        return { lines: [{ text: `grep: 无匹配（${args.join(' ')}）`, cls: 'err' }] };
      const lines: Line[] = [
        { text: `grep "${args.join(' ')}": ${hits.length} hit${hits.length > 1 ? 's' : ''}`, cls: 'dim' },
      ];
      for (const h of hits) {
        const n = all.findIndex((e) => e.slug === h.slug) + 1;
        // 匹配行优先级：命中标题 → 标题；命中正文 → 那一行；只有 tag 命中 → 正文摘要
        const titleHit = terms.some((t) => h.title.toLowerCase().includes(t));
        const textHit = h.text
          .split('\n')
          .find((l) => terms.some((t) => l.toLowerCase().includes(t)));
        const line = titleHit ? h.title : (textHit ?? (h.text.slice(0, 60) || h.title));
        lines.push({
          text: `[${n}] ${h.collection}/${h.slug}.md: ${line.slice(0, 60)}${line.length > 60 ? '…' : ''}`,
          cls: 'cyan',
        });
      }
      lines.push({ text: 'cat <n> 可打开全文', cls: 'dim' });
      return { lines };
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

    case 'history':
      return {
        lines: state.history.map((h, i) => ({ text: `${String(i + 1).padStart(4)}  ${h}`, cls: '' })),
      };

    case 'uptime': {
      const days = Math.max(1, Math.floor((Date.now() - LAIN_EPOCH) / 864e5));
      const now = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      return {
        lines: [
          {
            text: ` ${now} up ${days} days, 1 user (you), load average: 与 wired 连接的第 ${days} 天`,
            cls: 'green',
          },
        ],
      };
    }

    case 'ps':
      return {
        lines: [
          { text: '  PID TTY           TIME CMD', cls: 'dim' },
          { text: '    1 ?         00:00:01 lain.service', cls: '' },
          { text: '    7 ?         00:00:00 wired.socket', cls: '' },
          { text: '   42 ?         24:97:33 crt-daemon --scanlines', cls: '' },
          { text: '  313 ?         00:13:37 art-pipeline --fetch-anilist', cls: '' },
          { text: '  774 pts/0     00:00:00 garden-grow', cls: '' },
        ],
      };

    case 'netstat':
    case 'ss':
      return {
        lines: [
          { text: 'Proto Recv-Q Send-Q Local Address       Foreign Address      State', cls: 'dim' },
          { text: 'tcp        0      0 v01d.cyber:http    the-wired:present    ESTABLISHED', cls: '' },
          { text: 'tcp        0      0 v01d.cyber:443     you:eyes-only        ESTABLISHED', cls: '' },
          { text: 'tcp        0      0 localhost:7        lain.local:nps       CLOSE_WAIT', cls: 'cyan' },
        ],
      };

    case 'nmap':
      return {
        lines: [
          { text: `Starting Nmap 7.99 ( https://nmap.org ) at ${new Date().toISOString().slice(0, 10)}`, cls: 'dim' },
          { text: 'Nmap scan report for 2js56.github.io (185.199.108.153)', cls: '' },
          { text: 'Host is up (0.03s latency).', cls: '' },
          { text: 'Scanned 65535 ports in 2.4 seconds', cls: '' },
          { text: 'All 65535 ports filtered —— 静态站，连个端口都不给你', cls: 'err' },
          { text: 'Nmap done: 1 IP address (1 host up) scanned in 2.4 seconds', cls: 'dim' },
        ],
      };

    case 'sqlmap':
      return {
        lines: [
          { text: 'sqlmap: 连接目标 https://2js56.github.io/v01d-cyber/ …', cls: 'dim' },
          { text: 'sqlmap: heuristic test —— 目标不是数据库，是纯静态 HTML', cls: '' },
          { text: 'sqlmap: dbms=none, banner=CDN/nginx', cls: 'cyan' },
          { text: '[WARNING] 建议参数：--dbms=none --technique=放弃', cls: 'err' },
        ],
      };

    case 'ssh':
      return {
        lines: [
          { text: 'ssh: connect to host v01d.cyber port 22: Connection refused', cls: 'err' },
          { text: '本站 0 后端，无处可连 —— 你要 SSH 的东西不存在。', cls: 'dim' },
        ],
      };

    case 'hydra':
      return {
        lines: [
          { text: '[DATA] max 16 tasks per 1 server, overall 16 tasks, 1 login try (l:1 p:1)', cls: 'dim' },
          { text: '[ATTEMPT] target v01d.cyber - login "admin" - pass "********"', cls: '' },
          { text: '[STATUS] attack finished after 1.0s —— 0 of 1 targets completed', cls: 'err' },
          { text: '密码确实只有一个，但它不在任何数据库里。字典白背了。', cls: 'dim' },
        ],
      };

    default:
      return {
        lines: [{ text: `command not found: ${cmd} (try 'help')`, cls: 'err' }],
      };
  }
}
