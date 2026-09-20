import { describe, it, expect } from 'vitest';
import { autostartWanted } from '../src/lib/bgm';

// BGM 默认开：进站即尝试自动播放（浏览器 autoplay 策略拦截时退回首次交互即播）
describe('autostartWanted（自动起播偏好）', () => {
  it('未设置偏好（首次访客）默认自动播放', () => {
    expect(autostartWanted(null)).toBe(true);
  });

  it("显式 'on' 自动播放", () => {
    expect(autostartWanted('on')).toBe(true);
  });

  it("显式 'off'（用户关过）不自动播放", () => {
    expect(autostartWanted('off')).toBe(false);
  });
});
