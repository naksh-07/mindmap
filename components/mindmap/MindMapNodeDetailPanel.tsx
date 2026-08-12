'use client';

import React from 'react';
import { MindMapNode, QuizQuestion } from '@/lib/types/mindmap';
import { X, CheckCircle2, Sparkles, Award, ChevronRight, Target, EyeOff } from 'lucide-react';

interface MindMapNodeDetailPanelProps {
  node: MindMapNode | null;
  lineagePath: MindMapNode[];
  quizQuestions?: QuizQuestion[];
  isFocusedBranch?: boolean;
  onClose: () => void;
  onOpenQuizForNode?: (nodeId: string) => void;
  onToggleFocusBranch?: (nodeId: string) => void;
}

export const MindMapNodeDetailPanel: React.FC<MindMapNodeDetailPanelProps> = ({
  node,
  lineagePath,
  quizQuestions = [],
  isFocusedBranch = false,
  onClose,
  onOpenQuizForNode,
  onToggleFocusBranch,
}) => {
  if (!node) return null;

  // Filter quiz questions for this node
  const nodeQuizzes = quizQuestions.filter((q) => q.nodeId === node.id);
  const hasChildren = !!(node.children && node.children.length > 0);

  return (
    <div
      role="dialog"
      aria-label={`${node.label} details`}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
      className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 sm:w-80 z-40 bg-card/95 backdrop-blur-md border-t sm:border border-border/80 shadow-2xl rounded-t-3xl sm:rounded-2xl p-4 sm:p-4 transition-all duration-300 ease-out animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-3 max-h-[48vh] sm:max-h-[70vh] overflow-y-auto overscroll-contain touch-pan-y"
    >
      {/* Mobile Pull Handle */}
      <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3 sm:hidden" />

      {/* Header & Lineage Breadcrumb */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          {lineagePath.length > 1 && (
            <div className="flex items-center flex-wrap gap-1 text-[10px] text-muted-foreground mb-1">
              {lineagePath.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {idx > 0 && <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0" />}
                  <span className={idx === lineagePath.length - 1 ? 'text-primary font-medium' : 'truncate max-w-[90px]'}>
                    {item.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}

          <h2 className="text-base font-bold text-foreground leading-snug tracking-tight">{node.label}</h2>
          {node.subtitle && (
            <p className="text-xs text-muted-foreground font-normal mt-0.5">{node.subtitle}</p>
          )}
        </div>

        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Focus Branch Trigger Action (Available for any non-leaf node with children) */}
      {hasChildren && onToggleFocusBranch && (
        <div className="my-2.5">
          <button
            onClick={() => onToggleFocusBranch(node.id)}
            className={
              isFocusedBranch
                ? 'w-full py-1.5 px-3 bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors'
                : 'w-full py-1.5 px-3 bg-secondary hover:bg-muted border border-border text-foreground font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors'
            }
          >
            {isFocusedBranch ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>फ़ोकस हटाएं (Exit Focus)</span>
              </>
            ) : (
              <>
                <Target className="w-3.5 h-3.5 text-amber-500" />
                <span>इस शाखा पर फोकस करें (Focus Branch)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Educational Summary Description */}
      {node.description && (
        <div className="my-2.5 p-2.5 bg-muted/50 rounded-xl text-xs text-foreground/90 leading-relaxed border border-border/40">
          <p>{node.description}</p>
        </div>
      )}

      {/* Key Facts / Revision Bullet Points */}
      {node.keyFacts && node.keyFacts.length > 0 && (
        <div className="my-2.5">
          <h4 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>प्रमुख परीक्षा तथ्य (Key Facts)</span>
          </h4>
          <ul className="space-y-1">
            {node.keyFacts.map((fact, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-foreground/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quiz trigger for this concept */}
      {nodeQuizzes.length > 0 && onOpenQuizForNode && (
        <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-primary" />
            <span>{nodeQuizzes.length} अभ्यास प्रश्न</span>
          </span>

          <button
            onClick={() => onOpenQuizForNode(node.id)}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-2xs focus-visible:ring-2 focus-visible:ring-primary"
          >
            प्रश्नोत्तरी
          </button>
        </div>
      )}
    </div>
  );
};
