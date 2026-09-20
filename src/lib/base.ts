// GitHub Pages 子路径部署（2js56.github.io/v01d-cyber）时 BASE_URL 非 '/'，
// 全站的内部链接与资源路径统一经 withBase 拼接，本地开发则原样返回。
const ROOT = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');
export const withBase = (path: string) => ROOT + path;
