// 解码动画：文本从乱码流里逐位落定 —— 加密流被现场解密的样子。
// 纯函数核心可测；animateScramble 是浏览器侧 rAF 驱动器

const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ01<>/#$%&*!?';

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

/** progress ∈ [0,1]：前 floor(len·progress) 位落定为原文，其余是确定性乱码（空格保留） */
export function scrambleFrame(target: string, progress: number, frame = 0): string {
  const p = Math.max(0, Math.min(1, progress));
  const settled = Math.floor(target.length * p);
  let out = target.slice(0, settled);
  for (let i = settled; i < target.length; i++) {
    const c = target[i]!;
    if (c === ' ') {
      out += ' ';
      continue;
    }
    out += GLYPHS[hash(`${target}|${i}|${frame}`) % GLYPHS.length];
  }
  return out;
}

export const SCRAMBLE_MS = 700;

/** 浏览器驱动：在 ms 内把 el 的文本从乱码落定到 text（重入时旧动画自然被覆盖） */
export function animateScramble(el: HTMLElement, text: string, ms = SCRAMBLE_MS): void {
  const t0 = performance.now();
  el.dataset.scrambling = '1';
  const step = (t: number) => {
    // 被新的 animateScramble 接管就退出
    if (el.dataset.scrambling === '0') return;
    const p = Math.min(1, (t - t0) / ms);
    el.textContent = scrambleFrame(text, p, Math.floor(t / 34));
    if (p < 1) requestAnimationFrame(step);
    else {
      el.textContent = text;
      el.dataset.scrambling = '0';
    }
  };
  requestAnimationFrame(step);
}
