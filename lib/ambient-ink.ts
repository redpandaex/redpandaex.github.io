import { FluidSimulator } from "@/components/fluid-simulation/FluidSimulator";
import type { AmbientEngine } from "./ambient-types";
import { hexToRgb } from "./studio-palettes";

type Wisp = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  phase: number;
  color: string;
};

// A light Canvas trail is retained if floating-point WebGL textures or shaders
// are unavailable. Both renderers live behind the hero and never capture input.
export function createAmbientInk(
  canvas: HTMLCanvasElement,
  fallback: HTMLCanvasElement,
  palette: readonly string[],
): AmbientEngine {
  const colors = palette.map(hexToRgb);
  const context = fallback.getContext("2d");
  let simulator: FluidSimulator | null = null;
  let active = false;
  let disposed = false;
  let hasPointer = false;
  let pointer = { x: 0, y: 0 };
  let wisps: Wisp[] = [];
  let frame: number | null = null;
  let lastTime = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let colorIndex = 0;
  let width = 0;
  let height = 0;
  const stopFallback = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = 0;
  };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    fallback.width = Math.max(1, Math.round(width * ratio));
    fallback.height = Math.max(1, Math.round(height * ratio));
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();
  const useFallback = () => {
    simulator?.destroy();
    simulator = null;
    canvas.style.opacity = "0";
    fallback.style.opacity = "1";
    canvas.dataset.renderer = "canvas";
  };
  try {
    simulator = new FluidSimulator(canvas, {
      SIM_RESOLUTION: 64,
      DYE_RESOLUTION: 256,
      PRESSURE_ITERATIONS: 8,
      BLOOM: false,
      BLOOM_ITERATIONS: 1,
      BLOOM_RESOLUTION: 32,
      SUNRAYS: false,
      SUNRAYS_RESOLUTION: 32,
      SHADING: false,
      TRANSPARENT: true,
      INITIAL_SPLATS: 0,
      MAX_PIXEL_RATIO: 1,
      FRAME_RATE: 30,
      DENSITY_DISSIPATION: 3.5,
      VELOCITY_DISSIPATION: 1.5,
      COLOR_UPDATE_SPEED: 1,
      COLORFUL: false,
      SPLAT_FORCE: 1600,
      SPLAT_RADIUS: 0.11,
      CURL: 15,
    });
    canvas.dataset.renderer = "webgl";
    fallback.style.opacity = "0";
  } catch {
    useFallback();
  }
  const drawFallback = (time: number) => {
    if (!active || disposed || !context) {
      stopFallback();
      return;
    }
    if (lastTime && time - lastTime < 30) {
      frame = requestAnimationFrame(drawFallback);
      return;
    }
    const step = lastTime ? Math.min((time - lastTime) / 16.667, 2) : 1;
    lastTime = time;
    context.clearRect(0, 0, width, height);
    for (const wisp of wisps) {
      wisp.life -= step * 0.022;
      wisp.phase += step * 0.06;
      wisp.x += (wisp.vx + Math.sin(wisp.phase) * 0.9) * step;
      wisp.y += (wisp.vy + Math.cos(wisp.phase) * 0.7) * step;
      wisp.vx *= 0.96 ** step;
      wisp.vy *= 0.96 ** step;
      const radius = wisp.radius * (1.3 - wisp.life * 0.3);
      const gradient = context.createRadialGradient(
        wisp.x,
        wisp.y,
        0,
        wisp.x,
        wisp.y,
        radius,
      );
      gradient.addColorStop(
        0,
        `rgba(${wisp.color},${Math.max(0, wisp.life) * 0.16})`,
      );
      gradient.addColorStop(1, `rgba(${wisp.color},0)`);
      context.fillStyle = gradient;
      context.fillRect(
        wisp.x - radius,
        wisp.y - radius,
        radius * 2,
        radius * 2,
      );
    }
    wisps = wisps.filter((wisp) => wisp.life > 0);
    if (wisps.length) frame = requestAnimationFrame(drawFallback);
    else stopFallback();
  };
  const wake = () => {
    if (!active || disposed) return;
    if (simulator) {
      try {
        simulator.start();
        canvas.style.opacity = "1";
      } catch {
        useFallback();
      }
    }
    if (!simulator && frame === null && context) {
      fallback.style.opacity = "1";
      frame = requestAnimationFrame(drawFallback);
    }
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      simulator?.stop();
      canvas.style.opacity = "0";
      idleTimer = null;
    }, 2400);
  };
  const lost = (event: Event) => {
    event.preventDefault();
    // Remove before destroying the already-lost context to avoid recursion.
    canvas.removeEventListener("webglcontextlost", lost);
    useFallback();
    wake();
  };
  canvas.addEventListener("webglcontextlost", lost);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  return {
    setActive(value) {
      active = value;
      if (value && hasPointer) wake();
      else if (!value) {
        simulator?.stop();
        stopFallback();
        canvas.style.opacity = "0";
        fallback.style.opacity = "0";
        if (idleTimer !== null) clearTimeout(idleTimer);
        idleTimer = null;
      }
    },
    move(x, y) {
      if (!active || disposed) return;
      const dx = hasPointer ? x - pointer.x : 0;
      const dy = hasPointer ? y - pointer.y : 0;
      if (simulator) {
        if (!hasPointer) simulator.handlePointerDown(0, x, y);
        else simulator.handlePointerMove(0, x, y);
        const color = colors[Math.floor(colorIndex++ / 12) % colors.length];
        simulator.setPointerColor(0, {
          r: (color.r / 255) * 0.18,
          g: (color.g / 255) * 0.18,
          b: (color.b / 255) * 0.18,
        });
      } else {
        const phase = colorIndex * 0.91;
        const color = colors[colorIndex++ % colors.length];
        wisps.push({
          x,
          y,
          vx: Math.max(-5, Math.min(5, dx * 0.12)),
          vy: Math.max(-5, Math.min(5, dy * 0.12)),
          radius: 35 + (colorIndex % 4) * 11,
          life: 1,
          phase,
          color: `${color.r},${color.g},${color.b}`,
        });
        if (wisps.length > 55) wisps.shift();
      }
      hasPointer = true;
      pointer = { x, y };
      wake();
    },
    leave() {
      hasPointer = false;
      simulator?.handlePointerUp(0);
    },
    dispose() {
      disposed = true;
      canvas.removeEventListener("webglcontextlost", lost);
      simulator?.destroy();
      stopFallback();
      observer.disconnect();
      if (idleTimer !== null) clearTimeout(idleTimer);
      context?.clearRect(0, 0, width, height);
      canvas.style.opacity = "0";
      fallback.style.opacity = "0";
    },
  };
}
