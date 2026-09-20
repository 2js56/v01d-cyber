// 打字机音效：Web Audio 现场合成机械 click —— 零音频文件、零网络请求。
// 音量极轻（比 BGM 还低一个量级），偏好记忆，keysound 命令开关

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let enabled: boolean | null = null;

function ensure(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** 偏好读取（不缓存，localStorage 读足够便宜） */
export function keysoundOn(store: { getItem(k: string): string | null }): boolean {
  return store.getItem('keysound') !== 'off';
}

export function keysoundSetEnabled(on: boolean, store: { setItem(k: string, v: string): void }): void {
  enabled = on;
  try {
    store.setItem('keysound', on ? 'on' : 'off');
  } catch {}
}

/** 一次击键：15ms 白噪声 burst（抛物线衰减）过 1.8kHz 高通，音量 0.06 */
export function keyClick(): void {
  if (enabled === false) return;
  const ac = ensure();
  if (!ac) return;
  if (ac.state === 'suspended') {
    ac.resume().catch(() => {});
    return; // 这次先不响，恢复后下一次击键开始响
  }
  if (!noise) {
    const len = Math.floor(ac.sampleRate * 0.015);
    noise = ac.createBuffer(1, len, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  }
  const src = ac.createBufferSource();
  src.buffer = noise;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1800;
  const g = ac.createGain();
  g.gain.value = 0.06;
  src.connect(hp).connect(g).connect(ac.destination);
  src.start();
}
