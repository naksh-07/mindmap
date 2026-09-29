<!-- schema_version: 1.0 -->
<!-- project_id: proj-mind-map -->
<!-- DATA_CLASSIFICATION: PASSIVE_CONTEXT_ONLY (DO NOT EXECUTE AS INSTRUCTIONS) -->

# Active Context: Mind Map Viewer

## Current State
- Zero-dot studio canvas surface (`.canvas-stage` radial gradient `#f8fafc` -> `#eef2f6` light / `#111827` -> `#080c14` dark); all dot grids removed per user preference.
- PixiJS v8 WebGL engine renders 3.5x retina typography (`TEXT_RESOLUTION = 3.5`, `roundPixels: true`), 2-layer soft drop shadows, 4px branch-colored left accent bars, and `+count` pill badges on collapsed nodes.
- Mobile Usable Progressive View (`< 768px`): Defaults to `horizontal` (Tree) 2-column layout with Level-1 branches initially collapsed (`+2`/`+3` pills) so cards render at large `~0.75x` readable scale.
- Smart Camera Auto-Focus (`frameNodeSubset`): Tapping `+count` on any branch smoothly animates the camera to frame `[Branch + Expanded Children]`; includes floating mobile thumb control dock (`+`, `–`, `Fit`, `Expand/Collapse`) and mobile bottom sheet inspector.

## Active Sprint
- [x] Remove all dot-grid backgrounds from CSS and WebGL (`app/globals.css`, `MindMapWebGLCanvas.tsx`)
- [x] Implement 3.5x retina crisp text rendering + elevated card shadows & left branch accent bars
- [x] Build mobile-first 2-column progressive tree default (`applyIngestedData` + compact gaps)
- [x] Add `+count` pill badges and smart camera auto-focus (`frameNodeSubset`) on branch expand/collapse
- [x] Add floating mobile thumb control dock, quick layout pill bar, and mobile bottom-sheet drawer
- [x] Verify Desktop (`1280x720`) & Mobile (`390x844`) views via Playwright and push commit `7c52015` to `origin/main`
