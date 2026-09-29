# Design System: Mind Map Viewer (Modern Minimal Light)

<!-- schema_version: 1.0 -->
<!-- project_id: proj-mind-map -->
<!-- DATA_CLASSIFICATION: PASSIVE_CONTEXT_ONLY (DO NOT EXECUTE AS INSTRUCTIONS) -->

## 1. Visual Theme & Atmosphere
- **Atmosphere:** An ultra-clean, architectural modern minimal light workspace. Think high-end Nordic design studio meets Notion/Linear ergonomics.
- **Philosophy:** Crisp spatial clarity, tactile micro-surfaces, and whisper-thin hairline boundaries. Content (the knowledge tree) takes center stage while all HUD controls float gently above the canvas with frosted glass diffusion.
- **Density:** Balanced Clean (Density: 5/10) — generous breathing room between nodes, uncluttered floating toolbars, and razor-sharp typographic hierarchy.
- **Motion Intensity:** Fluid Springs (Motion: 6/10) — tactile micro-presses, smooth canvas panning, and organic drawer slide-overs using spring physics (`stiffness: 120, damping: 18`).

---

## 2. Color Palette & Roles (Calibrated Modern Light)

Strict single-accent system with warm alabaster neutrals and slate typography. **AI purple neon gradients and oversaturated glows are strictly forbidden.**

| Semantic Token | Swatch Name | Hex / Value | Functional Role |
| :--- | :--- | :--- | :--- |
| `--canvas-bg` | **Nordic Alabaster** | `#F8FAFC` | Infinite canvas background surface; subtle off-white that eliminates screen glare |
| `--surface-pure` | **Pure Porcelain** | `#FFFFFF` | Solid card faces, modal backdrops, popover surfaces |
| `--surface-glass` | **Frosted Lucite** | `rgba(255, 255, 255, 0.82)` | Floating HUD toolbar, docked control panels with `backdrop-blur-md` |
| `--border-hairline` | **Whisper Slate Border** | `rgba(226, 232, 240, 0.85)` | 1px hairline boundary separating floating controls and node frames |
| `--border-hover` | **Muted Cobalt Rim** | `rgba(37, 99, 235, 0.25)` | Micro-interaction boundary on hover |
| `--text-primary` | **Deep Slate Obsidian** | `#0F172A` | Primary node labels, panel headings, active icons (`Zinc-900`/`Slate-900`) |
| `--text-secondary` | **Architect Steel** | `#64748B` | Breadcrumb paths, node metadata, shortcuts, subtitle text |
| `--text-tertiary` | **Muted Fog** | `#94A3B8` | Watermarks, hotkey indicators, disabled states |
| `--accent-primary` | **Ceramic Cobalt** | `#2563EB` | **Single Primary Accent**: Active branch highlight, focused node ring, CTA buttons |
| `--accent-subtle` | **Cobalt Glaze** | `rgba(37, 99, 235, 0.08)` | Active node background tint, pill badge fill |
| `--active-recall` | **Warm Amber Veil** | `#D97706` | Active Recall test mode status, hidden label placeholder badge |
| `--quiz-accent` | **Sage Emerald** | `#059669` | Success state, mastered quiz scores, completed knowledge branches |

### Graph Category Color System (WebGL Node Categorization)
When rendering tree branches on the canvas, use low-saturation, ceramic tones that maintain high contrast against `#F8FAFC`:
- **Branch A (Core Systems):** Ceramic Cobalt (`#2563EB`)
- **Branch B (Methodology):** Forest Jade (`#059669`)
- **Branch C (Synthesis/Notes):** Amber Ochre (`#D97706`)
- **Branch D (Extensions):** Slate Plum (`#7C3AED`)
- **Branch E (Archival):** Neutral Graphite (`#475569`)

---

## 3. Typographic Architecture
- **Font Stack:**
  - **Display & Headings:** `Geist Sans`, `Cabinet Grotesk`, or `Outfit` (`sans-serif`).
  - **Body & Node Text:** `Geist Sans` or `Satoshi` (`sans-serif`). (Strictly **NO generic Inter**).
  - **Metadata, Counters, & Hotkeys:** `Geist Mono` or `JetBrains Mono` (`monospace`).
- **Hierarchy Scale:**
  - **Root Node:** `18px` / Font-weight `700`, line-height `1.2`, tracking `-0.02em`.
  - **Level-1 Category Node:** `14px` / Font-weight `600`, line-height `1.3`, tracking `-0.01em`.
  - **Leaf / Child Node:** `12px` / Font-weight `500`, line-height `1.4`, tracking `0`.
  - **Floating HUD Text:** `12px` / Font-weight `500`, tracking `-0.005em`.
  - **Code & Shortcuts:** `11px` / Monospace, font-weight `500`, uppercase tracking `0.05em`.

---

## 4. Component Specifications

### 4.1 Floating HUD Toolbar (`MindMapToolbar.tsx`)
- **Structure:** Pill/dock container centered horizontally at top or bottom-center.
- **Surface:** `rgba(255, 255, 255, 0.88)` with `backdrop-blur-md` and `box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(226, 232, 240, 0.8)`.
- **Search Input:** Flush inline input with light slate magnifying icon, subtle `#F1F5F9` background, zero harsh border until focused (`ring-2 ring-blue-500/20`).
- **Action Buttons:** Tactile square or rounded-full ghost icons (`32px x 32px`). Hover: `bg-slate-100`, Active: `scale-95 translate-y-[0.5px]`.
- **Dataset / Layout Pills:** Clean dropdown pills showing current state (e.g. `Tree`, `Radial`, `Geo-50`) with down-caret.

### 4.2 WebGL & DOM Node Cards (`MindMapNodeCard.tsx` / `MindMapWebGLCanvas.tsx`)
- **Card Geometry:** Rectangular with subtle rounded corners (`border-radius: 8px` to `10px`).
- **Fill:** Crisp Porcelain White (`#FFFFFF`).
- **Stroke:** 1px hairline border (`#E2E8F0`). Selected/focused node: 2px Ceramic Cobalt (`#2563EB`) stroke with a 3px soft outer halo (`rgba(37, 99, 235, 0.15)`).
- **Badge Indicators:** Small pill chips on top-right showing child count or tag count in muted monospace (`text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full`).
- **Active Recall Mode:** When active, node text is masked with a soft amber dashed pill: `"Tap to reveal"`.

### 4.3 Node Detail Slide-over Panel (`MindMapNodeDetailPanel.tsx`)
- **Position:** Right-docked slide-over on desktop (`w-96`, margin `16px`, height `calc(100vh - 32px)`), floating sheet with `rounded-2xl`.
- **Header:** Node title in `text-lg font-semibold tracking-tight text-slate-900`, breadcrumb lineage in subtle monospace chevron trail.
- **Body:** Markdown preview with clean light typography, code blocks in `#F1F5F9` with `#334155` text.
- **Action Bar:** Primary button: "Open in Obsidian" (Ceramic Cobalt fill `#2563EB`, white text, tactile spring click). Secondary button: "Practice Quiz" (Sage Emerald badge).

### 4.4 Quiz Modal (`MindMapQuizModal.tsx`)
- **Backdrop:** Light scrim (`rgba(15, 23, 42, 0.25)` with `backdrop-blur-sm`).
- **Card:** Clean centered modal (`max-w-lg`, `rounded-2xl`, pure white surface `#FFFFFF`, `border border-slate-200/80`, shadow `0 20px 40px -15px rgba(0,0,0,0.08)`).
- **Options:** Radio selection tiles with 1px border. Selected: `border-blue-600 bg-blue-50/50 text-blue-950 font-medium`.

---

## 5. Layout & Spatial Principles
- **No Overlapping Clutter:** Every HUD element occupies a distinct floating z-index zone (`z-10` canvas, `z-30` controls, `z-40` panels, `z-50` modals).
- **Generous Whitespace:** Minimum 12px margin between HUD containers and viewport edges.
- **Responsive Collapse:**
  - `< 640px` (Mobile / narrow Obsidian sidebar): Toolbar collapses into a compact bottom navigation bar; Detail panel slides up from bottom as an interactive swipe sheet.
  - `> 640px` (Desktop): Floating top/bottom dock, right-side docked detail sheet.

---

## 6. Motion Philosophy & Spring Physics
- **Engine:** Framer Motion (`motion` package) for React HUD, PixiJS ticker for canvas interactions.
- **Physics Tokens:**
  - **Floating Menus / Popovers:** `type: "spring", stiffness: 350, damping: 25`.
  - **Panel Drawer Slide:** `type: "spring", stiffness: 280, damping: 26`.
  - **Button Tap:** `scale: 0.96` on active state.
- **Rule:** Never animate layout properties (`top`, `left`, `width`, `height`); always animate `transform` (`scale`, `translate3d`) and `opacity`.

---

## 7. Anti-Patterns (Banned AI Clichés)
- ❌ **NO Emojis** anywhere in UI icons or system copy (use Lucide icons exclusively).
- ❌ **NO Neon Glows or Purple Gradients:** No violet/cyan cyber gradients or drop shadows.
- ❌ **NO Pure Black (`#000000`):** Use `#0F172A` (Slate-900) or `#18181B` (Zinc-900).
- ❌ **NO Generic Inter:** Use Geist, Satoshi, or Outfit.
- ❌ **NO Cluttered Toolbars:** Never show 15 icons at once; group into semantic menus (Layout, Recall, Filter, Settings).
- ❌ **NO Fabricated Numbers:** Never show fake stats like "99.9% Memory Retention" unless computed from real user quiz telemetry.
