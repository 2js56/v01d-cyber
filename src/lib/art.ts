import manifest from '../../public/art/manifest.json';

export interface ArtInfo {
  title: string;
  cover: string;
  banner: string;
}

export { manifest };
export function art(slug?: string): ArtInfo | undefined {
  return slug ? (manifest as Record<string, ArtInfo>)[slug] : undefined;
}
