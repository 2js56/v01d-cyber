// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://2js56.github.io',
  // CI（GitHub Actions）构建走子路径部署，本地开发保持根路径
  base: process.env.CI ? '/v01d-cyber' : '/',
});
