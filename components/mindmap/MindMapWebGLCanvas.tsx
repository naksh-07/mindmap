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

/**
 * Computes the exact relative (x, y) offset for the expand/collapse badge
 * based on which direction the node's children grow.
 */
function getToggleBadgeOffset(pNode: PositionedNode): { x: number; y: number } {
  const halfW = pNode.width / 2;
  const halfH = pNode.height / 2;

  if (pNode.parent) {
    const dx = pNode.x - pNode.parent.x;
    const dy = pNode.y - pNode.parent.y;
    // Vertical layout flow (children grow downward)
    if (Math.abs(dy) > Math.abs(dx) * 1.5 && dy > 0 && Math.abs(dx) < 40) {
      return { x: 0, y: halfH };
    }
    // Left-branching flow in Balanced mode
    if (dx < -20) {
      return { x: -halfW, y: 0 };
    }
  }
  return { x: halfW, y: 0 };
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

  // Scene sub-containers (rendered bottom-to-top)
  const connectorsLayerRef = useRef<Graphics | null>(null);
  const crossLinksLayerRef = useRef<Graphics | null>(null);
  const nodesLayerRef = useRef<Container | null>(null);

  // Track initial fit per dataset root & smart camera focus after expand/collapse
  const hasFittedRef = useRef<boolean>(false);
  const pendingFocusNodeIdRef = useRef<string | null>(null);
  const rootId = nodes.length > 0 ? nodes[0].id : null;
  const [isPixiReady, setIsPixiReady] = useState(false);

  // Pointer tracking to distinguish pan from tap and guard against multi-touch accidental taps
  const pointerDownRef = useRef<{ x: number; y: number; time: number; pointerId: number } | null>(null);
  const activeTouchIdsRef = useRef<Set<number>>(new Set());
  const hadMultiTouchRef = useRef<boolean>(false);

  // Node position map for fast lookups
  const nodePosMap = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Color theme tokens (Pure Zero-Dot Architectural Studio Surface)
  const isDark = theme === 'dark';
  const themeColors = useMemo(() => {
    return {
      cardBg: isDark ? 0x1e293b : 0xffffff,
      cardBorder: isDark ? 0x334155 : 0xcbd5e1,
      cardBorderHover: isDark ? 0x64748b : 0x94a3b8,
      selectedBorder: 0x2563eb,
      selectedHalo: 0x2563eb,
      highlightBorder: 0xf59e0b,
      textPrimary: isDark ? '#f8fafc' : '#0f172a',
      textSecondary: isDark ? '#94a3b8' : '#475569',
      activeRecallVeil: 0xd97706,
      crossLinkLine: 0xf59e0b,
    };
  }, [isDark]);

  // Viewport Culling Engine (60 FPS optimizer)
  const updateCulling = useCallback(() => {
    const viewport = viewportRef.current;
    const nodesLayer = nodesLayerRef.current;
    if (!viewport || !nodesLayer) return;

    const visibleBounds = viewport.getVisibleBounds();
    const margin = 120;
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

  // Frame a specific subset of nodes cleanly in the viewport
  const frameNodeSubset = useCallback(
    (targetNodes: PositionedNode[], animate = true) => {
      const viewport = viewportRef.current;
      const container = containerRef.current;
      if (!viewport || !container || targetNodes.length === 0) return;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      targetNodes.forEach((n) => {
        const w = n.width || 0;
        const h = n.height || 0;
        minX = Math.min(minX, n.x - w / 2);
        maxX = Math.max(maxX, n.x + w / 2);
        minY = Math.min(minY, n.y - h / 2);
        maxY = Math.max(maxY, n.y + h / 2);
      });

      if (minX === Infinity) return;

      const isMobile = container.clientWidth < 640;
      const padX = isMobile ? 28 : 80;
      const padY = isMobile ? 64 : 80;
      const bboxWidth = maxX - minX + padX * 2;
      const bboxHeight = maxY - minY + padY * 2;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const scaleX = container.clientWidth / bboxWidth;
      const scaleY = container.clientHeight / bboxHeight;
      // On mobile, never zoom out into unreadable microscopic ants (< 0.55x)
      const minScale = isMobile ? 0.58 : 0.38;
      const maxScale = isMobile ? 1.05 : 1.2;
      const targetScale = Math.min(Math.max(Math.min(scaleX, scaleY), minScale), maxScale);

      if (animate) {
        viewport.animate({
          position: { x: centerX, y: centerY },
          scale: targetScale,
          time: 360,
          ease: 'easeInOutSine',
          callbackOnComplete: updateCulling,
        });
      } else {
        viewport.moveCenter(centerX, centerY);
        viewport.scaled = targetScale;
        updateCulling();
      }
    },
    [updateCulling]
  );

  // Fit view to all nodes (with smart readable framing on mobile)
  const fitToScreen = useCallback(
    (animate = true) => {
      const container = containerRef.current;
      if (!container || nodes.length === 0) return;

      const isMobile = container.clientWidth < 640;
      if (isMobile) {
        // On mobile, prioritize framing Root + Depth 1 branches so text is always large & readable
        const coreNodes = nodes.filter((n) => n.depth <= 1);
        frameNodeSubset(coreNodes.length > 0 ? coreNodes : nodes, animate);
      } else {
        frameNodeSubset(nodes, animate);
      }
    },
    [nodes, frameNodeSubset]
  );

  // Reset fitted ref when root node changes
  useEffect(() => {
    hasFittedRef.current = false;
  }, [rootId]);

  // Smart Camera Auto-Focus when a branch is expanded or collapsed
  useEffect(() => {
    if (!isPixiReady || !pendingFocusNodeIdRef.current) return;
    const toggledId = pendingFocusNodeIdRef.current;
    pendingFocusNodeIdRef.current = null;

    const targetNode = nodePosMap.get(toggledId);
    if (!targetNode) return;

    if (!targetNode.collapsed && targetNode.children && targetNode.children.length > 0) {
      // Node was just expanded -> Frame the node and its newly revealed direct children
      frameNodeSubset([targetNode, ...targetNode.children], true);
    } else if (targetNode.collapsed && targetNode.parent) {
      // Node was just collapsed -> Frame its parent and sibling branches
      const siblings = targetNode.parent.children || [targetNode];
      frameNodeSubset([targetNode.parent, ...siblings], true);
    }
  }, [nodes, isPixiReady, nodePosMap, frameNodeSubset]);

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
      const targetScale = Math.min(Math.max(currentScale * factor, 0.25), 3.5);
      viewport.animate({
        scale: targetScale,
        time: 220,
        ease: 'easeInOutSine',
        callbackOnComplete: updateCulling,
      });
    };
    window.addEventListener('mindmap:zoom', handleZoom);
    return () => window.removeEventListener('mindmap:zoom', handleZoom);
  }, [updateCulling]);

  const updateCullingRef = useRef(updateCulling);
  updateCullingRef.current = updateCulling;

  // Initialize PixiJS Application & Viewport (Runs once on mount)
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

      const dpr = Math.min(Math.max(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5), 2.5);

      await app.init({
        width,
        height,
        backgroundAlpha: 0,
        resolution: dpr,
        autoDensity: true,
        antialias: true,
        roundPixels: true,
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
        .decelerate({ friction: 0.92 });

      app.stage.addChild(viewport);
      viewportRef.current = viewport;

      // 1. Connectors Layer
      const connectorsG = new Graphics();
      viewport.addChild(connectorsG);
      connectorsLayerRef.current = connectorsG;

      // 2. Cross-links Layer
      const crossLinksG = new Graphics();
      viewport.addChild(crossLinksG);
      crossLinksLayerRef.current = crossLinksG;

      // 3. Nodes Container
      const nodesContainer = new Container();
      viewport.addChild(nodesContainer);
      nodesLayerRef.current = nodesContainer;

      viewport.on('moved', () => {
        updateCullingRef.current();
      });
      viewport.on('zoomed', () => {
        updateCullingRef.current();
      });

      setIsPixiReady(true);
    }

    initPixi();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && appRef.current && viewportRef.current) {
          appRef.current.renderer.resize(width, height);
          viewportRef.current.resize(width, height);
          updateCullingRef.current();
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      isCancelled = true;
      resizeObserver.disconnect();
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
        viewportRef.current = null;
        connectorsLayerRef.current = null;
        crossLinksLayerRef.current = null;
        nodesLayerRef.current = null;
        setIsPixiReady(false);
      }
    };
  }, []);

  // Initial fit when nodes are positioned and Pixi is ready
  useEffect(() => {
    if (isPixiReady && nodes.length > 0 && !hasFittedRef.current) {
      fitToScreen(false);
      hasFittedRef.current = true;
    }
  }, [isPixiReady, nodes, fitToScreen]);

  // Render Hierarchical Connectors (Cubic Bezier Splines)
  useEffect(() => {
    if (!isPixiReady) return;
    const g = connectorsLayerRef.current;
    if (!g) return;

    g.clear();

    connectors.forEach((conn) => {
      const fromNode = nodePosMap.get(conn.sourceId);
      const toNode = nodePosMap.get(conn.targetId);
      if (!fromNode || !toNode) return;

      const isSelected = selectedNodeId === conn.targetId || selectedNodeId === conn.sourceId;
      const isLineage = lineageNodeIds.has(conn.targetId) && lineageNodeIds.has(conn.sourceId);
      const isFocused =
        focusedBranchNodeIds &&
        (focusedBranchNodeIds.has(conn.sourceId) || focusedBranchNodeIds.has(conn.targetId));

      const isDimmed =
        (focusedBranchNodeIds && focusedBranchNodeIds.size > 0 && !isFocused) ||
        (selectedNodeId !== null && !isLineage && !isSelected);

      const alpha = getConnectorOpacity(isSelected, isLineage, isDimmed);
      const strokeWidth = getConnectorStrokeWidth(toNode.depth, isSelected, isLineage);
      const strokeColor = conn.color ? new Color(conn.color).toNumber() : themeColors.cardBorderHover;

      const dx = conn.targetX - conn.sourceX;
      const dy = conn.targetY - conn.sourceY;

      let cp1X = conn.sourceX + dx * 0.5;
      let cp1Y = conn.sourceY;
      let cp2X = conn.sourceX + dx * 0.5;
      let cp2Y = conn.targetY;

      if (Math.abs(dy) > Math.abs(dx)) {
        cp1X = conn.sourceX;
        cp1Y = conn.sourceY + dy * 0.5;
        cp2X = conn.targetX;
        cp2Y = conn.sourceY + dy * 0.5;
      }

      g.moveTo(conn.sourceX, conn.sourceY);
      g.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, conn.targetX, conn.targetY);

      g.stroke({
        width: strokeWidth,
        color: strokeColor,
        alpha,
        cap: 'round',
        join: 'round',
      });
    });
  }, [
    connectors,
    nodePosMap,
    selectedNodeId,
    lineageNodeIds,
    focusedBranchNodeIds,
    themeColors.cardBorderHover,
    isPixiReady,
  ]);

  // Render Cross-Links
  useEffect(() => {
    if (!isPixiReady) return;
    const g = crossLinksLayerRef.current;
    if (!g) return;

    g.clear();

    crossLinks.forEach((link) => {
      const source = nodePosMap.get(link.sourceId);
      const target = nodePosMap.get(link.targetId);
      if (!source || !target) return;

      const isFocused =
        focusedBranchNodeIds &&
        (focusedBranchNodeIds.has(link.sourceId) || focusedBranchNodeIds.has(link.targetId));

      const alpha = focusedBranchNodeIds && focusedBranchNodeIds.size > 0 ? (isFocused ? 0.9 : 0.08) : 0.65;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.hypot(dx, dy);
      const curvature = Math.min(dist * 0.25, 120);

      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2 - curvature;

      g.moveTo(source.x, source.y);
      g.quadraticCurveTo(midX, midY, target.x, target.y);
      g.stroke({
        width: 1.5,
        color: themeColors.crossLinkLine,
        alpha,
        cap: 'round',
      });

      const angle = Math.atan2(target.y - midY, target.x - midX);
      const arrowLen = 9;
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

  // Render Nodes Layer (Elevated Cards with Branch Accents & 3.5x Retina Typography)
  useEffect(() => {
    if (!isPixiReady) return;
    const nodesContainer = nodesLayerRef.current;
    if (!nodesContainer) return;

    nodesContainer.removeChildren();

    const TEXT_RESOLUTION = 3.5;

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

      nodeContainer.alpha = isDimmed ? 0.28 : 1.0;

      const halfW = pNode.width / 2;
      const halfH = pNode.height / 2;
      const radius = pNode.depth === 0 ? 14 : pNode.depth === 1 ? 12 : 10;
      const branchColorHex = pNode.branchColor ? new Color(pNode.branchColor).toNumber() : 0x2563eb;

      // Card Background Graphics with Tactile Elevation Shadow
      const cardG = new Graphics();
      cardG.eventMode = 'static';
      cardG.cursor = 'pointer';

      // 1. Multi-layer Soft Drop Shadow (gives crisp depth against clean studio background)
      cardG.roundRect(-halfW - 1, -halfH + 2, pNode.width + 2, pNode.height + 3, radius + 1);
      cardG.fill({ color: 0x0f172a, alpha: isDark ? 0.45 : 0.05 });
      cardG.roundRect(-halfW, -halfH + 4, pNode.width, pNode.height, radius);
      cardG.fill({ color: 0x0f172a, alpha: isDark ? 0.35 : 0.04 });

      // 2. Soft Halo for Selected or Root State
      if (isSelected) {
        cardG.roundRect(-halfW - 4, -halfH - 4, pNode.width + 8, pNode.height + 8, radius + 3);
        cardG.fill({ color: themeColors.selectedHalo, alpha: 0.16 });
      } else if (pNode.depth === 0) {
        cardG.roundRect(-halfW - 3, -halfH - 3, pNode.width + 6, pNode.height + 6, radius + 2);
        cardG.fill({ color: branchColorHex, alpha: 0.08 });
      }

      // 3. Card Surface Face
      cardG.roundRect(-halfW, -halfH, pNode.width, pNode.height, radius);
      cardG.fill({ color: themeColors.cardBg });

      // 4. Border Stroke
      if (isSelected) {
        cardG.stroke({ width: 2.5, color: themeColors.selectedBorder });
      } else if (isHighlighted) {
        cardG.stroke({ width: 2.2, color: themeColors.highlightBorder });
      } else if (pNode.depth === 0) {
        cardG.stroke({ width: 2, color: branchColorHex, alpha: 0.85 });
      } else {
        cardG.stroke({ width: 1.25, color: themeColors.cardBorder });
      }

      // 5. Branch Color Left Accent Pill (for Level 1+ nodes)
      if (pNode.depth >= 1) {
        const accentHeight = Math.max(pNode.height - 20, 18);
        cardG.roundRect(-halfW + 5, -accentHeight / 2, 4, accentHeight, 2);
        cardG.fill({ color: branchColorHex, alpha: 0.9 });
      }

      nodeContainer.addChild(cardG);

      // Check Active Recall mode
      const isMaskedInActiveRecall = isActiveRecall && !revealedNodeIds.has(pNode.id);

      if (isMaskedInActiveRecall) {
        const veilG = new Graphics();
        veilG.roundRect(-halfW + 10, -halfH + 8, pNode.width - 20, pNode.height - 16, 6);
        veilG.fill({ color: themeColors.activeRecallVeil, alpha: 0.12 });
        veilG.stroke({ width: 1, color: themeColors.activeRecallVeil, alpha: 0.5 });
        nodeContainer.addChild(veilG);

        const veilText = new Text({
          text: 'देखने के लिए टैप करें (Reveal)',
          style: new TextStyle({
            fontFamily: '"Geist Sans", "Outfit", "Noto Sans Devanagari", system-ui, sans-serif',
            fontSize: 10.5,
            fontWeight: '600',
            fill: '#d97706',
            align: 'center',
          }),
          resolution: TEXT_RESOLUTION,
          roundPixels: true,
        });
        veilText.anchor.set(0.5);
        nodeContainer.addChild(veilText);
      } else {
        // Normal Node Typography (Crisp 3.5x Resolution)
        const fontSize = pNode.depth === 0 ? 15 : pNode.depth === 1 ? 13.5 : 12.5;
        const fontWeight = pNode.depth === 0 ? '700' : pNode.depth === 1 ? '600' : '500';

        const labelText = new Text({
          text: pNode.node.label,
          style: new TextStyle({
            fontFamily: '"Geist Sans", "Outfit", "Noto Sans Devanagari", system-ui, sans-serif',
            fontSize,
            fontWeight,
            fill: themeColors.textPrimary,
            wordWrap: true,
            wordWrapWidth: pNode.width - 28,
            align: 'center',
            lineHeight: fontSize * 1.32,
          }),
          resolution: TEXT_RESOLUTION,
          roundPixels: true,
        });
        labelText.anchor.set(0.5);

        if (pNode.node.subtitle) {
          labelText.y = -7;

          const subText = new Text({
            text: pNode.node.subtitle,
            style: new TextStyle({
              fontFamily: '"Geist Sans", "Outfit", "Noto Sans Devanagari", system-ui, sans-serif',
              fontSize: 10.5,
              fontWeight: '400',
              fill: themeColors.textSecondary,
              wordWrap: true,
              wordWrapWidth: pNode.width - 28,
              align: 'center',
            }),
            resolution: TEXT_RESOLUTION,
            roundPixels: true,
          });
          subText.anchor.set(0.5);
          subText.y = halfH - 13;
          nodeContainer.addChild(subText);
        }

        nodeContainer.addChild(labelText);
      }

      // Child Count & Collapse/Expand Pill Badge
      const hasChildren =
        (pNode.node.children && pNode.node.children.length > 0) ||
        (pNode.children && pNode.children.length > 0);

      if (hasChildren) {
        const badgeOffset = getToggleBadgeOffset(pNode);
        const toggleBtn = new Container();
        toggleBtn.eventMode = 'static';
        toggleBtn.cursor = 'pointer';
        toggleBtn.x = badgeOffset.x;
        toggleBtn.y = badgeOffset.y;

        const toggleG = new Graphics();
        const count = pNode.hiddenCount || pNode.node.children?.length || 0;

        if (pNode.collapsed) {
          // Prominent colored pill badge showing "+3" hidden sub-nodes
          const pillW = count >= 10 ? 32 : 26;
          const pillH = 20;
          toggleG.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 10);
          toggleG.fill({ color: branchColorHex });
          toggleG.stroke({ width: 1.5, color: 0xffffff });
          toggleBtn.addChild(toggleG);

          const glyphText = new Text({
            text: `+${count}`,
            style: new TextStyle({
              fontFamily: '"Geist Mono", system-ui, sans-serif',
              fontSize: 10.5,
              fontWeight: '700',
              fill: '#ffffff',
            }),
            resolution: TEXT_RESOLUTION,
            roundPixels: true,
          });
          glyphText.anchor.set(0.5, 0.52);
          toggleBtn.addChild(glyphText);
        } else {
          // Clean circular collapse button "–"
          toggleG.circle(0, 0, 10);
          toggleG.fill({ color: themeColors.cardBg });
          toggleG.stroke({ width: 1.5, color: branchColorHex });
          toggleBtn.addChild(toggleG);

          const glyphText = new Text({
            text: '–',
            style: new TextStyle({
              fontFamily: '"Geist Mono", monospace',
              fontSize: 12,
              fontWeight: '700',
              fill: themeColors.textSecondary,
            }),
            resolution: TEXT_RESOLUTION,
            roundPixels: true,
          });
          glyphText.anchor.set(0.5, 0.55);
          toggleBtn.addChild(glyphText);
        }

        toggleBtn.on('pointertap', (e) => {
          e.stopPropagation();
          pendingFocusNodeIdRef.current = pNode.id;
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
          if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
            window.parent.postMessage({ action: 'OPEN_NOTE', nodeId: pNode.id }, '*');
          }
        }
      });

      nodesContainer.addChild(nodeContainer);
    });

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
    isDark,
    onSelectNode,
    onToggleCollapse,
    onToggleReveal,
    isPixiReady,
    updateCulling,
  ]);

  // Spatial Hit-Testing Engine with Multi-Touch Guard
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    activeTouchIdsRef.current.add(e.pointerId);
    if (activeTouchIdsRef.current.size > 1) {
      hadMultiTouchRef.current = true;
    }
    if (!e.isPrimary) return;
    pointerDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now(), pointerId: e.pointerId };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasMultiTouch = hadMultiTouchRef.current || activeTouchIdsRef.current.size > 1;
    activeTouchIdsRef.current.delete(e.pointerId);
    if (activeTouchIdsRef.current.size === 0) {
      hadMultiTouchRef.current = false;
    }

    if (!e.isPrimary || wasMultiTouch) {
      pointerDownRef.current = null;
      return;
    }

    const start = pointerDownRef.current;
    if (!start || start.pointerId !== e.pointerId) return;

    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    const duration = Date.now() - start.time;

    if (dist < 12 && duration < 500) {
      const viewport = viewportRef.current;
      const container = containerRef.current;
      if (!viewport || !container) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPoint = viewport.toWorld(screenX, screenY);

      for (let i = nodes.length - 1; i >= 0; i--) {
        const pNode = nodes[i];
        const halfW = pNode.width / 2;
        const halfH = pNode.height / 2;

        // Check collapse/expand badge with generous 24px touch radius
        if (pNode.node.children && pNode.node.children.length > 0) {
          const badgeOffset = getToggleBadgeOffset(pNode);
          const handleX = pNode.x + badgeOffset.x;
          const handleY = pNode.y + badgeOffset.y;
          if (Math.hypot(worldPoint.x - handleX, worldPoint.y - handleY) <= 24) {
            pendingFocusNodeIdRef.current = pNode.id;
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
            if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
              window.parent.postMessage({ action: 'OPEN_NOTE', nodeId: pNode.id }, '*');
            }
          }
          return;
        }
      }

      onSelectNode(null);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    activeTouchIdsRef.current.delete(e.pointerId);
    if (activeTouchIdsRef.current.size === 0) {
      hadMultiTouchRef.current = false;
    }
    pointerDownRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Mind Map WebGL Stage"
      onPointerDownCapture={handlePointerDown}
      onPointerUpCapture={handlePointerUp}
      onPointerCancelCapture={handlePointerCancel}
      className="w-full h-full relative overflow-hidden select-none outline-none touch-none cursor-grab active:cursor-grabbing"
    />
  );
};
