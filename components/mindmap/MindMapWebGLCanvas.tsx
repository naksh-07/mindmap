'use client';

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle, Color } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { PositionedNode, ConnectorLine } from '@/lib/mindmap-layout';
import { CrossLink } from '@/lib/types/mindmap';
import { getConnectorStrokeWidth, getConnectorOpacity } from '@/lib/mindmap-theme';

export interface MindMapWebGLCanvasProps {
  nodes: PositionedNode[];
  connectors: ConnectorLine[];
  crossLinks?: CrossLink[];
  selectedNodeId: string | null;
  highlightedNodeIds: Set<string>;
  lineageNodeIds: Set<string>;
  focusedBranchNodeIds?: Set<string>;
  isActiveRecall: boolean;
  revealedNodeIds: Set<string>;
  theme: 'light' | 'dark';
  onSelectNode: (nodeId: string | null) => void;
  onToggleCollapse: (nodeId: string, e: React.MouseEvent) => void;
  onToggleReveal: (nodeId: string, e: React.MouseEvent) => void;
}

export const MindMapWebGLCanvas: React.FC<MindMapWebGLCanvasProps> = ({
  nodes,
  connectors,
  crossLinks = [],
  selectedNodeId,
  highlightedNodeIds,
  lineageNodeIds,
  focusedBranchNodeIds,
  isActiveRecall,
  revealedNodeIds,
  theme,
  onSelectNode,
  onToggleCollapse,
  onToggleReveal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);

  // Scene sub-containers
  const connectorsLayerRef = useRef<Graphics | null>(null);
  const crossLinksLayerRef = useRef<Graphics | null>(null);
  const nodesLayerRef = useRef<Container | null>(null);

  // Track initial fit per dataset root
  const hasFittedRef = useRef<boolean>(false);
  const rootId = nodes.length > 0 ? nodes[0].id : null;
  const [isPixiReady, setIsPixiReady] = useState(false);

  // Node position map for fast lookups
  const nodePosMap = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Color theme tokens (conforming strictly to DESIGN.md Modern Minimal Light)
  const isDark = theme === 'dark';
  const themeColors = useMemo(() => {
    return {
      canvasBg: isDark ? 0x0f172a : 0xf8fafc,
      cardBg: isDark ? 0x1e293b : 0xffffff,
      cardBorder: isDark ? 0x334155 : 0xe2e8f0,
      cardBorderHover: isDark ? 0x64748b : 0x94a3b8,
      selectedBorder: 0x2563eb,
      selectedHalo: 0x2563eb,
      highlightBorder: 0xf59e0b,
      textPrimary: isDark ? '#f8fafc' : '#0f172a',
      textSecondary: isDark ? '#94a3b8' : '#64748b',
      activeRecallVeil: 0xd97706,
      badgeBg: isDark ? 0x334155 : 0xf1f5f9,
      badgeBorder: isDark ? 0x475569 : 0xe2e8f0,
      badgeText: isDark ? '#94a3b8' : '#475569',
      crossLinkLine: 0xf59e0b,
    };
  }, [isDark]);

  // Viewport Culling Engine (60 FPS optimizer)
  const updateCulling = useCallback(() => {
    const viewport = viewportRef.current;
    const nodesLayer = nodesLayerRef.current;
    if (!viewport || !nodesLayer) return;

    const visibleBounds = viewport.getVisibleBounds();
    const margin = 100;
    const minX = visibleBounds.x - margin;
    const maxX = visibleBounds.x + visibleBounds.width + margin;
    const minY = visibleBounds.y - margin;
    const maxY = visibleBounds.y + visibleBounds.height + margin;

    nodesLayer.children.forEach((child) => {
      const pNode = (child as any).__nodeData as PositionedNode | undefined;
      if (pNode) {
        const left = pNode.x - pNode.width / 2;
        const right = pNode.x + pNode.width / 2;
        const top = pNode.y - pNode.height / 2;
        const bottom = pNode.y + pNode.height / 2;

        const isVisible = right >= minX && left <= maxX && bottom >= minY && top <= maxY;
        child.visible = isVisible;
      }
    });
  }, []);

  // Fit view to all nodes bounding box
  const fitToScreen = useCallback((animate = true) => {
    const viewport = viewportRef.current;
    const container = containerRef.current;
    if (!viewport || !container || nodes.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      const w = n.width || 0;
      const h = n.height || 0;
      minX = Math.min(minX, n.x - w / 2);
      maxX = Math.max(maxX, n.x + w / 2);
      minY = Math.min(minY, n.y - h / 2);
      maxY = Math.max(maxY, n.y + h / 2);
    });

    if (minX === Infinity) return;

    const padding = 80;
    const bboxWidth = maxX - minX + padding * 2;
    const bboxHeight = maxY - minY + padding * 2;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const scaleX = container.clientWidth / bboxWidth;
    const scaleY = container.clientHeight / bboxHeight;
    const targetScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.2);

    if (animate) {
      viewport.animate({
        position: { x: centerX, y: centerY },
        scale: targetScale,
        time: 400,
        ease: 'easeInOutSine',
        callbackOnComplete: updateCulling,
      });
    } else {
      viewport.moveCenter(centerX, centerY);
      viewport.scaled = targetScale;
      updateCulling();
    }
  }, [nodes, updateCulling]);

  // Reset fitted ref when root node changes
  useEffect(() => {
    hasFittedRef.current = false;
  }, [rootId]);

  // Listen for toolbar fit-screen event
  useEffect(() => {
    const handleFitScreen = () => {
      fitToScreen(true);
    };
    window.addEventListener('mindmap:fit-screen', handleFitScreen);
    return () => window.removeEventListener('mindmap:fit-screen', handleFitScreen);
  }, [fitToScreen]);

  // Listen for toolbar zoom in/out events
  useEffect(() => {
    const handleZoom = (e: Event) => {
      const customEvent = e as CustomEvent<{ direction: 'in' | 'out' }>;
      const viewport = viewportRef.current;
      if (!viewport) return;
      const factor = customEvent.detail?.direction === 'in' ? 1.25 : 0.8;
      const currentScale = viewport.scale.x;
      const targetScale = Math.min(Math.max(currentScale * factor, 0.2), 3.0);
      viewport.animate({
        scale: targetScale,
        time: 250,
        ease: 'easeInOutSine',
        callbackOnComplete: () => {
          updateCulling();
        },
      });
    };
    window.addEventListener('mindmap:zoom', handleZoom);
    return () => window.removeEventListener('mindmap:zoom', handleZoom);
  }, [updateCulling]);

  // Initialize PixiJS Application & Viewport
  useEffect(() => {
    let isCancelled = false;
    const container = containerRef.current;
    if (!container) return;

    const app = new Application();
    appRef.current = app;

    async function initPixi() {
      if (!container) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      await app.init({
        width,
        height,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (isCancelled) {
        app.destroy(true, { children: true, texture: true });
        return;
      }

      container.appendChild(app.canvas);

      // Setup pixi-viewport
      const viewport = new Viewport({
        screenWidth: width,
        screenHeight: height,
        worldWidth: 20000,
        worldHeight: 20000,
        events: app.renderer.events,
      });

      viewport
        .drag()
        .pinch()
        .wheel({ smooth: 6 })
        .decelerate();

      app.stage.addChild(viewport);
      viewportRef.current = viewport;

      // Create layers in bottom-to-top rendering order
      const connectorsG = new Graphics();
      viewport.addChild(connectorsG);
      connectorsLayerRef.current = connectorsG;

      const crossLinksG = new Graphics();
      viewport.addChild(crossLinksG);
      crossLinksLayerRef.current = crossLinksG;

      const nodesContainer = new Container();
      viewport.addChild(nodesContainer);
      nodesLayerRef.current = nodesContainer;

      // Bind culling on camera movements
      viewport.on('moved', updateCulling);
      viewport.on('zoomed', updateCulling);

      setIsPixiReady(true);
    }

    initPixi();

    // Handle container resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && appRef.current && viewportRef.current) {
          appRef.current.renderer.resize(width, height);
          viewportRef.current.resize(width, height);
          updateCulling();
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      isCancelled = true;
      resizeObserver.disconnect();
      if (viewportRef.current) {
        viewportRef.current.destroy({ children: true });
        viewportRef.current = null;
      }
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true, texture: true });
        } catch (e) {
          // ignore cleanup errors on fast refresh
        }
        appRef.current = null;
      }
    };
  }, []); // Mount once

  // Keep background transparent so CSS canvas-dots shines through
  useEffect(() => {
    if (appRef.current && appRef.current.renderer) {
      appRef.current.renderer.background.alpha = 0;
    }
  }, [themeColors]);

  // Render Connectors Layer
  useEffect(() => {
    if (!isPixiReady) return;
    const g = connectorsLayerRef.current;
    if (!g) return;

    g.clear();

    connectors.forEach((c) => {
      const sourceNode = nodePosMap.get(c.sourceId);
      const depth = sourceNode ? sourceNode.depth : 1;

      const isConnectedToSelected =
        selectedNodeId !== null && (c.sourceId === selectedNodeId || c.targetId === selectedNodeId);
      const isConnectedToLineage =
        lineageNodeIds.has(c.sourceId) && lineageNodeIds.has(c.targetId);

      const isFocusDimmed =
        focusedBranchNodeIds &&
        focusedBranchNodeIds.size > 0 &&
        (!focusedBranchNodeIds.has(c.sourceId) || !focusedBranchNodeIds.has(c.targetId));

      const isDimmed =
        isFocusDimmed ||
        (selectedNodeId !== null && !isConnectedToLineage && !isConnectedToSelected) ||
        (highlightedNodeIds.size > 0 &&
          !highlightedNodeIds.has(c.sourceId) &&
          !highlightedNodeIds.has(c.targetId));

      const strokeWidth = getConnectorStrokeWidth(depth, !!isConnectedToSelected, isConnectedToLineage);
      const strokeOpacity = isFocusDimmed
        ? 0.25
        : getConnectorOpacity(!!isConnectedToSelected, isConnectedToLineage, !!isDimmed);

      const colorVal = new Color(c.color || '#2563eb').toNumber();

      // Parse svg path 'M x1 y1 C cx1 cy1, cx2 cy2, x2 y2'
      const p = c.path;
      if (p.startsWith('M')) {
        const parts = p.replace(/[MC,]/g, ' ').trim().split(/\s+/).map(Number);
        if (parts.length >= 8) {
          const [x1, y1, cx1, cy1, cx2, cy2, x2, y2] = parts;
          g.moveTo(x1, y1);
          g.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
          g.stroke({ width: strokeWidth, color: colorVal, alpha: strokeOpacity, cap: 'round' });
        } else if (parts.length >= 4) {
          const [x1, y1, x2, y2] = parts;
          g.moveTo(x1, y1);
          g.lineTo(x2, y2);
          g.stroke({ width: strokeWidth, color: colorVal, alpha: strokeOpacity, cap: 'round' });
        }
      }
    });
  }, [connectors, nodePosMap, selectedNodeId, lineageNodeIds, focusedBranchNodeIds, highlightedNodeIds, isPixiReady]);

  // Render Cross-links Layer
  useEffect(() => {
    if (!isPixiReady) return;
    const g = crossLinksLayerRef.current;
    if (!g) return;

    g.clear();

    crossLinks.forEach((link) => {
      const source = nodePosMap.get(link.sourceId);
      const target = nodePosMap.get(link.targetId);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const cx = (source.x + target.x) / 2 - dy * 0.2;
      const cy = (source.y + target.y) / 2 + dx * 0.2;

      const isFocusDimmed =
        focusedBranchNodeIds &&
        focusedBranchNodeIds.size > 0 &&
        (!focusedBranchNodeIds.has(link.sourceId) || !focusedBranchNodeIds.has(link.targetId));

      const alpha = isFocusDimmed ? 0.2 : 0.65;

      g.moveTo(source.x, source.y);
      g.quadraticCurveTo(cx, cy, target.x, target.y);
      g.stroke({
        width: 1.5,
        color: themeColors.crossLinkLine,
        alpha,
        cap: 'round',
      });

      // Arrowhead marker
      const angle = Math.atan2(target.y - cy, target.x - cx);
      const arrowLen = 8;
      g.moveTo(target.x, target.y);
      g.lineTo(
        target.x - arrowLen * Math.cos(angle - Math.PI / 6),
        target.y - arrowLen * Math.sin(angle - Math.PI / 6)
      );
      g.moveTo(target.x, target.y);
      g.lineTo(
        target.x - arrowLen * Math.cos(angle + Math.PI / 6),
        target.y - arrowLen * Math.sin(angle + Math.PI / 6)
      );
      g.stroke({ width: 1.5, color: themeColors.crossLinkLine, alpha, cap: 'round' });
    });
  }, [crossLinks, nodePosMap, focusedBranchNodeIds, themeColors.crossLinkLine, isPixiReady]);

  // Render Nodes Layer
  useEffect(() => {
    if (!isPixiReady) return;
    const nodesContainer = nodesLayerRef.current;
    if (!nodesContainer) return;

    // Clean existing children
    nodesContainer.removeChildren();

    // Map each positioned node to a PixiJS Container
    nodes.forEach((pNode) => {
      const nodeContainer = new Container();
      (nodeContainer as any).__nodeData = pNode;
      nodeContainer.x = pNode.x;
      nodeContainer.y = pNode.y;
      nodeContainer.eventMode = 'static';
      nodeContainer.cursor = 'pointer';

      const isSelected = selectedNodeId === pNode.id;
      const isHighlighted = highlightedNodeIds.has(pNode.id);
      const isLineage = lineageNodeIds.has(pNode.id);

      const isFocusDimmed =
        focusedBranchNodeIds &&
        focusedBranchNodeIds.size > 0 &&
        !focusedBranchNodeIds.has(pNode.id);

      const isDimmed =
        isFocusDimmed ||
        (selectedNodeId !== null && !isLineage && !isSelected) ||
        (highlightedNodeIds.size > 0 && !isHighlighted);

      nodeContainer.alpha = isDimmed ? 0.25 : 1.0;

      const halfW = pNode.width / 2;
      const halfH = pNode.height / 2;
      const radius = pNode.depth === 0 ? 12 : pNode.depth === 1 ? 10 : 8;

      // Card Background Graphics
      const cardG = new Graphics();
      cardG.eventMode = 'static';
      cardG.cursor = 'pointer';

      // Soft Halo for Selected State
      if (isSelected) {
        cardG.roundRect(-halfW - 3, -halfH - 3, pNode.width + 6, pNode.height + 6, radius + 2);
        cardG.fill({ color: themeColors.selectedHalo, alpha: 0.15 });
      }

      // Card Face
      cardG.roundRect(-halfW, -halfH, pNode.width, pNode.height, radius);
      cardG.fill({ color: themeColors.cardBg });

      // Border Stroke
      if (isSelected) {
        cardG.stroke({ width: 2.5, color: themeColors.selectedBorder });
      } else if (isHighlighted) {
        cardG.stroke({ width: 2, color: themeColors.highlightBorder });
      } else {
        cardG.stroke({ width: 1, color: themeColors.cardBorder });
      }

      nodeContainer.addChild(cardG);

      // Check Active Recall mode
      const isMaskedInActiveRecall = isActiveRecall && !revealedNodeIds.has(pNode.id);

      if (isMaskedInActiveRecall) {
        // Amber Veil Mask
        const veilG = new Graphics();
        veilG.roundRect(-halfW + 8, -halfH + 8, pNode.width - 16, pNode.height - 16, 6);
        veilG.fill({ color: themeColors.activeRecallVeil, alpha: 0.12 });
        veilG.stroke({ width: 1, color: themeColors.activeRecallVeil, alpha: 0.5 });
        nodeContainer.addChild(veilG);

        const veilText = new Text({
          text: 'देखने के लिए टैप करें (Reveal)',
          style: new TextStyle({
            fontFamily: '"Geist Sans", "Outfit", "Noto Sans Devanagari", system-ui, sans-serif',
            fontSize: 10,
            fontWeight: '600',
            fill: '#d97706',
            align: 'center',
          }),
        });
        veilText.anchor.set(0.5);
        nodeContainer.addChild(veilText);
      } else {
        // Normal Node Typography
        const fontSize = pNode.depth === 0 ? 15 : pNode.depth === 1 ? 13 : 12;
        const fontWeight = pNode.depth === 0 ? '700' : pNode.depth === 1 ? '600' : '500';

        const labelText = new Text({
          text: pNode.node.label,
          style: new TextStyle({
            fontFamily: '"Geist Sans", "Outfit", "Noto Sans Devanagari", system-ui, sans-serif',
            fontSize,
            fontWeight,
            fill: themeColors.textPrimary,
            wordWrap: true,
            wordWrapWidth: pNode.width - 24,
            align: 'center',
            lineHeight: fontSize * 1.3,
          }),
        });
        labelText.anchor.set(0.5);

        // Position slightly higher if subtitle exists
        if (pNode.node.subtitle) {
          labelText.y = -6;

          const subText = new Text({
            text: pNode.node.subtitle,
            style: new TextStyle({
              fontFamily: '"Geist Sans", "Outfit", "Noto Sans Devanagari", system-ui, sans-serif',
              fontSize: 10,
              fontWeight: '400',
              fill: themeColors.textSecondary,
              wordWrap: true,
              wordWrapWidth: pNode.width - 24,
              align: 'center',
            }),
          });
          subText.anchor.set(0.5);
          subText.y = halfH - 12;
          nodeContainer.addChild(subText);
        }

        nodeContainer.addChild(labelText);
      }

      // Child Count & Collapse/Expand Button (if node has children)
      const hasChildren = (pNode.node.children && pNode.node.children.length > 0) || (pNode.children && pNode.children.length > 0);
      if (hasChildren) {
        const toggleBtn = new Container();
        toggleBtn.eventMode = 'static';
        toggleBtn.cursor = 'pointer';

        // Position on the edge according to tree flow
        toggleBtn.x = halfW;
        toggleBtn.y = 0;

        const toggleG = new Graphics();
        toggleG.circle(0, 0, 9);
        toggleG.fill({ color: themeColors.cardBg });
        toggleG.stroke({ width: 1.5, color: isSelected ? themeColors.selectedBorder : themeColors.cardBorderHover });
        toggleBtn.addChild(toggleG);

        const glyphText = new Text({
          text: pNode.collapsed ? '+' : '–',
          style: new TextStyle({
            fontFamily: '"Geist Mono", monospace',
            fontSize: 11,
            fontWeight: '700',
            fill: themeColors.textSecondary,
          }),
        });
        glyphText.anchor.set(0.5, 0.55);
        toggleBtn.addChild(glyphText);

        toggleBtn.on('pointertap', (e) => {
          e.stopPropagation();
          onToggleCollapse(pNode.id, e as any);
        });

        nodeContainer.addChild(toggleBtn);
      }

      // Node tap selection & Active Recall reveal
      nodeContainer.on('pointertap', (e) => {
        e.stopPropagation();
        if (isActiveRecall && !revealedNodeIds.has(pNode.id)) {
          onToggleReveal(pNode.id, e as any);
        } else {
          onSelectNode(pNode.id);
          // Bi-directional Obsidian Bridge dispatch
          if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
            window.parent.postMessage({ action: 'OPEN_NOTE', nodeId: pNode.id }, '*');
          }
        }
      });

      nodesContainer.addChild(nodeContainer);
    });

    // Run culling pass once nodes are mounted
    updateCulling();
  }, [
    nodes,
    selectedNodeId,
    highlightedNodeIds,
    lineageNodeIds,
    focusedBranchNodeIds,
    isActiveRecall,
    revealedNodeIds,
    themeColors,
    isPixiReady,
    onSelectNode,
    onToggleCollapse,
    onToggleReveal,
    updateCulling,
  ]);

  // Center on dataset changes or when Pixi becomes ready
  useEffect(() => {
    if (!isPixiReady || nodes.length === 0) return;
    fitToScreen(false);
  }, [isPixiReady, rootId, fitToScreen]);

  // Mathematical spatial hit-testing engine for 100% reliable node selection & collapse
  const pointerDownRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerDownRef.current;
    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    const duration = Date.now() - start.time;

    // Distinguish tap from pan/drag (threshold 8px and 500ms)
    if (dist < 8 && duration < 500) {
      const viewport = viewportRef.current;
      const container = containerRef.current;
      if (!viewport || !container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPoint = viewport.toWorld(screenX, screenY);

      // Check nodes from top to bottom (leaf to root priority)
      for (let i = nodes.length - 1; i >= 0; i--) {
        const pNode = nodes[i];
        const halfW = pNode.width / 2;
        const halfH = pNode.height / 2;

        // Check collapse handle (+/- handle circle at edge)
        if (pNode.node.children && pNode.node.children.length > 0) {
          const handleX = pNode.x + halfW;
          const handleY = pNode.y;
          if (Math.hypot(worldPoint.x - handleX, worldPoint.y - handleY) <= 15) {
            onToggleCollapse(pNode.id, e as any);
            return;
          }
        }

        // Check card boundary
        if (
          worldPoint.x >= pNode.x - halfW &&
          worldPoint.x <= pNode.x + halfW &&
          worldPoint.y >= pNode.y - halfH &&
          worldPoint.y <= pNode.y + halfH
        ) {
          if (isActiveRecall && !revealedNodeIds.has(pNode.id)) {
            onToggleReveal(pNode.id, e as any);
          } else {
            onSelectNode(pNode.id);
            // Bi-directional Obsidian Bridge dispatch
            if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
              window.parent.postMessage({ action: 'OPEN_NOTE', nodeId: pNode.id }, '*');
            }
          }
          return;
        }
      }

      // Deselect if empty canvas tapped
      onSelectNode(null);
    }
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Mind Map WebGL Stage"
      onPointerDownCapture={handlePointerDown}
      onPointerUpCapture={handlePointerUp}
      className="w-full h-full relative overflow-hidden select-none outline-none touch-none cursor-grab active:cursor-grabbing"
    />
  );
};
