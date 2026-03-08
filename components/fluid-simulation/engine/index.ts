/**
 * 流体模拟引擎 - 导出入口
 */

// 配置 - 显式导出以避免冲突
export {
  defaultConfig,
  generateColor,
  getPixelRatio,
  HSVtoRGB,
  hashCode,
  isMobile,
  lowPerfConfig,
  mobileConfig,
  normalizeColor,
  scaleByPixelRatio,
  wrap,
} from "./config";
// 帧缓冲区管理 - 显式导出以避免与 webgl-context 的 getResolution 冲突
export {
  createDoubleFBO,
  createFBO,
  getTextureFormats,
  resizeDoubleFBO,
  resizeFBO,
} from "./framebuffers";
// 指针管理
export {
  calculateSplatForce,
  createPointer,
  findPointerById,
  updatePointerColor,
  updatePointerDownData,
  updatePointerMoveData,
  updatePointerUpData,
} from "./pointers";
// 着色器程序管理
export * from "./programs";
// 着色器源码
export * from "./shaders";
// 类型定义
export * from "./types";
// WebGL 上下文
export {
  getResolution,
  getTextureScale,
  getWebGLContext,
} from "./webgl-context";
