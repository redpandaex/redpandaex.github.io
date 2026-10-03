/**
 * WebGL 帧缓冲区管理
 */

import type {
  DoubleFBO,
  FBO,
  TextureFormats,
  WebGLContextResult,
} from "./types";

type GL = WebGLRenderingContext | WebGL2RenderingContext;

// 创建单个帧缓冲区
export function createFBO(
  gl: GL,
  width: number,
  height: number,
  internalFormat: number,
  format: number,
  type: number,
  filterParam: number,
): FBO {
  gl.activeTexture(gl.TEXTURE0);

  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Failed to create texture");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterParam);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterParam);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    internalFormat,
    width,
    height,
    0,
    format,
    type,
    null,
  );

  const fbo = gl.createFramebuffer();
  if (!fbo) {
    throw new Error("Failed to create fbo");
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    throw new Error(
      "This device cannot render the requested fluid texture format",
    );
  }
  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const texelSizeX = 1.0 / width;
  const texelSizeY = 1.0 / height;

  return {
    texture,
    fbo,
    width,
    height,
    texelSizeX,
    texelSizeY,
    attach(textureUnit: number): number {
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      return textureUnit;
    },
  };
}

// 创建双缓冲帧缓冲区（用于 ping-pong 渲染）
export function createDoubleFBO(
  gl: GL,
  width: number,
  height: number,
  internalFormat: number,
  format: number,
  type: number,
  filterParam: number,
): DoubleFBO {
  let fbo1 = createFBO(
    gl,
    width,
    height,
    internalFormat,
    format,
    type,
    filterParam,
  );
  let fbo2 = createFBO(
    gl,
    width,
    height,
    internalFormat,
    format,
    type,
    filterParam,
  );

  return {
    width,
    height,
    texelSizeX: fbo1.texelSizeX,
    texelSizeY: fbo1.texelSizeY,
    get read(): FBO {
      return fbo1;
    },
    set read(value: FBO) {
      fbo1 = value;
    },
    get write(): FBO {
      return fbo2;
    },
    set write(value: FBO) {
      fbo2 = value;
    },
    swap() {
      const temp = fbo1;
      fbo1 = fbo2;
      fbo2 = temp;
    },
  };
}

// 调整 FBO 大小
export function resizeFBO(
  gl: GL,
  fbo: FBO,
  width: number,
  height: number,
  internalFormat: number,
  format: number,
  type: number,
  filterParam: number,
  blit: (destination: WebGLFramebuffer | null) => void,
  copyProgram: {
    bind: () => void;
    uniforms: Record<string, WebGLUniformLocation | null>;
  },
): FBO {
  const newFBO = createFBO(
    gl,
    width,
    height,
    internalFormat,
    format,
    type,
    filterParam,
  );

  copyProgram.bind();
  gl.uniform1i(copyProgram.uniforms.uTexture, fbo.attach(0));
  blit(newFBO.fbo);

  return newFBO;
}

// 调整双缓冲 FBO 大小
export function resizeDoubleFBO(
  gl: GL,
  doubleFBO: DoubleFBO,
  width: number,
  height: number,
  internalFormat: number,
  format: number,
  type: number,
  filterParam: number,
  blit: (destination: WebGLFramebuffer | null) => void,
  copyProgram: {
    bind: () => void;
    uniforms: Record<string, WebGLUniformLocation | null>;
  },
): DoubleFBO {
  if (doubleFBO.width === width && doubleFBO.height === height) {
    return doubleFBO;
  }

  doubleFBO.read = resizeFBO(
    gl,
    doubleFBO.read,
    width,
    height,
    internalFormat,
    format,
    type,
    filterParam,
    blit,
    copyProgram,
  );
  doubleFBO.width = width;
  doubleFBO.height = height;
  doubleFBO.texelSizeX = 1.0 / width;
  doubleFBO.texelSizeY = 1.0 / height;

  return doubleFBO;
}

// 获取合适的纹理格式
export function getTextureFormats(context: WebGLContextResult): TextureFormats {
  const { gl, ext } = context;
  const { formatRGBA: rgba, formatRG: rg, formatR: r } = ext;
  if (!rgba || !rg || !r)
    throw new Error("Renderable floating-point textures are unavailable");
  return {
    rgba,
    rg,
    r,
    filterType: ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST,
    halfFloatType: ext.halfFloatTexType,
  };
}

// 获取模拟分辨率
export function getResolution(
  gl: GL,
  resolution: number,
): { width: number; height: number } {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;

  if (aspectRatio < 1) {
    aspectRatio = 1 / aspectRatio;
  }

  const min = Math.round(resolution);
  const max = Math.round(resolution * aspectRatio);

  if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
    return { width: max, height: min };
  }

  return { width: min, height: max };
}
