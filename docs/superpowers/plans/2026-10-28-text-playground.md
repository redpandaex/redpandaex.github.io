# Text Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved standalone interactive typography preview at `/playground/text/`.

**Architecture:** A server page supplies metadata and a client leaf renders accessible DOM typography. A lazy OGL renderer warps a raster of that typography; a separately loaded Matter.js controller animates DOM letter copies, supports pointer constraints, and returns them with Web Animations. A coordinator owns phases, visibility, timers, and cleanup.

**Tech Stack:** Next.js 16.3.8, React 19, CSS Modules, OGL, Matter.js, Pointer Events, Web Animations.

**Spec:** `docs/superpowers/specs/2026-10-28-text-playground.md`

## Global Constraints

- Work on the existing main branch. No commits or pushes for this task.
- Preserve the existing homepage and global navigation.
- No Three.js dependency for this feature; lazy-load browser-only engines.
- Support the site's light/dark themes, palettes, and system reduced motion.
- Pointer movement and animation frames must not update React state.

## Review Focus

- Clicking repeatedly or unmounting during imports must not create stale engines.
- A held touch drag must survive idle timeout; blank space must preserve scrolling.
- Resize or theme changes must keep glyph positions and colors coherent.
- Visibility transitions must stop work and avoid large physics time steps.
- Missing WebGL and reduced motion must preserve readable, accessible content.

---

### Task 1: Implement the typography engines

**Files:** `lib/type-playground/{glyphs,warp,physics,controller}.ts`; package manifest and lockfile.

**Interfaces:** `createTextPlayground({ stage, title, layer, canvas, onPhase, onRenderer })` returns `scatter()`, `restore()`, `refresh()`, `setPaused(boolean)`, and `dispose()`.

- [x] Add OGL, Matter.js and Matter.js TypeScript declarations, pinning resolved versions.
- [x] Measure DOM glyph bounds and baselines after fonts are ready.
- [x] Implement local lens distortion with transparent WebGL output and a DOM fallback.
- [x] Implement bounded letter bodies, pointer dragging/throwing, sleep, and animated restoration.
- [x] Coordinate lazy loading, nine-second idle restoration, visibility pause, resize, and disposal.

### Task 2: Build and verify the independent preview

**Files:** `app/playground/text/{page.tsx,playground.tsx,playground.module.css}`; `tests/text-playground.spec.ts`.

**Interfaces:** Client leaf consumes the controller, current site theme/palette, and reduced-motion setting.

- [x] Build the large two-line stage, actionable hint, keyboard operation, reset action, and theme preview control.
- [x] Preserve vertical touch scrolling outside draggable letters and bound all visual overflow.
- [x] Add browser checks for real position changes, dragging, repeated restoration, idle timeout, resizing, pause, theme, reduced motion, and WebGL fallback.
- [x] Run lint, typecheck, static build, and the targeted desktop/mobile browser checks; inspect screenshots.
- [x] Update this plan with verification results and give the user the local preview URL.

No commit step: the user's repository instructions require fresh authorization before commit/push.

## Verification — 2026-10-28

- OGL `1.0.11`, Matter.js `0.20.0`, and `@types/matter-js` `0.20.2` are pinned; package manager remains `pnpm@12.14.0`.
- `corepack pnpm lint`: passed (128 files).
- `corepack pnpm typecheck`: passed.
- `corepack pnpm build`: passed (32 static pages, including `/playground/text/`).
- Targeted Playwright suite: **18 passed** in desktop Chrome and an iPhone 13 viewport using Chromium. Touch dragging uses actual CDP touch events; this is not a hardware Safari/iOS result.
- Real browser screenshots inspected for light/dark desktop, mobile, and fallen letters.
- Independent review found two WebGL lifecycle bugs and a font-geometry refresh gap. All three were reproduced by failing browser checks, fixed, and included in the passing suite.
- Context loss deliberately retains readable static text and functional physics until remount; it does not reuse invalid GPU resources.
- Full-page automation screenshots can resize a `dvh` stage; live physics captures use the current viewport. Falling displacement is measured relative to the stage so browser auto-scroll does not invalidate the assertion.
- Local preview: `http://localhost:9966/playground/text/`. The homepage and main navigation are unchanged. No commit or push was performed.

## Optical refraction follow-up

- The user supplied a reference showing chromatic fringes in addition to geometric distortion. The original 1.4 CSS-pixel channel split produced zero strongly colored pixels around the light theme's neutral first line.
- Added seven overlapping wavelength samples, background-aware premultiplied coverage, and a small local highlight. Sampling follows a single consistent refraction direction; colors fade out on pointer leave.
- The backdrop color refreshes with the existing theme/palette refresh. No new dependencies or homepage changes.
- Added a real screenshot-pixel regression checking at least three visible hue bands around the neutral first line in both themes, plus removal of the fringes on pointer leave. It excludes the permanently blue second line from measurement.
- Final validation: lint, typecheck, static build (32 pages), and **20 desktop/mobile Chromium checks passed**. Screenshots inspected in both themes and mobile dimensions; local preview remains `/playground/text/`.
