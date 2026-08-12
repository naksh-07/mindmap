'use client';

import React from 'react';
import { PositionedNode } from '@/lib/mindmap-layout';
import { Minus, Eye, HelpCircle, Globe, Mountain, Wheat, Layers, Waves, Compass, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon Map
const ICON_MAP: Record<string, LucideIcon> = {
  Globe,
  Mountain,
  Wheat,
  Layers,
  Waves,
  Compass,
};

interface MindMapNodeCardProps {
  positionedNode: PositionedNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isLineage: boolean;
  isDimmed: boolean;
  isActiveRecall: boolean;
  isRevealedInActiveRecall: boolean;
  onSelect: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string, e: React.MouseEvent) => void;
  onToggleReveal: (nodeId: string, e: React.MouseEvent) => void;
}

export const MindMapNodeCard: React.FC<MindMapNodeCardProps> = ({
  positionedNode,
  isSelected,
  isHighlighted,
  isLineage,
  isDimmed,
  isActiveRecall,
  isRevealedInActiveRecall,
  onSelect,
  onToggleCollapse,
  onToggleReveal,
}) => {
  const { node, depth, width, height, branchColor, collapsed, hiddenCount } = positionedNode;
  const isRoot = depth === 0;
  const isPrimaryBranch = depth === 1;
  const isSubConcept = depth === 2;
  const isLeaf = depth >= 3;

  // Icon resolution
  const IconComponent = node.icon ? ICON_MAP[node.icon] : null;

  // Active recall display logic
  const isHiddenByRecall = isActiveRecall && !isRevealedInActiveRecall && !isRoot;

  return (
    <div
      data-mindmap-card="true"
      role="region"
      tabIndex={0}
      aria-label={`${node.label}${node.subtitle ? ` - ${node.subtitle}` : ''}`}
      onClick={(e) => {
        // Prevent selection if user clicked on collapse button or reveal button
        const targetEl = e.target as HTMLElement;
        if (!targetEl.closest('button')) {
          onSelect(node.id);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const targetEl = e.target as HTMLElement;
          if (!targetEl.closest('button')) {
            e.preventDefault();
            onSelect(node.id);
          }
        }
      }}
      style={{
        width: `${width}px`,
        minHeight: `${height}px`,
        borderTopColor: isSelected ? branchColor : undefined,
        borderRightColor: isSelected ? branchColor : undefined,
        borderBottomColor: isSelected ? branchColor : undefined,
        borderLeftColor: (isPrimaryBranch || isSelected) && branchColor ? branchColor : undefined,
      }}
      className={cn(
        'group relative flex flex-col justify-between cursor-pointer transition-all duration-200 ease-out select-none outline-none focus-visible:ring-2 focus-visible:ring-primary',
        
        // Depth 0: ROOT NODE (Hero Anchor)
        isRoot && 'p-3 rounded-2xl bg-slate-900 text-white dark:bg-slate-950 dark:text-slate-100 border border-slate-700 shadow-md ring-2 ring-blue-500/25',
        
        // Depth 1: PRIMARY BRANCH (Soft Pill with Left Border Accent)
        isPrimaryBranch && 'p-2.5 rounded-xl bg-card text-card-foreground shadow-2xs border border-border border-l-4 hover:shadow-xs',
        
        // Depth 2: SUB-CONCEPT (Compact Soft Card)
        isSubConcept && 'p-2 rounded-lg bg-card/80 text-card-foreground border border-border/70 backdrop-blur-xs hover:bg-card',
        
        // Depth 3+: LEAF NODE (Frameless Lightweight Text Label)
        isLeaf && 'px-2.5 py-1.5 rounded-md bg-muted/40 text-card-foreground border border-border/40 hover:bg-muted/70',
        
        // Dimmed state when focusing or searching
        isDimmed && 'opacity-20 grayscale-[50%] scale-[0.98]',
        
        // Selected highlight state (Subtle, non-jarring)
        isSelected && 'ring-2 ring-primary/80 shadow-md scale-[1.02] z-20',
        !isSelected && isLineage && 'ring-1 ring-primary/40 z-10 shadow-2xs',
        
        // Search match highlight
        isHighlighted && 'ring-2 ring-amber-500 shadow-amber-500/15 node-highlight-pulse z-30'
      )}
    >
      {/* Top Bar Accessories: Badge, Category Dot, Collapse Toggle */}
      {(node.badge || (node.children && node.children.length > 0) || IconComponent) && (
        <div className="flex items-center justify-between gap-1 w-full mb-0.5">
          <div className="flex items-center gap-1 min-w-0">
            {/* Branch Dot or Icon */}
            {IconComponent ? (
              <IconComponent
                className={cn('w-3.5 h-3.5 shrink-0', isRoot ? 'text-blue-400' : 'text-primary')}
                style={{ color: !isRoot ? branchColor : undefined }}
              />
            ) : (
              !isLeaf && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: branchColor || '#3b82f6' }}
                />
              )
            )}

            {/* Category Badge Tag */}
            {node.badge && !isHiddenByRecall && !isLeaf && (
              <span
                className={cn(
                  'px-1.5 py-0.2 text-[10px] font-medium rounded-full truncate max-w-[120px]',
                  isRoot
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-muted/80 text-muted-foreground border border-border/40'
                )}
              >
                {node.badge}
              </span>
            )}
          </div>

          {/* Expand/Collapse Trigger Button with 44px Touch Target Padding */}
          {node.children && node.children.length > 0 && (
            <div className="-m-2 p-2 shrink-0">
              <button
                type="button"
                onClick={(e) => onToggleCollapse(node.id, e)}
                aria-label={collapsed ? `Expand ${node.label} (${hiddenCount} items)` : `Collapse ${node.label}`}
                title={collapsed ? `विस्तार करें (${hiddenCount} उप-अवधारणाएँ)` : 'संकुचित करें'}
                className={cn(
                  'relative flex items-center justify-center w-5 h-5 rounded-full transition-transform text-[10px] font-bold border shadow-2xs focus-visible:ring-2 focus-visible:ring-primary before:content-[""] before:absolute before:-inset-3',
                  collapsed
                    ? 'bg-amber-500 text-white border-amber-600 scale-105 hover:scale-110'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted border-border'
                )}
              >
                {collapsed ? (
                  <span className="text-[9px] font-bold">+{hiddenCount || node.children.length}</span>
                ) : (
                  <Minus className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Concept Label / Active Recall Hidden Mask */}
      <div className="my-auto">
        {isHiddenByRecall ? (
          <div
            role="button"
            tabIndex={0}
            aria-label={`Reveal answer for ${node.label}`}
            onClick={(e) => onToggleReveal(node.id, e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleReveal(node.id, e as unknown as React.MouseEvent);
              }
            }}
            className="flex items-center justify-between px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-600 dark:text-amber-400 text-xs font-medium cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1 truncate">
              <HelpCircle className="w-3 h-3 shrink-0 animate-pulse" />
              <span className="text-[11px]">उत्तर देखें (Reveal)</span>
            </span>
            <Eye className="w-3 h-3 opacity-70 shrink-0" />
          </div>
        ) : (
          <div>
            <h3
              className={cn(
                'tracking-tight leading-snug text-balance',
                isRoot && 'text-base sm:text-lg text-white font-bold',
                isPrimaryBranch && 'text-xs sm:text-sm text-foreground font-semibold',
                isSubConcept && 'text-xs text-foreground/90 font-medium',
                isLeaf && 'text-[11px] sm:text-xs text-foreground/80 font-normal'
              )}
            >
              {node.label}
            </h3>

            {/* Subtitle / Qualifier */}
            {node.subtitle && (
              <p
                className={cn(
                  'text-[10px] leading-tight line-clamp-1 mt-0.5',
                  isRoot ? 'text-slate-300 font-normal' : 'text-muted-foreground/90 font-normal'
                )}
              >
                {node.subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
