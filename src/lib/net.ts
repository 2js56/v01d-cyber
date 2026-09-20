// 连接态（the WIRED）：一个全站状态而非一次性彩蛋。
// localStorage 持久化，ClientRouter 导航后由 TerminalShell 的 page-load 重放到 <html>

import type { Store } from './visitor';

export type NetPref = string | null;

/** 'wired' 才算连接（null/off/脏值都视为断开，与 bgm 默认相反：连接默认不自动） */
export function netWanted(pref: NetPref): boolean {
  return pref === 'wired';
}

export function netSet(store: Store, on: boolean): void {
  try {
    store.setItem('net', on ? 'wired' : 'off');
  } catch {}
}

/** 读偏好（不写 DOM）—— 组件层与测试共用 */
export function netOn(store: Store): boolean {
  try {
    return netWanted(store.getItem('net'));
  } catch {
    return false;
  }
}

/** 把状态重放到 <html>：冷加载与每次虚拟导航后调用。
 *  返回当前态，调用方据此联动 BGM/hero。 */
export function applyNet(root: HTMLElement, store: Store): boolean {
  const on = netOn(store);
  root.classList.toggle('wired', on);
  return on;
}
