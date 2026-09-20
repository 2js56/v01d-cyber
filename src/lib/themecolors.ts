// 主题色渗透：每部作品有专属 accent，文章页把 --green/--cyan 局部换成
// 作品色 —— 读 lain 的文章时终端面板泛黄，读 AKIRA 时泛红。
// 视觉素材是官方的，颜色也该是作品自己的。

export interface ThemeColors {
  /** 交互/强调色（hex）—— 覆盖 --green 与 --cyan */
  accent: string;
  /** 标题辉光（rgba）—— 覆盖 h1 text-shadow */
  glow: string;
}

export const THEMECOLORS: Record<string, ThemeColors> = {
  lain: { accent: '#ffd24a', glow: 'rgba(255,210,74,0.45)' }, // lain 黄
  gits: { accent: '#35c3b2', glow: 'rgba(53,195,178,0.4)' }, // 攻壳 teal
  gits_sac: { accent: '#2ea8a0', glow: 'rgba(46,168,160,0.4)' },
  bebop: { accent: '#d99a4e', glow: 'rgba(217,154,78,0.4)' }, // Bebop 黄昏
  akira: { accent: '#ff3b30', glow: 'rgba(255,59,48,0.4)' }, // AKIRA 红
  evangelion: { accent: '#9d7bff', glow: 'rgba(157,123,255,0.4)' }, // 初号机紫
  eva_eoe: { accent: '#ff5f5f', glow: 'rgba(255,95,95,0.4)' }, // EOE 海报红
  eva_10: { accent: '#7dc242', glow: 'rgba(125,194,66,0.4)' }, // 序 绿
  eva_20: { accent: '#ffb03a', glow: 'rgba(255,176,58,0.4)' }, // 破 橙
  eva_30: { accent: '#4ea3ff', glow: 'rgba(78,163,255,0.4)' }, // 破→Q 蓝
  eva_310: { accent: '#ff8a3d', glow: 'rgba(255,138,61,0.4)' }, // :|| 橙红
  patlabor2: { accent: '#8aa6c0', glow: 'rgba(138,166,192,0.4)' }, // 都会灰蓝
  perfect_blue: { accent: '#ff6fa5', glow: 'rgba(255,111,165,0.4)' }, // 幻觉粉
  paranoia: { accent: '#ffcf3d', glow: 'rgba(255,207,61,0.4)' }, // Maromi 黄
  psychopass: { accent: '#5f8fd9', glow: 'rgba(95,143,217,0.4)' }, // Sibyl 蓝
  promare: { accent: '#ff4d3d', glow: 'rgba(255,77,61,0.4)' }, // Promare 火焰
  blame: { accent: '#b8c4cc', glow: 'rgba(184,196,204,0.4)' }, // 网络化灰白
  gunnm: { accent: '#6f9fd8', glow: 'rgba(111,159,216,0.4)' }, // 铁蓝
  city_hunter: { accent: '#4ec9d4', glow: 'rgba(78,201,212,0.4)' }, // 新宿青
  ginga999: { accent: '#b48cff', glow: 'rgba(180,140,255,0.4)' }, // 银河紫
};

export function themeColors(slug?: string): ThemeColors | null {
  return slug ? (THEMECOLORS[slug] ?? null) : null;
}
