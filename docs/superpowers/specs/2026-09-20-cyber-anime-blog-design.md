# v01d@cyber — 数字花园博客设计文档

日期：2026-09-20
状态：已与用户逐节确认

## 1. 愿景

一个黑客终端形态的个人数字花园：整站伪装成终端，名作官方视觉做沉浸式首屏，动效浓烈但克制在性能红线内。风格关键词：**黑客 × 二次元（名作官方插画）× 高动效 × 概念超前**。明确不做的：传统博客布局、素材站大众壁纸、UI 层面的"二次元化"装饰。

博客名：**v01d@cyber**。

## 2. 已确认决策

| 维度 | 决定 |
|---|---|
| 内容定位 | 数字花园：文章 / 随笔 / 项目 / 收藏混合 |
| 部署 | 静态托管（GitHub Pages / Vercel / Netlify，发布时再定） |
| 概念骨架 | 黑客终端 Terminal OS，命令行 + 点击双导航 |
| 插画策略 | 名作官方 key visual（AniList），沉浸式 Hero（方案 1） |
| 审美偏好 | 90s 赛璐璐、现代厚涂、暗黑实验系、昭和/Citypop 全接受 |
| 技术栈 | Astro（SSG）+ vanilla JS 岛屿 |

## 3. 架构

```
blog/
├── src/
│   ├── content/
│   │   ├── posts/*.md        # 长文
│   │   ├── notes/*.md        # 碎片/短想
│   │   └── lab/*.md          # 项目展示
│   ├── components/           # 见 §7 组件清单
│   ├── layouts/
│   │   └── TerminalShell.astro
│   └── pages/
│       ├── index.astro       # Hero + 终端主体
│       └── posts/[slug].astro
├── scripts/fetch-art.ts      # 构建前拉官方图（带缓存）
├── public/art/               # 官方图本地缓存（进仓库）
└── astro.config.mjs
```

页面流程：

1. 首次访问播 2 秒 BIOS 风 boot 动画（可跳过，localStorage 记忆）
2. 首页：上部沉浸 Hero（官方 key visual + 浮层标题 + 底部渐变），下部终端主体（`ls` 形式文章列表 + 可输入命令）
3. 文章页：顶部关联作品小幅封面 + 可读性优先的正文（等宽仅用于代码块与元数据），外壳保持终端风
4. 响应式：窄屏隐藏命令行，点击导航为主

## 4. 视觉与动效

配色（赛璐璐夜色调）：

- 底 `#04080f` / `#05030c`；主 终端绿 `#7dffb0`；辅 青 `#8ad8ff`、紫 `#b466ff`、粉 `#ff9ad5`

字体：JetBrains Mono Nerd（界面/代码）、FIGlet ASCII art（开机装饰标题）、霞鹜文楷或思源宋（中文正文）。

动效清单：

| 动效 | 实现 | 备注 |
|---|---|---|
| BIOS 开机动画 | 打字机 + 日志滚动 | 一次性，可跳过 |
| CRT 扫描线 + 暗角 | 纯 CSS 全局覆盖层 | `theme -crt` 可关 |
| glitch 色差 | CSS clip-path 切片 | Hero 换图、标题 hover |
| 打字机回显 | JS | 命令行 |
| 列表行 hover | CSS | 高亮 + 箭头滑入 |
| 实时状态栏 | 纯前端 | 时钟、uptime、字数 |
| 粒子 | canvas 限 Hero 区 | 滚出视口即暂停 |
| konami code | JS | 触发反转/隐藏页彩蛋 |

红线：尊重 `prefers-reduced-motion`；零动画库依赖（CSS/vanilla JS）；Hero 粒子区域化；Lighthouse ≥ 90。

命令系统：`help` `ls` `cat <n>` `cd <page>` `whoami` `theme` `clear` `history`；彩蛋 `sudo`、`rm -rf /`（假故障后恢复）、`lain`（wired 反转模式）、`exit`（关窗再弹出"骗你的"）；未知命令终端风报错。

## 5. 内容模型

frontmatter（zod schema 校验）：

```yaml
title: string        # 必填
date: date           # 必填
tags: string[]       # 可选
anime: string        # 可选：AniList slug（如 "gits_sac"），自动配官方视觉
mood: string         # 可选：一句话心情，显示在元数据
draft: boolean       # 默认 false
```

`anime` 未填 → 默认故障艺术占位图。三个内容集合（posts / notes / lab）在首页按目录分组显示。

## 6. 图片策略与版权

- 图源：AniList CDN 官方 key visual（cover + banner）
- `scripts/fetch-art.ts` 构建时解析全部 `anime` 引用，下载至 `public/art/`，带本地缓存（二次构建零网络请求）
- **版权说明**：官方 key visual 版权属各制作委员会；个人非商用博客装饰性使用是社区普遍惯例，但需在站点 footer 标注作品名与"版权归原作者"。若未来需规避风险，可切换为 AI 生成同人风格图（接口已抽象在 fetch-art 脚本层）。

## 7. 组件

| 组件 | 职责 | 水合 |
|---|---|---|
| `TerminalShell` | 外壳：窗口栏、CRT 层、状态栏插槽 | 静态 |
| `BootSequence` | 开机动画 | client:only，一次性 |
| `CommandLine` | 命令解析路由（小状态机） | client island |
| `HeroBanner` | 沉浸 hero、glitch 切换 | client island |
| `PostList` | `ls` 文章列表 | 服务端渲染 |
| `AnimeArt` | anime 字段 → 本地缓存图 | 静态 |
| `StatusHUD` | 时钟/uptime/字数 | client island |
| `ParticleField` | Hero 粒子 | client:visible |

## 8. 错误处理

- frontmatter 不合法 → 构建失败，zod 报错指明文件
- AniList 拉图失败 → 占位图 + 构建警告，不阻塞
- 未知命令 → `command not found: xxx (try 'help')`

## 9. 验证

- `astro build` 零警告
- Playwright 走查：首页 / 文章页 / 命令交互 / 窄屏
- Lighthouse ≥ 90（性能）
- 素材：15 部作品官方图已在会话中预下载验证通路（`.superpowers/brainstorm/*/assets/anilist/`），正式实施时移入 `public/art/`

## 10. 明确不做（v1）

- 评论系统（后续可加 giscus）
- 全文搜索（命令行导航即浏览；`grep` 命令留给 v2）
- CMS / 在线编辑（本地 Markdown + git 即工作流）
- 多语言
