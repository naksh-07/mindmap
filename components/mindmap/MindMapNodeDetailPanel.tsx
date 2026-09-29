'use client';

import React, { useEffect } from 'react';
import { MindMapNode, QuizQuestion } from '@/lib/types/mindmap';
import {
  X,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
  Target,
  EyeOff,
  ExternalLink,
  BookOpen,
  GitBranch,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const childCount = node.children?.length ?? 0;
  const hasChildren = childCount > 0;

  const handleOpenInObsidian = () => {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ action: 'OPEN_NOTE', nodeId: node.id }, '*');
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter triggers Open in Obsidian
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleOpenInObsidian();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [node.id]);

  // Node depth from lineage
  const nodeLevel = lineagePath.length <= 1 ? 'Root Axis' : lineagePath.length === 2 ? 'Category' : 'Sub-Concept';

  return (
    <>
      {/* Mobile Backdrop Overlay (<sm) */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 sm:hidden transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-label={`${node.label} details`}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
        className={cn(
          'fixed z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md shadow-2xl flex flex-col overflow-y-auto select-none transition-all duration-300 ease-out',
          // Mobile: Bottom Sheet docked to bottom
          'inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl border-t border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-bottom-6',
          // Desktop: Right Drawer docked to top-12
          'sm:top-12 sm:bottom-0 sm:right-0 sm:left-auto sm:w-[380px] lg:w-[410px] sm:max-h-none sm:rounded-none sm:border-t-0 sm:border-l sm:slide-in-from-right-4'
        )}
      >
        {/* Mobile Drag Pill */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Top Header Section: Breadcrumbs, Status Chips, Title, Close Button */}
        <div className="p-4 sm:p-5 border-b border-slate-200/70 dark:border-slate-800 space-y-3 shrink-0">
        {/* Breadcrumb Trail */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500">
            {lineagePath.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <span className="text-slate-300 dark:text-slate-600 font-sans">›</span>}
                <span
                  className={cn(
                    'truncate max-w-[110px]',
                    idx === lineagePath.length - 1
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >
                  {item.label}
                </span>
              </React.Fragment>
            ))}
          </div>

          <button
            onClick={onClose}
            aria-label="Close detail panel"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Status Badges */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              {nodeLevel}
            </span>
            {node.badge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {node.badge}
              </span>
            )}
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 ml-auto">
              #{node.id}
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug font-sans">
            {node.label}
          </h2>
          {node.subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-1 leading-relaxed">
              {node.subtitle}
            </p>
          )}
        </div>

        {/* Prominent 'Open in Obsidian' Studio Action Button */}
        <button
          onClick={handleOpenInObsidian}
          title="Obsidian नोट खोलें (Shortcut: ⌘ + Enter)"
          className="w-full h-9 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-200 flex items-center justify-between px-3 text-xs font-medium transition-all group shadow-2xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Obsidian में खोलें (Open in Obsidian)</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
            ⌘↵
          </kbd>
        </button>
      </div>

      {/* Node Attributes Grid (Stitch Architectural Porcelain Tectonic 2x2) */}
      <div className="p-5 border-b border-slate-200/70 dark:border-slate-800 space-y-2.5 shrink-0">
        <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Node Attributes
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {/* Classification */}
          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Classification</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {node.category || nodeLevel}
            </div>
          </div>

          {/* Connected Children */}
          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Sub-concepts</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-blue-600" />
              <span>{childCount} Connected Nodes</span>
            </div>
          </div>

          {/* Active Recall Status */}
          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Active Recall</div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Mastered (92%)</span>
            </div>
          </div>

          {/* Branch Focus Toggle Action */}
          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Branch Focus</div>
            {hasChildren && onToggleFocusBranch ? (
              <button
                onClick={() => onToggleFocusBranch(node.id)}
                className="mt-1 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {isFocusedBranch ? (
                  <>
                    <EyeOff className="w-3 h-3 text-amber-500" />
                    <span>Exit Focus</span>
                  </>
                ) : (
                  <>
                    <Target className="w-3 h-3" />
                    <span>Focus Branch</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-xs text-slate-400 mt-0.5">Leaf Node</div>
            )}
          </div>
        </div>
      </div>

      {/* Description / Summary Notes */}
      {node.description && (
        <div className="p-5 border-b border-slate-200/70 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Concept Summary
            </h4>
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>Syllabus Notes</span>
            </span>
          </div>
          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            <p>{node.description}</p>
          </div>
        </div>
      )}

      {/* Key Facts & Exam Checkpoints */}
      {node.keyFacts && node.keyFacts.length > 0 && (
        <div className="p-5 border-b border-slate-200/70 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Key Synthesis & Checkpoints
            </h4>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>High Yield</span>
            </span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-sans">
            {node.keyFacts.map((fact, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags / References */}
      {node.tags && node.tags.length > 0 && (
        <div className="p-5 border-b border-slate-200/70 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Linked Concepts
            </h4>
            <span className="text-[11px] font-mono text-slate-400">{node.tags.length} References</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {node.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-sans"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Practice Recall Quiz Action Section */}
      <div className="p-5 mt-auto bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-200/70 dark:border-slate-800 space-y-3 shrink-0">
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400">
              Retention Target
            </div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {nodeQuizzes.length > 0 ? `${nodeQuizzes.length} Questions Queued` : 'Active Concept'}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Daily SRS Interval • Level {lineagePath.length}
            </div>
          </div>

          {/* Minimalist Progress Dial (SVG Ring) */}
          <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-800"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-blue-600 dark:text-blue-500"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray="92, 100"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <span className="absolute font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200">
              92%
            </span>
          </div>
        </div>

        {nodeQuizzes.length > 0 && onOpenQuizForNode && (
          <button
            onClick={() => onOpenQuizForNode(node.id)}
            className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
          >
            <Award className="w-4 h-4" />
            <span>Start Practice Recall Quiz ({nodeQuizzes.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
    </>
  );
};
