/**
 * WebGL 流体模拟类型定义
 * 基于 Pavel Dobryakov 的 WebGL-Fluid-Simulation
 */

// WebGL 扩展格式
export interface TextureFormat {
  internalFormat: number;
  format: number;
}

// 纹理格式集合
export interface TextureFormats {
  rgba: TextureFormat;
  rg: TextureFormat;
  r: TextureFormat;
  filterType: number;
  halfFloatType: number;
}

// WebGL 扩展信息
export interface WebGLExtensions {
  formatRGBA: TextureFormat | null;
  formatRG: TextureFormat | null;
  formatR: TextureFormat | null;
  halfFloatTexType: number;
  supportLinearFiltering: OES_texture_half_float_linear | null;
}

// WebGL 上下文结果
export interface WebGLContextResult {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  ext: WebGLExtensions;
  isWebGL2: boolean;
}

// 帧缓冲对象
export interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

// 双缓冲帧缓冲对象
export interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

// 纹理对象
export interface TextureObject {
  texture: WebGLTexture;
  width: number;
  height: number;
  attach: (id: number) => number;
}

// 分辨率
export interface Resolution {
  width: number;
  height: number;
}

// RGB 颜色
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// 指针/触摸数据
export interface Pointer {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;
  color: RGBColor;
}

// 流体模拟配置 (别名)
export type SimulationConfig = FluidConfig;

// 流体模拟配置
export interface FluidConfig {
  SIM_RESOLUTION: number;
  DYE_RESOLUTION: number;
  CAPTURE_RESOLUTION: number;
  DENSITY_DISSIPATION: number;
  VELOCITY_DISSIPATION: number;
  PRESSURE: number;
  PRESSURE_ITERATIONS: number;
  CURL: number;
  SPLAT_RADIUS: number;
  SPLAT_FORCE: number;
  SHADING: boolean;
  COLORFUL: boolean;
  COLOR_UPDATE_SPEED: number;
  PAUSED: boolean;
  BACK_COLOR: RGBColor;
  TRANSPARENT: boolean;
  BLOOM: boolean;
  BLOOM_ITERATIONS: number;
  BLOOM_RESOLUTION: number;
  BLOOM_INTENSITY: number;
  BLOOM_THRESHOLD: number;
  BLOOM_SOFT_KNEE: number;
  SUNRAYS: boolean;
  SUNRAYS_RESOLUTION: number;
  SUNRAYS_WEIGHT: number;
  INITIAL_SPLATS: number;
  MAX_PIXEL_RATIO: number;
  FRAME_RATE: number;
}

// Uniform 位置映射
export type UniformLocations = Record<string, WebGLUniformLocation | null>;

// 着色器程序
export interface ShaderProgram {
  program: WebGLProgram;
  uniforms: UniformLocations;
  bind: () => void;
}

// 材质（支持多关键字编译）
export interface Material {
  vertexShader: WebGLShader;
  fragmentShaderSource: string;
  programs: Map<number, WebGLProgram>;
  activeProgram: WebGLProgram | null;
  uniforms: UniformLocations;
  setKeywords: (keywords: string[]) => void;
  bind: () => void;
}

// 流体模拟帧缓冲集合
export interface SimulationFramebuffers {
  dye: DoubleFBO | null;
  velocity: DoubleFBO | null;
  divergence: FBO | null;
  curl: FBO | null;
  pressure: DoubleFBO | null;
  bloom: FBO | null;
  bloomFramebuffers: FBO[];
  sunrays: FBO | null;
  sunraysTemp: FBO | null;
}

// 流体模拟着色器程序集合
export interface SimulationPrograms {
  blur: ShaderProgram;
  copy: ShaderProgram;
  clear: ShaderProgram;
  color: ShaderProgram;
  checkerboard: ShaderProgram;
  bloomPrefilter: ShaderProgram;
  bloomBlur: ShaderProgram;
  bloomFinal: ShaderProgram;
  sunraysMask: ShaderProgram;
  sunrays: ShaderProgram;
  splat: ShaderProgram;
  advection: ShaderProgram;
  divergence: ShaderProgram;
  curl: ShaderProgram;
  vorticity: ShaderProgram;
  pressure: ShaderProgram;
  gradientSubtract: ShaderProgram;
  display: Material;
}

// 流体引擎接口
export interface FluidEngine {
  start: () => void;
  stop: () => void;
  resize: () => void;
  splat: (
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: RGBColor,
  ) => void;
  multipleSplats: (amount: number) => void;
  setConfig: (config: Partial<FluidConfig>) => void;
  getConfig: () => FluidConfig;
  destroy: () => void;
}
