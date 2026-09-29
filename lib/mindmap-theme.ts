import { MindMapNode } from './types/mindmap';

// Curated theme color palettes for Modern Minimal Light visual harmony (DESIGN.md)
export const DEFAULT_BRANCH_PALETTE = [
  '#2563eb', // Ceramic Cobalt (Branch 0)
  '#059669', // Forest Jade (Branch 1)
  '#d97706', // Amber Ochre (Branch 2)
  '#7c3aed', // Slate Plum (Branch 3)
  '#475569', // Neutral Graphite (Branch 4)
  '#0284c7', // Sky Slate (Branch 5)
  '#ea580c', // Warm Ochre (Branch 6)
  '#0891b2', // Teal Slate (Branch 7)
];

/**
 * Resolves the presentation color for a node based on tree depth, branch index, and explicit JSON overrides.
 */
export function getNodeBranchColor(
  depth: number,
  branchIndex: number,
  explicitColor?: string,
  parentBranchColor?: string
): string {
  // If JSON data explicitly provides a color, honor it for backwards compatibility
  if (explicitColor) {
    return explicitColor;
  }

  // Root Node default
  if (depth === 0) {
    return '#3b82f6';
  }

  // Level 1 Major Branch: Assign palette color based on branch index
  if (depth === 1) {
    return DEFAULT_BRANCH_PALETTE[branchIndex % DEFAULT_BRANCH_PALETTE.length];
  }

  // Sub-concepts & leaves (depth >= 2): Inherit parent branch color
  return parentBranchColor || DEFAULT_BRANCH_PALETTE[branchIndex % DEFAULT_BRANCH_PALETTE.length];
}

/**
 * Resolves depth-tapered stroke width for hierarchy connector lines.
 * Root -> Branch (2.5px), Branch -> Subconcept (1.8px), Subconcept -> Leaf (1.2px).
 */
export function getConnectorStrokeWidth(
  depth: number,
  isSelected: boolean,
  isLineage: boolean
): number {
  if (isSelected) return 3.0;
  if (isLineage) return 2.2;
  if (depth === 0) return 2.5;
  if (depth === 1) return 1.8;
  return 1.2;
}

/**
 * Resolves stroke opacity for connector lines based on focus / search dimming state.
 */
export function getConnectorOpacity(
  isSelected: boolean,
  isLineage: boolean,
  isDimmed: boolean
): number {
  if (isDimmed) return 0.10;
  if (isSelected || isLineage) return 0.85;
  return 0.40;
}
