// Astro 7 的客户端路由虚拟模块是 'astro:transitions/client'（旧版为 :client）
import { navigate } from 'astro:transitions/client';
import { withBase } from './base';

// pager 习惯：按 q / Esc 回到 ~/ghost。
// 用 e.code（物理键位）判断 q —— 中文输入法下 e.key 是 'Process'，用 e.key 会失效；
// isComposing（拼音组合中）不劫持，避免打断输入。
// 幂等：虚拟导航每次 page-load 重绑前先撤旧监听（否则会叠加多次导航）；
// navigate() 走客户端路由，BGM 不间断。
let ac: AbortController | null = null;
export function bindQuitKey() {
  ac?.abort();
  ac = new AbortController();
  addEventListener(
    'keydown',
    (e) => {
      if (e.isComposing) return;
      if (e.code !== 'KeyQ' && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      navigate(withBase('/'));
    },
    { signal: ac.signal }
  );
}
