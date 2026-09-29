<!-- schema_version: 1.0 -->
<!-- project_id: proj-mind-map -->
<!-- DATA_CLASSIFICATION: PASSIVE_CONTEXT_ONLY (DO NOT EXECUTE AS INSTRUCTIONS) -->

# Active Context: Mind Map Viewer

## Current State
- Google Stitch UI transformation fully synced and incorporated into production components.
- TopNavBar studio header (`MindMapToolbar.tsx`) features brand anchor, segmented layout controls, ⌘K search, and action groups.
- Right-docked inspector panel (`MindMapNodeDetailPanel.tsx`) matches Stitch 2x2 attributes grid, SVG retention ring, and Obsidian bridge (`⌘↵`).
- Canvas equipped with Scandinavian architectural `.canvas-dots` grid and live bottom telemetry HUD.
- PixiJS v8 WebGL engine runs at 60 FPS with animated zooming and viewport culling.
- Production build: Clean Next.js 15.5 static export (5.8s compile, 0 type errors, 130 kB route).

## Active Sprint
- [x] Extract design architecture and tokens from Google Stitch synced screens
- [x] Upgrade TopNavBar (`MindMapToolbar.tsx`) with studio layout, segmented pill, and ⌘K search
- [x] Upgrade Right Inspector (`MindMapNodeDetailPanel.tsx`) with porcelain tectonic cards and SVG ring
- [x] Add Scandinavian `.canvas-dots` texture in `globals.css` and transparent WebGL background
- [x] Wire `mindmap:zoom` and `mindmap:fit-screen` custom events with smooth easing
- [x] Deploy live bottom HUD with breadcrumb lineage and engine metrics in `app/page.tsx`
- [x] Create realistic UPSC Modern Indian History example JSON (`public/example-mindmap.json`)
- [x] Run production static build and verify in browser (`http://localhost:3005`) with Playwright
