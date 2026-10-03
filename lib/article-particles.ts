import * as THREE from "three";
import { readInkColors } from "./studio-palettes";
import type { TextCloud } from "./text-cloud";

export function createArticleParticles(
  canvas: HTMLCanvasElement,
  source: TextCloud,
  done: () => void,
  reveal: () => void,
) {
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!context) throw new Error("WebGL 2 is unavailable");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: false,
  });
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0, 0);
  const camera = new THREE.OrthographicCamera(
    0,
    window.innerWidth,
    0,
    window.innerHeight,
    0.1,
    30,
  );
  camera.position.z = 10;
  const scene = new THREE.Scene();
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const count = Math.min(coarse ? 6000 : 10000, source.positions.length / 2);
  const positions = new Float32Array(count * 3);
  const origins = new Float32Array(count * 2);
  const destinations = new Float32Array(count * 2);
  const baseColors = new Float32Array(count * 3);
  const targetColors = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const accent = readInkColors().map((hex) => new THREE.Color(hex));
  const color = new THREE.Color();
  const sample = (cloud: TextCloud, xy: Float32Array, rgb: Float32Array) => {
    const total = cloud.positions.length / 2;
    for (let i = 0; i < count; i++) {
      const index = Math.min(total - 1, Math.floor((i / count) * total));
      xy[i * 2] = cloud.positions[index * 2];
      xy[i * 2 + 1] = cloud.positions[index * 2 + 1];
      color.setRGB(
        cloud.colors[index * 3] / 255,
        cloud.colors[index * 3 + 1] / 255,
        cloud.colors[index * 3 + 2] / 255,
        THREE.SRGBColorSpace,
      );
      rgb[i * 3] = color.r;
      rgb[i * 3 + 1] = color.g;
      rgb[i * 3 + 2] = color.b;
    }
  };
  sample(source, origins, baseColors);
  destinations.set(origins);
  targetColors.set(baseColors);
  colors.set(baseColors);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = origins[i * 2];
    positions[i * 3 + 1] = origins[i * 2 + 1];
    seeds[i] = (Math.sin(i * 127.1 + 91.7) * 43758.5453 + 1) % 1;
    seeds[i] = Math.abs(seeds[i]);
  }
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(
    THREE.DynamicDrawUsage,
  );
  const colorAttribute = new THREE.BufferAttribute(colors, 3).setUsage(
    THREE.DynamicDrawUsage,
  );
  geometry.setAttribute("position", positionAttribute);
  geometry.setAttribute("color", colorAttribute);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    vertexColors: true,
    uniforms: {
      uDpr: { value: dpr },
      uOpacity: { value: 1 },
      uSize: { value: 2.5 },
    },
    vertexShader: `
      uniform float uDpr;
      uniform float uSize;
      varying vec3 vInk;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * uDpr;
        vInk = color;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vInk;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        if (r > 1.0) discard;
        gl_FragColor = vec4(vInk, (1.0 - smoothstep(0.5, 1.0, r)) * uOpacity);
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  let frame = 0;
  let disposed = false;
  let targetTime: number | null = null;
  let revealed = false;
  const began = performance.now();
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const draw = (now: number) => {
    if (disposed) return;
    const elapsed = now - began;
    const progress =
      targetTime === null ? 0 : Math.min(1, (now - targetTime) / 820);
    const travel = smooth(progress);
    const scatter = smooth(Math.min(1, elapsed / 240)) * (1 - travel);
    const bend = Math.sin(travel * Math.PI);
    for (let i = 0; i < count; i++) {
      const seed = seeds[i];
      const angle = seed * Math.PI * 2;
      const radius = scatter * (14 + seed * 38);
      positions[i * 3] =
        origins[i * 2] +
        (destinations[i * 2] - origins[i * 2]) * travel +
        Math.cos(angle + elapsed * 0.001) * radius +
        bend * (seed - 0.5) * 110;
      positions[i * 3 + 1] =
        origins[i * 2 + 1] +
        (destinations[i * 2 + 1] - origins[i * 2 + 1]) * travel +
        Math.sin(angle + elapsed * 0.001) * radius -
        bend * (40 + seed * 110);
      const ink = accent[i % accent.length];
      const heat = Math.min(0.7, scatter * 0.5 + bend * 0.3);
      for (let channel = 0; channel < 3; channel++) {
        const base =
          baseColors[i * 3 + channel] * (1 - travel) +
          targetColors[i * 3 + channel] * travel;
        const tint = channel === 0 ? ink.r : channel === 1 ? ink.g : ink.b;
        colors[i * 3 + channel] = base * (1 - heat) + tint * heat;
      }
    }
    if (progress > 0.86 && !revealed) {
      revealed = true;
      reveal();
    }
    material.uniforms.uOpacity.value =
      progress > 0.86 ? (1 - progress) / 0.14 : 1;
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    renderer.render(scene, camera);
    if (progress >= 1 || elapsed > 4200) {
      done();
      return;
    }
    frame = requestAnimationFrame(draw);
  };
  const cancel = () => done();
  const hidden = () => {
    if (document.hidden) done();
  };
  const escape = (event: KeyboardEvent) => {
    if (event.key === "Escape") done();
  };
  const lost = (event: Event) => {
    event.preventDefault();
    done();
  };
  canvas.addEventListener("webglcontextlost", lost);
  window.addEventListener("resize", cancel);
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchmove", cancel, { passive: true });
  document.addEventListener("visibilitychange", hidden);
  document.addEventListener("keydown", escape);
  try {
    renderer.render(scene, camera);
    frame = requestAnimationFrame(draw);
  } catch (error) {
    dispose();
    throw error;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    canvas.removeEventListener("webglcontextlost", lost);
    window.removeEventListener("resize", cancel);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchmove", cancel);
    document.removeEventListener("visibilitychange", hidden);
    document.removeEventListener("keydown", escape);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }
  return {
    gather(target: TextCloud) {
      if (disposed) return;
      sample(target, destinations, targetColors);
      targetTime = performance.now();
    },
    dispose,
  };
}
