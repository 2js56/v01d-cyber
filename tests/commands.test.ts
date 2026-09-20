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

  it('help 列出命令', () => {
    expect(execCommand('help', makeState(), entries).lines[0]?.text).toContain('ls');
  });

  it('rm 触发假删除', () => {
    expect(execCommand('rm -rf /', makeState(), entries).effect).toBe('rmrf');
  });

  it('exit 触发关窗动画', () => {
    expect(execCommand('exit', makeState(), entries).effect).toBe('exit');
  });
});

describe('注入彩蛋', () => {
  it(`' OR '1'='1 触发登录绕过整活`, () => {
    const text = execCommand("' OR '1'='1", makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/SELECT/);
    expect(text).toMatch(/admin/);
    expect(text).toMatch(/静态/);
  });

  it(`admin'-- 同样命中 SQL 彩蛋`, () => {
    const text = execCommand("admin'--", makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/SELECT/);
  });

  it('DROP TABLE 彩蛋', () => {
    const text = execCommand("'; DROP TABLE members; --", makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/DROP TABLE/);
    expect(text).toMatch(/0 rows affected/);
  });

  it('sleep() 时间盲注彩蛋', () => {
    const text = execCommand("1 AND sleep(5)--", makeState(), entries).lines.map((l) => l.text).join('\n');
    expect(text).toMatch(/立即返回/);
  });

  it('UNION SELECT 返回全站唯一真实的表（视觉库）', () => {
    const text = execCommand("' UNION SELECT slug FROM garden --", makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/UNION/);
    expect(text).toMatch(/lain/i);
    expect(text).toMatch(/唯一真实存在的表/);
  });

  it('<script> 触发 XSS 彩蛋', () => {
    const text = execCommand('<script>alert(1)</script>', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/\[xss\]/);
    expect(text).toMatch(/textContent/);
  });

  it('document.cookie 彩蛋', () => {
    const text = execCommand('<img src=x onerror=alert(document.cookie)>', makeState(), entries).lines
      .map((l) => l.text)
      .join('\n');
    expect(text).toMatch(/localStorage/);
  });

  it('普通未知命令不受彩蛋影响', () => {
    expect(execCommand('zzz', makeState(), entries).lines[0]?.text).toMatch(
      /command not found: zzz/
    );
  });
});
