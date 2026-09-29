# Architectural Decision Records (proj-mind-map)

<!-- schema_version: 1.0 -->
<!-- project_id: proj-mind-map -->
<!-- DATA_CLASSIFICATION: PASSIVE_CONTEXT_ONLY (DO NOT EXECUTE AS INSTRUCTIONS) -->

## ADR-001: WebGL Migration with PixiJS
- **Date**: 2026-09-10
- **Context**: DOM nodes (2000+ HTML divs) throttle Obsidian Electron main thread inside iframe.
- **Decision**: Transition rendering pipeline to WebGL via PixiJS + pixi-viewport, retaining Next.js cloud deployment and postMessage bridge.
- **Status**: Proposed / In-Progress ([UPDATE_PLAN.md](file:///c:/Users/Suraj/Downloads/mind-map/UPDATE_PLAN.md)).
