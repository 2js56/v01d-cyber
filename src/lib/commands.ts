import { manPage } from './manpages';
import { residueFor } from './residue';
import { whoamiLine } from './visitor';
import { SYSFILES, SYSDIRS } from './sysfiles';

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
  /** who 的本地指纹行（客户端 init 时采样注入；测试/SSR 缺省） */
  finger?: string[];
}

export interface Line {
  text: string;
  cls?: '' | 'cyan' | 'green' | 'err' | 'dim' | 'purple';
}

export type Effect =
  | 'clear'
  | 'wired'
  | 'rmrf'
  | 'exit'
  | 'crt-toggle'
  | 'bgm-toggle'
  | 'net-on'
  | 'net-off'
  | 'keysound-toggle';

export interface Result {
  lines: Line[];
  navigate?: { href: string };
  effect?: Effect;
  /** 管道用：本命令的 stdout 行（默认等于 lines 的文本） */
  stdout?: string[];
}

export interface State {
  history: string[];
  /** 当前目录：'' = ~（home），或 'posts' | 'notes' | 'lab' */
  cwd: string;
  /** 访客会话代数（客户端注入；whoami 按它演化） */
  whoamiN: number;
}

export const makeState = (): State => ({ history: [], cwd: '', whoamiN: 0 });

/** 管道中 cat 输出正文纯文本（来自搜索索引），无索引时退化为标题行 */
function bodyOf(slug: string, ctx: Ctx): string[] {
  const se = ctx.search?.find((s) => s.slug === slug);
  return se && se.text ? se.text.split('\n') : [slug];
}

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

/** grep 无匹配时：某些词会渗出一句不属于任何文章的话（确定性哈希，约 1/3 触发） */
function residueLine(query: string): Line[] {
  const res = residueFor(query);
  return res ? [{ text: `signal residue: ${res}`, cls: 'purple' }] : [];
}

/** 对外入口：处理管道（a | b | c），每段 stdout 喂给下一段 stdin */
export function execCommand(raw: string, state: State, ctx: Ctx): Result {
  const trimmed = raw.trim();
  state.history.push(trimmed);

  const segs = trimmed.split('|').map((s) => s.trim()).filter(Boolean);
  if (segs.length <= 1) return execOne(trimmed, state, ctx);

  let stdin: string[] | undefined;
  let earlyErrs: Line[] = [];
  let result: Result = { lines: [] };
  for (let i = 0; i < segs.length; i++) {
    result = execOne(segs[i], state, ctx, stdin);
    if (i < segs.length - 1) earlyErrs = [...earlyErrs, ...result.lines.filter((l) => l.cls === 'err')];
    stdin = result.stdout;
  }
  // 中间段的 stderr 照常显示（真 shell 行为），最终结果以末段为准
  return { ...result, lines: [...earlyErrs, ...result.lines] };
}

function execOne(raw: string, state: State, ctx: Ctx, stdin?: string[]): Result {
  const [cmd, ...args] = raw.trim().split(/\s+/);
  const r = runCase(cmd, args, state, ctx, stdin);
  r.stdout ??= r.lines.map((l) => l.text);
  return r;
}

function runCase(cmd: string, args: string[], state: State, ctx: Ctx, stdin?: string[]): Result {

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
            text: 'commands: help man ls cat cd grep mpg123 whoami who theme clear lain connect exit',
            cls: 'green',
          },
          { text: '用法: man <cmd> 看手册 · cat <n|文件> · cd <目录> · ↑↓ 历史 · Ctrl+R 搜索', cls: 'dim' },
          { text: '环境: keysound（打字机音效）', cls: 'dim' },
          { text: '管道: ls | grep 免杀 —— 用 | 把命令串起来', cls: 'dim' },
          { text: 'installed: ps netstat ss uptime dmesg history nmap sqlmap ssh hydra', cls: 'cyan' },
          { text: '彩蛋自己找。（提示：上上下下左右左右BA）', cls: 'dim' },
        ],
      };

    case 'man': {
      const t = args[0];
      if (!t) return { lines: [{ text: 'What manual page do you want?', cls: 'err' }] };
      const page = manPage(t);
      if (!page) return { lines: [{ text: `No manual entry for ${t}`, cls: 'err' }] };
      return {
        lines: page.split('\n').map((l) => ({
          text: l,
          // 全大写的节标题（NAME/SYNOPSIS…）绿色，正文 dim
          cls: /^[A-Z][A-Z ]+$/.test(l.trim()) ? ('green' as const) : ('dim' as const),
        })),
      };
    }

    case 'ls': {
      // Unix 语义：无参数只列子目录名；ls <dir> 进目录；-R 递归全列；
      // -a 显示隐藏（.ghost/ 与 dotfile —— 发现本身就是奖励）。
      // 文件带全局编号 [01]…，与页面显示和 cat <n> 一致（cat 1 / cat 01 均可）。
      const flags = args.filter((a) => a.startsWith('-'));
      const dirs = args.filter((a) => !a.startsWith('-'));
      const all = flags.some((f) => /a/.test(f));
      const recursive = flags.some((f) => /[Rr]/.test(f));
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
      // 系统目录内容：SYSFILES 键按前缀归入目录，dotfile 只在 -a 出现
      const sysNames = (dir: string): string[] => {
        const prefix = `${dir}/`;
        const names = new Set<string>();
        for (const k of Object.keys(SYSFILES)) {
          if (!k.startsWith(prefix)) continue;
          const rest = k.slice(prefix.length);
          if (rest.includes('/')) names.add(`${rest.split('/')[0]}/`);
          else if (!rest.startsWith('.') || all) names.add(rest);
        }
        return [...names].sort();
      };
      const sysLines = (dir: string, header: boolean): Line[] => {
        const names = sysNames(dir);
        if (!names.length) return [];
        return [
          ...(header ? [{ text: `${dir}:`, cls: 'cyan' as const }] : []),
          { text: names.join('  '), cls: 'cyan' as const },
        ];
      };
      if (!dirs.length) {
        if (recursive)
          return {
            lines: [
              ...groups.flatMap(([name, list]) => [
                { text: `${name}:`, cls: 'cyan' as const },
                ...files(name, list),
              ]),
              ...sysLines('etc', true),
              ...sysLines('var', true),
              ...sysLines('var/log', true),
              ...(all ? sysLines('.ghost', true) : []),
            ],
          };
        // home 列目录（系统目录也在根上：~ 与 / 同根）；子目录里列该目录内容
        if (state.cwd === '')
          return {
            lines: [
              {
                text: all ? '.ghost/  etc/  lab/  notes/  posts/  var/' : 'lab/  notes/  posts/',
                cls: 'cyan' as const,
              },
            ],
          };
        if (SYSDIRS.includes(state.cwd)) return { lines: sysLines(state.cwd, false) };
        const g = groups.find(([name]) => name === state.cwd)!;
        return { lines: files(g[0], g[1]) };
      }
      const lines: Line[] = [];
      for (const d of dirs) {
        const key = resolvePath(state.cwd, d);
        if (SYSDIRS.includes(key)) {
          lines.push(...sysLines(key, dirs.length > 1 || recursive));
          continue;
        }
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
          stdout: bodyOf(e.slug, ctx),
        };
      }
      // 系统文件（/etc/passwd、~/.ghost/.bash_history 等）：输出全文，管道吃 stdout
      const sp = resolvePath(state.cwd, arg);
      if (SYSFILES[sp])
        return {
          lines: SYSFILES[sp].map((t) => ({ text: t, cls: 'dim' as const })),
          stdout: SYSFILES[sp],
        };
      if (sp === 'etc/shadow')
        return {
          lines: [
            { text: 'cat: /etc/shadow: Permission denied —— 密码不在文件里，在文件的间隙里', cls: 'err' },
          ],
        };
      // 文件名：相对 cwd 解析（可省略 .md）
      const path = sp.replace(/\.md$/, '');
      const m = path.match(/^(posts|notes|lab)\/(.+)$/);
      if (m) {
        const list = m[1] === 'posts' ? ctx.posts : m[1] === 'notes' ? ctx.notes : ctx.lab;
        const e = list.find((x) => x.slug === m[2]);
        if (e)
          return {
            lines: [{ text: `opening ${e.slug}.md …`, cls: 'dim' }],
            navigate: { href: `/posts/${e.slug}` },
            stdout: bodyOf(e.slug, ctx),
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
      const terms = args.map((a) => a.toLowerCase());
      // 管道模式：在上一命令的 stdout 里过滤（真 grep 语义）
      if (stdin) {
        const hits = stdin.filter((l) => terms.every((t) => l.toLowerCase().includes(t)));
        if (!hits.length)
          return {
            lines: [
              { text: `grep: 无匹配（${args.join(' ')}）`, cls: 'err' },
              ...residueLine(args.join(' ')),
            ],
          };
        return { lines: hits.map((h) => ({ text: h, cls: 'cyan' as const })) };
      }
      if (!ctx.search)
        return {
          lines: [
            { text: 'grep: 索引未就绪 —— /search-index.json 还没到手（静态站也会堵车）', cls: 'err' },
          ],
        };
      const hits = ctx.search.filter((e) => {
        const hay = `${e.title} ${e.tags.join(' ')} ${e.text}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
      if (!hits.length)
        return {
          lines: [
            { text: `grep: 无匹配（${args.join(' ')}）`, cls: 'err' },
            ...residueLine(args.join(' ')),
          ],
        };
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
      // 系统目录：切过去就行，没有对应页面锚点，不导航
      if (SYSDIRS.includes(path)) {
        state.cwd = path;
        return { lines: [] };
      }
      const valid = path === '' || groups.some(([name]) => name === path);
      if (!valid)
        return { lines: [{ text: `cd: ${target}: No such file or directory`, cls: 'err' }] };
      state.cwd = path;
      return { lines: [], navigate: { href: path ? `/#${path}` : '/' } };
    }

    case 'whoami': {
      // 身份按访问代数演化：guest → guest? → you are not v01d（站主身份见 who）
      const l = whoamiLine(state.whoamiN);
      return { lines: [{ text: l.text, cls: l.cls as Line['cls'] }] };
    }

    case 'who':
      return {
        lines: [
          { text: 'v01d     tty1    自称站主，web 渗透 / 内网 / 免杀      ~/ghost', cls: 'green' },
          { text: 'guest    pts/0    就是你，此刻                        此刻', cls: '' },
          ...(ctx.finger
            ? ctx.finger.map((t) => ({ text: t, cls: '' as const }))
            : [{ text: 'who: 本地指纹采样不可用（没有 nav 就没有你）', cls: 'dim' as const }]),
        ],
      };

    case 'connect':
      return {
        lines: [
          { text: 'dialing the WIRED …', cls: 'dim' },
          { text: 'connection established. 无论你到哪里，所有人都已连接。', cls: 'purple' },
          { text: 'disconnect 可断开（但你确定要吗）', cls: 'dim' },
        ],
        effect: 'net-on',
      };

    case 'disconnect':
      return {
        lines: [
          { text: 'connection closed by foreign host.', cls: 'dim' },
          { text: '线拔了。有些东西留下来了。', cls: 'purple' },
        ],
        effect: 'net-off',
      };

    case 'keysound':
      return {
        lines: [
          { text: 'keysound: 打字机音效 —— Web Audio 现场合成，零文件零请求', cls: 'cyan' },
          { text: '极轻的机械 click，每次击键都有重量。再输一次开关，偏好会记住。', cls: 'dim' },
        ],
        effect: 'keysound-toggle',
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

    case 'mpg123':
      return {
        lines: [
          { text: '[mpg123] ~/audio/duvet.mp3 —— bôa 「Duvet」', cls: 'cyan' },
          { text: 'low volume · loop · 再输一次停止 · 状态会记住', cls: 'dim' },
        ],
        effect: 'bgm-toggle',
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
        lines: [{ text: 'rm: 正在删除 /dev/ghost …', cls: 'err' }],
        effect: 'rmrf',
      };

    case 'history':
      return {
        lines: state.history.map((h, i) => ({ text: `${String(i + 1).padStart(4)}  ${h}`, cls: '' })),
      };

    case 'dmesg':
      return {
        lines: SYSFILES['var/log/dmesg']!.map((t) => ({ text: t, cls: 'dim' as const })),
        stdout: SYSFILES['var/log/dmesg'],
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
          { text: '  774 pts/0     00:00:00 ghost-in-shell', cls: '' },
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
