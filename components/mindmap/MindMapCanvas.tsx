'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PositionedNode, ConnectorLine } from '@/lib/mindmap-layout';
import { MindMapNodeCard } from './MindMapNodeCard';
import { CrossLink } from '@/lib/types/mindmap';
import { getConnectorStrokeWidth, getConnectorOpacity } from '@/lib/mindmap-theme';
import { cn } from '@/lib/utils';

interface MindMapCanvasProps {
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

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
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

  // Pan & Zoom Transform state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.9 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Pointer drag vs. tap threshold tracking (6px threshold)
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragMovedRef = useRef<boolean>(false);

  // Node position dictionary for fast lookup
  const nodePosMap = React.useMemo(() => {
    const map = new Map<string, PositionedNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const stageRef = useRef<HTMLDivElement>(null);

  // High-frequency transform update helper for GPU hardware acceleration (BUG-017 Fix)
  const applyStageTransform = useCallback((x: number, y: number, scale: number) => {
    if (stageRef.current) {
      stageRef.current.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${scale})`;
    }
  }, []);

  // Update DOM transform whenever transform state changes
  useEffect(() => {
    applyStageTransform(transform.x, transform.y, transform.scale);
  }, [transform, applyStageTransform]);

  // Center & Fit view helper
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) return false;

    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return false;
    
    // Compute bounding box of all nodes
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      const w = n.width || 0;
      const h = n.height || 0;
      minX = Math.min(minX, n.x - w / 2);
      maxX = Math.max(maxX, n.x + w / 2);
      minY = Math.min(minY, n.y - h / 2);
      maxY = Math.max(maxY, n.y + h / 2);
    });

    if (minX === Infinity) return false;

    const bboxWidth = maxX - minX + 120;
    const bboxHeight = maxY - minY + 120;
    const bboxCenterX = (minX + maxX) / 2;
    const bboxCenterY = (minY + maxY) / 2;

    const scaleX = clientWidth / bboxWidth;
    const scaleY = clientHeight / bboxHeight;
    const initialScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.1);

    const initialX = clientWidth / 2 - bboxCenterX * initialScale;
    const initialY = clientHeight / 2 - bboxCenterY * initialScale;

    setTransform({ x: initialX, y: initialY, scale: initialScale });
    return true;
  }, [nodes]);

  // Track initial viewport fitting to prevent disorienting jumps on collapse/expand
  const hasFittedInitialRef = useRef(false);

  // Center canvas ONLY on initial mount / dataset load
  useEffect(() => {
    if (nodes.length === 0 || hasFittedInitialRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const attemptFit = () => {
      if (hasFittedInitialRef.current) return;
      const success = fitToScreen();
      if (success) {
        hasFittedInitialRef.current = true;
      }
    };

    attemptFit();

    // If still not fitted (e.g. clientWidth 0), use ResizeObserver
    if (!hasFittedInitialRef.current) {
      const observer = new ResizeObserver(() => {
        attemptFit();
        if (hasFittedInitialRef.current) {
          observer.disconnect();
        }
      });
      observer.observe(container);
      return () => observer.disconnect();
    }
  }, [nodes, fitToScreen]);

  // Reset initial fitted ref if node root changes (new dataset loaded)
  const rootId = nodes.length > 0 ? nodes[0].id : null;
  useEffect(() => {
    hasFittedInitialRef.current = false;
  }, [rootId]);

  // Wrapped node selection handler that enforces the 6px drag-vs-tap threshold
  const handleSelectNodeWithDragCheck = useCallback((nodeId: string | null) => {
    if (isDragMovedRef.current) {
      return; // Ignore selection if user dragged canvas >= 6px
    }
    onSelectNode(nodeId);
  }, [onSelectNode]);

  // Mouse Pan handlers with robust window-level event binding (BUG-003 Fix)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only initiate drag if click is not on a UI button or input
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('button') || targetEl.closest('input')) {
      return;
    }

    setIsDragging(true);
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    isDragMovedRef.current = false;
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  // Window-level mouse move & mouse up listeners to prevent ghost dragging (BUG-003 Fix)
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - pointerStartPosRef.current.x, e.clientY - pointerStartPosRef.current.y);
      if (dist >= 6) {
        isDragMovedRef.current = true;
      }

      const nextX = e.clientX - dragStart.x;
      const nextY = e.clientY - dragStart.y;
      
      // Fast direct DOM transform update during active drag (BUG-017 Fix)
      applyStageTransform(nextX, nextY, transform.scale);
      transformRef.current = { x: nextX, y: nextY, scale: transform.scale };
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
      if (transformRef.current) {
        setTransform(transformRef.current);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('blur', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('blur', handleWindowMouseUp);
    };
  }, [isDragging, dragStart, transform.scale, applyStageTransform]);

  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Non-passive Wheel Zoom listener (BUG-014 Fix)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const currentTransform = transformRef.current;
      const newScale = Math.min(Math.max(currentTransform.scale * zoomFactor, 0.25), 2.5);

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - currentTransform.x) * (newScale / currentTransform.scale);
      const newY = mouseY - (mouseY - currentTransform.y) * (newScale / currentTransform.scale);

      const nextTransform = { x: newX, y: newY, scale: newScale };
      applyStageTransform(nextTransform.x, nextTransform.y, nextTransform.scale);
      setTransform(nextTransform);
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelNative);
    };
  }, [applyStageTransform]);

  // Touch gesture support for mobile (Anchored 2-Finger Pinch Zoom + 6px drag threshold)
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const targetEl = e.target as HTMLElement;
    // Don't pan if starting on a button or input (allow panning from cards)
    if (targetEl.closest('button') || targetEl.closest('input')) {
      return;
    }

    if (e.touches.length === 1) {
      setIsDragging(true);
      pointerStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isDragMovedRef.current = false;
      touchStartRef.current = {
        x: e.touches[0].clientX - transform.x,
        y: e.touches[0].clientY - transform.y,
      };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      isDragMovedRef.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { x: 0, y: 0, dist };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dist = Math.hypot(
        e.touches[0].clientX - pointerStartPosRef.current.x,
        e.touches[0].clientY - pointerStartPosRef.current.y
      );
      if (dist >= 6) {
        isDragMovedRef.current = true;
      }

      const nextX = e.touches[0].clientX - touchStartRef.current.x;
      const nextY = e.touches[0].clientY - touchStartRef.current.y;
      applyStageTransform(nextX, nextY, transform.scale);
      transformRef.current = { x: nextX, y: nextY, scale: transform.scale };
    } else if (e.touches.length === 2 && touchStartRef.current.dist && containerRef.current) {
      isDragMovedRef.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const zoomFactor = dist / touchStartRef.current.dist;
      const currentTransform = transformRef.current;
      const newScale = Math.min(Math.max(currentTransform.scale * zoomFactor, 0.25), 2.5);

      const rect = containerRef.current.getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

      touchStartRef.current.dist = dist;
      const newX = midX - (midX - currentTransform.x) * (newScale / currentTransform.scale);
      const newY = midY - (midY - currentTransform.y) * (newScale / currentTransform.scale);

      const nextTransform = { x: newX, y: newY, scale: newScale };
      applyStageTransform(nextTransform.x, nextTransform.y, nextTransform.scale);
      setTransform(nextTransform);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (transformRef.current) {
      setTransform(transformRef.current);
    }
  };

  // Expose fitToScreen listener
  useEffect(() => {
    const handleFitEvent = () => fitToScreen();
    window.addEventListener('mindmap:fit-screen', handleFitEvent);
    return () => window.removeEventListener('mindmap:fit-screen', handleFitEvent);
  }, [fitToScreen]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClickCapture={(e) => {
        // Global capture: if we just finished dragging >= 6px, block ALL clicks
        if (isDragMovedRef.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onClick={(e) => {
        const targetEl = e.target as HTMLElement;
        if (!targetEl.closest('[data-mindmap-card="true"]') && !targetEl.closest('button')) {
          handleSelectNodeWithDragCheck(null);
        }
      }}
      style={{ touchAction: 'none' }}
      className={cn(
        'w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing select-none canvas-background touch-none',
        theme === 'dark' ? 'bg-grid-pattern-dark bg-[#090d16]' : 'bg-grid-pattern-light bg-[#f8fafc]'
      )}
    >
      {/* Transformed Stage */}
      <div
        ref={stageRef}
        className="absolute top-0 left-0 w-full h-full origin-top-left transition-transform duration-75 ease-out pointer-events-none"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0px) scale(${transform.scale})`,
        }}
      >
        {/* SVG Connector Lines Layer */}
        <svg className="absolute overflow-visible top-0 left-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="cross-link-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" fillOpacity="0.7" />
            </marker>
          </defs>

          {/* Primary Tree Connectors with Depth-Tapered Stroke Widths & Focus Branch Opacity */}
          {connectors.map((c) => {
            const sourceNode = nodePosMap.get(c.sourceId);
            const depth = sourceNode ? sourceNode.depth : 1;
            
            const isConnectedToSelected =
              selectedNodeId !== null && (c.sourceId === selectedNodeId || c.targetId === selectedNodeId);
            const isConnectedToLineage =
              lineageNodeIds.has(c.sourceId) && lineageNodeIds.has(c.targetId);
            
            // Check Focus Branch active mode (25% opacity for non-focused branches)
            const isFocusDimmed =
              focusedBranchNodeIds &&
              focusedBranchNodeIds.size > 0 &&
              (!focusedBranchNodeIds.has(c.sourceId) || !focusedBranchNodeIds.has(c.targetId));

            // BUG-004 Fix: Ensure connectors directly connected to selected node (source or target) are NOT dimmed
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

            return (
              <path
                key={c.id}
                d={c.path}
                fill="none"
                stroke={c.color}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            );
          })}

          {/* Cross Links (Subtle Dashed Arc Relationships) */}
          {crossLinks.map((link, idx) => {
            const source = nodePosMap.get(link.sourceId);
            const target = nodePosMap.get(link.targetId);
            if (!source || !target) return null;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const cx = (source.x + target.x) / 2 - dy * 0.2;
            const cy = (source.y + target.y) / 2 + dx * 0.2;
            const path = `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`;

            const isFocusDimmed =
              focusedBranchNodeIds &&
              focusedBranchNodeIds.size > 0 &&
              (!focusedBranchNodeIds.has(link.sourceId) || !focusedBranchNodeIds.has(link.targetId));

            return (
              <g key={`cross-${idx}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  strokeOpacity={isFocusDimmed ? 0.20 : 0.55}
                  markerEnd="url(#cross-link-arrow)"
                  className="hover:stroke-opacity-100 transition-opacity"
                />
                {link.label && (
                  <text
                    x={cx}
                    y={cy - 5}
                    fill={theme === 'dark' ? '#fbbf24' : '#d97706'}
                    fontSize="9"
                    fontWeight="500"
                    textAnchor="middle"
                    className="select-none font-sans opacity-80"
                  >
                    {link.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* DOM HTML Nodes Layer */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-auto">
          {nodes.map((pNode) => {
            const isSelected = selectedNodeId === pNode.id;
            const isHighlighted = highlightedNodeIds.has(pNode.id);
            const isLineage = lineageNodeIds.has(pNode.id);

            // Focus Branch check: non-focused nodes retain 25% opacity so root and tree structure remain discoverable
            const isFocusDimmed =
              focusedBranchNodeIds &&
              focusedBranchNodeIds.size > 0 &&
              !focusedBranchNodeIds.has(pNode.id);

            const isDimmed =
              isFocusDimmed ||
              (selectedNodeId !== null && !isLineage) ||
              (highlightedNodeIds.size > 0 && !isHighlighted);
            
            const isRevealedInActiveRecall = revealedNodeIds.has(pNode.id);

            return (
              <div
                key={pNode.id}
                style={{
                  position: 'absolute',
                  left: `${pNode.x - pNode.width / 2}px`,
                  top: `${pNode.y - pNode.height / 2}px`,
                  zIndex: isSelected ? 30 : isHighlighted ? 25 : isLineage ? 20 : 10,
                }}
              >
                <MindMapNodeCard
                  positionedNode={pNode}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  isLineage={isLineage}
                  isDimmed={isDimmed}
                  isActiveRecall={isActiveRecall}
                  isRevealedInActiveRecall={isRevealedInActiveRecall}
                  onSelect={handleSelectNodeWithDragCheck}
                  onToggleCollapse={onToggleCollapse}
                  onToggleReveal={onToggleReveal}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
