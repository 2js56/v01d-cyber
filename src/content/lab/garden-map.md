---
title: "garden-map：本站是如何搭建的"
date: 2026-09-15
tags: [astro, web]
mood: "自己动手，丰衣足食"
---

这个博客本身就是一个 lab 项目：Astro 静态生成 + vanilla JS 岛屿，没有任何动画库。

## 结构

- `posts/ notes/ lab/` 三个内容集合，Markdown + frontmatter；
- `scripts/fetch-art.mjs` 构建前从 AniList 拉官方 key visual，本地缓存；
- 命令行导航是一个 ~200 行的纯函数状态机，有单测。

## 为什么不用框架写动效

CSS 的 `clip-path` 能做出 90% 的 glitch，`canvas` 两百行以内能写出克制的数据雨。依赖越少，十年后回来改样式的时候，你面对的敌人只有过去的自己。
