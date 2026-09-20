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

`lain` `gits` `gits_sac` `bebop` `akira` `evangelion`（TV）`eva_eoe`（旧剧场版）`eva_10` `eva_20` `eva_30` `eva_310`（新剧场版 序/破/Q/终）`patlabor2` `perfect_blue` `paranoia` `psychopass` `promare` `blame` `gunnm` `city_hunter` `ginga999`

扩充池子：在 `public/art/manifest.json` 加一行（键名即 slug；AniList 搜索词与键名对不上时加 `search` 字段指定，如 `"search": "Evangelion 3.0 You Can"`），删掉本地缓存文件后跑 `npm run fetch-art` 会自动补拉。想用自己的图：按 `${slug}_cover.jpg` / `${slug}_banner.jpg` 命名放进 `public/art/` 即可——文件齐了管线就不会去拉。

## 终端命令

`help` `ls` `cat <n>` `cd <page>` `grep <关键词>`（全站搜索，含正文）`whoami`（按访问代数演化）`who`（站主 + 你的本地指纹）`connect`/`disconnect`（连接态，全站换 lain 黄红面板、BGM 退远、hero 锁 lain）`theme`（开关 CRT 扫描线）`clear` `lain` `exit` —— 以及"本机已装"的 `ps` `netstat`/`ss` `uptime` `dmesg` `history` `nmap` `sqlmap` `ssh` `hydra`（对静态站使用后果自负）。

文件系统是真的（至少长得是）：`cat /etc/passwd`、`cd /var/log`、`cat site.log`（站点史混排 1998 与 2026）、`cat /etc/shadow`（试试）。根下有个隐藏目录，`ls -a` 才现身。

另有若干彩蛋（试试 `sudo`、`rm -rf /`、konami code ↑↑↓↓←→←→BA、深夜来访、footer 右下角那个 T-n）。

## 站点的"活着"的部分（全部零后端，全在你本地）

- **访客记忆**：localStorage 计会话代数——hero 副标题实时报时/报代号，`whoami` 答案随代数漂移
- **深夜低语**：0:00–4:59 全站变冷变轻，hero 只换 lain / paranoia / perfect_blue，副标题换成 "why are you awake"
- **无解释倒计时**：footer 只显示 T-n，不说明在数什么。点击让终端说一句没头没尾的话。T-0 当天颜色不对，hero 锁定对应作品
- **主题色渗透**：文章的 `anime` 决定该页 accent——读 lain 泛黄、读 AKIRA 泛红（`src/lib/themecolors.ts`，manifest 全 slug 有色，测试保证）
- **信号对焦**：阅读时只有当前段清晰，其余退成微糊的背景信号（prefers-reduced-motion 自动关闭）
- **镜像文章**：frontmatter 加 `mirror: |` 多行文本——默认不显示，连接态（`connect` 后）才浮现，见 `wired-protocol.md`
- **grep 信号残留**：无匹配时约 1/3 的词会渗出一句不属于任何文章的话（确定性哈希，同词同结果）

## 视觉素材版权

`public/art/` 下的 key visual 来自 AniList 收录的官方宣传图，版权归各制作委员会所有。本站为个人非商用博客，页脚已标注来源；如需完全规避风险，可将 `scripts/fetch-art.mjs` 的图源替换为 AI 生成。

## BGM

bôa — Duvet（serial experiments lain OP），低音量循环。**默认进站自动播放**：浏览器 autoplay 策略允许时（Chrome 对常访站点放行）进站即响，被拦时任意一次点击/按键立即响。站内导航走客户端路由（Astro View Transitions），切页音乐不断。终端里输 `mpg123` 或点窗口栏的 `♪` 可开关，偏好会记住（关过就不再自动播）。

音频文件 `public/audio/duvet.mp3` 需自备且默认不入库（`.gitignore` 忽略 `*.mp3`，公开分发版权音频有被 DMCA 的风险）。想上线原曲：删掉 `.gitignore` 里那行、放入文件、commit——风险自担。文件缺失时命令会优雅报错。



任意静态托管均可：

- **Vercel / Netlify**：导入仓库，构建命令 `npm run build`，输出目录 `dist/`
- **GitHub Pages**：同理（注意若发布到 `<user>.github.io/<repo>/` 需调整 `astro.config.mjs` 的 `base`）
