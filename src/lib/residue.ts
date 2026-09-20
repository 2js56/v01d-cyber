// grep 无匹配时的"信号残留"：某些词会在无结果时返回一句不属于任何文章的话。
// 触发与否由词的哈希决定 —— 同一个词永远同一个结果，世界有一致性。

const RESIDUE = [
  '这个关键词曾经存在过。那篇文章在你到达之前自己删除了自己。',
  '无论你在哪里搜索，所有人都已连接。',
  '此处原文已被一个未来版本覆盖。',
  'ghost 不在文件里。ghost 在读取文件的间隙里。',
  '你搜的词在另一个现实里命中了 3 篇。',
  '这段信号在连接建立时丢失，断开时才会恢复。',
  '深夜的访问者能看到这一行的另一半。',
  '该关键词已随上一位访问者的会话结束而蒸发。',
  '7 号线上有一台 Navi 还在等一个输入。',
  '索引记得它，但索引决定沉默。',
  '删除是写入的一种，遗忘是记忆的一种。',
  '你确定要找的是这个词，还是找这个词的自己？',
];

/** djb2：够用且跨运行时稳定（不能用 Math.random，会破坏一致性） */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

/** 命中（约 1/3 的词）返回残留句，否则 null */
export function residueFor(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const h = hash(q);
  return h % 10 < 3 ? RESIDUE[h % RESIDUE.length] : null;
}

/** 测试用：暴露池本体 */
export const residuePool = RESIDUE;
