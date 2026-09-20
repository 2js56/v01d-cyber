---
title: "heap feng shui：glibc 2.35 tcache 备忘"
date: 2026-09-12
tags: [pwn, heap]
anime: gits_sac
mood: "深夜，耳机里是 Tank!"
---

调 heap 的玄学堪比风水。这篇记的是 glibc 2.35 里 tcache 的行为，给未来的自己（以及某个深夜里对着 core dump 发呆的你）留一份地图。

## tcache 是什么

线程本地的一级缓存，free 掉的 chunk 先进这里，malloc 同尺寸时优先从这里取。2.35 引入了 safe-linking：`next` 指针存储时与 `chunk_addr >> 12` 异或。这意味着就算你有堆地址泄露，直接伪造 next 也过不了检查。

```c
// glibc 2.35, tcache_put 的核心一行
e->next = PROTECT_PTR (&e->next, tcache->entries[tc_idx]);

#define PROTECT_PTR(pos, ptr) \
  ((__typeof (ptr)) ((((size_t) pos) >> 12) ^ ((size_t) ptr)))
```

## 布局直觉

七个 chunk 一队，满了溢去 fastbin。打 tcache poisoning 的时候，目标地址的对齐要求是 16 字节——不对齐会在 `malloc` 的检查里直接 abort，连报错信息都会误导你去查别的地方。

## 一点心得

- 先 `gdb` 里 `p *(tcache_perthread_struct*)tcache` 看全貌，别盲猜；
- 沙地里先数 chunk 流向，再谈利用，风水先生的功课也是从看山开始的；
- 笑点解析：tcache double free 在 2.35 有 key 检查，但 key 本身可以被 UAF 改掉——检查的存在不是终点，检查的代价才是。

mood 里写了，Tank! 是最好的调试 BGM。素子少佐也解决不了你的段错误，但她会告诉你：思考是灵魂在和自己对话。
