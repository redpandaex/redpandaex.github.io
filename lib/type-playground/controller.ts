import type { createLetterPhysics } from "./physics";
import type { createWarp } from "./warp";

export type PlaygroundPhase = "ready" | "loading" | "falling" | "returning";
export type PlaygroundRenderer = "loading" | "lens" | "static";

export function createTextPlayground({
  stage,
  title,
  layer,
  canvas,
  onPhase,
  onRenderer,
  onError,
}: {
  stage: HTMLElement;
  title: HTMLElement;
  layer: HTMLElement;
  canvas: HTMLCanvasElement;
  onPhase: (phase: PlaygroundPhase) => void;
  onRenderer: (renderer: PlaygroundRenderer) => void;
  onError?: (message: string) => void;
}) {
  let lens: ReturnType<typeof createWarp> | null = null;
  let physics: ReturnType<typeof createLetterPhysics> | null = null;
  let phase: PlaygroundPhase = "ready";
  let disposed = false;
  let paused = true;
  let dragging = false;
  let timer = 0;
  let generation = 0;
  let width = stage.clientWidth;
  let height = stage.clientHeight;
  let titleHeight = title.getBoundingClientRect().height;
  let fontSize = getComputedStyle(title).fontSize;

  const changePhase = (value: PlaygroundPhase) => {
    phase = value;
    stage.dataset.phase = value;
    lens?.setPaused(paused || phase !== "ready");
    physics?.setPaused(paused || phase === "ready");
    onPhase(value);
  };
  const clearTimer = () => window.clearTimeout(timer);
  const activity = () => {
    clearTimer();
    if (paused || dragging || phase !== "falling" || disposed) return;
    timer = window.setTimeout(() => void restore(), 9000);
  };
  const restore = async () => {
    if (disposed || phase !== "falling" || !physics) return;
    const current = ++generation;
    clearTimer();
    changePhase("returning");
    await physics.restore();
    if (disposed || current !== generation) return;
    changePhase("ready");
    lens?.refresh();
  };
  const reset = () => {
    generation++;
    clearTimer();
    physics?.clear();
    dragging = false;
    changePhase("ready");
    lens?.refresh();
  };
  const scatter = async () => {
    if (disposed || phase !== "ready") return;
    const current = ++generation;
    changePhase("loading");
    try {
      if (!physics) {
        const [{ createLetterPhysics }] = await Promise.all([
          import("./physics"),
          document.fonts.ready,
        ]);
        if (disposed || current !== generation) return;
        physics = createLetterPhysics({
          stage,
          title,
          layer,
          onActivity: activity,
          onDrag(value) {
            dragging = value;
            activity();
          },
        });
      }
      if (disposed || current !== generation) return;
      physics.start();
      changePhase("falling");
      activity();
    } catch {
      if (!disposed && current === generation) {
        reset();
        onError?.("这次没能开始，点一下再试。");
      }
    }
  };
  const refresh = () => {
    if (disposed) return;
    const nextTitleHeight = title.getBoundingClientRect().height;
    const nextFontSize = getComputedStyle(title).fontSize;
    const resized =
      width !== stage.clientWidth ||
      height !== stage.clientHeight ||
      titleHeight !== nextTitleHeight ||
      fontSize !== nextFontSize;
    width = stage.clientWidth;
    height = stage.clientHeight;
    titleHeight = nextTitleHeight;
    fontSize = nextFontSize;
    if (resized && phase !== "ready") reset();
    else lens?.refresh();
  };
  const resize = new ResizeObserver(refresh);
  resize.observe(stage);
  resize.observe(title);
  window.addEventListener("resize", refresh, { passive: true });
  void (async () => {
    try {
      const [{ createWarp }] = await Promise.all([
        import("./warp"),
        document.fonts.ready,
      ]);
      if (disposed) return;
      lens = createWarp({
        stage,
        title,
        canvas,
        onAvailable(available) {
          stage.dataset.renderer = available ? "lens" : "static";
          onRenderer(available ? "lens" : "static");
        },
      });
      lens.setPaused(paused || phase !== "ready");
    } catch {
      if (disposed) return;
      stage.dataset.renderer = "static";
      onRenderer("static");
    }
  })();
  return {
    scatter,
    restore,
    refresh,
    setPaused(value: boolean) {
      paused = value;
      stage.dataset.paused = String(value);
      lens?.setPaused(value || phase !== "ready");
      physics?.setPaused(value || phase === "ready");
      activity();
    },
    dispose() {
      disposed = true;
      generation++;
      clearTimer();
      resize.disconnect();
      window.removeEventListener("resize", refresh);
      lens?.dispose();
      physics?.dispose();
      stage.dataset.phase = "ready";
      stage.dataset.renderer = "static";
      stage.dataset.paused = "true";
    },
  };
}
