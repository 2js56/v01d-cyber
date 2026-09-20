import type { Ctx } from './commands';

const COMMANDS = [
  'help', 'man', 'ls', 'cat', 'cd', 'grep', 'mpg123', 'whoami', 'who', 'theme', 'clear', 'lain',
  'connect', 'disconnect', 'exit', 'keysound', 'poweroff',
  'sudo', 'rm', 'history', 'uptime', 'ps', 'netstat', 'ss', 'nmap', 'sqlmap', 'ssh', 'hydra',
];

export interface Completion {
  /** 所有匹配的候选（多候select 时由客户端列出） */
  matches: string[];
  /** 补全后的完整输入；null = 无增益，只列候选不替换 */
  insert: string | null;
}

const commonPrefix = (arr: string[]) => {
  let p = arr[0] ?? '';
  for (const s of arr) while (!s.startsWith(p)) p = p.slice(0, -1);
  return p;
};

/** 终端 Tab 补全：命令名 / 目录 / 文章路径，相对 cwd 解析裸文件名 */
export function tabComplete(input: string, ctx: Ctx, cwd: string): Completion {
  const token = input.match(/(\S*)$/)?.[1] ?? '';
  const before = input.slice(0, input.length - token.length);

  const done = (matches: string[]): Completion => {
    if (!matches.length) return { matches, insert: null };
    const full = matches.length === 1 ? matches[0] : commonPrefix(matches);
    // 公共前缀没有新增字符时，与 bash 一致：只列候选不替换
    return full === token || !full
      ? { matches, insert: null }
      : { matches, insert: before + full };
  };

  // 命令位置：光标前只有空白 → 补命令名
  if (before.trim() === '') return done(COMMANDS.filter((c) => c.startsWith(token)));

  // 参数位置：目录（home 相对）+ 文件（home 相对路径；cwd 内再加裸文件名）。
  // 系统文件可补全；.ghost 不进候选 —— 隐藏目录要靠 ls -a 自己发现
  const files = (['posts', 'notes', 'lab'] as const).flatMap((dir) => {
    const list = dir === 'posts' ? ctx.posts : dir === 'notes' ? ctx.notes : ctx.lab;
    const names = list.map((e) => `${e.slug}.md`);
    return cwd === dir ? [...names.map((n) => `${dir}/${n}`), ...names] : names.map((n) => `${dir}/${n}`);
  });
  const sys = ['etc/', 'etc/passwd', 'etc/motd', 'var/', 'var/log/', 'var/log/site.log', 'var/log/access.log', 'var/log/dmesg'];
  const candidates = ['lab/', 'notes/', 'posts/', ...files, ...sys];
  const t = token.replace(/^~?\//, '');
  if (!t) return { matches: candidates, insert: null };
  // token 以 / 结尾说明已在往目录里补文件，不再列目录本身
  const matched = t.endsWith('/')
    ? candidates.filter((c) => c.startsWith(t) && c !== t)
    : candidates.filter((c) => c.startsWith(t));
  return done(matched);
}
