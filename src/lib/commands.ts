export interface Entry {
  slug: string;
  title: string;
  /** ISO 日期串（YYYY-MM-DD…）：ctx 经 data-ctx JSON 序列化传给客户端，不能放 Date */
  date: string;
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
  /** 当前目录：'' = ~（home），或 'posts' | 'notes' | 'lab' */
  cwd: string;
}

export const makeState = (): State => ({ history: [], cwd: '' });

/** 路径规范化：容忍 ~ / 绝对路径 / 相对路径 / .. / . / 尾斜杠 */
function resolvePath(cwd: string, input: string): string {
  const fromRoot = input.startsWith('~') || input.startsWith('/');
  const stripped = input.replace(/^~/, '').replace(/^\/+/, '');
  const base = fromRoot ? [] : cwd ? cwd.split('/') : [];
  const out: string[] = [...base];
  for (const seg of stripped.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') out.pop();
    else out.push(seg);
  }
  return out.join('/');
}

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

    case 'ls': {
      // Unix 语义：无参数只列子目录名；ls <dir> 进目录；-R 递归全列。
      // 文件带全局编号 [01]…，与页面显示和 cat <n> 一致（cat 1 / cat 01 均可）。
      const flags = args.filter((a) => a.startsWith('-'));
      const dirs = args.filter((a) => !a.startsWith('-'));
      const recursive = flags.some((f) => /[Ra]/.test(f));
      const offset = (name: string) =>
        name === 'posts'
          ? 0
          : name === 'notes'
            ? ctx.posts.length
            : ctx.posts.length + ctx.notes.length;
      const files = (name: string, list: Entry[]): Line[] =>
        list.map(
          (e, i) =>
            ({
              text: `  [${String(offset(name) + i + 1).padStart(2, '0')}]  ${e.slug}.md  ${e.date.slice(0, 10)}`,
              cls: '',
            }) as Line
        );
      if (!dirs.length) {
        if (recursive)
          return {
            lines: groups.flatMap(([name, list]) => [
              { text: `${name}:`, cls: 'cyan' as const },
              ...files(name, list),
            ]),
          };
        // home 列目录；在子目录里列该目录文件
        if (state.cwd === '')
          return { lines: [{ text: 'lab/  notes/  posts/', cls: 'cyan' as const }] };
        const g = groups.find(([name]) => name === state.cwd)!;
        return { lines: files(g[0], g[1]) };
      }
      const lines: Line[] = [];
      for (const d of dirs) {
        const key = resolvePath(state.cwd, d);
        const g = groups.find(([name]) => name === key);
        if (!g) {
          lines.push({ text: `ls: ${d}: No such file or directory`, cls: 'err' });
          continue;
        }
        if (dirs.length > 1 || recursive) lines.push({ text: `${g[0]}:`, cls: 'cyan' });
        lines.push(...files(g[0], g[1]));
      }
      return { lines };
    }

    case 'cat': {
      const arg = args[0];
      if (!arg)
        return { lines: [{ text: 'usage: cat <n> | cat <dir>/<file>.md', cls: 'err' }] };
      // 纯数字：按全局编号（页面 [01]… 显示一致，1 与 01 均可）
      if (/^\d+$/.test(arg)) {
        const e = all[Number(arg) - 1];
        if (!e)
          return { lines: [{ text: `cat: ${arg}: No such file or directory`, cls: 'err' }] };
        return {
          lines: [{ text: `opening ${e.slug}.md …`, cls: 'dim' }],
          navigate: { href: `/posts/${e.slug}` },
        };
      }
      // 文件名：相对 cwd 解析（可省略 .md）
      const path = resolvePath(state.cwd, arg).replace(/\.md$/, '');
      const m = path.match(/^(posts|notes|lab)\/(.+)$/);
      if (m) {
        const list = m[1] === 'posts' ? ctx.posts : m[1] === 'notes' ? ctx.notes : ctx.lab;
        const e = list.find((x) => x.slug === m[2]);
        if (e)
          return {
            lines: [{ text: `opening ${e.slug}.md …`, cls: 'dim' }],
            navigate: { href: `/posts/${e.slug}` },
          };
        return { lines: [{ text: `cat: ${arg}: No such file or directory`, cls: 'err' }] };
      }
      // 无目录前缀：home 下没有裸文件，全组找命中给出路径建议
      let hint: { dir: string; slug: string } | null = null;
      for (const [dir, list] of groups) {
        const f = list.find((x) => x.slug === path);
        if (f) {
          hint = { dir, slug: f.slug };
          break;
        }
      }
      return {
        lines: [
          { text: `cat: ${arg}: No such file or directory`, cls: 'err' },
          ...(hint
            ? [{ text: `（它在 ${hint.dir}/ 下：cat ${hint.dir}/${hint.slug}.md）`, cls: 'dim' }]
            : []),
        ],
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
      const path = resolvePath(state.cwd, target);
      const valid = path === '' || groups.some(([name]) => name === path);
      if (!valid)
        return { lines: [{ text: `cd: ${target}: No such file or directory`, cls: 'err' }] };
      state.cwd = path;
      return { lines: [], navigate: { href: path ? `/#${path}` : '/' } };
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
