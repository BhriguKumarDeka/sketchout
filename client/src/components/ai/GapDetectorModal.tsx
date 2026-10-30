import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import {
  AlertTriangle,
  X,
  Target,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

export const GapDetectorModal: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    gaps,
    runGapDetection,
    focusElement,
  } = useCanvasStore();

  if (activeDrawer !== 'gaps') return null;

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40">high</span>;
      case 'medium':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">medium</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">low</span>;
    }
  };

  return (
    <div className="absolute top-13 right-0 bottom-0 w-[420px] bg-[var(--surface-1)] border-l border-[var(--border-subtle)] flex flex-col z-30 shadow-sm animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-zinc-100" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Context Gap & Consistency Analysis
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => runGapDetection()}
            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Rerun gap check"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveDrawer('none')}
            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gaps List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {gaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--text-tertiary)] gap-2">
            <CheckCircle className="w-8 h-8 text-emerald-500/70" />
            <p className="text-xs font-medium text-[var(--text-primary)]">No severe gaps detected</p>
            <p className="text-[11px] leading-relaxed">
              Your canvas topology maintains consistent node relationships, assumptions, and decision paths.
            </p>
          </div>
        ) : (
          gaps.map((gap) => (
            <div
              key={gap.id}
              className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[var(--text-primary)]">
                  {gap.title}
                </span>
                {getSeverityBadge(gap.severity)}
              </div>

              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                {gap.description}
              </p>

              <div className="p-2 rounded bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)]">
                <strong className="text-[var(--text-secondary)]">Resolution: </strong>
                {gap.suggestedResolution}
              </div>

              {gap.relatedElementIds && gap.relatedElementIds.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-[var(--text-tertiary)]">Affects:</span>
                  {gap.relatedElementIds.map((id) => (
                    <button
                      key={id}
                      onClick={() => focusElement(id)}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-1"
                    >
                      <Target className="w-2.5 h-2.5" />
                      <span>#{id.slice(0, 6)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
