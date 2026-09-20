import { describe, it, expect } from 'vitest';
import { execCommand, makeState, type Ctx } from '../src/lib/commands';

const entries: Ctx = {
  posts: [
    { slug: 'a', title: 'Alpha', date: new Date('2026-01-02') },
    { slug: 'b', title: 'Beta', date: new Date('2026-01-01') },
  ],
  notes: [{ slug: 'n1', title: 'Note', date: new Date('2026-02-01') }],
  lab: [{ slug: 'l1', title: 'Lab', date: new Date('2026-03-01') }],
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
  it('ls 列出各分组文件', () => {
    const out = execCommand('ls', makeState(), entries);
    const text = out.lines.map((l) => l.text).join('\n');
    expect(text).toContain('posts/');
    expect(text).toContain('a.md');
    expect(text).toContain('n1.md');
    expect(text).toContain('l1.md');
  });

  it('cat 2 按列表序号打开第二篇', () => {
    const out = execCommand('cat 2', makeState(), entries);
    expect(out.navigate?.href).toBe('/posts/b');
  });

  it('cat 越界报错', () => {
    const out = execCommand('cat 99', makeState(), entries);
    expect(out.lines[0]?.text).toMatch(/No such entry/);
  });

  it('cd lab 跳转到分组锚点', () => {
    expect(execCommand('cd lab', makeState(), entries).navigate?.href).toBe('/#lab');
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

  it('whoami 介绍自己', () => {
    expect(execCommand('whoami', makeState(), entries).lines[0]?.text).toMatch(/v01d/);
  });

  it('help 列出命令（含 grep）', () => {
    const text = execCommand('help', makeState(), entries).lines[0]?.text ?? '';
    expect(text).toContain('ls');
    expect(text).toContain('grep');
  });

  it('rm 触发假删除', () => {
    expect(execCommand('rm -rf /', makeState(), entries).effect).toBe('rmrf');
  });

  it('exit 触发关窗动画', () => {
    expect(execCommand('exit', makeState(), entries).effect).toBe('exit');
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
