'use client';

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, FileCode, Layers } from 'lucide-react';
import { ValidationError, ValidationWarning } from '@/lib/mindmap-data/types';
import { cn } from '@/lib/utils';

interface MindMapErrorStateProps {
  errors: ValidationError[];
  warnings?: ValidationWarning[];
  datasetKey?: string;
  onSelectDataset?: (key: string) => void;
  onRetry?: () => void;
}

export const MindMapErrorState: React.FC<MindMapErrorStateProps> = ({
  errors,
  warnings = [],
  datasetKey = 'sample-json',
  onSelectDataset,
  onRetry,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center p-4 bg-background text-foreground select-none">
      <div className="max-w-xl w-full bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-200">
        
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-destructive/10 text-destructive rounded-2xl shrink-0">
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="space-y-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
              Mind Map load नहीं हो पाया
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {errors.length} data {errors.length === 1 ? 'problem' : 'problems'} found in external JSON
            </p>
          </div>
        </div>

        {/* Formatted Errors List */}
        <div className="bg-muted/50 border border-border/60 rounded-2xl p-4 space-y-3 max-h-60 overflow-y-auto">
          {errors.map((err, idx) => (
            <div key={idx} className="space-y-0.5 text-xs">
              <div className="font-mono font-semibold text-destructive/90 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block shrink-0" />
                <span>{err.path}</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 bg-destructive/15 text-destructive rounded font-sans ml-auto">
                  {err.code}
                </span>
              </div>
              <p className="text-foreground/90 pl-3 font-sans text-xs sm:text-sm">
                {err.message}
              </p>
            </div>
          ))}
        </div>

        {/* Collapsible Details Section */}
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline transition-all outline-none"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{showDetails ? 'Hide technical details' : 'View details'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-muted rounded-xl text-[11px] font-mono text-muted-foreground space-y-2 max-h-44 overflow-y-auto">
              <div>
                <span className="font-bold text-foreground">Current Dataset Key:</span> {datasetKey}
              </div>
              {warnings.length > 0 && (
                <div>
                  <div className="font-bold text-amber-500 mb-1">Warnings ({warnings.length}):</div>
                  {warnings.map((w, i) => (
                    <div key={i}>
                      • [{w.path}] {w.message}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <span className="font-bold text-foreground">Raw Validation Output:</span>
                <pre className="mt-1 text-[10px] overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify({ errors, warnings }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>पुनः प्रयास करें (Retry)</span>
            </button>
          )}

          {onSelectDataset && (
            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Switch to valid dataset:</span>
              <select
                value={datasetKey}
                onChange={(e) => onSelectDataset(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 bg-background border border-border text-xs font-semibold text-foreground rounded-xl outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="sample-json">Sample External JSON (Hindi)</option>
                <option value="geo-20">20 Nodes Benchmark</option>
                <option value="geo-50">50 Nodes Benchmark</option>
                <option value="geo-100">100 Nodes Benchmark</option>
              </select>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
