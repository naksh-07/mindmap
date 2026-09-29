'use client';

import React from 'react';
import {
  Search,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Award,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Layers,
  MoreVertical,
  Target,
  X,
  ZoomIn,
  ZoomOut,
  GitFork,
  Compass,
  Network,
  EyeOff,
  FolderTree,
} from 'lucide-react';
import { LayoutMode } from '@/lib/types/mindmap';
import { cn } from '@/lib/utils';

interface MindMapToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  layoutMode: LayoutMode;
  onChangeLayoutMode: (mode: LayoutMode) => void;
  datasetKey?: string;
  onChangeDatasetKey?: (key: string) => void;
  focusedBranchId?: string | null;
  onClearFocusBranch?: () => void;
  isActiveRecall: boolean;
  onToggleActiveRecall: () => void;
  onOpenQuiz: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  hasCollapsedNodes: boolean;
  onToggleCollapseAll: () => void;
  matchCount: number;
  totalNodes: number;
}

export const MindMapToolbar: React.FC<MindMapToolbarProps> = ({
  searchQuery,
  onSearchChange,
  layoutMode,
  onChangeLayoutMode,
  datasetKey = 'geo-50',
  onChangeDatasetKey,
  focusedBranchId,
  onClearFocusBranch,
  isActiveRecall,
  onToggleActiveRecall,
  onOpenQuiz,
  theme,
  onToggleTheme,
  hasCollapsedNodes,
  onToggleCollapseAll,
  matchCount,
  totalNodes,
}) => {
  const containerToolbarRef = React.useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showDatasetMenu, setShowDatasetMenu] = React.useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = React.useState(false);

  // Sync fullscreen state with native browser event
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcut listener for Cmd/Ctrl+K search focus and Cmd/Ctrl+Enter
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('mindmap-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dismiss open dropdown menus on outside-click or Escape key
  React.useEffect(() => {
    const handleDocumentMouseDown = (e: MouseEvent) => {
      if (containerToolbarRef.current && !containerToolbarRef.current.contains(e.target as Node)) {
        setShowDatasetMenu(false);
        setShowOverflowMenu(false);
      }
    };

    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDatasetMenu(false);
        setShowOverflowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.error(err));
      }
    }
  };

  const triggerFitScreen = () => {
    window.dispatchEvent(new CustomEvent('mindmap:fit-screen'));
  };

  const triggerZoom = (direction: 'in' | 'out') => {
    window.dispatchEvent(new CustomEvent('mindmap:zoom', { detail: { direction } }));
  };

  // Human readable dataset label
  const datasetDisplayName = React.useMemo(() => {
    if (datasetKey === '/example-mindmap.json') return 'UPSC Modern History';
    if (datasetKey === '/data/examples/dummy-geography-mindmap.json') return 'India Geography';
    if (datasetKey.startsWith('http')) return 'External URL';
    if (datasetKey === 'sample-json') return 'Sample JSON (Hindi)';
    if (datasetKey === 'malformed-json') return 'Malformed JSON';
    if (datasetKey === 'geo-20') return '20 Nodes (Small)';
    if (datasetKey === 'geo-50') return '50 Nodes (UPSC)';
    if (datasetKey === 'geo-100') return '100 Nodes';
    if (datasetKey === 'geo-200') return '200 Nodes';
    if (datasetKey === 'geo-500') return '500 Nodes';
    if (datasetKey === 'geo-1000') return '1000 Nodes';
    return datasetKey;
  }, [datasetKey]);

  return (
    <header
      ref={containerToolbarRef}
      className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-2 flex items-center justify-between z-30 shrink-0 select-none shadow-xs transition-colors duration-150"
    >
      {/* Left: Brand Anchor, Dataset Selector & Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {/* Brand Anchor */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Network className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 hidden md:inline-block">
            MindMap Studio
          </span>
        </div>

        {/* Dataset Scale Selector Dropdown */}
        {onChangeDatasetKey && (
          <div className="relative hidden lg:block shrink-0">
            <button
              onClick={() => setShowDatasetMenu(!showDatasetMenu)}
              aria-label="Select test dataset scale"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 border border-slate-200/60 dark:border-slate-700/60 rounded-md transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{datasetDisplayName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDatasetMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  Example Datasets
                </div>
                {[
                  { key: '/example-mindmap.json', label: 'UPSC Modern History (1857-1947)' },
                  { key: '/data/examples/dummy-geography-mindmap.json', label: 'India Physical Geography' },
                  { key: 'sample-json', label: 'Sample JSON (Hindi)' },
                  { key: 'malformed-json', label: 'Malformed JSON (Error Test)' },
                ].map((d) => (
                  <button
                    key={d.key}
                    onClick={() => {
                      onChangeDatasetKey(d.key);
                      setShowDatasetMenu(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between',
                      datasetKey === d.key && 'font-semibold text-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:text-blue-400'
                    )}
                  >
                    <span>{d.label}</span>
                  </button>
                ))}

                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mt-1.5">
                  Benchmark Datasets
                </div>
                {[
                  { key: 'geo-20', label: '20 Nodes (Small)' },
                  { key: 'geo-50', label: '50 Nodes (UPSC Medium)' },
                  { key: 'geo-100', label: '100 Nodes (Large)' },
                  { key: 'geo-200', label: '200 Nodes (Stress)' },
                  { key: 'geo-500', label: '500 Nodes (Extreme)' },
                  { key: 'geo-1000', label: '1000 Nodes (Max Stress)' },
                ].map((d) => (
                  <button
                    key={d.key}
                    onClick={() => {
                      onChangeDatasetKey(d.key);
                      setShowDatasetMenu(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between',
                      datasetKey === d.key && 'font-semibold text-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:text-blue-400'
                    )}
                  >
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Search Bar (search_bar with ⌘K badge) */}
        <div className="relative flex items-center flex-1 max-w-xs sm:max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            id="mindmap-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search mind map concepts"
            placeholder="खोजें (Search concept)..."
            className="w-full h-8 pl-8 pr-12 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-sans"
          />
          {searchQuery ? (
            <span className="absolute right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40">
              {matchCount}/{totalNodes}
            </span>
          ) : (
            <kbd className="absolute right-2 hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Exit Focus Pill Button when Focus Mode is Active */}
        {focusedBranchId && onClearFocusBranch && (
          <button
            onClick={onClearFocusBranch}
            aria-label="Exit Focus Branch Mode"
            title="फ़ोकस मोड हटाएं"
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-lg shadow-2xs transition-all active:scale-95 shrink-0"
          >
            <Target className="w-3 h-3" />
            <span className="hidden sm:inline">एकज़िट फ़ोकस</span>
            <X className="w-3 h-3 opacity-80 ml-0.5" />
          </button>
        )}
      </div>

      {/* Center: Layout Mode Segmented Control (Google Stitch Segmented Pill) */}
      <div className="hidden md:flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 mx-3">
        {[
          { mode: 'balanced', label: 'Balanced', icon: LayoutGrid },
          { mode: 'horizontal', label: 'Tree', icon: GitFork },
          { mode: 'vertical', label: 'Vertical', icon: FolderTree },
          { mode: 'radial', label: 'Radial', icon: Compass },
        ].map(({ mode, label, icon: Icon }) => {
          const isActive = layoutMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onChangeLayoutMode(mode as LayoutMode)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-700/40'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Viewport Actions, Active Recall, Quiz, Theme */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Trailing Icon Actions Group: Zoom & Fit to Screen */}
        <div className="hidden sm:flex items-center border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-0.5 bg-white/80 dark:bg-slate-800/80 shadow-2xs">
          <button
            onClick={() => triggerZoom('in')}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all duration-150 active:scale-95"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => triggerZoom('out')}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all duration-150 active:scale-95"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={triggerFitScreen}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all duration-150 active:scale-95"
            title="Fit to Screen"
            aria-label="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            onClick={onToggleCollapseAll}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all duration-150 active:scale-95"
            title={hasCollapsedNodes ? 'सभी शाखाएं खोलें (Expand All)' : 'सभी शाखाएं समेटें (Collapse All)'}
            aria-label={hasCollapsedNodes ? 'Expand all branches' : 'Collapse all branches'}
          >
            {hasCollapsedNodes ? (
              <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all duration-150 active:scale-95"
            title="Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Secondary Action: Active Recall Mode Toggle */}
        <button
          onClick={onToggleActiveRecall}
          aria-label="Toggle Active Recall study mode"
          title="एक्टिव रीकॉल (Active Recall Mode)"
          className={cn(
            'h-8 px-2.5 sm:px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ease-out active:scale-95 shadow-2xs',
            isActiveRecall
              ? 'bg-amber-500 text-white border-amber-600 font-semibold shadow-xs ring-2 ring-amber-500/20'
              : 'border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          )}
        >
          <EyeOff className={cn('w-3.5 h-3.5', isActiveRecall ? 'text-white' : 'text-amber-500')} />
          <span className="hidden sm:inline">Active Recall</span>
        </button>

        {/* Primary Action: Quiz Mode Button */}
        <button
          onClick={onOpenQuiz}
          aria-label="Open Interactive Quiz"
          title="प्रश्नोत्तरी (Quiz Mode)"
          className="h-8 px-2.5 sm:px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 transition-all duration-150 ease-out active:scale-95 shadow-xs"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Quiz</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle dark/light theme"
          title={theme === 'dark' ? 'लाइट मोड (Light)' : 'डार्क मोड (Dark)'}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all active:scale-95 border border-slate-200/80 dark:border-slate-700"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>

        {/* Mobile Overflow Menu Button (<md:) */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowOverflowMenu(!showOverflowMenu)}
            aria-label="More toolbar options"
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showOverflowMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 flex flex-col max-h-[80vh] overflow-y-auto">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                Layout
              </div>
              {[
                { mode: 'balanced', label: 'संतुलित (Balanced)' },
                { mode: 'horizontal', label: 'क्षैतिज (Horizontal Tree)' },
                { mode: 'vertical', label: 'लंबवत (Vertical Tree)' },
                { mode: 'radial', label: 'रेडियल (Radial Hub)' },
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    onChangeLayoutMode(mode as LayoutMode);
                    setShowOverflowMenu(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between',
                    layoutMode === mode && 'font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300'
                  )}
                >
                  <span>{label}</span>
                </button>
              ))}

              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <button
                onClick={() => {
                  triggerFitScreen();
                  setShowOverflowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fit Screen</span>
              </button>
              <button
                onClick={() => {
                  onToggleCollapseAll();
                  setShowOverflowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                {hasCollapsedNodes ? <ChevronDown className="w-3.5 h-3.5 text-amber-500" /> : <ChevronUp className="w-3.5 h-3.5" />}
                <span>{hasCollapsedNodes ? 'सभी शाखाएं खोलें' : 'समेटें'}</span>
              </button>
              <button
                onClick={() => {
                  toggleFullscreen();
                  setShowOverflowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
