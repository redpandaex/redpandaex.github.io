/**
 * WebGL 上下文初始化
 */

import type { Resolution, TextureFormat, WebGLContextResult } from "./types";

type GL = WebGLRenderingContext | WebGL2RenderingContext;

// 检测 WebGL2
function isWebGL2Context(gl: GL): gl is WebGL2RenderingContext {
  return "createVertexArray" in gl;
}

// 检测是否为移动设备
export function isMobile(): boolean {
  return /Mobi|Android/i.test(navigator.userAgent);
}

// 获取支持的渲染纹理格式
export function getSupportedFormat(
  gl: GL,
  internalFormat: number,
  format: number,
  type: number,
): TextureFormat | null {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    // WebGL2 特定的格式回退
    if (isWebGL2Context(gl)) {
      switch (internalFormat) {
        case gl.R16F:
          return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
        case gl.RG16F:
          return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
        default:
          return null;
      }
    }
    return null;
  }
  return { internalFormat, format };
}

// 检测渲染纹理格式支持
function supportRenderTextureFormat(
  gl: GL,
  internalFormat: number,
  format: number,
  type: number,
): boolean {
  const texture = gl.createTexture();
  if (!texture) return false;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  if (!fbo) {
    gl.deleteTexture(texture);
    return false;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(texture);

  return status === gl.FRAMEBUFFER_COMPLETE;
}

// 获取 WebGL 上下文
export function getWebGLContext(
  canvas: HTMLCanvasElement,
): WebGLContextResult | null {
  const params: WebGLContextAttributes = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };

  let gl: GL | null = canvas.getContext(
    "webgl2",
    params,
  ) as WebGL2RenderingContext | null;
  const isWebGL2 = !!gl;

  if (!gl) {
    gl = (canvas.getContext("webgl", params) ||
      canvas.getContext(
        "experimental-webgl",
        params,
      )) as WebGLRenderingContext | null;
  }

  if (!gl) return null;

  let halfFloatTexType: number;
  let supportLinearFiltering: OES_texture_half_float_linear | null = null;

  if (isWebGL2) {
    gl.getExtension("EXT_color_buffer_float");
    supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
    halfFloatTexType = (gl as WebGL2RenderingContext).HALF_FLOAT;
  } else {
    const halfFloat = gl.getExtension("OES_texture_half_float");
    supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
    halfFloatTexType = halfFloat ? halfFloat.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  let formatRGBA: TextureFormat | null = null;
  let formatRG: TextureFormat | null = null;
  let formatR: TextureFormat | null = null;

  if (isWebGL2) {
    const gl2 = gl as WebGL2RenderingContext;
    formatRGBA = getSupportedFormat(
      gl2,
      gl2.RGBA16F,
      gl2.RGBA,
      halfFloatTexType,
    );
    formatRG = getSupportedFormat(gl2, gl2.RG16F, gl2.RG, halfFloatTexType);
    formatR = getSupportedFormat(gl2, gl2.R16F, gl2.RED, halfFloatTexType);
  } else {
    formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
  }

  return {
    gl,
    ext: {
      formatRGBA,
      formatRG,
      formatR,
      halfFloatTexType,
      supportLinearFiltering,
    },
    isWebGL2,
  };
}

// 获取分辨率
export function getResolution(gl: GL, resolution: number): Resolution {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if (aspectRatio < 1) {
    aspectRatio = 1.0 / aspectRatio;
  }

  const min = Math.round(resolution);
  const max = Math.round(resolution * aspectRatio);

  if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
    return { width: max, height: min };
  } else {
    return { width: min, height: max };
  }
}

// 获取纹理缩放
export function getTextureScale(
  textureWidth: number,
  textureHeight: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: width / textureWidth,
    y: height / textureHeight,
  };
}
