import Matter from "matter-js";
import { type Glyph, measureGlyphs } from "./glyphs";

type Piece = { element: HTMLSpanElement; body: Matter.Body; glyph: Glyph };
type Drag = { id: number; constraint: Matter.Constraint };

export function createLetterPhysics({
  stage,
  title,
  layer,
  onActivity,
  onDrag,
}: {
  stage: HTMLElement;
  title: HTMLElement;
  layer: HTMLElement;
  onActivity: () => void;
  onDrag: (dragging: boolean) => void;
}) {
  const engine = Matter.Engine.create({ enableSleeping: true });
  engine.gravity.y = 1.25;
  let pieces: Piece[] = [];
  let drag: Drag | null = null;
  let frame = 0;
  let last = 0;
  let accumulator = 0;
  let paused = true;
  let disposed = false;
  let returning = false;
  let animations: Animation[] = [];
  let generation = 0;
  let pointer = { x: -1000, y: -1000, time: 0 };

  const draw = () => {
    for (const { element, body, glyph } of pieces) {
      element.style.transform = `translate3d(${body.position.x - glyph.width / 2}px, ${body.position.y - glyph.height / 2}px, 0) rotate(${body.angle}rad)`;
    }
  };
  const tick = (now: number) => {
    frame = 0;
    if (paused || disposed || returning) return;
    accumulator += last ? Math.min(now - last, 50) : 1000 / 60;
    last = now;
    while (accumulator >= 1000 / 60) {
      Matter.Engine.update(engine, 1000 / 60);
      accumulator -= 1000 / 60;
    }
    for (const { body } of pieces) {
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      if (speed > 32) {
        Matter.Body.setVelocity(body, {
          x: (body.velocity.x / speed) * 32,
          y: (body.velocity.y / speed) * 32,
        });
      }
    }
    draw();
    if (drag || pieces.some(({ body }) => !body.isSleeping)) {
      frame = requestAnimationFrame(tick);
    }
  };
  const wake = () => {
    if (!frame && !paused && !disposed && !returning) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  };
  const local = (event: PointerEvent) => {
    const bounds = stage.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };
  const release = () => {
    if (!drag) return;
    const id = drag.id;
    Matter.Composite.remove(engine.world, drag.constraint);
    drag = null;
    if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
    onDrag(false);
    onActivity();
    wake();
  };
  const down = (event: PointerEvent) => {
    if (paused || returning || drag || event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const element = target.closest<HTMLElement>("[data-kinetic-piece]");
    const piece = pieces.find((item) => item.element === element);
    if (!piece) return;
    const point = local(event);
    // Constraint offsets are stored in the body's current world orientation.
    const constraint = Matter.Constraint.create({
      pointA: point,
      bodyB: piece.body,
      pointB: {
        x: point.x - piece.body.position.x,
        y: point.y - piece.body.position.y,
      },
      stiffness: 0.16,
      damping: 0.14,
      length: 0,
    });
    drag = { id: event.pointerId, constraint };
    Matter.Composite.add(engine.world, constraint);
    Matter.Sleeping.set(piece.body, false);
    stage.setPointerCapture(event.pointerId);
    stage.dataset.dragging = "true";
    pointer = { ...point, time: performance.now() };
    onDrag(true);
    onActivity();
    event.preventDefault();
    wake();
  };
  const move = (event: PointerEvent) => {
    if (paused || returning) return;
    const point = local(event);
    const now = performance.now();
    if (drag) {
      if (drag.id !== event.pointerId) return;
      drag.constraint.pointA = {
        x: Math.max(6, Math.min(stage.clientWidth - 6, point.x)),
        y: Math.max(6, Math.min(stage.clientHeight - 16, point.y)),
      };
      event.preventDefault();
      onActivity();
      wake();
    } else if (event.pointerType === "mouse") {
      const dt = Math.max(now - pointer.time, 16);
      const vx = Math.max(-7, Math.min(7, ((point.x - pointer.x) / dt) * 12));
      const vy = Math.max(-7, Math.min(7, ((point.y - pointer.y) / dt) * 12));
      if (
        pointer.time &&
        now - pointer.time < 100 &&
        Math.hypot(vx, vy) > 0.6
      ) {
        for (const { body, glyph } of pieces) {
          const radius = Math.max(glyph.width, glyph.height) * 0.7;
          if (
            Math.hypot(point.x - body.position.x, point.y - body.position.y) >
            radius
          )
            continue;
          Matter.Sleeping.set(body, false);
          Matter.Body.setVelocity(body, {
            x: body.velocity.x + vx * 0.35,
            y: body.velocity.y + Math.min(vy * 0.35, -0.3),
          });
        }
        wake();
      }
      onActivity();
    }
    pointer = { ...point, time: now };
  };
  const up = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    release();
    delete stage.dataset.dragging;
  };
  const clear = () => {
    generation++;
    release();
    cancelAnimationFrame(frame);
    frame = 0;
    for (const animation of animations) animation.cancel();
    animations = [];
    Matter.Composite.clear(engine.world, false);
    Matter.Engine.clear(engine);
    layer.replaceChildren();
    pieces = [];
    delete stage.dataset.dragging;
  };
  stage.addEventListener("pointerdown", down);
  stage.addEventListener("pointermove", move, { passive: false });
  stage.addEventListener("pointerup", up);
  stage.addEventListener("pointercancel", up);
  stage.addEventListener("lostpointercapture", up);

  return {
    start() {
      clear();
      returning = false;
      accumulator = 0;
      last = 0;
      pointer = { x: -1000, y: -1000, time: 0 };
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const options = { isStatic: true, friction: 0.35, restitution: 0.25 };
      Matter.Composite.add(engine.world, [
        Matter.Bodies.rectangle(
          width / 2,
          height + 18,
          width + 160,
          60,
          options,
        ),
        Matter.Bodies.rectangle(-30, height / 2, 60, height * 3, options),
        Matter.Bodies.rectangle(
          width + 30,
          height / 2,
          60,
          height * 3,
          options,
        ),
        Matter.Bodies.rectangle(width / 2, -50, width + 160, 60, options),
      ]);
      pieces = measureGlyphs(stage, title).map((glyph, index) => {
        const element = document.createElement("span");
        element.textContent = glyph.text;
        element.dataset.kineticPiece = String(index);
        element.dataset.accent = String(glyph.accent);
        Object.assign(element.style, {
          position: "absolute",
          inset: "0 auto auto 0",
          width: `${glyph.width}px`,
          height: `${glyph.height}px`,
          fontSize: glyph.fontSize,
          fontFamily: glyph.fontFamily,
          fontWeight: glyph.fontWeight,
          letterSpacing: glyph.letterSpacing,
          lineHeight: glyph.lineHeight,
          color: glyph.accent ? "var(--primary)" : "var(--foreground)",
          whiteSpace: "pre",
          pointerEvents: "auto",
          touchAction: "none",
          cursor: "grab",
          willChange: "transform",
        });
        layer.appendChild(element);
        const body = Matter.Bodies.rectangle(
          glyph.x + glyph.width / 2,
          glyph.y + glyph.height / 2,
          Math.max(8, glyph.width * 0.82),
          Math.max(8, glyph.height * 0.8),
          {
            restitution: 0.52,
            friction: 0.35,
            frictionAir: 0.012,
            density: 0.002,
            sleepThreshold: 60,
            chamfer: { radius: 3 },
          },
        );
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 7,
          y: -2 - Math.random() * 4,
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.14);
        Matter.Composite.add(engine.world, body);
        return { element, body, glyph };
      });
      draw();
      wake();
    },
    async restore() {
      const current = ++generation;
      returning = true;
      release();
      cancelAnimationFrame(frame);
      frame = 0;
      animations = pieces.map(({ element, body, glyph }, index) => {
        const angle = Math.atan2(Math.sin(body.angle), Math.cos(body.angle));
        const from = `translate3d(${body.position.x - glyph.width / 2}px, ${body.position.y - glyph.height / 2}px, 0) rotate(${angle}rad)`;
        const to = `translate3d(${glyph.x}px, ${glyph.y}px, 0) rotate(0rad)`;
        return element.animate([{ transform: from }, { transform: to }], {
          duration: 850,
          delay: index * 22,
          easing: "cubic-bezier(.22,1,.36,1)",
          fill: "forwards",
        });
      });
      if (paused) for (const animation of animations) animation.pause();
      await Promise.all(
        animations.map((animation) => animation.finished.catch(() => {})),
      );
      if (!disposed && current === generation) clear();
    },
    setPaused(value: boolean) {
      paused = value;
      if (paused) {
        release();
        cancelAnimationFrame(frame);
        frame = 0;
        for (const animation of animations) animation.pause();
      } else {
        for (const animation of animations) animation.play();
        wake();
      }
    },
    clear,
    dispose() {
      disposed = true;
      clear();
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointercancel", up);
      stage.removeEventListener("lostpointercapture", up);
    },
  };
}
