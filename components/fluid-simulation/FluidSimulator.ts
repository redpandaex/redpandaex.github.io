/**
 * 流体模拟核心类
 */

import { defaultConfig, generateColor, normalizeColor } from "./engine/config";
import {
  createDoubleFBO,
  createFBO,
  getResolution,
  getTextureFormats,
} from "./engine/framebuffers";
import {
  createPointer,
  findPointerById,
  scaleByPixelRatio,
  updatePointerDownData,
  updatePointerMoveData,
  updatePointerUpData,
} from "./engine/pointers";
import {
  type BlitTarget,
  createMaterial,
  createShaderProgram,
  initBlit,
} from "./engine/programs";
import * as Shaders from "./engine/shaders";
import type {
  DoubleFBO,
  FBO,
  Material,
  Pointer,
  RGBColor,
  ShaderProgram,
  SimulationConfig,
  TextureFormats,
} from "./engine/types";
import { getWebGLContext, isMobile } from "./engine/webgl-context";

type GL = WebGLRenderingContext | WebGL2RenderingContext;

export class FluidSimulator {
  private canvas: HTMLCanvasElement;
  private gl: GL;
  private config: SimulationConfig;
  private pointers: Pointer[] = [];
  private splatStack: number[] = [];

  // 着色器程序
  private blurProgram!: ShaderProgram;
  private clearProgram!: ShaderProgram;
  private colorProgram!: ShaderProgram;
  private checkerboardProgram!: ShaderProgram;
  private bloomPrefilterProgram!: ShaderProgram;
  private bloomBlurProgram!: ShaderProgram;
  private bloomFinalProgram!: ShaderProgram;
  private sunraysMaskProgram!: ShaderProgram;
  private sunraysProgram!: ShaderProgram;
  private splatProgram!: ShaderProgram;
  private advectionProgram!: Material;
  private divergenceProgram!: ShaderProgram;
  private curlProgram!: ShaderProgram;
  private vorticityProgram!: ShaderProgram;
  private pressureProgram!: ShaderProgram;
  private gradientSubtractProgram!: ShaderProgram;
  private displayMaterial!: Material;

  // 帧缓冲区
  private dye!: DoubleFBO;
  private velocity!: DoubleFBO;
  private divergence!: FBO;
  private curl!: FBO;
  private pressure!: DoubleFBO;
  private bloom!: FBO;
  private bloomFramebuffers: FBO[] = [];
  private sunrays!: FBO;
  private sunraysTemp!: FBO;

  // 纹理格式
  private formats!: TextureFormats;
  private supportLinearFiltering = true;

  // 渲染函数
  private blit!: (destination: BlitTarget, clear?: boolean) => void;

  // 动画帧 ID
  private animationFrameId: number | null = null;
  private lastUpdateTime = Date.now();
  private colorUpdateTimer = 0;

  constructor(
    canvas: HTMLCanvasElement,
    customConfig?: Partial<SimulationConfig>,
  ) {
    this.canvas = canvas;
    this.config = { ...defaultConfig, ...customConfig };

    // 移动端优化
    if (isMobile()) {
      this.config.DYE_RESOLUTION = 512;
    }

    // 初始化 WebGL
    const context = getWebGLContext(canvas);
    if (!context) {
      throw new Error("WebGL is not supported");
    }

    this.gl = context.gl;
    this.supportLinearFiltering = !!context.ext.supportLinearFiltering;

    // 初始化
    this.blit = initBlit(this.gl);
    this.formats = getTextureFormats(
      this.gl,
      context.ext.halfFloatTexType,
      this.supportLinearFiltering,
    );
    this.initPrograms();
    this.initFramebuffers();

    // 创建默认指针
    this.pointers.push(createPointer());

    // 初始随机飞溅
    this.multipleSplats(Math.floor(Math.random() * 20) + 5);
  }

  private initPrograms(): void {
    const gl = this.gl;
    const supportLinearFiltering = this.supportLinearFiltering;

    this.blurProgram = createShaderProgram(
      gl,
      Shaders.blurVertexShaderSource,
      Shaders.blurShaderSource,
    );
    this.clearProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.clearShaderSource,
    );
    this.colorProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.colorShaderSource,
    );
    this.checkerboardProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.checkerboardShaderSource,
    );
    this.bloomPrefilterProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.bloomPrefilterShaderSource,
    );
    this.bloomBlurProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.bloomBlurShaderSource,
    );
    this.bloomFinalProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.bloomFinalShaderSource,
    );
    this.sunraysMaskProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.sunraysMaskShaderSource,
    );
    this.sunraysProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.sunraysShaderSource,
    );
    this.splatProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.splatShaderSource,
    );
    this.divergenceProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.divergenceShaderSource,
    );
    this.curlProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.curlShaderSource,
    );
    this.vorticityProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.vorticityShaderSource,
    );
    this.pressureProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.pressureShaderSource,
    );
    this.gradientSubtractProgram = createShaderProgram(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.gradientSubtractShaderSource,
    );

    this.advectionProgram = createMaterial(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.advectionShaderSource,
    );
    this.displayMaterial = createMaterial(
      gl,
      Shaders.baseVertexShaderSource,
      Shaders.displayShaderSource,
    );

    // 设置 advection 关键字
    this.advectionProgram.setKeywords(
      supportLinearFiltering ? [] : ["MANUAL_FILTERING"],
    );
  }

  private initFramebuffers(): void {
    const gl = this.gl;
    const formats = this.formats;

    const simRes = getResolution(gl, this.config.SIM_RESOLUTION);
    const dyeRes = getResolution(gl, this.config.DYE_RESOLUTION);

    const texType = formats.halfFloatType;
    const rgba = formats.rgba;
    const rg = formats.rg;
    const r = formats.r;
    const filtering = formats.filterType;

    gl.disable(gl.BLEND);

    // 速度场
    this.velocity = createDoubleFBO(
      gl,
      simRes.width,
      simRes.height,
      rg.internalFormat,
      rg.format,
      texType,
      filtering,
    );

    // 染料场
    this.dye = createDoubleFBO(
      gl,
      dyeRes.width,
      dyeRes.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering,
    );

    // 散度场
    this.divergence = createFBO(
      gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST,
    );

    // 旋度场
    this.curl = createFBO(
      gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST,
    );

    // 压力场
    this.pressure = createDoubleFBO(
      gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST,
    );

    this.initBloomFramebuffers();
    this.initSunraysFramebuffers();
  }

  private initBloomFramebuffers(): void {
    const gl = this.gl;
    const formats = this.formats;
    const rgba = formats.rgba;
    const texType = formats.halfFloatType;
    const filtering = formats.filterType;

    const res = getResolution(gl, this.config.BLOOM_RESOLUTION);

    this.bloom = createFBO(
      gl,
      res.width,
      res.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering,
    );

    this.bloomFramebuffers = [];
    for (let i = 0; i < this.config.BLOOM_ITERATIONS; i++) {
      const width = res.width >> (i + 1);
      const height = res.height >> (i + 1);

      if (width < 2 || height < 2) break;

      const fbo = createFBO(
        gl,
        width,
        height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering,
      );
      this.bloomFramebuffers.push(fbo);
    }
  }

  private initSunraysFramebuffers(): void {
    const gl = this.gl;
    const formats = this.formats;
    const r = formats.r;
    const texType = formats.halfFloatType;
    const filtering = formats.filterType;

    const res = getResolution(gl, this.config.SUNRAYS_RESOLUTION);

    this.sunrays = createFBO(
      gl,
      res.width,
      res.height,
      r.internalFormat,
      r.format,
      texType,
      filtering,
    );

    this.sunraysTemp = createFBO(
      gl,
      res.width,
      res.height,
      r.internalFormat,
      r.format,
      texType,
      filtering,
    );
  }

  private updateKeywords(): void {
    const keywords: string[] = [];
    if (this.config.SHADING) keywords.push("SHADING");
    if (this.config.BLOOM) keywords.push("BLOOM");
    if (this.config.SUNRAYS) keywords.push("SUNRAYS");
    this.displayMaterial.setKeywords(keywords);
  }

  public start(): void {
    if (this.animationFrameId !== null) return;
    this.lastUpdateTime = Date.now();
    this.updateKeywords();
    this.update();
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private update = (): void => {
    const dt = this.calcDeltaTime();

    if (this.resizeCanvas()) {
      this.initFramebuffers();
    }

    this.updateColors(dt);
    this.applyInputs();

    if (!this.config.PAUSED) {
      this.step(dt);
    }

    this.render(null);

    this.animationFrameId = requestAnimationFrame(this.update);
  };

  private calcDeltaTime(): number {
    const now = Date.now();
    let dt = (now - this.lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    this.lastUpdateTime = now;
    return dt;
  }

  private resizeCanvas(): boolean {
    const width = scaleByPixelRatio(this.canvas.clientWidth);
    const height = scaleByPixelRatio(this.canvas.clientHeight);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      return true;
    }
    return false;
  }

  private updateColors(dt: number): void {
    if (!this.config.COLORFUL) return;

    this.colorUpdateTimer += dt * this.config.COLOR_UPDATE_SPEED;
    if (this.colorUpdateTimer >= 1) {
      this.colorUpdateTimer = this.wrap(this.colorUpdateTimer, 0, 1);
      this.pointers.forEach((p) => {
        p.color = generateColor();
      });
    }
  }

  private wrap(value: number, min: number, max: number): number {
    const range = max - min;
    if (range === 0) return min;
    return ((((value - min) % range) + range) % range) + min;
  }

  private applyInputs(): void {
    if (this.splatStack.length > 0) {
      const count = this.splatStack.pop();
      if (count !== undefined) {
        this.multipleSplats(count);
      }
    }

    this.pointers.forEach((p) => {
      if (p.moved) {
        p.moved = false;
        this.splatPointer(p);
      }
    });
  }

  private step(dt: number): void {
    const gl = this.gl;

    gl.disable(gl.BLEND);

    // 计算旋度
    this.curlProgram.bind();
    gl.uniform2f(
      this.curlProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    gl.uniform1i(
      this.curlProgram.uniforms.uVelocity,
      this.velocity.read.attach(0),
    );
    this.blit(this.curl);

    // 应用涡度
    this.vorticityProgram.bind();
    gl.uniform2f(
      this.vorticityProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    gl.uniform1i(
      this.vorticityProgram.uniforms.uVelocity,
      this.velocity.read.attach(0),
    );
    gl.uniform1i(this.vorticityProgram.uniforms.uCurl, this.curl.attach(1));
    gl.uniform1f(this.vorticityProgram.uniforms.curl, this.config.CURL);
    gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
    this.blit(this.velocity.write);
    this.velocity.swap();

    // 计算散度
    this.divergenceProgram.bind();
    gl.uniform2f(
      this.divergenceProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    gl.uniform1i(
      this.divergenceProgram.uniforms.uVelocity,
      this.velocity.read.attach(0),
    );
    this.blit(this.divergence);

    // 清除压力场
    this.clearProgram.bind();
    gl.uniform1i(
      this.clearProgram.uniforms.uTexture,
      this.pressure.read.attach(0),
    );
    gl.uniform1f(this.clearProgram.uniforms.value, this.config.PRESSURE);
    this.blit(this.pressure.write);
    this.pressure.swap();

    // 求解压力（Jacobi 迭代）
    this.pressureProgram.bind();
    gl.uniform2f(
      this.pressureProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    gl.uniform1i(
      this.pressureProgram.uniforms.uDivergence,
      this.divergence.attach(0),
    );
    for (let i = 0; i < this.config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(
        this.pressureProgram.uniforms.uPressure,
        this.pressure.read.attach(1),
      );
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    // 减去压力梯度
    this.gradientSubtractProgram.bind();
    gl.uniform2f(
      this.gradientSubtractProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    gl.uniform1i(
      this.gradientSubtractProgram.uniforms.uPressure,
      this.pressure.read.attach(0),
    );
    gl.uniform1i(
      this.gradientSubtractProgram.uniforms.uVelocity,
      this.velocity.read.attach(1),
    );
    this.blit(this.velocity.write);
    this.velocity.swap();

    // 速度平流
    this.advectionProgram.bind();
    gl.uniform2f(
      this.advectionProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    if (!this.supportLinearFiltering) {
      gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
    }
    gl.uniform1i(
      this.advectionProgram.uniforms.uVelocity,
      this.velocity.read.attach(0),
    );
    gl.uniform1i(
      this.advectionProgram.uniforms.uSource,
      this.velocity.read.attach(0),
    );
    gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
    gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      this.config.VELOCITY_DISSIPATION,
    );
    this.blit(this.velocity.write);
    this.velocity.swap();

    // 染料平流
    if (!this.supportLinearFiltering) {
      gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.dye.texelSizeX,
        this.dye.texelSizeY,
      );
    }
    gl.uniform1i(
      this.advectionProgram.uniforms.uVelocity,
      this.velocity.read.attach(0),
    );
    gl.uniform1i(
      this.advectionProgram.uniforms.uSource,
      this.dye.read.attach(1),
    );
    gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      this.config.DENSITY_DISSIPATION,
    );
    this.blit(this.dye.write);
    this.dye.swap();
  }

  private render(target: FBO | null): void {
    const gl = this.gl;

    if (this.config.BLOOM) {
      this.applyBloom(this.dye.read, this.bloom);
    }
    if (this.config.SUNRAYS) {
      this.applySunrays(this.dye.read, this.dye.write, this.sunrays);
      this.blur(this.sunrays, this.sunraysTemp, 1);
    }

    if (target === null || !this.config.TRANSPARENT) {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
    } else {
      gl.disable(gl.BLEND);
    }

    if (!this.config.TRANSPARENT) {
      this.drawColor(target, normalizeColor(this.config.BACK_COLOR));
    }

    if (target === null && this.config.TRANSPARENT) {
      this.drawCheckerboard(target);
    }

    this.drawDisplay(target);
  }

  private drawColor(target: FBO | null, color: RGBColor): void {
    const gl = this.gl;
    this.colorProgram.bind();
    gl.uniform4f(
      this.colorProgram.uniforms.color,
      color.r,
      color.g,
      color.b,
      1,
    );
    this.blit(target);
  }

  private drawCheckerboard(target: FBO | null): void {
    const gl = this.gl;
    this.checkerboardProgram.bind();
    gl.uniform1f(
      this.checkerboardProgram.uniforms.aspectRatio,
      this.canvas.width / this.canvas.height,
    );
    this.blit(target);
  }

  private drawDisplay(target: FBO | null): void {
    const gl = this.gl;
    const width = target ? target.width : gl.drawingBufferWidth;
    const height = target ? target.height : gl.drawingBufferHeight;

    this.displayMaterial.bind();
    if (this.config.SHADING) {
      gl.uniform2f(
        this.displayMaterial.uniforms.texelSize,
        1.0 / width,
        1.0 / height,
      );
    }
    gl.uniform1i(
      this.displayMaterial.uniforms.uTexture,
      this.dye.read.attach(0),
    );
    if (this.config.BLOOM) {
      gl.uniform1i(this.displayMaterial.uniforms.uBloom, this.bloom.attach(1));
      gl.uniform1i(
        this.displayMaterial.uniforms.uDithering,
        this.dye.read.attach(2),
      );
      gl.uniform2f(
        this.displayMaterial.uniforms.ditherScale,
        width / 8,
        height / 8,
      );
    }
    if (this.config.SUNRAYS) {
      gl.uniform1i(
        this.displayMaterial.uniforms.uSunrays,
        this.sunrays.attach(3),
      );
    }
    this.blit(target);
  }

  private applyBloom(source: FBO, destination: FBO): void {
    const gl = this.gl;
    if (this.bloomFramebuffers.length < 2) return;

    let last = destination;

    gl.disable(gl.BLEND);
    this.bloomPrefilterProgram.bind();
    const knee =
      this.config.BLOOM_THRESHOLD * this.config.BLOOM_SOFT_KNEE + 0.0001;
    const curve0 = this.config.BLOOM_THRESHOLD - knee;
    const curve1 = knee * 2;
    const curve2 = 0.25 / knee;
    gl.uniform3f(
      this.bloomPrefilterProgram.uniforms.curve,
      curve0,
      curve1,
      curve2,
    );
    gl.uniform1f(
      this.bloomPrefilterProgram.uniforms.threshold,
      this.config.BLOOM_THRESHOLD,
    );
    gl.uniform1i(
      this.bloomPrefilterProgram.uniforms.uTexture,
      source.attach(0),
    );
    this.blit(last);

    this.bloomBlurProgram.bind();
    for (const dest of this.bloomFramebuffers) {
      gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY,
      );
      gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0));
      this.blit(dest);
      last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (let i = this.bloomFramebuffers.length - 2; i >= 0; i--) {
      const baseTex = this.bloomFramebuffers[i];
      gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY,
      );
      gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0));
      this.blit(baseTex);
      last = baseTex;
    }

    gl.disable(gl.BLEND);
    this.bloomFinalProgram.bind();
    gl.uniform2f(
      this.bloomFinalProgram.uniforms.texelSize,
      last.texelSizeX,
      last.texelSizeY,
    );
    gl.uniform1i(this.bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(
      this.bloomFinalProgram.uniforms.intensity,
      this.config.BLOOM_INTENSITY,
    );
    this.blit(destination);
  }

  private applySunrays(source: FBO, mask: FBO, destination: FBO): void {
    const gl = this.gl;
    gl.disable(gl.BLEND);

    this.sunraysMaskProgram.bind();
    gl.uniform1i(this.sunraysMaskProgram.uniforms.uTexture, source.attach(0));
    this.blit(mask);

    this.sunraysProgram.bind();
    gl.uniform1f(
      this.sunraysProgram.uniforms.weight,
      this.config.SUNRAYS_WEIGHT,
    );
    gl.uniform1i(this.sunraysProgram.uniforms.uTexture, mask.attach(0));
    this.blit(destination);
  }

  private blur(target: FBO, temp: FBO, iterations: number): void {
    const gl = this.gl;
    this.blurProgram.bind();

    for (let i = 0; i < iterations; i++) {
      gl.uniform2f(this.blurProgram.uniforms.texelSize, target.texelSizeX, 0);
      gl.uniform1i(this.blurProgram.uniforms.uTexture, target.attach(0));
      this.blit(temp);

      gl.uniform2f(this.blurProgram.uniforms.texelSize, 0, target.texelSizeY);
      gl.uniform1i(this.blurProgram.uniforms.uTexture, temp.attach(0));
      this.blit(target);
    }
  }

  // 飞溅效果
  private splat(
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: RGBColor,
  ): void {
    const gl = this.gl;

    this.splatProgram.bind();
    gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.velocity.read.attach(0),
    );
    gl.uniform1f(
      this.splatProgram.uniforms.aspectRatio,
      this.canvas.width / this.canvas.height,
    );
    gl.uniform2f(this.splatProgram.uniforms.point, x, y);
    gl.uniform3f(this.splatProgram.uniforms.color, dx, dy, 0);
    gl.uniform1f(
      this.splatProgram.uniforms.radius,
      this.correctRadius(this.config.SPLAT_RADIUS / 100),
    );
    this.blit(this.velocity.write);
    this.velocity.swap();

    gl.uniform1i(this.splatProgram.uniforms.uTarget, this.dye.read.attach(0));
    gl.uniform3f(this.splatProgram.uniforms.color, color.r, color.g, color.b);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  private splatPointer(pointer: Pointer): void {
    const dx = pointer.deltaX * this.config.SPLAT_FORCE;
    const dy = pointer.deltaY * this.config.SPLAT_FORCE;
    this.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
  }

  private multipleSplats(amount: number): void {
    for (let i = 0; i < amount; i++) {
      const color = generateColor();
      const x = Math.random();
      const y = Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);
      this.splat(x, y, dx, dy, color);
    }
  }

  private correctRadius(radius: number): number {
    const aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio > 1) {
      radius *= aspectRatio;
    }
    return radius;
  }

  // 公共 API
  public addSplats(count: number): void {
    this.splatStack.push(count);
  }

  public handlePointerDown(id: number, posX: number, posY: number): void {
    const pointer = this.pointers.find((p) => p.id === -1) || this.pointers[0];
    updatePointerDownData(
      pointer,
      id,
      posX,
      posY,
      this.canvas.width,
      this.canvas.height,
    );
  }

  public handlePointerMove(id: number, posX: number, posY: number): void {
    const pointer = findPointerById(this.pointers, id);
    if (!pointer) return;
    updatePointerMoveData(
      pointer,
      posX,
      posY,
      this.canvas.width,
      this.canvas.height,
    );
  }

  public handlePointerUp(id: number): void {
    const pointer = findPointerById(this.pointers, id);
    if (!pointer) return;
    updatePointerUpData(pointer);
  }

  public setConfig(config: Partial<SimulationConfig>): void {
    Object.assign(this.config, config);
    this.updateKeywords();
  }

  public getConfig(): SimulationConfig {
    return { ...this.config };
  }

  public destroy(): void {
    this.stop();
    // 清理 WebGL 资源
    const gl = this.gl;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
