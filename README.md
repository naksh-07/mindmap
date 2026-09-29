<div align="center">
  <h1>🧠 MindMap Studio (Cloud App)</h1>
  <p>A high-performance, WebGL-accelerated Next.js 15 application for interactive, large-scale mind map visualization.</p>
  <p>
    <a href="#-features">Features</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-design-system">Design System</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-obsidian-bridge-protocol">Obsidian Protocol</a>
  </p>
</div>

---

## 📖 Overview

**MindMap Studio** is a Cloudflare-ready, Next.js 15 WebGL application designed to render complex, multi-thousand-node Markdown mind maps with silky-smooth 60 FPS performance.

This project is the **Cloud & Visualization Engine** of the Obsidian MindMap ecosystem. It works seamlessly with the [Obsidian MindMap Bridge Plugin](https://github.com/naksh-07/obsidian-mindmap-bridge) to deliver hardware-accelerated interactive graph visualization directly inside your Obsidian vault without consuming Electron's main memory or lagging the local editor.

---

## ✨ Features

- **⚡ Hardware-Accelerated 60 FPS WebGL Engine**: Powered by **PixiJS v8** and `pixi-viewport`. Replaced heavy HTML DOM nodes (`<div>`) with hardware GPU sprites, textured containers, and smooth cubic Bezier splines.
- **🎯 Viewport Culling & LOD**: Automatically culls off-screen nodes and connectors, maintaining sub-1% CPU usage during pan/zoom even with 1,000+ nodes.
- **🎨 Scandinavian Minimalist Aesthetic (Google Stitch)**: Designed per Linear/Notion principles—Pure Porcelain (`#FFFFFF`), Nordic Alabaster (`#F8FAFC`), Ceramic Cobalt (`#2563EB`), hairline borders, and architectural dot matrix texture (`.canvas-dots`).
- **🔍 Instant Search & Highlighting (`⌘K`)**: Fast client-side fuzzy search across node labels, summaries, and tags with live match counters (`x/total`) and canvas dimming.
- **📐 Multiple Layout Algorithms**:
  - **Balanced (Two-way Radial Tree)**: Root centered, branches distributed left and right.
  - **Tree (Left-to-Right)**: Hierarchical outline flow.
  - **Vertical (Top-to-Bottom)**: Downward organizational structure.
  - **Radial**: Concentric circular orientation.
- **🧠 Active Recall Study Mode**: Transforms the entire mind map into an interactive flashcard memory trainer. Conceals node titles behind tap-to-reveal pills for active study and UPSC/competitive exam mastery.
- **📋 Right-Docked Porcelain Inspector**:
  - Detailed concept notes and syllabus summaries.
  - High-Yield key facts checkpoints with status badges.
  - 2×2 Node Attributes Grid (Classification, Sub-concepts, Recall Status, Branch Focus).
  - SVG Retention Progress Ring with SRS mastery levels.
- **🔗 Bi-directional Obsidian Bridge**:
  - Prominent **Obsidian में खोलें (Open in Obsidian)** action button with `<kbd>⌘↵</kbd>` shortcut.
  - Communicates with the local Obsidian host via secure `window.parent.postMessage`.
  - Deep-links directly to local `.md` vault notes.
- **📊 Real-time Telemetry HUD**: Persistent bottom telemetry display reporting active node count, visible culled count, WebGL 60 FPS status, and clickable lineage breadcrumbs.

---

## 🏗️ Architecture

```mermaid
sequenceDiagram
    participant O as Obsidian Plugin (Local)
    participant B as Iframe Bridge (postMessage)
    participant C as Next.js Cloud App (Cloudflare)
    participant G as PixiJS v8 / WebGL (GPU)

    O->>O: Parse Vault Markdown into JSON Tree
    O->>B: Mount Iframe (Loads MindMap Studio)
    B->>C: React 19 Client App Initializes
    O->>B: postMessage({ type: 'MINDMAP_DATA', payload: JSON })
    B->>C: Ingest MindMap State
    C->>C: Layout Engine calculates x, y & Bezier bounds
    C->>G: Render Graph via WebGL Canvas
    
    Note over C,G: 60 FPS GPU Rendering & Viewport Culling
    
    G->>C: User Clicks Node / Focuses Branch
    C->>C: Slide-in Porcelain Inspector Panel
    C->>B: postMessage({ action: 'OPEN_NOTE', nodeId: '123' })
    B->>O: Dispatch local vault navigation
    O->>O: Open target note in active tab
```

---

## 🎨 Design System

Designed and synced using **Google Stitch**, adhering to modern architectural minimalism:

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| **Canvas Background** | `#F8FAFC` (Nordic Alabaster) | `#0B1120` (Midnight Navy) | Global workspace canvas |
| **Grid Dots** | `rgba(148, 163, 184, 0.45)` | `rgba(51, 65, 85, 0.45)` | 24px architectural grid |
| **Node Surface** | `#FFFFFF` (Pure Porcelain) | `#1E293B` (Slate Tectonic) | Node cards & inspector |
| **Primary Accent** | `#2563EB` (Ceramic Cobalt) | `#3B82F6` (Electric Azure) | Selection ring & brand |
| **Active Recall** | `#D97706` (Warm Amber) | `#F59E0B` (Amber Flame) | Study recall mode & badges |
| **Typography** | Geist Sans / Noto Sans Devanagari | Same | Crisp legibility in Hindi & English |

---

## 💻 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Running Locally

1. **Clone & Install Dependencies:**
   ```bash
   git clone https://github.com/naksh-07/mindmap.git
   cd mindmap
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

3. **Build Static Export (Cloudflare Pages):**
   ```bash
   npm run build
   npx serve out -l 3005
   ```
   Open [http://localhost:3005](http://localhost:3005) to verify the production static bundle.

---

## 🧪 Included Datasets

The app includes bundled sample datasets ready for instant exploration:
- **UPSC Modern Indian History (`/example-mindmap.json`)**: 15 nodes covering 1857 to 1947, 4 eras, high-yield checkpoints, and embedded MCQs.
- **India Physical Geography**: 15 nodes covering Himalayas, Peninsular Plateau, River systems, and Coastal Plains.
- **Stress-Test Benchmarks**: Synthetic 20, 50, 100, 200, 500, and 1,000 node trees for GPU benchmark profiling.

---

## 🔌 Obsidian Bridge Protocol

When embedded inside an Obsidian iframe, MindMap Studio communicates via `postMessage`:

### 1. Ingesting Vault MindMap (`Obsidian -> WebApp`):
```json
{
  "type": "MINDMAP_DATA",
  "payload": {
    "title": "My Note Graph",
    "root": {
      "id": "root-1",
      "label": "Central Concept",
      "children": [...]
    }
  }
}
```

### 2. Opening Note in Obsidian (`WebApp -> Obsidian`):
```json
{
  "action": "OPEN_NOTE",
  "nodeId": "History/1857-Revolt.md"
}
```

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
