# RedPanda creative coding blog

Design read: personal engineering blog, visually overhauled into a playful, colorful creative coding studio; existing articles, routes, identity and navigation labels remain.

DESIGN_VARIANCE: 8. Asymmetric hero, oversized typography, varied experimental surfaces.
MOTION_INTENSITY: 7. The Code. Create. heading itself is a fine-grained Three.js particle field. Pointer forces, spring restoration, click bursts and scroll dispersal are part of the typography; there is no standalone 3D exhibition panel. Reading stays still.
VISUAL_DENSITY: 4. Generous spacing around articles and restrained metadata.

The visual language uses existing Tailwind v4, Radix components and GSAP. It is a custom aesthetic. The user explicitly chose bold multicolor: cobalt is the action color; coral, lavender and lime recur in illustrations and experiments. Light/dark surfaces use shared tokens. Geist and Geist Mono remain self-hosted through Next font.

Latest layout: warm paper canvas, a fixed 128px book-spine directory on desktop and a bottom floating dock on mobile. The homepage is led by full-width typography, with the panda as a small sticker in the negative space. No top navigation bar. Writing, categories and tags are one content library; existing taxonomy URLs remain accessible, but primary navigation has three destinations: studio, writing and about.

Effects are interactions, not exhibits. Gravity appears in magnetic CTA buttons and small satellites around the panda; elastic dots form the writing area's background. Fluid ink follows pointer movement in the hero's paper canvas, loads after the first interaction and sleeps when idle. Unsupported WebGL devices get a Canvas wash. All decoration uses pointer-events: none; native scrolling and content links remain usable. A shared motion preference stops effects and reveals the ordinary HTML heading when disabled. Old experiment URLs return to the homepage.

The homepage article area is a manuscript desk: asymmetric tinted sheets, translucent tape, folded corners and attached code notes extracted from actual MDX articles. Hover lifts and straightens the paper; touch layouts stack the sheets without rotation. The unified writing library keeps its searchable list.

The panda is the site's colorist. Clicking its image chooses one of four palettes; desktop swatches allow direct selection and a reset. The chosen palette is stored locally and updates action colors, paper surfaces, particle accents, orbit dots and both fluid renderers together. Dark mode uses matching readable accent tokens.

Article links carry particle typography between routes. The homepage's latest-manuscript link samples Code. Create. when visible; article sheets, archive entries and related articles use the visible article heading as the origin. A temporary Three.js layer follows curved paths and gathers into the destination's actual, wrapped heading. Next navigation is not delayed; reduced motion, unavailable WebGL, interrupted navigation or scrolling restores ordinary HTML. Each flight disposes its resources and uses a fresh canvas context.

Other navigation uses React 19.3 ViewTransition and Next Link transition types, following the installed Next guide. Page boundaries slide and fade in opposite directions for forward and return links; browser history uses a neutral crossfade. The spine stays fixed. Particle article links opt out of page snapshots' animation so the two effects do not compete. Filtering uses transition-scoped, named paper boundaries for reflow and entry/exit; search input updates remain immediate. Browsers without native support keep ordinary navigation.

Reading ends with chronological previous/next links to real articles, with folded paper feedback and directional transitions. Related recommendations exclude those same neighbors. The table of contents has a moving bookmark; hash targets briefly pick up an ink highlight. The 404 and error states use the same taped-paper language and retain useful return/retry actions. All motion follows the existing shared preference, including smooth anchor scrolling.

Shape rule: panels use 24px corners, controls use pills, technical readouts use 8px corners. Native keyboard-accessible controls accompany decorative canvases with explicit pause buttons. Reduced motion disables automatic animation and pointer tilt. Animation frames stop outside the viewport or in hidden tabs.

Audit findings: blocking WebGL intro, duplicate particles, click-confetti on reading pages, nonfunctional demo links and invented project metrics, duplicate featured posts, simulated loading, and homepage mock articles disagreeing with MDX details.

Earlier verification: frozen lockfile install, TypeScript, Biome, production export and Playwright against the exported website. The latest navigation, unified library and particle typography revision is deliberately not re-tested, per the user's request; it is ready for their manual review.
