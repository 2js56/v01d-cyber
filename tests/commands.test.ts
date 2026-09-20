import { describe, it, expect } from 'vitest';
import { execCommand, makeState, type Ctx } from '../src/lib/commands';
import { residueFor } from '../src/lib/residue';

// date 是 ISO 字符串：ctx 经 data-ctx JSON 传到客户端，Date 会变 string
// （Entry.date 曾声明为 Date 导致 ls 在浏览器抛 TypeError —— 空回显）
const entries: Ctx = {
  posts: [
    { slug: 'a', title: 'Alpha', date: '2026-01-02' },
    { slug: 'b', title: 'Beta', date: '2026-01-01' },
  ],
  notes: [{ slug: 'n1', title: 'Note', date: '2026-02-01' }],
  lab: [{ slug: 'l1', title: 'Lab', date: '2026-03-01' }],
};

const searchCtx: Ctx = {
  ...entries,
  search: [
    {
      slug: 'a',
      collection: 'posts',
      title: 'Alpha',
      tags: ['免杀'],
      text: '从明文 shellcode 到内存里的伪装，猫鼠游戏十年',
    },
    { slug: 'n1', collection: 'notes', title: 'Note', tags: [], text: 'nothing here' },
  ],
};

describe('execCommand', () => {
  it('ls 无参数只列出子目录名（Unix 语义，不递归）', () => {
    const text = execCommand('ls', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toContain('posts/');
    expect(text).toContain('notes/');
    expect(text).toContain('lab/');
    expect(text).not.toContain('a.md');
  });

  it('ls posts 进目录列文件，带全局编号', () => {
    const text = execCommand('ls posts', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toContain('[01]');
    expect(text).toContain('a.md');
    expect(text).toContain('2026-01-02');
    expect(text).not.toContain('n1.md');
  });

  it('ls 尾斜杠与 ~/ 前缀均可容忍', () => {
    expect(execCommand('ls posts/', makeState(), entries).lines.map((l) => l.text).join('\n')).toContain('a.md');
    expect(execCommand('ls ~/notes', makeState(), entries).lines.map((l) => l.text).join('\n')).toContain('n1.md');
  });

  it('ls -R 递归列出全部', () => {
    const text = execCommand('ls -R', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toContain('a.md');
    expect(text).toContain('n1.md');
    expect(text).toContain('l1.md');
  });

  it('ls 未知目录报 No such file or directory', () => {
    const text = execCommand('ls zzz', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/No such file or directory/);
  });

  it('cd posts 后 ls 直接列该目录文件', () => {
    const s = makeState();
    execCommand('cd posts', s, entries);
    const text = execCommand('ls', s, entries).lines.map((l) => l.text).join('\n');
    expect(text).toContain('a.md');
    expect(text).not.toContain('posts/');
  });

  it('cat 2 按列表序号打开第二篇', () => {
    const out = execCommand('cat 2', makeState(), entries);
    expect(out.navigate?.href).toBe('/posts/b');
  });

  it('cat 02 补零编号同样可用（与页面 [02] 显示一致）', () => {
    const out = execCommand('cat 02', makeState(), entries);
    expect(out.navigate?.href).toBe('/posts/b');
  });

  it('cat 越界报错', () => {
    const out = execCommand('cat 99', makeState(), entries);
    expect(out.lines[0]?.text).toMatch(/No such file or directory/);
  });

  it('cat 按文件名打开（带目录路径）', () => {
    expect(execCommand('cat posts/a.md', makeState(), entries).navigate?.href).toBe('/posts/a');
  });

  it('cat 文件名可省略 .md 扩展名', () => {
    expect(execCommand('cat posts/b', makeState(), entries).navigate?.href).toBe('/posts/b');
  });

  it('cd posts 后 cat 相对当前目录解析', () => {
    const s = makeState();
    execCommand('cd posts', s, entries);
    expect(execCommand('cat a.md', s, entries).navigate?.href).toBe('/posts/a');
  });

  it('cat home 下裸文件名报错并提示正确路径', () => {
    const out = execCommand('cat a.md', makeState(), entries);
    const text = out.lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/No such file or directory/);
    expect(text).toMatch(/cat posts\/a\.md/);
  });

  it('cat 不存在的文件报错', () => {
    expect(execCommand('cat posts/zzz.md', makeState(), entries).lines[0]?.text).toMatch(
      /No such file or directory/
    );
  });

  it('cd lab 跳转到分组锚点', () => {
    expect(execCommand('cd lab', makeState(), entries).navigate?.href).toBe('/#lab');
  });

  it('cd posts 记住工作目录', () => {
    const s = makeState();
    execCommand('cd posts', s, entries);
    expect(s.cwd).toBe('posts');
  });

  it('cd .. 从子目录回家', () => {
    const s = makeState();
    execCommand('cd posts', s, entries);
    execCommand('cd ..', s, entries);
    expect(s.cwd).toBe('');
  });

  it('cd ../notes 支持相对路径', () => {
    const s = makeState();
    execCommand('cd posts', s, entries);
    execCommand('cd ../notes', s, entries);
    expect(s.cwd).toBe('notes');
  });

  it('cd 未知目录报错且不改变 cwd', () => {
    const s = makeState();
    execCommand('cd posts', s, entries);
    const out = execCommand('cd zzz', s, entries);
    expect(out.lines[0]?.text).toMatch(/No such file or directory/);
    expect(s.cwd).toBe('posts');
  });

  it('cd ~ 回首页', () => {
    expect(execCommand('cd ~', makeState(), entries).navigate?.href).toBe('/');
  });

  it('未知命令报 command not found', () => {
    expect(execCommand('zzz', makeState(), entries).lines[0]?.text).toMatch(
      /command not found: zzz/
    );
  });

  it('sudo 彩蛋', () => {
    const text = execCommand('sudo rm -rf /', makeState(), entries).lines
      .map((l) => l.text)
      .join();
    expect(text).toMatch(/root/);
  });

  it('lain 彩蛋返回 wired 效果', () => {
    expect(execCommand('lain', makeState(), entries).effect).toBe('wired');
  });

  it('clear 返回 clear 效果', () => {
    expect(execCommand('clear', makeState(), entries).effect).toBe('clear');
  });

  it('theme 切换 crt', () => {
    expect(execCommand('theme', makeState(), entries).effect).toBe('crt-toggle');
  });

  it('whoami 介绍访客自己（站主身份移到了 who）', () => {
    expect(execCommand('whoami', makeState(), entries).lines[0]?.text).toMatch(/guest/);
  });

  it('help 列出命令（含 grep 和假工具/假系统命令）', () => {
    const text = execCommand('help', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toContain('ls');
    expect(text).toContain('grep');
    expect(text).toContain('mpg123');
    expect(text).toContain('nmap');
    expect(text).toContain('sqlmap');
    expect(text).toContain('ps');
    expect(text).toContain('netstat');
    expect(text).toContain('uptime');
    expect(text).toContain('history');
  });

  it('rm 触发假删除', () => {
    expect(execCommand('rm -rf /', makeState(), entries).effect).toBe('rmrf');
  });

  it('exit 触发关窗动画', () => {
    expect(execCommand('exit', makeState(), entries).effect).toBe('exit');
  });

  it('mpg123 切换 BGM 并显示曲目', () => {
    const out = execCommand('mpg123', makeState(), entries);
    expect(out.effect).toBe('bgm-toggle');
    expect(out.lines.map((l) => l.text).join('\n')).toMatch(/Duvet/);
  });
});

describe('grep 全站搜索', () => {
  it('grep 无参数提示用法', () => {
    const text = execCommand('grep', makeState(), searchCtx).lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/usage: grep/);
  });

  it('grep 命中 tags/正文并给出 cat 序号', () => {
    const text = execCommand('grep 免杀', makeState(), searchCtx).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/1 hit/);
    expect(text).toMatch(/posts\/a\.md/);
    expect(text).toMatch(/内存里的伪装/);
    expect(text).toMatch(/cat <n>/);
  });

  it('grep 多关键词按 AND 过滤', () => {
    const both = execCommand('grep shellcode 伪装', makeState(), searchCtx).lines
      .map((l) => l.text)
      .join('\n');
    expect(both).toMatch(/posts\/a\.md/);
    const one = execCommand('grep shellcode 不存在的词', makeState(), searchCtx).lines
      .map((l) => l.text)
      .join('\n');
    expect(one).toMatch(/无匹配/);
  });

  it('grep 无命中报错', () => {
    const text = execCommand('grep 不存在的关键词', makeState(), searchCtx).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/无匹配/);
  });

  it('grep 索引未加载时提示', () => {
    const text = execCommand('grep anything', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/索引/);
  });
});

describe('假安全工具', () => {
  it('nmap 假扫描全端口 filtered', () => {
    const text = execCommand('nmap -sV 2js56.github.io', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/filtered/);
    expect(text).toMatch(/65535/);
  });

  it('sqlmap 发现目标不是数据库', () => {
    const text = execCommand('sqlmap -u https://v01d.cyber/', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/dbms=none/);
  });

  it('ssh 连接被拒', () => {
    const text = execCommand('ssh root@v01d.cyber', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/Connection refused/);
    expect(text).toMatch(/后端/);
  });

  it('hydra 假破解一无所获', () => {
    const text = execCommand('hydra -l admin -P rockyou.txt v01d.cyber ssh', makeState(), entries)
      .lines.map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/0 of 1/);
  });
});

describe('假系统命令', () => {
  it('ps 列出假进程', () => {
    const text = execCommand('ps aux', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/lain\.service/);
    expect(text).toMatch(/wired/);
  });

  it('netstat（含 ss 别名）列出假连接', () => {
    for (const cmd of ['netstat -antp', 'ss -t']) {
      const text = execCommand(cmd, makeState(), entries).lines.map((l) => l.text).join('\n');
      expect(text).toMatch(/ESTABLISHED/);
      expect(text).toMatch(/wired/i);
    }
  });

  it('uptime 从 lain 开播日起算天数', () => {
    const text = execCommand('uptime', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/up \d+ days/);
    expect(text).toMatch(/wired/);
  });

  it('history 输出刚执行过的命令', () => {
    const state = makeState();
    execCommand('whoami', state, entries);
    const text = execCommand('history', state, entries).lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/whoami/);
    expect(text).toMatch(/history/);
  });
});

describe('管道', () => {
  it('ls | grep 过滤目录行', () => {
    const text = execCommand('ls | grep posts', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toContain('posts/');
  });

  it('ls -R | grep notes 行级过滤（标题行命中，文件行不含）', () => {
    const lines = execCommand('ls -R | grep notes', makeState(), entries).lines.map((l) => l.text);
    expect(lines).toContain('notes:');
    expect(lines.some((l) => l.includes('n1.md'))).toBe(false);
  });

  it('ps aux | grep lain 过滤进程行', () => {
    const text = execCommand('ps aux | grep lain.service', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toContain('lain.service');
    expect(text).not.toContain('crt-daemon');
  });

  it('help | grep 也能过滤', () => {
    const lines = execCommand('help | grep 管道', makeState(), entries).lines.map((l) => l.text);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('管道');
  });

  it('cat | grep 在文章正文里过滤', () => {
    const text = execCommand('cat posts/a | grep shellcode', makeState(), searchCtx).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toContain('shellcode');
  });

  it('管道中间段报错透传', () => {
    const text = execCommand('zzz | grep x', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/command not found: zzz/);
  });

  it('管道无匹配报错', () => {
    const text = execCommand('ls | grep 不存在的词', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/无匹配/);
  });

  it('整条管道命令记入 history 一次', () => {
    const s = makeState();
    execCommand('ls | grep posts', s, entries);
    expect(s.history.filter((h) => h === 'ls | grep posts')).toHaveLength(1);
  });
});

describe('man 手册', () => {
  it('man ls 输出手册页', () => {
    const text = execCommand('man ls', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/NAME/);
    expect(text).toMatch(/SYNOPSIS/);
    expect(text).toMatch(/ls/);
  });

  it('man man 递归彩蛋', () => {
    const text = execCommand('man man', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/man/);
  });

  it('man 无参数报真实文案', () => {
    expect(execCommand('man', makeState(), entries).lines[0]?.text).toMatch(
      /What manual page/
    );
  });

  it('man 未知命令报 No manual entry', () => {
    expect(execCommand('man zzz', makeState(), entries).lines[0]?.text).toMatch(
      /No manual entry for zzz/
    );
  });

  it('man ls | grep SEE ALSO 手册也能进管道', () => {
    const text = execCommand('man ls | grep SEE', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toContain('SEE ALSO');
  });
});

describe('注入彩蛋已移除', () => {
  it(`' OR '1'='1 回归 command not found`, () => {
    expect(execCommand("' OR '1'='1", makeState(), entries).lines[0]?.text).toMatch(
      /command not found/
    );
  });

  it('<script> 不再触发 XSS 彩蛋', () => {
    expect(execCommand('<script>alert(1)</script>', makeState(), entries).lines[0]?.text).toMatch(
      /command not found/
    );
  });
});

describe('连接态命令', () => {
  it('connect 建立 WIRED 连接（net-on）', () => {
    const r = execCommand('connect', makeState(), entries);
    expect(r.effect).toBe('net-on');
    expect(r.lines.map((l) => l.text).join('\n')).toMatch(/WIRED|连接/);
  });

  it('disconnect 断开（net-off）', () => {
    const r = execCommand('disconnect', makeState(), entries);
    expect(r.effect).toBe('net-off');
  });

  it('lain 命令仍可用（toggle 语义，wired effect）', () => {
    const r = execCommand('lain', makeState(), entries);
    expect(r.effect).toBe('wired');
  });
});

describe('whoami 身份演化（按访问代数）', () => {
  it('默认（代数 0）是 guest', () => {
    expect(execCommand('whoami', makeState(), entries).lines[0]?.text).toContain('guest');
  });

  it('代数 10 进入身份消解', () => {
    const s = makeState();
    s.whoamiN = 10;
    const t = execCommand('whoami', s, entries).lines[0]?.text ?? '';
    expect(t).toContain('v01d');
    expect(t).not.toContain('guest');
  });
});

describe('who 本地指纹', () => {
  it('ctx.finger 存在时逐行输出', () => {
    const r = execCommand('who', makeState(), { ...entries, finger: ['agent: X', 'lang: zh'] });
    const text = r.lines.map((l) => l.text).join('\n');
    expect(text).toContain('agent: X');
    expect(text).toContain('lang: zh');
  });

  it('无 finger 时优雅降级', () => {
    const text = execCommand('who', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text.length).toBeGreaterThan(0);
  });
});

describe('grep 信号残留', () => {
  // 从词表里现找一对触发/不触发的词（residueFor 是确定性哈希，样本足够）
  const words = Array.from({ length: 60 }, (_, i) => `zz${i}q`);
  const hit = words.find((w) => residueFor(w))!;
  const miss = words.find((w) => !residueFor(w))!;

  it('触发词在无匹配后渗出 signal residue', () => {
    const text = execCommand(`grep ${hit}`, makeState(), searchCtx)
      .lines.map((l) => l.text)
      .join('\n');
    expect(text).toContain('signal residue');
  });

  it('不触发的词保持正常报错', () => {
    const text = execCommand(`grep ${miss}`, makeState(), searchCtx)
      .lines.map((l) => l.text)
      .join('\n');
    expect(text).toContain('无匹配');
    expect(text).not.toContain('signal residue');
  });
});


describe('幽灵访客与 traceroute', () => {
  it('who 在幽灵来过时多一行"刚才那位"', () => {
    const plain = execCommand('who', makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(plain).not.toContain('???');
    const haunted = execCommand('who', makeState(), { ...entries, ghostHint: true }).lines.map((l) => l.text).join('\n');
    expect(haunted).toContain('???');
    expect(haunted).toContain('刚才那位');
  });

  it('traceroute lain：7 跳 + 最后一跳超时 + 结语', () => {
    const lines = execCommand('traceroute lain', makeState(), entries).lines.map((l) => l.text);
    expect(lines[0]).toContain('traceroute to lain');
    expect(lines.filter((t) => /^\s*7\s/.test(t)).join()).toContain('* * *');
    expect(lines.at(-1)).toContain('lain 是网络本身');
  });

  it('traceroute 别的目标：无法解析', () => {
    const r = execCommand('traceroute google.com', makeState(), entries);
    expect(r.lines[0]?.cls).toBe('err');
  });
});
