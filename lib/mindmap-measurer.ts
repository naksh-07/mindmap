import { MindMapNode } from './types/mindmap';

export interface MeasuredDimensions {
  width: number;
  height: number;
  labelLines: number;
}

// Canvas 2D Context singleton for 0-DOM synchronous text measurement
let measurementCanvas: HTMLCanvasElement | null = null;
let measurementCtx: CanvasRenderingContext2D | null = null;

function getContext(forceFallback: boolean = false): CanvasRenderingContext2D | null {
  if (forceFallback) return null; // Force fallback for SSR/Hydration matching
  if (typeof window === 'undefined') return null; // SSR fallback
  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas');
    measurementCtx = measurementCanvas.getContext('2d');
  }
  return measurementCtx;
}

// Measure word-wrapped text lines in Canvas 2D
function calculateTextLines(
  text: string,
  font: string,
  maxWidth: number,
  forceFallback: boolean = false
): { lineCount: number; maxLineWidth: number } {
  const ctx = getContext(forceFallback);
  if (!ctx) {
    // Basic fallback if Canvas 2D is unavailable (e.g. SSR)
    const approxLines = Math.max(1, Math.ceil((text.length * 9) / maxWidth));
    return { lineCount: approxLines, maxLineWidth: Math.min(text.length * 9, maxWidth) };
  }

  ctx.font = font;

  // Split text into words (handling spaces and Devanagari punctuation)
  const words = text.split(/\s+/);
  if (words.length === 0 || text.trim().length === 0) {
    return { lineCount: 1, maxLineWidth: 50 };
  }

  let lineCount = 1;
  let currentLineWidth = 0;
  let maxObservedWidth = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWidth = ctx.measureText(word).width;
    const spaceWidth = i > 0 ? ctx.measureText(' ').width : 0;

    if (currentLineWidth + spaceWidth + wordWidth <= maxWidth) {
      currentLineWidth += spaceWidth + wordWidth;
    } else {
      if (currentLineWidth > 0) {
        maxObservedWidth = Math.max(maxObservedWidth, currentLineWidth);
        lineCount++;
        currentLineWidth = wordWidth;
      } else {
        // Single word exceeds max width
        currentLineWidth = wordWidth;
      }
    }
    maxObservedWidth = Math.max(maxObservedWidth, currentLineWidth);
  }

  return { lineCount, maxLineWidth: Math.min(maxObservedWidth, maxWidth) };
}

/**
 * Calculates exact rendered dimensions (width, height) for a MindMapNode.
 * Accounts for depth-tiered styling: Root (hero), Branch 1 (pill), Sub-concept (compact), Leaf (frameless text).
 */
export function measureNodeDimensions(
  node: MindMapNode,
  depth: number,
  forceFallback: boolean = false
): MeasuredDimensions {
  const labelText = node.label || '';
  const subtitleText = node.subtitle || '';
  const hasBadge = !!node.badge;
  const hasChildren = !!(node.children && node.children.length > 0);

  // Depth-specific typography & constraint parameters
  let labelFont: string;
  let labelLineHeight: number;
  let maxTextWidth: number;
  let minCardWidth: number;
  let maxCardWidth: number;
  let minCardHeight: number;

  if (depth === 0) {
    // Root Node (Hero Anchor)
    labelFont = 'bold 17px "Noto Sans Devanagari", "Inter", system-ui, sans-serif';
    labelLineHeight = 23;
    maxTextWidth = 260;
    minCardWidth = 220;
    maxCardWidth = 340;
    minCardHeight = 62;
  } else if (depth === 1) {
    // Primary Major Branch (Pill Container)
    labelFont = '600 14px "Noto Sans Devanagari", "Inter", system-ui, sans-serif';
    labelLineHeight = 19;
    maxTextWidth = 210;
    minCardWidth = 170;
    maxCardWidth = 270;
    minCardHeight = 48;
  } else if (depth === 2) {
    // Sub-concept Node (Compact Card)
    labelFont = '500 13px "Noto Sans Devanagari", "Inter", system-ui, sans-serif';
    labelLineHeight = 17;
    maxTextWidth = 180;
    minCardWidth = 140;
    maxCardWidth = 230;
    minCardHeight = 40;
  } else {
    // Leaf Node (Frameless Minimal Text Label - Depth 3+)
    labelFont = '400 12px "Noto Sans Devanagari", "Inter", system-ui, sans-serif';
    labelLineHeight = 16;
    maxTextWidth = 160;
    minCardWidth = 120;
    maxCardWidth = 200;
    minCardHeight = 34;
  }

  // Calculate Label text lines and width
  const { lineCount, maxLineWidth } = calculateTextLines(labelText, labelFont, maxTextWidth, forceFallback);

  // Subtitle height calculation (BUG-007 Fix: Clamped to 1 line matching CSS line-clamp-1)
  let subtitleHeight = 0;
  if (subtitleText.length > 0) {
    const subtitleFont = '400 11px "Noto Sans Devanagari", "Inter", system-ui, sans-serif';
    const subRes = calculateTextLines(subtitleText, subtitleFont, maxTextWidth, forceFallback);
    subtitleHeight = Math.min(1, subRes.lineCount) * 13 + 3; // 13px line height + 3px margin top
  }

  // Internal card paddings & accessories adjusted for depth
  const horizontalPadding = depth >= 2 ? 20 : 28;
  const verticalPadding = depth >= 3 ? 14 : depth === 2 ? 18 : 24;
  const topBarHeight = hasBadge || hasChildren ? (depth >= 2 ? 14 : 18) : 0;
  const gapBetweenLabelSubtitle = 2;

  // Compute total width
  let calculatedWidth = maxLineWidth + horizontalPadding;
  if (hasBadge) calculatedWidth += 32;
  if (hasChildren) calculatedWidth += 20;

  const finalWidth = Math.max(minCardWidth, Math.min(calculatedWidth, maxCardWidth));

  // Compute total height
  const labelHeight = lineCount * labelLineHeight;
  const calculatedHeight =
    verticalPadding + topBarHeight + labelHeight + subtitleHeight + gapBetweenLabelSubtitle;

  const finalHeight = Math.max(minCardHeight, calculatedHeight);

  return {
    width: Math.round(finalWidth),
    height: Math.round(finalHeight),
    labelLines: lineCount,
  };
}
