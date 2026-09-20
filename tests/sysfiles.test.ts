import { describe, it, expect } from 'vitest';
import { SYSFILES, SYSDIRS } from '../src/lib/sysfiles';
import { execCommand, makeState } from '../src/lib/commands';
import type { Ctx } from '../src/lib/commands';

const ctx: Ctx = { posts: [], notes: [], lab: [] };
const run = (raw: string) => execCommand(raw, makeState(), ctx);

describe('sysfiles 数据', () => {
  it('每个文件非空、键无前导斜杠', () => {
    expect(Object.keys(SYSFILES).length).toBeGreaterThanOrEqual(6);
    for (const [k, v] of Object.entries(SYSFILES)) {
      expect(k.startsWith('/')).toBe(false);
      expect(v.length).toBeGreaterThan(0);
      expect(v.every((l) => typeof l === 'string')).toBe(true);
    }
  });

  it('/etc/passwd：unix 字段格式 + lain/v01d/ghost 都在', () => {
    const pw = SYSFILES['etc/passwd']!;
    for (const l of pw) expect(l).toMatch(/^[\w-]+:x:\d+:\d+:/);
    expect(pw.join('\n')).toMatch(/lain/);
    expect(pw.join('\n')).toMatch(/v01d/);
    expect(pw.join('\n')).toMatch(/ghost/);
  });

  it('site.log：1998 与 2026 混在同一块盘上（真实 commit 时间线）', () => {
    const log = SYSFILES['var/log/site.log']!.join('\n');
    expect(log).toMatch(/Jul +6/); // lain 系统时间
    expect(log).toMatch(/Sep 20/); // 站点真实构建日
    expect(log).toMatch(/astro|site boot/);
  });

  it('.ghost/.bash_history：站主演化史（lain 三连 + 自写注释）', () => {
    const h = SYSFILES['.ghost/.bash_history']!;
    expect(h.filter((l) => l === 'lain').length).toBeGreaterThanOrEqual(3);
    expect(h.some((l) => l.startsWith('#'))).toBe(true);
  });

  it('SYSDIRS 覆盖全部文件目录', () => {
    for (const k of Object.keys(SYSFILES)) {
      const dir = k.split('/').slice(0, -1).join('/');
      expect(SYSDIRS).toContain(dir);
    }
  });
});

describe('cat 系统文件', () => {
  it('cat /etc/passwd（绝对路径）输出全文', () => {
    const r = run('cat /etc/passwd');
    expect(r.lines.map((l) => l.text)).toEqual(SYSFILES['etc/passwd']);
    expect(r.navigate).toBeUndefined();
  });

  it('cat ~/.ghost/.bash_history（home 相对）', () => {
    const r = run('cat ~/.ghost/.bash_history');
    expect(r.lines.map((l) => l.text)).toEqual(SYSFILES['.ghost/.bash_history']);
  });

  it('cd var/log 后 cat site.log（相对路径）', () => {
    const s = makeState();
    execCommand('cd var/log', s, ctx);
    const r = execCommand('cat site.log', s, ctx);
    expect(r.lines.map((l) => l.text)).toEqual(SYSFILES['var/log/site.log']);
  });

  it('cat /etc/shadow：权限拒绝', () => {
    const r = run('cat /etc/shadow');
    expect(r.lines[0]?.cls).toBe('err');
    expect(r.lines[0]?.text).toMatch(/permission denied|No such/i);
  });

  it('管道：cat /etc/passwd | grep lain', () => {
    const r = run('cat /etc/passwd | grep lain');
    expect(r.lines.length).toBe(1);
    expect(r.lines[0]?.text).toMatch(/^lain:x:/);
    expect(r.lines[0]?.cls).toBe('cyan');
  });
});

describe('ls 与隐藏目录', () => {
  it('home 默认不显示 .ghost，-a 才显示', () => {
    expect(run('ls').lines[0]?.text).not.toContain('.ghost');
    const a = run('ls -a').lines[0]?.text ?? '';
    expect(a).toContain('.ghost/');
    expect(a).toContain('posts/');
  });

  it('ls .ghost 空（dotfile 全隐藏），-a 全出来', () => {
    expect(run('ls .ghost').lines).toEqual([]);
    const r = run('ls -a .ghost');
    const t = r.lines.map((l) => l.text).join(' ');
    expect(t).toContain('.bash_history');
    expect(t).toContain('.profile');
  });

  it('ls /etc：passwd 与 motd', () => {
    const t = run('ls /etc').lines.map((l) => l.text).join(' ');
    expect(t).toContain('passwd');
    expect(t).toContain('motd');
  });

  it('ls var → log/，ls var/log → 三个日志', () => {
    expect(run('ls var').lines[0]?.text).toContain('log/');
    const t = run('ls var/log').lines.map((l) => l.text).join(' ');
    expect(t).toContain('site.log');
    expect(t).toContain('access.log');
    expect(t).toContain('dmesg');
  });

  it('cd 进系统目录（含绝对路径），cd .. 回家', () => {
    const s = makeState();
    expect(execCommand('cd etc', s, ctx).lines).toEqual([]);
    expect(execCommand('cd /var/log', s, ctx).lines).toEqual([]);
    expect(execCommand('cd ..', s, ctx).lines).toEqual([]);
    expect(s.cwd).toBe('var');
    expect(execCommand('cd', s, ctx).lines).toEqual([]);
    expect(s.cwd).toBe('');
  });

  it('cd /the/wired 不存在', () => {
    const r = run('cd /the/wired');
    expect(r.lines[0]?.cls).toBe('err');
  });

  it('ls -R 连系统目录一起递归', () => {
    const t = run('ls -R').lines.map((l) => l.text).join('\n');
    expect(t).toContain('etc:');
    expect(t).toContain('var/log:');
    expect(t).not.toContain('.ghost:'); // 不带 -a 不该看见
    const t2 = run('ls -a -R').lines.map((l) => l.text).join('\n');
    expect(t2).toContain('.ghost:');
  });
});

describe('dmesg', () => {
  it('dmesg 输出启动日志（与 var/log/dmesg 同源）', () => {
    const r = run('dmesg');
    expect(r.lines.map((l) => l.text)).toEqual(SYSFILES['var/log/dmesg']);
    expect(r.lines[0]?.text).toMatch(/^\[/);
  });
});
