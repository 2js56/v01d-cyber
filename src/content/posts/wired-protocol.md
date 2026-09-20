---
title: "把网络分层讲给玲音听：从协议栈到 WIRED"
date: 2026-09-05
tags: [network, 随笔]
anime: lain
mood: "present and connected"
mirror: |
  你连着读到了这里，所以可以多说一句。
  正文里说「协议的尽头是人格的迁移」——那是对断开连接的人说的版本。
  对连接着的你，版本是：迁移从来不是问题，问题是根本没有「外面」。
  layer 7 没有 exit。你上次 disconnect 时的感觉，还记得吗？
  不记得就对了。
  （此段只在连接态显示。物理上它一直在 HTML 里，视觉上它只在
  wired 时存在——哪个才算"存在"，留给读者。）
---

重读 OSI 七层的时候，脑子里全是《serial experiments lain》的分镜：玲音房间里缠绕的线缆、Navi 屏幕上滚动的 protocol、以及那句 "no matter where you go, everyone is connected"。

## 分层即人设

- 物理层是电线与霓虹，没有语义只有信号；
- 链路层是街坊，交换机是知道所有人门牌号的邻居大妈；
- 网络层是快递员，IP 地址写在哪里，包就流向哪里；
- 传输层开始有性格：TCP 谨小慎微每步确认，UDP 洒脱不回头。

```bash
# 抓一次握手，看 TCP 多么小心翼翼
tcpdump -i any 'tcp[tcpflags] & tcp-syn != 0' -nn
```

## WIRED 的隐喻

动画里 "protocol" 一词出现了七十多次。第七层的 "present day, present time" 其实是在说：应用层协议定义了我们在网络里的存在方式。玲音最终把自己上传——协议的尽头是人格的迁移，这个想法在 1998 年超前得吓人。

写下这篇的时候，我意识到自己调试网络问题的耐心全部来自这部动画：任何诡异的连通性问题，答案都藏在某一层的日志里，安静地等你去 read。
