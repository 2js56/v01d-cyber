// scripts/fetch-art.mjs — 确保 manifest 引用的官方图都存在，缺则从 AniList 拉取（幂等）
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ART = 'public/art';
mkdirSync(ART, { recursive: true });
const manifest = JSON.parse(readFileSync(`${ART}/manifest.json`, 'utf8'));

const gql = (query) =>
  fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then((r) => r.json());

async function fetchOne(slug, kind) {
  // kind: cover | banner；slug 即 AniList 搜索词（manifest 键已按作品英文名/罗马音命名）
  const q = `query { Media(search:"${slug}", type:ANIME, sort:SEARCH_MATCH) { coverImage{extraLarge} bannerImage } }`;
  const res = await gql(q);
  const m = res?.data?.Media;
  if (!m) return console.warn(`⚠ ${slug}: not found on AniList`);
  const url = kind === 'cover' ? m.coverImage?.extraLarge : m.bannerImage;
  if (!url) return console.warn(`⚠ ${slug}: no ${kind} image`);
  const raw = `${ART}/${slug}_${kind}_raw`;
  writeFileSync(raw, Buffer.from(await (await fetch(url)).arrayBuffer()));
  execFileSync('sips', [
    '-Z', kind === 'cover' ? '400' : '900',
    '-s', 'format', 'jpeg', '-s', 'formatOptions', '62',
    raw, '--out', `${ART}/${slug}_${kind}.jpg`,
  ]);
  rmSync(raw);
  console.log(`✓ ${slug} ${kind}`);
}

const missing = [];
for (const [slug, info] of Object.entries(manifest)) {
  for (const kind of ['cover', 'banner']) {
    if (!existsSync(`${ART}/${info[kind]}`)) missing.push([slug, kind]);
  }
}

if (!missing.length) {
  console.log('art cache complete ✓');
  process.exit(0);
}

console.log(`fetching ${missing.length} images...`);
for (const [slug, kind] of missing) await fetchOne(slug, kind);
console.warn('note: 新拉取的图请核对 manifest title 是否匹配预期作品');
