import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";
import { measureGlyphs } from "./glyphs";

// A local lens on a raster of the DOM title; the DOM remains the text source.
const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;
const fragment = `
precision highp float;
uniform sampler2D uText;
uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uHover;
uniform vec3 uBackdrop;
varying vec2 vUv;
void main() {
  vec2 delta = (vUv - uPointer) * uSize;
  float radius = min(uSize.x * 0.24, 155.0);
  float distance = length(delta);
  float lens = 1.0 - smoothstep(0.0, radius, distance);
  vec2 direction = delta / max(distance, 1.0);
  vec2 offset = delta * lens * lens * 0.88 * uHover / uSize;
  float dispersion = min(radius * 0.065, 10.0) * lens * uHover;
  dispersion *= smoothstep(0.0, radius * 0.12, distance);
  vec2 split = direction * dispersion / uSize;
  vec3 ink = vec3(0.0);
  vec3 coverage = vec3(0.0);
  vec3 weights = vec3(0.0);
  // Overlapping wavelength bands soften the transitions between the fringes.
  for (int sampleIndex = 0; sampleIndex < 7; sampleIndex++) {
    float wavelength = float(sampleIndex) / 3.0 - 1.0;
    vec3 band = max(vec3(0.0), vec3(1.0) -
      abs(vec3(wavelength) - vec3(-0.65, 0.0, 0.65)) * 1.65);
    vec2 refracted = vUv - offset - split * wavelength;
    vec4 sampleColor = texture2D(uText, refracted);
    coverage += sampleColor.a * band;
    ink += sampleColor.rgb * sampleColor.a * band;
    weights += band;
  }
  ink /= weights;
  coverage /= weights;
  float alpha = max(coverage.r, max(coverage.g, coverage.b));
  // Each wavelength covers a different part of the backdrop. Keeping that
  // coverage separate produces both additive fringes on dark backgrounds
  // and complementary fringes around dark ink on light backgrounds.
  vec3 light = ink + (vec3(alpha) - coverage) * uBackdrop;
  float highlight = lens * (1.0 - lens) * uHover * 0.20;
  light += vec3(highlight * coverage.g);
  gl_FragColor = vec4(min(light, vec3(alpha)), alpha);
}`;

export function createWarp({
  stage,
  title,
  canvas,
  onAvailable,
}: {
  stage: HTMLElement;
  title: HTMLElement;
  canvas: HTMLCanvasElement;
  onAvailable: (available: boolean) => void;
}) {
  const attributes = {
    alpha: true,
    antialias: false,
    depth: false,
    powerPreference: "low-power" as const,
  };
  const available =
    canvas.getContext("webgl2", attributes) ||
    canvas.getContext("webgl", attributes);
  if (!available) throw new Error("WebGL is unavailable");
  const renderer = new Renderer({
    canvas,
    alpha: true,
    antialias: false,
    depth: false,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    powerPreference: "low-power",
  });
  const gl = renderer.gl;
  const image = document.createElement("canvas");
  const context = image.getContext("2d");
  if (!context) throw new Error("Canvas text is unavailable");
  const swatch = document.createElement("canvas");
  swatch.width = swatch.height = 1;
  const swatchContext = swatch.getContext("2d", { willReadFrequently: true });
  if (!swatchContext) throw new Error("Canvas colors are unavailable");
  const texture = new Texture(gl, {
    image,
    generateMipmaps: false,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
  });
  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    cullFace: false,
    uniforms: {
      uText: { value: texture },
      uSize: { value: [1, 1] },
      uPointer: { value: [0.5, 0.5] },
      uHover: { value: 0 },
      uBackdrop: { value: [1, 1, 1] },
    },
  });
  const mesh = new Mesh(gl, { geometry, program });
  let paused = true;
  let disposed = false;
  let failed = false;
  let frame = 0;
  let width = 1;
  let height = 1;
  let last = 0;
  let intro = 0;
  let touched = false;
  let targetX = 0.5;
  let targetY = 0.5;
  let targetHover = 0;

  const draw = (now: number) => {
    frame = 0;
    if (paused || disposed || failed) return;
    const dt = last ? Math.min(now - last, 40) : 16;
    last = now;
    if (!touched && intro < 1350) {
      intro += dt;
      const progress = Math.min(intro / 1350, 1);
      targetX = 0.12 + progress * 0.76;
      targetY = 0.65 - progress * 0.3;
      targetHover = Math.sin(progress * Math.PI) * 0.95;
    }
    const point = program.uniforms.uPointer.value as number[];
    const ease = 1 - Math.exp(-dt / 65);
    point[0] += (targetX - point[0]) * ease;
    point[1] += (targetY - point[1]) * ease;
    program.uniforms.uHover.value +=
      (targetHover - program.uniforms.uHover.value) * ease;
    renderer.render({ scene: mesh });
    if (
      (!touched && intro < 1350) ||
      Math.abs(point[0] - targetX) +
        Math.abs(point[1] - targetY) +
        Math.abs(program.uniforms.uHover.value - targetHover) >
        0.001
    ) {
      frame = requestAnimationFrame(draw);
    }
  };
  const wake = () => {
    if (!paused && !disposed && !failed && !frame) {
      last = 0;
      frame = requestAnimationFrame(draw);
    }
  };
  const move = (event: PointerEvent) => {
    if (paused || event.pointerType === "touch") return;
    const rect = stage.getBoundingClientRect();
    touched = true;
    targetX = (event.clientX - rect.left) / width;
    targetY = 1 - (event.clientY - rect.top) / height;
    targetHover = 1;
    wake();
  };
  const leave = () => {
    touched = true;
    targetHover = 0;
    wake();
  };
  const refresh = () => {
    if (disposed || failed || gl.isContextLost()) return;
    width = stage.clientWidth;
    height = stage.clientHeight;
    if (!width || !height) return;
    swatchContext.clearRect(0, 0, 1, 1);
    swatchContext.fillStyle = getComputedStyle(document.body).backgroundColor;
    swatchContext.fillRect(0, 0, 1, 1);
    const backdrop = swatchContext.getImageData(0, 0, 1, 1).data;
    program.uniforms.uBackdrop.value = [
      backdrop[0] / 255,
      backdrop[1] / 255,
      backdrop[2] / 255,
    ];
    renderer.setSize(width, height);
    image.width = Math.round(width * renderer.dpr);
    image.height = Math.round(height * renderer.dpr);
    context.setTransform(renderer.dpr, 0, 0, renderer.dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.textBaseline = "alphabetic";
    for (const glyph of measureGlyphs(stage, title)) {
      context.font = glyph.font;
      context.fillStyle = glyph.color;
      context.fillText(glyph.text, glyph.x, glyph.baseline);
    }
    texture.image = image;
    texture.needsUpdate = true;
    program.uniforms.uSize.value = [width, height];
    renderer.render({ scene: mesh });
    onAvailable(true);
    wake();
  };
  const lost = (event: Event) => {
    event.preventDefault();
    // Restored contexts invalidate GPU objects; keep the readable DOM fallback.
    failed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    onAvailable(false);
  };
  canvas.addEventListener("webglcontextlost", lost);
  stage.addEventListener("pointermove", move, { passive: true });
  stage.addEventListener("pointerleave", leave, { passive: true });
  refresh();
  return {
    refresh,
    setPaused(value: boolean) {
      paused = value;
      if (paused) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else wake();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", lost);
      geometry.remove();
      gl.deleteTexture(texture.texture);
      gl.deleteProgram(program.program);
    },
  };
}
