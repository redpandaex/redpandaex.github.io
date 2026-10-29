# Homepage Kinetic Title Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for the approved homepage integration. User instructions prohibit commits and pushes and require work on main.

**Goal:** Replace the homepage particle title with the approved chromatic glass lens and falling letters.

**Architecture:** Extract a shared `KineticTitle({ variant: "home" | "playground" })` client leaf from the working preview. Keep the same controller, lazy engines, accessible DOM text, and scoped stage styles. The home variant renders h1 and matches the existing hero proportions. Per the 2026-10-30 follow-up, it has no visible hints or action/reset buttons; it uses title activation and automatic restoration. The preview retains its controls.

**Tech Stack:** Existing Next.js/React, CSS Modules, OGL, Matter.js. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-28-text-playground.md`, homepage integration section.

## Constraints and review focus

- Work on main; preserve existing staged work; no commit/push or author inspection.
- Preserve hero copy, artwork, links, global navigation, and metadata.
- Shared stage must retain preview behavior while giving the homepage exactly one h1.
- Palette/theme changes, reduced motion, WebGL fallback, and route remounts must remain usable.
- The artwork must not activate falling text or obscure playable letters.
- Mobile blank-space scrolling, clipped letters, and no horizontal overflow are required.

## Task 1: Integrate and verify

- [x] Run the real lens/physics/keyboard/fallback browser suite against both preview and homepage; first observe failure on the missing homepage stage.
- [x] Extract shared component/styles, keep preview shell, and replace homepage ParticleTitle.
- [x] Verify homepage artwork controls and navigation/remount while physics is active.
- [x] Run focused desktop/mobile tests, lint, typecheck, static build, and diff checks; inspect theme/mobile screenshots.
- [x] Review integration and record results. Leave changes uncommitted.

## Verification

- Homepage integration test failed first because the homepage had no text stage. The same suite now covers both routes through their public controls.
- Independent read-only review found one Important issue: the sticker covered draggable letters. A browser regression reproduced it with a letter inside the artwork bounds whose center hit the image instead of the letter. Active home stages now sit above the sticker and let empty space pass pointer events through; letter elements retain pointer events.
- Overlay regression passed in both viewport projects, including artwork palette changes during falling, visible letter hit testing over the artwork, and releasing/regrabbing. The regrab check freezes animation time so it tests hit testing independently of throw momentum; regular physics checks verify movement and touch throws.
- The full production-export browser run passed **44/44** with two workers: desktop Chrome and iPhone 13 dimensions in Chromium. It covers colored fringe pixels in both themes, pointer leave, repeated falls/restoration, held-drag timeout, mouse/CDP touch dragging, reduced motion, WebGL loss/unavailability, font/viewport changes, offscreen pause, palette changes, and route cleanup/remount.
- Homepage colored first-line pixels measured about 6,100 on desktop and 2,200 on mobile, with five hue bands. Pixel sampling crops the neutral line to exclude the sticker. Screenshots inspected for desktop/mobile light/dark layouts and falling letters.
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm build` (32 static pages), and both staged/unstaged `git diff --check` passed. The homepage export has exactly one h1, no old particle canvas, and no noindex directive.
- Tests run on the exported site at `http://localhost:9978/`. The existing development server had an HMR WebSocket handshake failure and did not hydrate; no production workaround was added for that local transport issue.
- A preview mobile click was intercepted by the fixed dock while automation was scrolling. Test actions now scroll deliberately to the center instantly before clicking; the final complete run passed with retries disabled.
- Review scope decisions: existing physics/shader internals remain unchanged and their browser regressions pass. Native Safari/iOS and hardware touch behavior were not claimed; mobile verification uses Chromium viewport emulation. Existing native pan-y/letter-only touch blocking is retained.
- No new dependencies, commits, pushes, or changes to the existing staged index. Preview remains available without a main-navigation link.

## UI simplification follow-up — 2026-10-30

- Removed the homepage hint/action row, its reserved space, unused home control styles, and the title trigger's reference to the removed hint. Preview controls remain available.
- Homepage clicks now act directly on the title. Idle restoration remains nine seconds; keyboard activation restores focus to the title after automatic restoration.
- Updated the existing browser checks to use title clicks and automatic restoration on the homepage, while retaining manual controls in the preview. The homepage checks also confirm no hint, scatter button, or reset button is rendered.
- Final validation: **44/44 desktop/mobile Chromium checks passed**, lint/typecheck and static build passed. Updated desktop/mobile screenshots were inspected to confirm the row and its space are gone. No commit or push.
