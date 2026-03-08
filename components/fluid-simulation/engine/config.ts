/**
 * 流体模拟配置
 */

import type { FluidConfig, RGBColor } from "./types";

// 默认配置
export const defaultConfig: FluidConfig = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1024,
  CAPTURE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 1,
  VELOCITY_DISSIPATION: 0.2,
  PRESSURE: 0.8,
  PRESSURE_ITERATIONS: 20,
  CURL: 30,
  SPLAT_RADIUS: 0.25,
  SPLAT_FORCE: 6000,
  SHADING: true,
  COLORFUL: true,
  COLOR_UPDATE_SPEED: 10,
  PAUSED: false,
  BACK_COLOR: { r: 0, g: 0, b: 0 },
  TRANSPARENT: false,
  BLOOM: true,
  BLOOM_ITERATIONS: 8,
  BLOOM_RESOLUTION: 256,
  BLOOM_INTENSITY: 0.8,
  BLOOM_THRESHOLD: 0.6,
  BLOOM_SOFT_KNEE: 0.7,
  SUNRAYS: true,
  SUNRAYS_RESOLUTION: 196,
  SUNRAYS_WEIGHT: 1.0,
};

// 移动端配置调整
export const mobileConfig: Partial<FluidConfig> = {
  DYE_RESOLUTION: 512,
  SIM_RESOLUTION: 64,
  BLOOM_RESOLUTION: 128,
  SUNRAYS_RESOLUTION: 128,
};

// 低性能设备配置
export const lowPerfConfig: Partial<FluidConfig> = {
  DYE_RESOLUTION: 512,
  SHADING: false,
  BLOOM: false,
  SUNRAYS: false,
};

// 检测是否移动设备
export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// 获取设备像素比
export function getPixelRatio(): number {
  if (typeof window === "undefined") return 1;
  return window.devicePixelRatio || 1;
}

// 按像素比缩放
export function scaleByPixelRatio(input: number): number {
  return Math.floor(input * getPixelRatio());
}

// HSV 转 RGB
export function HSVtoRGB(h: number, s: number, v: number): RGBColor {
  let r = 0,
    g = 0,
    b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return { r, g, b };
}

// 生成随机颜色
export function generateColor(): RGBColor {
  const c = HSVtoRGB(Math.random(), 1.0, 1.0);
  c.r *= 0.15;
  c.g *= 0.15;
  c.b *= 0.15;
  return c;
}

// 归一化颜色 (0-255 -> 0-1)
export function normalizeColor(input: RGBColor): RGBColor {
  return {
    r: input.r / 255,
    g: input.g / 255,
    b: input.b / 255,
  };
}

// 包装数值
export function wrap(value: number, min: number, max: number): number {
  const range = max - min;
  if (range === 0) return min;
  return ((value - min) % range) + min;
}

// 字符串哈希
export function hashCode(s: string): number {
  if (s.length === 0) return 0;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
