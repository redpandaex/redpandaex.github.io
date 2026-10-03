/**
 * WebGL 着色器程序管理
 */

import { hashCode } from "./config";
import type { Material, ShaderProgram, UniformLocations } from "./types";

type GL = WebGLRenderingContext | WebGL2RenderingContext;

// 编译着色器
export function compileShader(
  gl: GL,
  type: number,
  source: string,
  keywords?: string[] | null,
): WebGLShader {
  const processedSource = addKeywords(source, keywords);
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Failed to create shader");
  }

  gl.shaderSource(shader, processedSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation error: ${info}`);
  }

  return shader;
}

// 添加关键字预处理
function addKeywords(source: string, keywords?: string[] | null): string {
  if (!keywords || keywords.length === 0) return source;

  const keywordsString = keywords
    .map((keyword) => `#define ${keyword}\n`)
    .join("");

  return keywordsString + source;
}

// 创建着色器程序
export function createProgram(
  gl: GL,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram {
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Failed to create program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }

  return program;
}

// 获取 uniform 位置
export function getUniforms(gl: GL, program: WebGLProgram): UniformLocations {
  const uniforms: UniformLocations = {};
  const uniformCount = gl.getProgramParameter(
    program,
    gl.ACTIVE_UNIFORMS,
  ) as number;

  for (let i = 0; i < uniformCount; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
  }

  return uniforms;
}

// 创建着色器程序对象
export function createShaderProgram(
  gl: GL,
  vertexShaderSource: string,
  fragmentShaderSource: string,
  keywords?: string[] | null,
): ShaderProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
    keywords,
  );
  const program = createProgram(gl, vertexShader, fragmentShader);
  const uniforms = getUniforms(gl, program);

  return {
    program,
    uniforms,
    bind() {
      // biome-ignore lint/correctness/useHookAtTopLevel: This is the WebGL API, not a React hook.
      gl.useProgram(this.program);
    },
  };
}

// 创建材质（支持动态关键字）
export function createMaterial(
  gl: GL,
  vertexShaderSource: string,
  fragmentShaderSource: string,
): Material {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const programs = new Map<number, WebGLProgram>();

  const material: Material = {
    vertexShader,
    fragmentShaderSource,
    programs,
    activeProgram: null,
    uniforms: {},

    setKeywords(keywords: string[]) {
      let hash = 0;
      for (const keyword of keywords) {
        hash += hashCode(keyword);
      }

      let program = programs.get(hash);
      if (!program) {
        const fragmentShader = compileShader(
          gl,
          gl.FRAGMENT_SHADER,
          this.fragmentShaderSource,
          keywords,
        );
        program = createProgram(gl, this.vertexShader, fragmentShader);
        programs.set(hash, program);
      }

      if (program === this.activeProgram) return;

      this.uniforms = getUniforms(gl, program);
      this.activeProgram = program;
    },

    bind() {
      if (this.activeProgram) {
        // biome-ignore lint/correctness/useHookAtTopLevel: This is the WebGL API, not a React hook.
        gl.useProgram(this.activeProgram);
      }
    },
  };

  return material;
}

// FBO target 类型，支持 null（屏幕）、FBO 对象或原始 WebGLFramebuffer
export type BlitTarget =
  | null
  | { fbo: WebGLFramebuffer; width: number; height: number }
  | WebGLFramebuffer;

// 初始化 blit 缓冲区（全屏四边形渲染）
export function initBlit(
  gl: GL,
): (destination: BlitTarget, clear?: boolean) => void {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
    gl.STATIC_DRAW,
  );

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array([0, 1, 2, 0, 2, 3]),
    gl.STATIC_DRAW,
  );

  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  return (destination: BlitTarget, clear = false) => {
    if (destination === null) {
      // 渲染到屏幕
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else if (
      typeof destination === "object" &&
      "fbo" in destination &&
      "width" in destination
    ) {
      // FBO 对象
      gl.viewport(0, 0, destination.width, destination.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination.fbo);
    } else {
      // 原始 WebGLFramebuffer（兼容旧代码）
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
    }

    if (clear) {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };
}
