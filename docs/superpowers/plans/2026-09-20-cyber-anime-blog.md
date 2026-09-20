# v01d@cyber 博客建站实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建成 v01d@cyber——Astro 静态博客，黑客终端骨架 + 名作官方视觉沉浸 Hero + 命令行导航 + 浓动效。

**Architecture:** Astro 5 SSG；内容集合（posts/notes/lab）zod 校验；`scripts/fetch-art.mjs` 构建前从 AniList 拉官方图到 `public/art/`（manifest + 缓存）；浏览器端仅三个岛屿（CommandLine、BootSequence、HeroBanner/粒子）。命令解析纯逻辑放 `src/lib/commands.ts`，vitest TDD。

**Tech Stack:** Astro 5、vanilla TS、vitest、@fontsource/jetbrains-mono、Playwright（走查，本会话已有 MCP）。

**设计文档:** `docs/superpowers/specs/2026-09-20-cyber-anime-blog-design.md`（配色/动效清单/命令集/frontmatter 字段以其为准）。

---

### Task 1: Astro 脚手架

**Files:**
- Create: 整个 Astro 项目（package.json、astro.config.mjs、src/ 结构）

- [ ] **Step 1: 创建项目**

```bash
cd /Users/v01d/coding/MyaiProject/blog
npm create astro@latest . -- --template minimal --no-install --no-git --yes
npm install
npm install -D vitest @fontsource/jetbrains-mono
```

（目录已有 docs/ 与 .gitignore，astro 创建器会合并；若提示冲突选择保留现有文件。）

- [ ] **Step 2: package.json scripts 增加测试与取图**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "node scripts/fetch-art.mjs && astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "fetch-art": "node scripts/fetch-art.mjs"
  }
}
```

- [ ] **Step 3: 验证**

Run: `npx astro build`（无内容时也应成功）
Expected: 构建成功，dist/ 生成

- [ ] **Step 4: Commit** `chore: astro scaffold + vitest`

### Task 2: 内容集合与示例内容

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/posts/heap-feng-shui.md`、`src/content/posts/wired-protocol.md`、`src/content/posts/session-notes.md`
- Create: `src/content/notes/001.md`、`src/content/notes/002.md`
- Create: `src/content/lab/garden-map.md`

- [ ] **Step 1: 定义集合 schema**

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const entry = z.object({
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  anime: z.string().optional(),
  mood: z.string().optional(),
  draft: z.boolean().default(false),
});

export const collections = {
  posts: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/posts' }), schema: entry }),
  notes: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/notes' }), schema: entry }),
  lab:   defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/lab' }),   schema: entry }),
};
```

- [ ] **Step 2: 写 6 篇示例**（真实内容感，非 lorem）

`heap-feng-shui.md`：frontmatter `title: "heap feng shui：glibc 2.35 tcache 备忘"、date: 2026-09-12、tags: [pwn, heap]、anime: gits_sac、mood: "深夜，耳机里是 Tank!"`，正文含一段解释 + 一个 c 代码块。
`wired-protocol.md`：`anime: lain`，主题网络分层。
`session-notes.md`：`anime: bebop`，爵士即兴 × bebop。
notes 两篇无 anime；lab 一篇介绍博客本身。
正文每篇 ≥ 3 段，代码块用 ```c / ```bash 测试高亮。

- [ ] **Step 3: 验证** `npx astro build`；写错 frontmatter（临时把 date 改成字符串以外的东西）确认 zod 报错，再改回。
- [ ] **Step 4: Commit** `feat: content collections + sample entries`

### Task 3: 官方图管线（AniList → public/art）

**Files:**
- Create: `scripts/fetch-art.mjs`
- Create: `public/art/manifest.json`
- Create: `public/art/*.jpg`（从会话素材目录拷入）

- [ ] **Step 1: 迁移已下载素材**

```bash
mkdir -p public/art
cp .superpowers/brainstorm/50822-1789873861/assets/anilist/*_cover.jpg public/art/
cp .superpowers/brainstorm/50822-1789873861/assets/anilist/*_banner.jpg public/art/
```

- [ ] **Step 2: manifest.json**（slug → 作品信息 + 本地文件名；15 部：lain, gits, gits_sac, bebop, akira, evangelion, patlabor2, perfect_blue, paranoia, psychopass, promare, blame, gunnm, city_hunter, ginga999）

```json
{
  "gits_sac": { "title": " Koukaku Kidoutai: STAND ALONE COMPLEX", "cover": "gits_sac_cover.jpg", "banner": "gits_sac_banner.jpg" },
  "lain": { "title": "serial experiments lain", "cover": "lain_cover.jpg", "banner": "lain_banner.jpg" }
}
```

（其余 13 部同构补全；title 用 AniList romaji。）

- [ ] **Step 3: fetch-art.mjs**（补缺 + 校验，幂等）

```js
// scripts/fetch-art.mjs — 确保 manifest 引用的图都存在，缺则从 AniList 拉取
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:process';

const ART = 'public/art';
mkdirSync(ART, { recursive: true });
const manifest = JSON.parse(readFileSync(`${ART}/manifest.json`, 'utf8'));

const gql = (query) => fetch('https://graphql.anilist.co', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
}).then(r => r.json());

async function fetchOne(slug, kind) { // kind: cover|banner
  const q = `query { Media(search:"${slug}", type:ANIME, sort:SEARCH_MATCH) { coverImage{extraLarge} bannerImage } }`;
  const m = (await gql(q)).data.Media;
  const url = kind === 'cover' ? m.coverImage.extraLarge : m.bannerImage;
  if (!url) return console.warn(`⚠ ${slug}: no ${kind}`);
  const raw = `${ART}/${slug}_${kind}_raw`;
  writeFileSync(raw, Buffer.from(await (await fetch(url)).arrayBuffer()));
  execFileSync('sips', ['-Z', kind === 'cover' ? '400' : '900', '-s', 'format', 'jpeg',
    '-s', 'formatOptions', '62', raw, '--out', `${ART}/${slug}_${kind}.jpg`]);
  execFileSync('rm', [raw]);
  console.log(`✓ ${slug} ${kind}`);
}

const missing = [];
for (const [slug, info] of Object.entries(manifest))
  for (const kind of ['cover', 'banner'])
    if (!existsSync(`${ART}/${info[kind]}`)) missing.push([slug, kind]);

if (!missing.length) { console.log('art cache complete ✓'); process.exit(0); }
console.log(`fetching ${missing.length} images...`);
for (const [slug, kind] of missing) await fetchOne(slug, kind);
console.warn('note: 新拉取请核对 manifest title 是否匹配预期作品');
```

- [ ] **Step 4: 验证** `npm run fetch-art` → 输出 `art cache complete ✓`（因已拷入）
- [ ] **Step 5: Commit** `feat: anilist art pipeline + 15 works cached`

### Task 4: TerminalShell 布局与全局样式

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/TerminalShell.astro`
- Create: `src/components/StatusHUD.astro`（静态部分）

- [ ] **Step 1: global.css**（设计 token + CRT + 打字机动画等公共层）

```css
:root {
  --bg: #04080f; --bg2: #05030c;
  --fg: #cfe8ff; --green: #7dffb0; --cyan: #8ad8ff;
  --purple: #b466ff; --pink: #ff9ad5; --dim: #3a7a5a;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  --serif: 'LXGW WenKai', 'Songti SC', 'Noto Serif CJK SC', serif;
}
* { box-sizing: border-box; margin: 0; }
html { background: var(--bg); color: var(--fg); font-family: var(--mono); }
body { min-height: 100vh; }

/* CRT 扫描线 + 暗角：全局覆盖层，可用 [data-crt=off] 关闭 */
.crt { position: fixed; inset: 0; pointer-events: none; z-index: 9999;
  background:
    radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.35) 100%),
    repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,20,10,.045) 2px 3px); }
[data-crt="off"] .crt { display: none; }

@keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
@keyframes scanline { 0%{top:-30%} 100%{top:130%} }
@keyframes glitch-1 { 0%,100%{clip-path:inset(0 0 82% 0)} 20%{clip-path:inset(28% 0 52% 0)} 40%{clip-path:inset(62% 0 8% 0)} 60%{clip-path:inset(10% 0 74% 0)} 80%{clip-path:inset(44% 0 40% 0)} }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  .crt { display: none; }
}
```

- [ ] **Step 2: TerminalShell.astro**（窗口栏 + 内容 + CRT 层 + 页脚版权标注）

```astro
---
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import '../styles/global.css';
const { title = 'v01d@cyber' } = Astro.props;
---
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <script is:inline>
    try { if (localStorage.getItem('crt') === 'off') document.documentElement.dataset.crt = 'off'; } catch {}
  </script>
</head>
<body>
  <div class="crt"></div>
  <header class="winbar">
    <span class="dots"><i></i><i></i><i></i></span>
    <span class="wintitle">v01d@cyber — zsh</span>
    <a class="homelink" href="/">~/garden</a>
  </header>
  <main><slot /></main>
  <footer>
    <span>v01d@cyber · 用 Astro 手写 · 视觉版权归原作者（lain / GITS / Bebop …）</span>
    <span id="hud-clock" aria-hidden="true">--:--:--</span>
  </footer>
</body>
</html>
```

winbar/footer 样式补进 global.css：winbar 深色条 + 三圆点；footer 两端对齐小字 var(--dim)。
StatusHUD 时钟脚本（内联 ~10 行：每秒更新 `#hud-clock`）追加在 TerminalShell 底部 `<script>`。

- [ ] **Step 3: 验证** `npm run dev` → 浏览器看到窗口栏/页脚/扫描线；`data-crt` 逻辑手动验证
- [ ] **Step 4: Commit** `feat: terminal shell + global styles + CRT`

### Task 5: 首页 Hero + 文章列表

**Files:**
- Create: `src/components/HeroBanner.astro`
- Create: `src/components/PostList.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: HeroBanner.astro**（服务端随机选一张 banner + 浮层 + 底部渐变；glitch 切换脚本作为岛屿在 Task 9 增强）

```astro
---
import { manifest } from '../lib/art.js';
const slugs = ['lain', 'gits', 'bebop', 'psychopass', 'akira'];
const pick = slugs[Math.floor(Math.random() * slugs.length)];
const info = manifest[pick];
---
<section class="hero" style={`background-image:url(/art/${info.banner})`}>
  <div class="hero-veil"></div>
  <div class="hero-text">
    <h1>v01d@cyber<span class="cursor">_</span></h1>
    <p class="hero-sub">present and connected — 数字花园 / 技术笔记 × 名作考据</p>
  </div>
  <span class="hero-credit">{info.title}</span>
</section>
<style>
.hero { position: relative; height: clamp(240px, 38vh, 420px); background: center 30%/cover; }
.hero-veil { position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(4,8,15,.25), rgba(4,8,15,.35) 55%, var(--bg)); }
.hero-text { position: absolute; left: 7%; bottom: 16px; }
.hero-text h1 { font-size: clamp(20px, 3.4vw, 34px); letter-spacing: 2px;
  color: var(--fg); text-shadow: 0 0 14px rgba(138,216,255,.8); }
.cursor { color: var(--green); animation: blink 1.1s infinite; }
.hero-sub { color: var(--cyan); font-size: 12px; opacity: .85; }
.hero-credit { position: absolute; right: 10px; bottom: 6px; font-size: 9px; color: rgba(255,255,255,.35); }
</style>
```

`src/lib/art.ts`：`export const manifest = (await import('/public/art/manifest.json')).default` 不行——Astro 里直接 `import manifest from '../../public/art/manifest.json'`（构建期内联，可行）。

- [ ] **Step 2: PostList.astro**（posts/notes/lab 分组 ls；每行：索引、文件名（链接）、tags、日期、anime 缩写）

props 接收三个集合的 getCollection 结果；输出结构：

```
$ ls ~/garden --group
posts/
  [1] heap-feng-shui.md        #pwn #heap   2026-09-12  ⌈gits_sac⌋
  ...
notes/
  ...
lab/
  ...
```

行 hover：高亮 + `>` 箭头滑入（CSS）。窄屏 `@media (max-width:768px)` 隐藏 tags/anime 列。

- [ ] **Step 3: index.astro** 组装（TerminalShell + HeroBanner + 一段 `$ whoami` 介绍 + PostList + CommandLine 挂载点 `<div id="cli-root">`，Task 6 填充）
- [ ] **Step 4: 验证** dev 模式看到 hero 图 + 分组列表 + 链接可点
- [ ] **Step 5: Commit** `feat: hero + post list homepage`

### Task 6: 命令系统（TDD）

**Files:**
- Create: `src/lib/commands.ts`
- Create: `tests/commands.test.ts`
- Create: `src/components/CommandLine.astro`
- Modify: `src/pages/index.astro`（挂载岛屿）

- [ ] **Step 1: 写失败测试**

```ts
// tests/commands.test.ts
import { describe, it, expect } from 'vitest';
import { execCommand, makeState } from '../src/lib/commands';

describe('execCommand', () => {
  const entries = { posts: [
    { slug: 'a', title: 'Alpha', date: new Date('2026-01-02') },
    { slug: 'b', title: 'Beta',  date: new Date('2026-01-01') },
  ]};

  it('ls 列出 posts', () => {
    const out = execCommand('ls', makeState(), entries);
    expect(out.lines.some(l => l.includes('a.md'))).toBe(true);
  });
  it('cat 2 按列表序号打开第二篇', () => {
    const out = execCommand('cat 2', makeState(), entries);
    expect(out.navigate?.href).toBe('/posts/b');
  });
  it('cd lab 跳转', () => {
    expect(execCommand('cd lab', makeState(), entries).navigate?.href).toBe('#lab');
  });
  it('未知命令报 command not found', () => {
    expect(execCommand('zzz', makeState(), entries).lines[0]).toMatch(/command not found: zzz/);
  });
  it('sudo 彩蛋', () => {
    expect(execCommand('sudo rm -rf /', makeState(), entries).lines.join()).toMatch(/root/);
  });
  it('lain 彩蛋返回 theme 动作', () => {
    expect(execCommand('lain', makeState(), entries).effect).toBe('wired');
  });
});
```

- [ ] **Step 2: `npx vitest run` 确认失败**（模块不存在）
- [ ] **Step 3: 实现 commands.ts**

```ts
export interface Entry { slug: string; title: string; date: Date; anime?: string }
export interface Ctx { posts: Entry[]; notes: Entry[]; lab: Entry[] }
export interface Result {
  lines: { text: string; cls?: string }[];
  navigate?: { href: string };
  effect?: 'clear' | 'wired' | 'rmrf' | 'exit' | 'crt-toggle';
}
export const makeState = () => ({ history: [] as string[] });

export function execCommand(raw: string, _state: ReturnType<typeof makeState>, ctx: Ctx): Result {
  const [cmd, ...args] = raw.trim().split(/\s+/);
  const flat = [['posts', ctx.posts], ['notes', ctx.notes], ['lab', ctx.lab]] as const;
  switch (cmd) {
    case 'help':
      return { lines: [
        { text: 'commands: help ls cat <n> cd <page> whoami theme clear lain exit' },
        { text: '彩蛋自己找。（提示：上上下下左右左右BA）', cls: 'dim' },
      ]};
    case 'ls':
      return { lines: flat.flatMap(([dir, list]) => [
        { text: dir + '/', cls: 'cyan' },
        ...list.map(e => ({ text: `  ${e.slug}.md  ${e.date.toISOString().slice(0,10)}`, cls: '' })),
      ])};
    case 'cat': {
      const n = Number(args[0]);
      const all = [...ctx.posts, ...ctx.notes, ...ctx.lab];
      const e = all[n - 1];
      if (!e) return { lines: [{ text: `cat: ${args[0] ?? ''}: No such entry (1-${all.length})`, cls: 'err' }] };
      return { lines: [{ text: `opening ${e.slug}.md …`, cls: 'dim' }], navigate: { href: `/posts/${e.slug}` } };
    }
    case 'cd':
      return { lines: [], navigate: { href: args[0] === '~' || !args[0] ? '/' : `/#${args[0]}` } };
    case 'whoami':
      return { lines: [{ text: 'v01d — 数码花园管理员 / pwn 研究者 / 赛璐璐考古学家' }] };
    case 'clear':
      return { lines: [], effect: 'clear' };
    case 'theme':
      return { lines: [{ text: 'crt toggled', cls: 'dim' }], effect: 'crt-toggle' };
    case 'lain':
      return { lines: [{ text: 'no matter where you go, everyone is connected.', cls: 'purple' }], effect: 'wired' };
    case 'sudo':
      return { lines: [{ text: 'v01d is not in the sudoers file. This incident will be reported. （骗你的，你是 root 又怎样）', cls: 'err' }] };
    case 'exit':
      return { lines: [{ text: 'logout…', cls: 'dim' }], effect: 'exit' };
    case 'rm':
      return { lines: [{ text: 'rm: 正在删除 /dev/garden …', cls: 'err' }], effect: 'rmrf' };
    default:
      return { lines: [{ text: `command not found: ${cmd} (try 'help')`, cls: 'err' }] };
  }
}
```

- [ ] **Step 4: `npx vitest run` 全绿**
- [ ] **Step 5: CommandLine.astro 岛屿**：`<div id="cli">` + 输入行（prompt `v01d@cyber:~$` + input 无边框透明）+ 输出区；`<script>`（TS，编译期 strip types）注入 ctx（astro define:vars 传 JSON）→ 调 execCommand → 追加行、执行 navigate/effect；打字机回显输出行（每行逐字 ~12ms）。`is:inline` 不用；用 `define:vars={{ ctx }}`。
- [ ] **Step 6: 验证** dev 页面敲 `ls`、`cat 1`（应跳文章）、`zzz`（报错）、`lain`（变紫滤镜：effect wired → document.documentElement.classList.add('wired')，global.css 加 `.wired { filter: hue-rotate(240deg) saturate(1.4); }`）
- [ ] **Step 7: Commit** `feat: command system (TDD) + cli island`

### Task 7: BootSequence 开机动画

**Files:**
- Create: `src/components/BootSequence.astro`
- Modify: `src/layouts/TerminalShell.astro`（首页才挂）

- [ ] **Step 1: 组件**（client:load 岛屿；localStorage 无 `booted` 时全屏黑底逐行打 BIOS 日志，~1.8s；任意键/点击跳过；结束后淡出、写 `booted`）

日志行（含 ASCII 标题）：
```
[    0.000000] v01d-bios v4.2 — initializing
[    0.412337] mounting /dev/garden … ok
[    0.771204] loading anime_keyvisual.ko … ok
[    1.092451] crt.phoshor calibration … ok
[    1.338877] establishing uplink to WIRED … CONNECTED
  welcome to v01d@cyber
```
- [ ] **Step 2: 验证** 清 localStorage 刷新看到动画、二次访问无
- [ ] **Step 3: Commit** `feat: boot sequence`

### Task 8: 文章页与正文排版

**Files:**
- Create: `src/pages/posts/[slug].astro`
- Create: `src/components/AnimeArt.astro`
- Create: `src/styles/prose.css`

- [ ] **Step 1: AnimeArt.astro**（props: slug；查 manifest，缺→占位 div（CSS 故障条纹），有→`<img loading="lazy">` + 作品名 caption）
- [ ] **Step 2: [slug].astro**：`getCollection('posts', c => !c.draft)` → hero 区（banner 横幅 + 标题浮层 + mood 一行 + 返回链接 `[q] 返回 ~/garden`）→ 正文 `<article class="prose">` → 文末 meta 行（tags、anime credit）
- [ ] **Step 3: prose.css**：`.prose { font-family: var(--serif); font-size: 17px; line-height: 1.9; max-width: 68ch; }` 标题用 mono + 绿色左边框；`pre/code` mono + 深底 + 扫描线纹理；链接青色下划线；`prose h2::before { content: '## '; color: var(--dim); }`
- [ ] **Step 4: 验证** dev 走查三篇文章（配图对、代码高亮、正文可读）
- [ ] **Step 5: Commit** `feat: post page + prose + anime art`

### Task 9: 动效包 + 彩蛋

**Files:**
- Modify: `src/components/HeroBanner.astro`（glitch 定时换图）
- Create: `src/components/ParticleField.astro`（client:visible，canvas 数据雨，限 hero 区，~60 行）
- Modify: `src/components/CommandLine.astro`（konami 监听；`rm -rf` 全屏假故障 1.5s 后恢复；`exit` 关窗动画）

- [ ] **Step 1: hero glitch 切换**：每 9s 给 `.hero` 叠 `glitching` 类 600ms（两层 ::before/::after 用同背景图 + `animation: glitch-1` + 色差 translate），期间换下一张 banner。
- [ ] **Step 2: ParticleField**：canvas 随机青绿字符列缓慢下落（matrix 数据雨，但低密度低透明度），`IntersectionObserver` 出视口 cancelAnimationFrame；reduced-motion 直接不启动。
- [ ] **Step 3: 彩蛋**：konami → `document.documentElement.classList.toggle('wired')` + toast；`rm -rf` → body 加 `.rmrf`（全屏白噪 + 抖动 1.5s）后移除并输出 `just kidding :)`；`exit` → main 缩小收起 400ms 后弹回 + 输出「骗你的」。
- [ ] **Step 4: 验证** dev 走查全部效果；Performance 面板无长任务
- [ ] **Step 5: Commit** `feat: motion pack + easter eggs`

### Task 10: 收尾与验收

**Files:**
- Create: `README.md`
- Modify: 全局（响应式微调）

- [ ] **Step 1: 响应式** 375px 宽走查：hero 文字不溢出、列表可读、命令行隐藏（`@media (max-width:768px){ #cli{display:none} }`）导航靠点击。
- [ ] **Step 2: `npm run build` 零错误零警告**
- [ ] **Step 3: Playwright 走查**（preview server）：首页截图、文章页截图、敲命令 `cat 1` 跳转断言、`lain` 变色断言、375px 视口截图。
- [ ] **Step 4: README**：本地开发、写文章流程（frontmatter 字段说明 + anime slug 表）、部署方式（Vercel/GH Pages 二选一说明）。
- [ ] **Step 5: Commit** `docs: readme + final polish`

---

## Self-Review

- **Spec 覆盖**：配色/字体（T4）、开机动画（T7）、CRT+glitch+粒子+打字机+hover+状态栏（T4/T5/T9）、命令全集+彩蛋（T6/T9）、anime 字段管线（T2/T3）、文章页可读性排版（T8）、响应式+reduced-motion（T4/T10）、版权标注（T4 footer + T8 credit）、Lighthouse（T10）。gaps：无。
- **占位符**：无 TBD/TODO；示例内容给了 3 篇的完整 frontmatter 与段落要求。
- **类型一致**：Entry/Ctx/Result 在 T6 定义并被 T5（PostList props 用同形数据）、T8（anime 字段名 anime）一致引用；manifest 字段 cover/banner 在 T3/T5/T8 一致。
