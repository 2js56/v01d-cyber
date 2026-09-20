import { withBase } from './base';

// pager 习惯：按 q / Esc 回到 ~/garden。
// 用 e.code（物理键位）判断 q —— 中文输入法下 e.key 是 'Process'，用 e.key 会失效；
// isComposing（拼音组合中）不劫持，避免打断输入。
export function bindQuitKey() {
  addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    if (e.code !== 'KeyQ' && e.key !== 'Escape') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement as HTMLElement | null;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    location.href = withBase('/');
  });
}
