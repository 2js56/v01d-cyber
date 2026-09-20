# v01d@cyber

黑客终端形态的个人站点（~/ghost）：整站伪装成 shell，内容是住在里面的 ghost——名作官方视觉做沉浸式首屏，支持命令行导航。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # 命令系统单测（vitest）
npm run build      # 取图管线 + 静态构建 → dist/
npm run preview    # 预览构建产物
```

## 写文章

在 `src/content/{posts,notes,lab}/` 下新建 Markdown 文件（文件名即 URL slug）：

```yaml
---
title: "文章标题"
date: 2026-09-20
tags: [免杀, 内网]
anime: psychopass    # 可选：关联名作，自动配官方视觉做封面/头图
mood: "写时的心情一句话"   # 可选
draft: false
---
正文 Markdown……
```

- `posts/` 长文 · `notes/` 碎片随笔 · `lab/` 项目展示
- frontmatter 不合法会在构建时报错并指明文件

## 可用的 anime slug（官方视觉池）

`lain` `gits` `gits_sac` `bebop` `akira` `evangelion` `patlabor2` `perfect_blue` `paranoia` `psychopass` `promare` `blame` `gunnm` `city_hunter` `ginga999`

扩充池子：在 `public/art/manifest.json` 加一行（键名 = AniList 搜索词），删掉本地缓存文件后跑 `npm run fetch-art` 会自动补拉。

## 终端命令

`help` `ls` `cat <n>` `cd <page>` `grep <关键词>`（全站搜索，含正文）`whoami` `theme`（开关 CRT 扫描线）`clear` `lain` `exit` —— 以及"本机已装"的 `ps` `netstat`/`ss` `uptime` `history` `nmap` `sqlmap` `ssh` `hydra`（对静态站使用后果自负）。另有若干彩蛋（试试 `sudo`、`rm -rf /`、konami code ↑↑↓↓←→←→BA）。

## 视觉素材版权

`public/art/` 下的 key visual 来自 AniList 收录的官方宣传图，版权归各制作委员会所有。本站为个人非商用博客，页脚已标注来源；如需完全规避风险，可将 `scripts/fetch-art.mjs` 的图源替换为 AI 生成。

## BGM

bôa — Duvet（serial experiments lain OP），低音量循环。**默认进站自动播放**：浏览器 autoplay 策略允许时（Chrome 对常访站点放行）进站即响，被拦时任意一次点击/按键立即响。站内导航走客户端路由（Astro View Transitions），切页音乐不断。终端里输 `mpg123` 或点窗口栏的 `♪` 可开关，偏好会记住（关过就不再自动播）。

音频文件 `public/audio/duvet.mp3` 需自备且默认不入库（`.gitignore` 忽略 `*.mp3`，公开分发版权音频有被 DMCA 的风险）。想上线原曲：删掉 `.gitignore` 里那行、放入文件、commit——风险自担。文件缺失时命令会优雅报错。



任意静态托管均可：

- **Vercel / Netlify**：导入仓库，构建命令 `npm run build`，输出目录 `dist/`
- **GitHub Pages**：同理（注意若发布到 `<user>.github.io/<repo>/` 需调整 `astro.config.mjs` 的 `base`）
