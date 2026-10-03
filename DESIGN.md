# RedPanda creative coding blog

Design read: personal engineering blog, visually overhauled into a playful, colorful creative coding studio; existing articles, routes, identity and navigation labels remain.

DESIGN_VARIANCE: 8. Asymmetric hero, oversized typography, varied experimental surfaces.
MOTION_INTENSITY: 7. The Code. Create. heading itself is a fine-grained Three.js particle field. Pointer forces, spring restoration, click bursts and scroll dispersal are part of the typography; there is no standalone 3D exhibition panel. Reading stays still.
VISUAL_DENSITY: 4. Generous spacing around articles and restrained metadata.

The visual language uses existing Tailwind v4, Radix components and GSAP. It is a custom aesthetic. The user explicitly chose bold multicolor: cobalt is the action color; coral, lavender and lime recur in illustrations and experiments. Light/dark surfaces use shared tokens. Geist and Geist Mono remain self-hosted through Next font.

Latest layout: warm paper canvas, a fixed 128px book-spine directory on desktop and a bottom floating dock on mobile. The homepage is led by full-width typography, with the panda as a small sticker in the negative space. No top navigation bar. Writing, categories and tags are one content library; existing taxonomy URLs remain accessible, but primary navigation has four destinations: studio, writing, experiments and about.

Shape rule: panels use 24px corners, controls use pills, technical readouts use 8px corners. Native keyboard-accessible controls accompany decorative canvases with explicit pause buttons. Reduced motion disables automatic animation and pointer tilt. Animation frames stop outside the viewport or in hidden tabs.

Audit findings: blocking WebGL intro, duplicate particles, click-confetti on reading pages, nonfunctional demo links and invented project metrics, duplicate featured posts, simulated loading, and homepage mock articles disagreeing with MDX details.

Earlier verification: frozen lockfile install, TypeScript, Biome, production export and Playwright against the exported website. The latest navigation, unified library and particle typography revision is deliberately not re-tested, per the user's request; it is ready for their manual review.
