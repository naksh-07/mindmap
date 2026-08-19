'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ALL_TEST_DATASETS } from '@/lib/data/test-datasets';
import { MindMapNode, MindMapData, LayoutMode } from '@/lib/types/mindmap';
import { parseAndIngestMindMapData, IngestionResult } from '@/lib/mindmap-data';
import { computeMindMapLayout } from '@/lib/mindmap-layout';
import { MindMapCanvas } from '@/components/mindmap/MindMapCanvas';
import { MindMapToolbar } from '@/components/mindmap/MindMapToolbar';
import { MindMapNodeDetailPanel } from '@/components/mindmap/MindMapNodeDetailPanel';
import { MindMapQuizModal } from '@/components/mindmap/MindMapQuizModal';
import { MindMapErrorState } from '@/components/mindmap/MindMapErrorState';

export default function MindMapPage() {
  const [sourceMode, setSourceMode] = useState<'empty' | 'loading' | 'loaded' | 'error'>('empty');
  const [datasetKey, setDatasetKey] = useState<string | null>(null);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult>({
    data: null,
    success: false,
    errors: [],
    warnings: [],
  });
  const currentFetchId = React.useRef(0);
  const fetchAbortController = React.useRef<AbortController | null>(null);

  // Layout & View State
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('balanced');
  const [collapsedSet, setCollapsedSet] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusedBranchId, setFocusedBranchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveRecall, setIsActiveRecall] = useState(false);
  const [revealedNodeIds, setRevealedNodeIds] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizInitialNodeId, setQuizInitialNodeId] = useState<string | null>(null);

  // Web font load readiness listener (BUG-011 Fix)
  const [fontsLoaded, setFontsLoaded] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  // Data Ingestion Pipeline Execution
  const loadDataset = useCallback(async (key: string | null) => {
    if (!key) return;

    const fetchId = ++currentFetchId.current;
    if (fetchAbortController.current) {
      fetchAbortController.current.abort();
    }
    const controller = new AbortController();
    fetchAbortController.current = controller;

    setSourceMode('loading');

    // Reset all view & interactive state when dataset changes to prevent state leakage
    setSelectedNodeId(null);
    setCollapsedSet(new Set());
    setRevealedNodeIds(new Set());
    setSearchQuery('');
    setFocusedBranchId(null);
    setIsQuizOpen(false);
    setQuizInitialNodeId(null);

    if (key.startsWith('http://') || key.startsWith('https://')) {
      try {
        const response = await fetch(key, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        const jsonText = await response.text();
        if (currentFetchId.current !== fetchId) return;

        const result = parseAndIngestMindMapData(jsonText);
        setIngestionResult(result);
        setSourceMode(result.success ? 'loaded' : 'error');
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (currentFetchId.current !== fetchId) return;

        setIngestionResult({
          data: null,
          success: false,
          errors: [
            {
              path: 'network',
              code: 'MALFORMED_JSON',
              message: `Failed to fetch external JSON URL: ${err instanceof Error ? err.message : String(err)}`,
              severity: 'fatal',
            },
          ],
          warnings: [],
        });
        setSourceMode('error');
      }
    } else if (process.env.NODE_ENV === 'development') {
      if (key === 'malformed-json') {
        const malformedInput = JSON.stringify({
          id: 'malformed-test',
          title: 'Malformed Test Data',
          subject: 'Testing',
          language: 'hi',
          root: {
            id: 'root-node',
            label: 'Root Concept',
            children: [
              { id: 'child-1', label: 'Child 1' },
              { id: 'child-1', label: 'Duplicate Child ID' },
            ],
          },
          crossLinks: [
            { sourceId: 'child-1', targetId: 'non-existent-node' },
          ],
        });
        const result = parseAndIngestMindMapData(malformedInput);
        if (currentFetchId.current === fetchId) {
          setIngestionResult(result);
          setSourceMode(result.success ? 'loaded' : 'error');
        }
      } else {
        const rawBenchmark = ALL_TEST_DATASETS[key] || ALL_TEST_DATASETS['geo-50'];
        const result = parseAndIngestMindMapData(rawBenchmark);
        if (currentFetchId.current === fetchId) {
          setIngestionResult(result);
          setSourceMode(result.success ? 'loaded' : 'error');
        }
      }
    } else {
       setSourceMode('empty');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sourceUrl = params.get('source') || params.get('json');
      if (sourceUrl) {
        try {
          const parsedUrl = new URL(sourceUrl);
          if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            throw new Error(`Unsupported URL protocol '${parsedUrl.protocol}'. Only HTTP/HTTPS URLs are supported.`);
          }
          if (datasetKey !== sourceUrl) {
            setDatasetKey(sourceUrl);
            return;
          }
        } catch (err) {
          setIngestionResult({
            data: null,
            success: false,
            errors: [
              {
                path: 'sourceUrl',
                code: 'INVALID_VALUE',
                message: `Invalid external JSON URL provided in query parameter: ${err instanceof Error ? err.message : String(err)}`,
                severity: 'fatal',
              },
            ],
            warnings: [],
          });
          setSourceMode('error');
          return;
        }
      }
    }
    if (datasetKey) {
      loadDataset(datasetKey);
    }
  }, [datasetKey, loadDataset]);

  // Bi-directional postMessage listener for Obsidian plugin bridge integration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      // Validate event origin
      const trustedOrigins = [
        'app://obsidian.md',
        'app://localhost',
        'capacitor://localhost',
        'https://mindmap.riyasaksena502.workers.dev',
      ];
      
      if (process.env.NODE_ENV === 'development') {
        trustedOrigins.push('http://localhost:3000');
        trustedOrigins.push('http://localhost:3001');
      }

      const isLocalhost = event.origin.startsWith('http://localhost') || 
                          event.origin.startsWith('https://localhost');
                          
      const isAppOrigin = event.origin.startsWith('app://') || 
                          event.origin.startsWith('capacitor://') ||
                          event.origin.startsWith('file://');

      const isExactTrustedOrigin = trustedOrigins.includes(event.origin) || isLocalhost || isAppOrigin;

      if (!isExactTrustedOrigin && event.origin !== 'null' && event.origin !== '') {
         if (process.env.NODE_ENV === 'development') {
            console.warn('Blocked message from untrusted origin:', event.origin);
         }
         return;
      }

      // Validate event source. Some privileged/mobile WebViews expose MessageEvent.source as null.
      // Only allow null source for exact known Obsidian/Capacitor origins, not opaque origins.
      if (event.source !== window.parent && !(event.source === null && isExactTrustedOrigin)) return;

      if (event.data && event.data.type === 'MINDMAP_DATA') {
        const rawData = event.data.payload !== undefined ? event.data.payload : event.data.data;
        if (rawData) {
          // Cancel any ongoing fetch to ensure Obsidian data is not overwritten
          currentFetchId.current++;
          if (fetchAbortController.current) {
            fetchAbortController.current.abort();
          }

          setSourceMode('loading');
          // Reset view & interactive states when new payload arrives
          setSelectedNodeId(null);
          setCollapsedSet(new Set());
          setRevealedNodeIds(new Set());
          setSearchQuery('');
          setFocusedBranchId(null);
          setIsQuizOpen(false);
          setQuizInitialNodeId(null);

          const result = parseAndIngestMindMapData(rawData);
          setIngestionResult(result);
          setSourceMode(result.success ? 'loaded' : 'error');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify parent container (e.g. Obsidian iframe bridge) that viewer is ready
    const notifyReady = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'MINDMAP_VIEWER_READY' }, '*');
      }
    };

    notifyReady();
    const readyRetryTimers = [
      window.setTimeout(notifyReady, 150),
      window.setTimeout(notifyReady, 500),
      window.setTimeout(notifyReady, 1500),
    ];

    return () => {
      window.removeEventListener('message', handleMessage);
      readyRetryTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const mindMapData = ingestionResult.data;

  // Apply dark class to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Recursively find a node by ID and build parent lineage path
  const getNodeWithLineage = useCallback(
    (targetId: string | null): { node: MindMapNode | null; path: MindMapNode[] } => {
      if (!targetId || !mindMapData) return { node: null, path: [] };

      const findInTree = (
        current: MindMapNode,
        currentPath: MindMapNode[]
      ): { node: MindMapNode; path: MindMapNode[] } | null => {
        const newPath = [...currentPath, current];
        if (current.id === targetId) {
          return { node: current, path: newPath };
        }
        if (current.children) {
          for (const child of current.children) {
            const res = findInTree(child, newPath);
            if (res) return res;
          }
        }
        return null;
      };

      const result = findInTree(mindMapData.root, []);
      return result || { node: null, path: [] };
    },
    [mindMapData]
  );

  // Global Keyboard Navigation (Escape key listener)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isQuizOpen) {
          setIsQuizOpen(false);
        } else if (focusedBranchId) {
          setFocusedBranchId(null);
        } else if (selectedNodeId) {
          setSelectedNodeId(null);
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuizOpen, focusedBranchId, selectedNodeId, searchQuery]);

  // Selected Node & Lineage Path
  const { node: selectedNode, path: lineagePath } = useMemo(
    () => getNodeWithLineage(selectedNodeId),
    [selectedNodeId, getNodeWithLineage]
  );

  const lineageNodeIds = useMemo(() => {
    return new Set(lineagePath.map((n) => n.id));
  }, [lineagePath]);

  // Focus Branch Subtree Calculation
  const focusedBranchNodeIds = useMemo(() => {
    if (!focusedBranchId) return undefined;
    const set = new Set<string>();

    const collectSubtree = (node: MindMapNode) => {
      set.add(node.id);
      if (node.children) {
        node.children.forEach(collectSubtree);
      }
    };

    const { node: targetNode } = getNodeWithLineage(focusedBranchId);
    if (targetNode) {
      collectSubtree(targetNode);
    }
    return set;
  }, [focusedBranchId, getNodeWithLineage]);

  const handleToggleFocusBranch = useCallback((nodeId: string) => {
    setFocusedBranchId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  // Toggle node collapse
  const handleToggleCollapse = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Toggle collapse all / expand all based on level-1 branch state (BUG-008 Fix)
  const level1Children = useMemo(
    () => mindMapData?.root.children ?? [],
    [mindMapData?.root.children]
  );
  const hasCollapsedNodes = useMemo(() => {
    return level1Children.length > 0 && level1Children.every((c) => collapsedSet.has(c.id));
  }, [level1Children, collapsedSet]);

  const handleToggleCollapseAll = useCallback(() => {
    if (hasCollapsedNodes) {
      setCollapsedSet(new Set());
    } else {
      const toCollapse = new Set<string>();
      level1Children.forEach((c) => toCollapse.add(c.id));
      setCollapsedSet(toCollapse);
    }
  }, [hasCollapsedNodes, level1Children]);

  // Search matching nodes logic with safe nullish property access (BUG-005 Fix)
  const { highlightedNodeIds, matchCount, totalNodeCount } = useMemo(() => {
    const matches = new Set<string>();
    let total = 0;
    const q = searchQuery.toLowerCase().trim();

    const traverse = (node: MindMapNode) => {
      total++;
      if (q.length > 0 && node) {
        const labelStr = (node.label ?? '').toLowerCase();
        const subStr = (node.subtitle ?? '').toLowerCase();
        const descStr = (node.description ?? '').toLowerCase();
        const badgeStr = (node.badge ?? '').toLowerCase();
        const factsArr = node.keyFacts ?? [];

        const inLabel = labelStr.includes(q);
        const inSub = subStr.includes(q);
        const inDesc = descStr.includes(q);
        const inBadge = badgeStr.includes(q);
        const inFacts = factsArr.some((f) => (f ?? '').toLowerCase().includes(q));

        if (inLabel || inSub || inDesc || inBadge || inFacts) {
          matches.add(node.id);
        }
      }
      if (node?.children) {
        node.children.forEach(traverse);
      }
    };

    if (mindMapData?.root) {
      traverse(mindMapData.root);
    }

    return {
      highlightedNodeIds: matches,
      matchCount: matches.size,
      totalNodeCount: total,
    };
  }, [mindMapData?.root, searchQuery]);

  // Search Auto-Expansion: Automatically expand collapsed parent branches for search matches
  useEffect(() => {
    if (highlightedNodeIds.size === 0) return;

    const parentsToExpand = new Set<string>();
    highlightedNodeIds.forEach((nodeId) => {
      const { path } = getNodeWithLineage(nodeId);
      path.forEach((ancestor) => {
        if (ancestor.id !== nodeId) {
          parentsToExpand.add(ancestor.id);
        }
      });
    });

    if (parentsToExpand.size > 0) {
      setCollapsedSet((prev) => {
        let changed = false;
        const next = new Set(prev);
        parentsToExpand.forEach((pId) => {
          if (next.has(pId)) {
            next.delete(pId);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [highlightedNodeIds, getNodeWithLineage]);

  // Active recall reveal toggle
  const handleToggleReveal = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Mount state for hydration matching
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute layout positioned nodes & connector lines
  const { nodes: positionedNodes, connectors } = useMemo(() => {
    if (!mindMapData?.root) {
      return { nodes: [], connectors: [] };
    }
    const forceFallback = !isMounted;
    return computeMindMapLayout(mindMapData.root, layoutMode, collapsedSet, forceFallback);
  }, [mindMapData?.root, layoutMode, collapsedSet, fontsLoaded, isMounted]);

  // Empty state view
  if (sourceMode === 'empty') {
    return (
      <main className="w-screen h-screen flex flex-col items-center justify-center bg-background text-foreground select-none p-6 text-center">
        <div className="flex flex-col items-center gap-4 max-w-md">
          <h1 className="text-2xl font-bold text-primary">माइंड मैप JSON लोड नहीं हुआ</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Obsidian में <code className="bg-muted px-1 py-0.5 rounded text-primary/80">.mindmap.json</code> खोलें या <code className="bg-muted px-1 py-0.5 rounded text-primary/80">?source=&lt;JSON URL&gt;</code> का उपयोग करें।
          </p>
        </div>
      </main>
    );
  }

  // Loading state view
  if (sourceMode === 'loading') {
    return (
      <main className="w-screen h-screen flex items-center justify-center bg-background text-foreground select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-muted-foreground animate-pulse">
            Mind Map Data loading & validating...
          </span>
        </div>
      </main>
    );
  }

  // Error state view if ingestion failed or data is invalid
  if (!ingestionResult.success || !mindMapData) {
    return (
      <main className="w-screen h-screen relative bg-background text-foreground flex flex-col select-none">
        <MindMapErrorState
          errors={ingestionResult.errors}
          warnings={ingestionResult.warnings}
          datasetKey={datasetKey ?? undefined}
          onSelectDataset={(key) => setDatasetKey(key)}
          onRetry={() => loadDataset(datasetKey)}
        />
      </main>
    );
  }

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-background text-foreground flex flex-col select-none">
      {/* Top Floating Toolbar */}
      <MindMapToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        layoutMode={layoutMode}
        onChangeLayoutMode={setLayoutMode}
        datasetKey={datasetKey ?? undefined}
        onChangeDatasetKey={setDatasetKey}
        focusedBranchId={focusedBranchId}
        onClearFocusBranch={() => setFocusedBranchId(null)}
        isActiveRecall={isActiveRecall}
        onToggleActiveRecall={() => setIsActiveRecall(!isActiveRecall)}
        onOpenQuiz={() => {
          setQuizInitialNodeId(null);
          setIsQuizOpen(true);
        }}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        hasCollapsedNodes={hasCollapsedNodes}
        onToggleCollapseAll={handleToggleCollapseAll}
        matchCount={matchCount}
        totalNodes={totalNodeCount}
      />

      {/* Main Mind Map Canvas Stage */}
      <div className="flex-1 w-full h-full relative">
        <MindMapCanvas
          nodes={positionedNodes}
          connectors={connectors}
          crossLinks={mindMapData.crossLinks}
          selectedNodeId={selectedNodeId}
          highlightedNodeIds={highlightedNodeIds}
          lineageNodeIds={lineageNodeIds}
          focusedBranchNodeIds={focusedBranchNodeIds}
          isActiveRecall={isActiveRecall}
          revealedNodeIds={revealedNodeIds}
          theme={theme}
          onSelectNode={setSelectedNodeId}
          onToggleCollapse={handleToggleCollapse}
          onToggleReveal={handleToggleReveal}
        />
      </div>

      {/* Selected Node Details Side Panel / Mobile Bottom Sheet */}
      <MindMapNodeDetailPanel
        node={selectedNode}
        lineagePath={lineagePath}
        quizQuestions={mindMapData.quizQuestions}
        isFocusedBranch={selectedNodeId ? focusedBranchId === selectedNodeId : false}
        onClose={() => setSelectedNodeId(null)}
        onOpenQuizForNode={(nodeId) => {
          setQuizInitialNodeId(nodeId);
          setIsQuizOpen(true);
        }}
        onToggleFocusBranch={handleToggleFocusBranch}
      />

      {/* Quiz Modal */}
      <MindMapQuizModal
        isOpen={isQuizOpen}
        quizQuestions={mindMapData.quizQuestions || []}
        initialNodeId={quizInitialNodeId}
        onClose={() => {
          setIsQuizOpen(false);
          setQuizInitialNodeId(null);
        }}
      />
    </main>
  );
}
