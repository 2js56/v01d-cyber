import { withBase } from './base';

// BGM: bôa — Duvet（serial experiments lain OP）
// 进站自动起播（默认开，mpg123/♪ 可关并记住）；站内走客户端路由，播放不断
// 音频文件缺失时命令优雅报错
const VOL = 0.35;
// 连接态（the WIRED）音量：Duvet 退到远处
const DUCK = 0.16;

let audio: HTMLAudioElement | null = null;
let ducked = false;

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

/** 连接态：音乐退远/恢复；未在播时只记状态（起播时生效） */
export function bgmSetDucked(on: boolean) {
  if (ducked === on) return;
  ducked = on;
  if (audio && bgmPlaying()) fade(audio, on ? DUCK : VOL, 900);
}

/** 自动起播偏好：默认开（首次访客也尝试），显式关过才关 */
export function autostartWanted(pref: string | null): boolean {
  return pref !== 'off';
}

/** 淡入淡出切换；返回切换后状态，文件缺失/被拦截返回 'missing' */
let toggling = false;
export async function bgmToggle(): Promise<'on' | 'off' | 'missing'> {
  // 防重入：bgmResume 的 kick（pointerdown）可能和指示器 click 在同一次
  // 点击里先后触发——第二次会误判"正在播放"而立刻停止
  if (toggling) return bgmPlaying() ? 'on' : 'off';
  toggling = true;
  try {
    return await toggleInner();
  } finally {
    toggling = false;
  }
}

async function toggleInner(): Promise<'on' | 'off' | 'missing'> {
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
    await fade(a, ducked ? DUCK : VOL, 1200);
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

/** 进站自动起播：立即尝试播放（Chrome 对常访站点放行），同时挂好
 *  首次交互即播的兜底——若先等尝试失败再挂，尝试 pending 期间用户的
 *  第一次交互会白白错过。成功则撤兜底。 */
let resumed = false;
export function bgmResume() {
  if (resumed) return;
  resumed = true;
  let want = false;
  try {
    want = autostartWanted(localStorage.getItem('bgm'));
  } catch {}
  syncBgmIndicator();
  if (!want) return;
  const unarm = () => {
    removeEventListener('pointerdown', kick);
    removeEventListener('keydown', kick);
  };
  const kick = () => {
    unarm();
    bgmToggle();
  };
  addEventListener('pointerdown', kick);
  addEventListener('keydown', kick);
  bgmToggle().then((st) => {
    if (st === 'on') unarm();
  });
}

/** 窗口栏指示器：♪ 常显，播放时亮绿呼吸，静默时暗淡 */
export function syncBgmIndicator() {
  const el = document.getElementById('bgm-ind');
  if (!el) return;
  let on = bgmPlaying();
  if (!audio) {
    try {
      on = autostartWanted(localStorage.getItem('bgm'));
    } catch {}
  }
  // 不用 ♪̸（组合斜线）——多数字体渲染模糊；统一 ♪，靠亮度/动画区分
  el.textContent = '♪';
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
