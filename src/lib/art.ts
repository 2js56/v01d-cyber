import manifest from '../../public/art/manifest.json';

export interface ArtInfo {
  title: string;
  cover: string;
  banner: string;
  /** AniList 搜索词；缺省用 slug 本身（slug 与作品名对不上时显式指定） */
  search?: string;
}

export { manifest };
export function art(slug?: string): ArtInfo | undefined {
  return slug ? (manifest as Record<string, ArtInfo>)[slug] : undefined;
}
