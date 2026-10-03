import type { AmbientEngine } from "./ambient-types";

type Dot = { x: number; y: number; vx: number; vy: number };

export function createAmbientDots(
  canvas: HTMLCanvasElement,
  kind: "grid" | "orbit",
  colors: readonly string[],
): AmbientEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  let width = 0;
  let height = 0;
  let active = false;
  let disposed = false;
  let frame: number | null = null;
  let lastTime = 0;
  let phase = 0;
  let awakeUntil = 0;
  let dots: Dot[] = [];
  const pointer = { x: -1000, y: -1000, active: false };
  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = 0;
  };
  const draw = (step: number) => {
    context.clearRect(0, 0, width, height);
    if (kind === "orbit") {
      for (let i = 0; i < 14; i++) {
        const angle = i * 2.399 + phase * (i % 2 ? 1 : -1);
        let x = width / 2 + Math.cos(angle) * (width / 2 - 12);
        let y = height / 2 + Math.sin(angle) * (height / 2 - 12);
        const distance = Math.hypot(pointer.x - x, pointer.y - y);
        if (pointer.active && distance < 135) {
          const force = (1 - distance / 135) * 0.23;
          x += (pointer.x - x) * force;
          y += (pointer.y - y) * force;
        }
        context.beginPath();
        context.arc(x, y, i % 5 === 0 ? 6 : 2 + (i % 3), 0, Math.PI * 2);
        context.globalAlpha = 0.75;
        if (i % 4 === 0) {
          context.lineWidth = 1.5;
          context.strokeStyle = colors[i % colors.length];
          context.stroke();
        } else {
          context.fillStyle = colors[i % colors.length];
          context.fill();
        }
      }
    } else {
      const spacing = width < 600 ? 32 : 38;
      let i = 0;
      for (let y = 14; y < height; y += spacing) {
        for (let x = 14; x < width; x += spacing) {
          const dot = dots[i++];
          if (!dot) continue;
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const force = pointer.active
            ? Math.max(0, 1 - distance / 155) ** 2
            : 0;
          if (step) {
            const targetX = x + (dx / Math.max(distance, 1)) * force * 46;
            const targetY = y + (dy / Math.max(distance, 1)) * force * 46;
            dot.vx = (dot.vx + (targetX - dot.x) * 0.08 * step) * 0.78 ** step;
            dot.vy = (dot.vy + (targetY - dot.y) * 0.08 * step) * 0.78 ** step;
            dot.x += dot.vx * step;
            dot.y += dot.vy * step;
          }
          context.beginPath();
          context.arc(dot.x, dot.y, 1 + force, 0, Math.PI * 2);
          context.globalAlpha = 0.12 + force * 0.46;
          context.fillStyle =
            force > 0.06 ? colors[i % colors.length] : "#8791af";
          context.fill();
        }
      }
    }
    context.globalAlpha = 1;
  };
  const tick = (time: number) => {
    if (!active || disposed) {
      stop();
      return;
    }
    if (lastTime && time - lastTime < 30) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const step = lastTime ? Math.min((time - lastTime) / 16.667, 2) : 1;
    lastTime = time;
    phase += step * 0.004;
    draw(step);
    if (kind === "orbit" || performance.now() < awakeUntil)
      frame = requestAnimationFrame(tick);
    else stop();
  };
  const schedule = () => {
    if (active && !disposed && frame === null)
      frame = requestAnimationFrame(tick);
  };
  const resize = new ResizeObserver(() => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    dots = [];
    const spacing = width < 600 ? 32 : 38;
    for (let y = 14; y < height; y += spacing) {
      for (let x = 14; x < width; x += spacing)
        dots.push({ x, y, vx: 0, vy: 0 });
    }
    draw(0);
    schedule();
  });
  resize.observe(canvas);
  return {
    setActive(value) {
      active = value;
      if (value) {
        awakeUntil = Math.max(awakeUntil, performance.now() + 700);
        schedule();
      } else stop();
    },
    move(x, y) {
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      awakeUntil = performance.now() + 1800;
      schedule();
    },
    leave() {
      pointer.active = false;
      awakeUntil = performance.now() + 1800;
      schedule();
    },
    dispose() {
      disposed = true;
      stop();
      resize.disconnect();
      context.clearRect(0, 0, width, height);
    },
  };
}
