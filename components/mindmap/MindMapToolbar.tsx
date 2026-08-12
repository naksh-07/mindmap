'use client';

import React from 'react';
import {
  Search,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  HelpCircle,
  Award,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Layers,
  MoreVertical,
  Target,
  X,
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
  const [showLayoutMenu, setShowLayoutMenu] = React.useState(false);
  const [showDatasetMenu, setShowDatasetMenu] = React.useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = React.useState(false);

  // Sync fullscreen state with native browser event (BUG-012 Fix)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Dismiss open dropdown menus on outside-click or Escape key (BUG-010 Fix)
  React.useEffect(() => {
    const handleDocumentMouseDown = (e: MouseEvent) => {
      if (containerToolbarRef.current && !containerToolbarRef.current.contains(e.target as Node)) {
        setShowLayoutMenu(false);
        setShowDatasetMenu(false);
        setShowOverflowMenu(false);
      }
    };

    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLayoutMenu(false);
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

  return (
    <div
      ref={containerToolbarRef}
      className="absolute top-3 left-3 right-3 z-40 pointer-events-none flex flex-row items-center justify-between gap-2"
    >
      {/* Search Input Bar & Exit Focus Pill */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-card/90 backdrop-blur-md border border-border/80 shadow-lg rounded-2xl px-2.5 sm:px-3 py-1.5 w-full max-w-[200px] sm:max-w-sm transition-all focus-within:ring-2 focus-within:ring-primary/40">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search mind map concepts"
            placeholder="खोजें (Search)..."
            className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none font-sans"
          />
          {searchQuery && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-primary px-1.5 py-0.5 bg-primary/10 rounded-full shrink-0">
              {matchCount}/{totalNodes}
            </span>
          )}
        </div>

        {/* Exit Focus Pill Button when Focus Mode is Active */}
        {focusedBranchId && onClearFocusBranch && (
          <button
            onClick={onClearFocusBranch}
            aria-label="Exit Focus Branch Mode"
            title="फ़ोकस मोड हटाएं"
            className="pointer-events-auto flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-amber-500 text-white font-semibold text-xs rounded-2xl shadow-md animate-in fade-in transition-all hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">एकज़िट फ़ोकस</span>
            <X className="w-3.5 h-3.5 opacity-80 shrink-0 ml-0.5" />
          </button>
        )}
      </div>

      {/* Floating Control Toolbar */}
      <div className="pointer-events-auto flex items-center justify-end gap-1 bg-card/90 backdrop-blur-md border border-border/80 shadow-lg rounded-2xl px-2 py-1.5 shrink-0">
        {/* Dataset Scale Selector Dropdown (Desktop/Tablet) */}
        {onChangeDatasetKey && (
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setShowDatasetMenu(!showDatasetMenu);
                setShowLayoutMenu(false);
              }}
              aria-label="Select test dataset scale"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Layers className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">
                {datasetKey.startsWith('http')
                  ? 'External URL'
                  : datasetKey === 'sample-json'
                  ? 'Sample JSON'
                  : datasetKey === 'malformed-json'
                  ? 'Malformed JSON'
                  : datasetKey === 'geo-20'
                  ? '20 Nodes'
                  : datasetKey === 'geo-50'
                  ? '50 Nodes'
                  : datasetKey === 'geo-100'
                  ? '100 Nodes'
                  : datasetKey === 'geo-200'
                  ? '200 Nodes'
                  : datasetKey === 'geo-500'
                  ? '500 Nodes'
                  : '1000 Nodes'}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {showDatasetMenu && (
              <div className="absolute top-full right-0 mt-1.5 w-56 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl py-1 z-50 max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/60">
                  External JSON
                </div>
                {[
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
                      'w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center justify-between',
                      datasetKey === d.key && 'font-semibold text-primary bg-primary/10'
                    )}
                  >
                    <span>{d.label}</span>
                  </button>
                ))}

                <div className="px-3 py-1 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/60 mt-1.5">
                  Benchmark Datasets
                </div>
                {[
                  { key: 'geo-20', label: '20 Nodes (Small)' },
                  { key: 'geo-50', label: '50 Nodes (Medium)' },
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
                      'w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center justify-between',
                      datasetKey === d.key && 'font-semibold text-primary bg-primary/10'
                    )}
                  >
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Layout Mode Selector Dropdown (Desktop/Tablet) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => {
              setShowLayoutMenu(!showLayoutMenu);
              setShowDatasetMenu(false);
            }}
            aria-label="Change layout mode"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            <LayoutGrid className="w-4 h-4 text-primary" />
            <span className="capitalize">{layoutMode}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {showLayoutMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-36 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl py-1 z-50 max-h-[60vh] overflow-y-auto">
              {(['balanced', 'horizontal', 'vertical'] as LayoutMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    onChangeLayoutMode(mode);
                    setShowLayoutMenu(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-muted transition-colors flex items-center justify-between',
                    layoutMode === mode && 'font-semibold text-primary bg-primary/10'
                  )}
                >
                  {mode === 'balanced'
                    ? 'संतुलित (Balanced)'
                    : mode === 'horizontal'
                    ? 'क्षैतिज (Horizontal)'
                    : 'लंबवत (Vertical)'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Expand / Collapse All */}
        <button
          onClick={onToggleCollapseAll}
          aria-label={hasCollapsedNodes ? 'Expand all branches' : 'Collapse all branches'}
          title={hasCollapsedNodes ? 'सभी शाखाएं खोलें' : 'सभी शाखाएं संकुचित करें'}
          className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          {hasCollapsedNodes ? (
            <>
              <ChevronDown className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline">सभी खोलें</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-4 h-4 text-slate-500" />
              <span className="hidden md:inline">समेटें</span>
            </>
          )}
        </button>

        <div className="hidden sm:block h-4 w-px bg-border/80 my-auto mx-0.5" />

        {/* Active Recall / Hide Labels Mode */}
        <button
          onClick={onToggleActiveRecall}
          aria-label="Toggle Active Recall study mode"
          title="एक्टिव रीकॉल (स्वयं-परीक्षण मोड)"
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-amber-500',
            isActiveRecall
              ? 'bg-amber-500 text-white font-semibold shadow-xs ring-2 ring-amber-500/30'
              : 'text-foreground hover:bg-muted'
          )}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden lg:inline">एक्टिव रीकॉल</span>
        </button>

        {/* Quiz Button */}
        <button
          onClick={onOpenQuiz}
          aria-label="Open Interactive Quiz"
          title="प्रश्नोत्तरी (Quiz Mode)"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors font-semibold focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Award className="w-4 h-4" />
          <span>क्विज़</span>
        </button>

        <div className="hidden sm:block h-4 w-px bg-border/80 my-auto mx-0.5" />

        {/* Fit View / Reset */}
        <button
          onClick={triggerFitScreen}
          aria-label="Fit mind map to screen viewport"
          title="स्क्रीन पर फ़िट करें (Fit to screen)"
          className="p-1.5 text-foreground hover:bg-muted rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle dark/light theme"
          title={theme === 'dark' ? 'लाइट मोड' : 'डार्क मोड'}
          className="p-1.5 text-foreground hover:bg-muted rounded-xl transition-colors hidden sm:block focus-visible:ring-2 focus-visible:ring-primary"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen view"
          title="फुलस्क्रीन"
          className="p-1.5 text-foreground hover:bg-muted rounded-xl transition-colors hidden sm:block focus-visible:ring-2 focus-visible:ring-primary"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Mobile Overflow Menu Toggle (<sm:) */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setShowOverflowMenu(!showOverflowMenu)}
            aria-label="More toolbar options"
            className="p-1.5 text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showOverflowMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-48 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl py-1 z-50 flex flex-col max-h-[80vh] overflow-y-auto">
              
              {/* Mobile-only tools */}
              <div className="sm:hidden border-b border-border mb-1 pb-1">
                <button
                  onClick={() => {
                    onToggleCollapseAll();
                    setShowOverflowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2"
                >
                  {hasCollapsedNodes ? <ChevronDown className="w-3.5 h-3.5 text-amber-500" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{hasCollapsedNodes ? 'सभी शाखाएं खोलें' : 'सभी शाखाएं संकुचित करें'}</span>
                </button>
                <button
                  onClick={() => {
                    onOpenQuiz();
                    setShowOverflowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span>क्विज़ (Quiz Mode)</span>
                </button>
                <button
                  onClick={() => {
                    onToggleTheme();
                    setShowOverflowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
                  <span>{theme === 'dark' ? 'लाइट मोड (Light)' : 'डार्क मोड (Dark)'}</span>
                </button>
                <button
                  onClick={() => {
                    toggleFullscreen();
                    setShowOverflowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isFullscreen ? 'फुलस्क्रीन बंद करें' : 'फुलस्क्रीन (Fullscreen)'}</span>
                </button>
              </div>

              {/* Layout Modes */}
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground border-b border-border mt-1">
                Layout
              </div>
              {(['balanced', 'horizontal', 'vertical'] as LayoutMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    onChangeLayoutMode(mode);
                    setShowOverflowMenu(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-muted transition-colors flex items-center justify-between',
                    layoutMode === mode && 'font-semibold text-primary bg-primary/10'
                  )}
                >
                  <span>
                  {mode === 'balanced'
                    ? 'संतुलित (Balanced)'
                    : mode === 'horizontal'
                    ? 'क्षैतिज (Horizontal)'
                    : 'लंबवत (Vertical)'}
                  </span>
                </button>
              ))}

              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground border-b border-border mt-2">
                External JSON
              </div>
              {[
                { key: 'sample-json', label: 'Sample JSON (Hindi)' },
                { key: 'malformed-json', label: 'Malformed JSON (Error Test)' },
              ].map((d) => (
                <button
                  key={d.key}
                  onClick={() => {
                    if (onChangeDatasetKey) onChangeDatasetKey(d.key);
                    setShowOverflowMenu(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center justify-between',
                    datasetKey === d.key && 'font-semibold text-primary bg-primary/10'
                  )}
                >
                  <span>{d.label}</span>
                </button>
              ))}

              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground border-b border-border mt-2">
                Scale Datasets
              </div>
              {[
                { key: 'geo-20', label: '20 Nodes (Small)' },
                { key: 'geo-50', label: '50 Nodes (Medium)' },
                { key: 'geo-100', label: '100 Nodes (Large)' },
                { key: 'geo-200', label: '200 Nodes (Stress)' },
                { key: 'geo-500', label: '500 Nodes (Extreme)' },
                { key: 'geo-1000', label: '1000 Nodes (Max)' },
              ].map((d) => (
                <button
                  key={d.key}
                  onClick={() => {
                    if (onChangeDatasetKey) onChangeDatasetKey(d.key);
                    setShowOverflowMenu(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center justify-between',
                    datasetKey === d.key && 'font-semibold text-primary bg-primary/10'
                  )}
                >
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
