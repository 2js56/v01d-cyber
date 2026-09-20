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
          { text: 'v01d — 数码花园管理员 / pwn 研究者 / 赛璐璐考古学家', cls: 'green' },
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

    default:
      return {
        lines: [{ text: `command not found: ${cmd} (try 'help')`, cls: 'err' }],
      };
  }
}
