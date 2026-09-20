import { withBase } from './base';

// BGM: bôa — Duvet（serial experiments lain OP）
// 音频文件 public/audio/duvet.mp3 不入 git（版权），缺失时命令优雅报错
const VOL = 0.35;

let audio: HTMLAudioElement | null = null;

const ensure = () => {
  if (!audio) {
    audio = new Audio(withBase('/audio/duvet.mp3'));
    audio.loop = true;
    audio.preload = 'metadata';
    audio.volume = 0;
    // 记播放进度：多页站导航会卸载音频，新页面从断点续播
    audio.addEventListener('timeupdate', () => {
      try {
        sessionStorage.setItem('bgm-t', String(audio!.currentTime));
      } catch {}
    });
    // 源加载失败（404）：play() 后 paused 先变 false，error 异步到达，
    // 不监听的话指示器会粘在 ♪
    audio.addEventListener('error', () => {
      audio!.pause();
      syncBgmIndicator();
    });
  }
  return audio;
};

export const bgmPlaying = () => !!audio && !audio.paused && !audio.error;

/** 淡入淡出切换；返回切换后状态，文件缺失/被拦截返回 'missing' */
export async function bgmToggle(): Promise<'on' | 'off' | 'missing'> {
  const a = ensure();
  if (bgmPlaying()) {
    await fade(a, 0, 500);
    a.pause();
    try {
      localStorage.setItem('bgm', 'off');
    } catch {}
    syncBgmIndicator();
    return 'off';
  }
  // 跨页续播：seek 到上次进度（等元数据加载完成才能设）
  try {
    const t = Number(sessionStorage.getItem('bgm-t'));
    if (t > 0) {
      if (a.readyState >= 1) a.currentTime = t;
      else a.addEventListener('loadedmetadata', () => (a.currentTime = t), { once: true });
    }
  } catch {}
  try {
    a.volume = 0;
    await a.play();
    await fade(a, VOL, 1200);
    try {
      localStorage.setItem('bgm', 'on');
    } catch {}
    syncBgmIndicator();
    return 'on';
  } catch {
    syncBgmIndicator();
    return 'missing';
  }
}

/** 上次是开着的：等用户首次交互后自动续播（浏览器禁止静默自动播放） */
export function bgmResume() {
  let want = false;
  try {
    want = localStorage.getItem('bgm') === 'on';
  } catch {}
  syncBgmIndicator();
  if (!want) return;
  const kick = () => {
    removeEventListener('pointerdown', kick);
    removeEventListener('keydown', kick);
    bgmToggle();
  };
  addEventListener('pointerdown', kick);
  addEventListener('keydown', kick);
}

/** 窗口栏指示器：♪ 播放中 / ♪̸ 静默 */
export function syncBgmIndicator() {
  const el = document.getElementById('bgm-ind');
  if (!el) return;
  let on = bgmPlaying();
  if (!audio) {
    try {
      on = localStorage.getItem('bgm') === 'on';
    } catch {}
  }
  el.textContent = on ? '♪' : '♪̸';
  el.classList.toggle('on', on);
}

function fade(a: HTMLAudioElement, to: number, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const from = a.volume;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      a.volume = from + (to - from) * k;
      if (k < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}
