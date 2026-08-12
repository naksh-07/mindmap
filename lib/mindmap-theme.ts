import { MindMapNode } from './types/mindmap';

// Curated theme color palettes for NotebookLM style visual harmony
export const DEFAULT_BRANCH_PALETTE = [
  '#d97706', // Amber Gold (Branch 0)
  '#059669', // Emerald Green (Branch 1)
  '#2563eb', // Royal Blue (Branch 2)
  '#7c3aed', // Purple Violet (Branch 3)
  '#e11d48', // Rose Pink (Branch 4)
  '#0284c7', // Sky Blue (Branch 5)
  '#ea580c', // Dark Orange (Branch 6)
  '#0891b2', // Teal Cyan (Branch 7)
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
