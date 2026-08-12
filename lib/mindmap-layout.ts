import { MindMapNode, LayoutMode } from './types/mindmap';
import { measureNodeDimensions, MeasuredDimensions } from './mindmap-measurer';
import { getNodeBranchColor } from './mindmap-theme';

export interface PositionedNode {
  node: MindMapNode;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  isLeft?: boolean;
  branchColor?: string;
  parent?: PositionedNode;
  children?: PositionedNode[];
  collapsed?: boolean;
  hiddenCount?: number;
}

export interface ConnectorLine {
  id: string;
  sourceId: string;
  targetId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  path: string;
  color: string;
  isCrossLink?: boolean;
  label?: string;
}

/**
 * Recursively calculates the vertical height requirement of a node's subtree
 * taking actual measured card heights into account.
 */
function computeSubtreeHeight(
  node: MindMapNode,
  depth: number,
  collapsedSet: Set<string>,
  levelGapY: number = 24,
  forceFallback: boolean = false
): { height: number; dimensions: MeasuredDimensions } {
  const dim = measureNodeDimensions(node, depth, forceFallback);

  if (collapsedSet.has(node.id) || !node.children || node.children.length === 0) {
    return { height: dim.height + levelGapY, dimensions: dim };
  }

  let childrenTotalHeight = 0;
  for (const child of node.children) {
    const childRes = computeSubtreeHeight(child, depth + 1, collapsedSet, levelGapY, forceFallback);
    childrenTotalHeight += childRes.height;
  }

  const selfRequiredHeight = dim.height + levelGapY;
  return {
    height: Math.max(selfRequiredHeight, childrenTotalHeight),
    dimensions: dim,
  };
}

// Helper to count hidden nodes in a collapsed subtree
function countTotalSubtreeNodes(n: MindMapNode): number {
  if (!n.children || n.children.length === 0) return 0;
  let count = n.children.length;
  for (const c of n.children) {
    count += countTotalSubtreeNodes(c);
  }
  return count;
}

/**
 * Computes deterministic, collision-free hierarchical layout for MindMapNode tree.
 * Uses real Canvas 2D node dimensions and weighted branch balancing.
 */
export function computeMindMapLayout(
  root: MindMapNode,
  mode: LayoutMode = 'balanced',
  collapsedSet: Set<string> = new Set(),
  forceFallback: boolean = false
): { nodes: PositionedNode[]; connectors: ConnectorLine[] } {
  const nodes: PositionedNode[] = [];
  const connectors: ConnectorLine[] = [];

  const rootDim = measureNodeDimensions(root, 0, forceFallback);
  const rootNode: PositionedNode = {
    node: root,
    id: root.id,
    x: 0,
    y: 0,
    width: rootDim.width,
    height: rootDim.height,
    depth: 0,
    branchColor: getNodeBranchColor(0, 0, root.color),
    children: [],
  };

  nodes.push(rootNode);

  if (!root.children || root.children.length === 0 || collapsedSet.has(root.id)) {
    return { nodes, connectors };
  }

  const levelGapX = 140; // Horizontal gap between node card edges
  const levelGapY = 24;  // Minimum vertical gap between sibling subtrees

  if (mode === 'balanced') {
    // DETERMINISTIC LEVEL-1 BRANCH SIDE ASSIGNMENT BASED ON SOURCE ORDER (BUG-001 Fix)
    // Ensures branches never switch sides dynamically on collapse/expand while allowing vertical reflow.
    const rightChildren: MindMapNode[] = [];
    const leftChildren: MindMapNode[] = [];

    root.children.forEach((child, index) => {
      if (index % 2 === 0) {
        rightChildren.push(child);
      } else {
        leftChildren.push(child);
      }
    });

    // Layout Right Subtree (x moves positive)
    layoutSubtree({
      parentPosNode: rootNode,
      children: rightChildren,
      isLeft: false,
      depth: 1,
      collapsedSet,
      nodes,
      connectors,
      levelGapX,
      levelGapY,
      forceFallback,
    });

    // Layout Left Subtree (x moves negative)
    layoutSubtree({
      parentPosNode: rootNode,
      children: leftChildren,
      isLeft: true,
      depth: 1,
      collapsedSet,
      nodes,
      connectors,
      levelGapX,
      levelGapY,
      forceFallback,
    });
  } else if (mode === 'horizontal') {
    // Pure Left-to-Right layout
    layoutSubtree({
      parentPosNode: rootNode,
      children: root.children,
      isLeft: false,
      depth: 1,
      collapsedSet,
      nodes,
      connectors,
      levelGapX,
      levelGapY,
      forceFallback,
    });
  } else if (mode === 'vertical') {
    // Top-to-Bottom layout
    layoutVerticalSubtree({
      parentPosNode: rootNode,
      children: root.children,
      depth: 1,
      collapsedSet,
      nodes,
      connectors,
      levelGapX: 28,
      levelGapY: 120,
      forceFallback,
    });
  }

  return { nodes, connectors };
}

interface LayoutSubtreeArgs {
  parentPosNode: PositionedNode;
  children: MindMapNode[];
  isLeft: boolean;
  depth: number;
  collapsedSet: Set<string>;
  nodes: PositionedNode[];
  connectors: ConnectorLine[];
  levelGapX: number;
  levelGapY: number;
  forceFallback: boolean;
}

// Recursive helper for Horizontal / Balanced layout
function layoutSubtree({
  parentPosNode,
  children,
  isLeft,
  depth,
  collapsedSet,
  nodes,
  connectors,
  levelGapX,
  levelGapY,
  forceFallback,
}: LayoutSubtreeArgs) {
  if (children.length === 0) return;

  // Calculate subtree height required for each child
  const childSubtreeInfos = children.map((c) =>
    computeSubtreeHeight(c, depth, collapsedSet, levelGapY, forceFallback)
  );

  const totalHeightRequired = childSubtreeInfos.reduce((acc, curr) => acc + curr.height, 0);
  let currentY = parentPosNode.y - totalHeightRequired / 2;

  children.forEach((childNode, index) => {
    const info = childSubtreeInfos[index];
    const subtreeH = info.height;
    const dim = info.dimensions;
    const childY = currentY + subtreeH / 2;

    const direction = isLeft ? -1 : 1;
    const parentEdgeX = parentPosNode.x + direction * (parentPosNode.width / 2);
    const childEdgeX = parentEdgeX + direction * levelGapX;
    const childCenterX = childEdgeX + direction * (dim.width / 2);

    const branchColor = getNodeBranchColor(
      depth,
      index,
      childNode.color,
      parentPosNode.branchColor
    );

    const isCollapsed = collapsedSet.has(childNode.id);
    const hiddenCount = isCollapsed ? countTotalSubtreeNodes(childNode) : 0;

    const childPosNode: PositionedNode = {
      node: childNode,
      id: childNode.id,
      x: childCenterX,
      y: childY,
      width: dim.width,
      height: dim.height,
      depth,
      isLeft,
      branchColor,
      parent: parentPosNode,
      children: [],
      collapsed: isCollapsed,
      hiddenCount,
    };

    if (parentPosNode.children) {
      parentPosNode.children.push(childPosNode);
    }
    nodes.push(childPosNode);

    // Create curved Bezier connector line between parent edge and child edge
    const path = generateCurvedPath(
      parentEdgeX,
      parentPosNode.y,
      childEdgeX,
      childY,
      isLeft
    );

    connectors.push({
      id: `${parentPosNode.id}->${childNode.id}`,
      sourceId: parentPosNode.id,
      targetId: childNode.id,
      sourceX: parentEdgeX,
      sourceY: parentPosNode.y,
      targetX: childEdgeX,
      targetY: childY,
      path,
      color: branchColor || '#94a3b8',
    });

    currentY += subtreeH;

    // Recurse for deeper children if not collapsed
    if (!isCollapsed && childNode.children && childNode.children.length > 0) {
      layoutSubtree({
        parentPosNode: childPosNode,
        children: childNode.children,
        isLeft,
        depth: depth + 1,
        collapsedSet,
        nodes,
        connectors,
        levelGapX,
        levelGapY,
        forceFallback,
      });
    }
  });
}

// Generate organic cubic Bezier S-curve
export function generateCurvedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  isLeft: boolean
): string {
  const dx = Math.abs(x2 - x1) * 0.55;
  const controlX1 = isLeft ? x1 - dx : x1 + dx;
  const controlX2 = isLeft ? x2 + dx : x2 - dx;

  return `M ${x1} ${y1} C ${controlX1} ${y1}, ${controlX2} ${y2}, ${x2} ${y2}`;
}

/**
 * Recursively calculates the horizontal width requirement of a node's subtree
 * taking actual measured card widths into account for Vertical layout mode (BUG-002 Fix).
 */
export function computeSubtreeWidth(
  node: MindMapNode,
  depth: number,
  collapsedSet: Set<string>,
  levelGapX: number = 28,
  forceFallback: boolean = false
): { width: number; dimensions: MeasuredDimensions } {
  const dim = measureNodeDimensions(node, depth, forceFallback);

  if (collapsedSet.has(node.id) || !node.children || node.children.length === 0) {
    return { width: dim.width + levelGapX, dimensions: dim };
  }

  let childrenTotalWidth = 0;
  for (const child of node.children) {
    const childRes = computeSubtreeWidth(child, depth + 1, collapsedSet, levelGapX, forceFallback);
    childrenTotalWidth += childRes.width;
  }

  const selfRequiredWidth = dim.width + levelGapX;
  return {
    width: Math.max(selfRequiredWidth, childrenTotalWidth),
    dimensions: dim,
  };
}

// Vertical layout helper (Top-to-Bottom) with recursive subtree width allocation
function layoutVerticalSubtree({
  parentPosNode,
  children,
  depth,
  collapsedSet,
  nodes,
  connectors,
  levelGapX,
  levelGapY,
  forceFallback,
}: Omit<LayoutSubtreeArgs, 'isLeft'>) {
  if (children.length === 0) return;

  const childSubtreeInfos = children.map((c) =>
    computeSubtreeWidth(c, depth, collapsedSet, levelGapX, forceFallback)
  );

  const totalWidthRequired = childSubtreeInfos.reduce((acc, curr) => acc + curr.width, 0);
  let currentX = parentPosNode.x - totalWidthRequired / 2;

  children.forEach((childNode, index) => {
    const info = childSubtreeInfos[index];
    const subtreeW = info.width;
    const dim = info.dimensions;
    const childX = currentX + subtreeW / 2;
    const childY = parentPosNode.y + levelGapY;

    const branchColor = getNodeBranchColor(
      depth,
      index,
      childNode.color,
      parentPosNode.branchColor
    );

    const isCollapsed = collapsedSet.has(childNode.id);
    const hiddenCount = isCollapsed ? countTotalSubtreeNodes(childNode) : 0;

    const childPosNode: PositionedNode = {
      node: childNode,
      id: childNode.id,
      x: childX,
      y: childY,
      width: dim.width,
      height: dim.height,
      depth,
      branchColor,
      parent: parentPosNode,
      children: [],
      collapsed: isCollapsed,
      hiddenCount,
    };

    if (parentPosNode.children) {
      parentPosNode.children.push(childPosNode);
    }
    nodes.push(childPosNode);

    const path = `M ${parentPosNode.x} ${parentPosNode.y + parentPosNode.height / 2} C ${parentPosNode.x} ${parentPosNode.y + levelGapY / 2}, ${childX} ${childY - levelGapY / 2}, ${childX} ${childY - dim.height / 2}`;

    connectors.push({
      id: `${parentPosNode.id}->${childNode.id}`,
      sourceId: parentPosNode.id,
      targetId: childNode.id,
      sourceX: parentPosNode.x,
      sourceY: parentPosNode.y + parentPosNode.height / 2,
      targetX: childX,
      targetY: childY - dim.height / 2,
      path,
      color: branchColor || '#94a3b8',
    });

    currentX += subtreeW;

    if (!isCollapsed && childNode.children && childNode.children.length > 0) {
      layoutVerticalSubtree({
        parentPosNode: childPosNode,
        children: childNode.children,
        depth: depth + 1,
        collapsedSet,
        nodes,
        connectors,
        levelGapX,
        levelGapY,
        forceFallback,
      });
    }
  });
}
