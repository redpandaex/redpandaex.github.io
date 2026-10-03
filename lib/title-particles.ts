import * as THREE from "three";

type MotionSettings = { paused: boolean; reducedMotion: boolean };
const padding = 36;
const accents = ["#3156e8", "#eb704c", "#9673df", "#abc849"];

function sampleTitle(host: HTMLElement) {
  const bounds = host.getBoundingClientRect();
  const width = Math.ceil(bounds.width + padding * 2);
  const height = Math.ceil(bounds.height + padding * 2);
  const raster = document.createElement("canvas");
  raster.width = width;
  raster.height = height;
  const context = raster.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Text sampling is unavailable");
  const lines = Array.from(
    host.querySelectorAll<HTMLElement>("[data-particle-line]"),
  );
  const colors: THREE.Color[] = [];
  for (const [index, line] of lines.entries()) {
    const style = getComputedStyle(line);
    const rect = line.getBoundingClientRect();
    colors.push(new THREE.Color(style.color));
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.letterSpacing = style.letterSpacing;
    context.textBaseline = "alphabetic";
    const metrics = context.measureText(line.textContent || "");
    const fontAscent =
      metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent;
    const fontDescent =
      metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent;
    const baseline = (rect.height - fontAscent - fontDescent) / 2 + fontAscent;
    // The mask's red channel identifies the line, independently of its palette.
    context.fillStyle = index === 0 ? "rgb(80,0,0)" : "rgb(200,0,0)";
    context.fillText(
      line.textContent || "",
      rect.left - bounds.left + padding,
      rect.top - bounds.top + padding + baseline,
    );
  }
  const pixels = context.getImageData(0, 0, width, height).data;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const step = coarse ? 3 : 2.6;
  const points: number[] = [];
  const bases: number[] = [];
  const accentColors: number[] = [];
  const seeds: number[] = [];
  const palette = accents.map((color) => new THREE.Color(color));
  for (let y = padding; y < height - padding; y += step) {
    for (let x = padding; x < width - padding; x += step) {
      const offset = (Math.floor(y) * width + Math.floor(x)) * 4;
      if (pixels[offset + 3] < 150) continue;
      const index = points.length / 3;
      const seed =
        (((Math.sin(index * 127.1 + 31.7) * 43758.5453) % 1) + 1) % 1;
      points.push(x, y, 0);
      const base =
        colors[pixels[offset] > 140 ? 1 : 0] || new THREE.Color("#3156e8");
      bases.push(base.r, base.g, base.b);
      const accent = palette[Math.floor(seed * palette.length)];
      accentColors.push(accent.r, accent.g, accent.b);
      seeds.push(seed);
    }
  }
  return {
    width,
    height,
    positions: new Float32Array(points),
    bases: new Float32Array(bases),
    accents: new Float32Array(accentColors),
    seeds: new Float32Array(seeds),
  };
}

export function createTitleParticles(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  onFallback: () => void,
) {
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!context) throw new Error("WebGL 2 is unavailable");
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const pixelRatio = Math.min(window.devicePixelRatio, coarse ? 1.5 : 2);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: false,
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.1, 30);
  camera.position.z = 10;
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uDpr: { value: pixelRatio },
      uTime: { value: 0 },
      uScatter: { value: 0 },
    },
    vertexShader: `
      attribute vec3 aBase;
      attribute vec3 aAccent;
      attribute float aSeed;
      attribute float aHeat;
      uniform float uDpr;
      uniform float uScatter;
      varying vec3 vColor;
      varying float vSeed;
      void main() {
        vec3 displaced = position;
        displaced.xy += vec2(sin(aSeed * 6.283), -aSeed) * uScatter * 32.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        gl_PointSize = (1.65 + aSeed * 0.7 + aHeat * 0.65) * uDpr;
        vColor = mix(aBase, aAccent, min(0.9, aHeat));
        vSeed = aSeed;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uScatter;
      varying vec3 vColor;
      varying float vSeed;
      void main() {
        float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
        if (radius > 1.0) discard;
        float alpha = (1.0 - smoothstep(0.5, 1.0, radius)) * (0.92 + sin(uTime * 0.7 + vSeed * 20.0) * 0.06);
        gl_FragColor = vec4(vColor, alpha * (1.0 - uScatter * 0.3));
        #include <colorspace_fragment>
      }
    `,
  });
  let geometry = new THREE.BufferGeometry();
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  let home = new Float32Array();
  let positions = new Float32Array();
  let velocity = new Float32Array();
  let heat = new Float32Array();
  let seeds = new Float32Array();
  let positionAttribute = new THREE.BufferAttribute(positions, 3);
  let heatAttribute = new THREE.BufferAttribute(heat, 1);
  let settings: MotionSettings = {
    paused: false,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
  };
  let pointer = { x: -1000, y: -1000, vx: 0, vy: 0, active: false };
  let visible = false;
  let disposed = false;
  let frame: number | null = null;
  let lastTime = 0;
  let elapsed = 0;
  let contextLost = false;
  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = 0;
  };
  const render = () => {
    renderer.render(scene, camera);
  };
  const tick = (time: number) => {
    if (disposed || contextLost) return;
    if (lastTime && time - lastTime < (coarse ? 32 : 22)) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.034) : 1 / 60;
    const step = dt * 60;
    lastTime = time;
    elapsed += dt;
    const damping = 0.84 ** step;
    const radius = coarse ? 78 : 110;
    for (let i = 0; i < heat.length; i++) {
      const p = i * 3;
      const v = i * 2;
      const dx = home[p] - pointer.x;
      const dy = home[p + 1] - pointer.y;
      const distance = Math.hypot(dx, dy);
      const force =
        pointer.active && distance < radius ? (1 - distance / radius) ** 2 : 0;
      const divisor = Math.max(distance, 1);
      const repelX =
        (dx / divisor) * force * 12 +
        pointer.vx * force * 0.09 -
        (dy / divisor) * force * 3;
      const repelY =
        (dy / divisor) * force * 12 +
        pointer.vy * force * 0.09 +
        (dx / divisor) * force * 3;
      velocity[v] =
        (velocity[v] +
          ((home[p] - positions[p]) * 0.055 + repelX * 0.13) * step) *
        damping;
      velocity[v + 1] =
        (velocity[v + 1] +
          ((home[p + 1] - positions[p + 1]) * 0.055 + repelY * 0.13) * step) *
        damping;
      positions[p] += velocity[v] * step;
      positions[p + 1] += velocity[v + 1] * step;
      heat[i] = Math.min(
        1,
        Math.hypot(velocity[v], velocity[v + 1]) * 0.18 + force * 0.3,
      );
    }
    pointer.vx *= 0.7;
    pointer.vy *= 0.7;
    material.uniforms.uTime.value = elapsed;
    const bounds = host.getBoundingClientRect();
    material.uniforms.uScatter.value = Math.min(
      1,
      Math.max(0, -bounds.top / Math.max(bounds.height, 1)),
    );
    positionAttribute.needsUpdate = true;
    heatAttribute.needsUpdate = true;
    render();
    frame = requestAnimationFrame(tick);
  };
  const schedule = () => {
    stop();
    if (disposed || contextLost) return;
    render();
    if (
      visible &&
      !document.hidden &&
      !settings.paused &&
      !settings.reducedMotion
    )
      frame = requestAnimationFrame(tick);
  };
  const refresh = () => {
    if (disposed || contextLost) return;
    const sampled = sampleTitle(host);
    home = sampled.positions;
    positions = home.slice();
    velocity = new Float32Array((home.length / 3) * 2);
    heat = new Float32Array(home.length / 3);
    seeds = sampled.seeds;
    const next = new THREE.BufferGeometry();
    positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    heatAttribute = new THREE.BufferAttribute(heat, 1).setUsage(
      THREE.DynamicDrawUsage,
    );
    next.setAttribute("position", positionAttribute);
    next.setAttribute("aHeat", heatAttribute);
    next.setAttribute("aBase", new THREE.BufferAttribute(sampled.bases, 3));
    next.setAttribute("aAccent", new THREE.BufferAttribute(sampled.accents, 3));
    next.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    points.geometry = next;
    geometry.dispose();
    geometry = next;
    renderer.setSize(sampled.width, sampled.height, false);
    camera.right = sampled.width;
    camera.bottom = sampled.height;
    camera.updateProjectionMatrix();
    schedule();
  };
  const move = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    const x = event.clientX - rect.left + padding;
    const y = event.clientY - rect.top + padding;
    pointer = {
      x,
      y,
      vx: pointer.active ? Math.max(-60, Math.min(60, x - pointer.x)) : 0,
      vy: pointer.active ? Math.max(-60, Math.min(60, y - pointer.y)) : 0,
      active: true,
    };
  };
  const leave = () => {
    pointer.active = false;
  };
  const release = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") leave();
  };
  const burst = () => {
    if (settings.paused || settings.reducedMotion || contextLost) return;
    for (let i = 0; i < heat.length; i++) {
      const angle = seeds[i] * Math.PI * 2;
      velocity[i * 2] += Math.cos(angle) * (3 + seeds[i] * 12);
      velocity[i * 2 + 1] += Math.sin(angle) * (3 + seeds[i] * 12);
    }
    leave();
  };
  const lost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    stop();
    host.dataset.particles = "fallback";
    onFallback();
  };
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerdown", move);
  host.addEventListener("pointerup", release);
  host.addEventListener("pointerleave", leave);
  host.addEventListener("pointercancel", leave);
  host.addEventListener("click", burst);
  canvas.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", schedule);
  const resize = new ResizeObserver(refresh);
  resize.observe(host);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) leave();
    schedule();
  });
  intersection.observe(host);
  refresh();
  host.dataset.particles = "ready";
  return {
    burst,
    refresh,
    setMotion(next: MotionSettings) {
      settings = next;
      if (next.reducedMotion) {
        positions.set(home);
        velocity.fill(0);
        heat.fill(0);
        material.uniforms.uScatter.value = 0;
        positionAttribute.needsUpdate = true;
        heatAttribute.needsUpdate = true;
      }
      schedule();
    },
    dispose() {
      disposed = true;
      stop();
      resize.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerdown", move);
      host.removeEventListener("pointerup", release);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointercancel", leave);
      host.removeEventListener("click", burst);
      canvas.removeEventListener("webglcontextlost", lost);
      document.removeEventListener("visibilitychange", schedule);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      delete host.dataset.particles;
    },
  };
}
