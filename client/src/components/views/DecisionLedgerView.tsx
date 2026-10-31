import React, { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import {
  Plus,
  Target,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

export const DecisionLedgerView: React.FC = () => {
  const {
    decisions,
    elements,
    focusElement,
    createDecisionRecord,
    runSessionAnalysis,
  } = useCanvasStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRationale, setNewRationale] = useState('');
  const [newAlternatives, setNewAlternatives] = useState('');
  const [newStatus, setNewStatus] = useState<'Proposed' | 'Accepted' | 'Final'>('Accepted');
  const [isExtracting, setIsExtracting] = useState(false);

  const canvasDecisions = elements.filter((e) => e.semanticType === 'decision');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createDecisionRecord({
      title: newTitle,
      rationale: newRationale,
      alternatives: newAlternatives.split(',').map((s) => s.trim()).filter(Boolean),
      status: newStatus,
      linkedElementIds: [],
    });

    setNewTitle('');
    setNewRationale('');
    setNewAlternatives('');
    setIsAdding(false);
  };

  const handleAutoExtract = async () => {
    setIsExtracting(true);
    await runSessionAnalysis();
    setIsExtracting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Final':
      case 'Accepted':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      case 'Proposed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
            <Clock className="w-3 h-3" /> Proposed
          </span>
        );
      case 'Rejected':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return <span className="text-[11px] text-[var(--text-tertiary)]">{status}</span>;
    }
  };

  return (
    <div className="w-full h-full bg-[var(--bg-canvas)] overflow-y-auto p-8 max-w-5xl mx-auto space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Decision Ledger
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Preserves the 'why' behind architectural choices, rejected alternatives, and consensus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoExtract}
            disabled={isExtracting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
          >
            <img src="/assets/hector_avatar.png" alt="Hector" className="w-3.5 h-3.5 rounded-full object-cover" />
            <span>{isExtracting ? 'Analyzing...' : 'Auto-Extract with Hector'}</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-zinc-100 text-zinc-950 font-medium hover:bg-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Decision</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-3"
        >
          <div className="font-medium text-xs text-[var(--text-primary)]">
            Record New Architecture Decision
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Decision title (e.g. Adopt MongoDB for flexible canvas graph persistence)"
              className="w-full bg-[var(--surface-2)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] px-3 py-2 rounded-lg outline-none border border-[var(--border-subtle)]"
              required
            />
            <textarea
              value={newRationale}
              onChange={(e) => setNewRationale(e.target.value)}
              placeholder="Rationale / Context / Tradeoffs..."
              className="w-full bg-[var(--surface-2)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] px-3 py-2 rounded-lg outline-none border border-[var(--border-subtle)] h-20 resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newAlternatives}
                onChange={(e) => setNewAlternatives(e.target.value)}
                placeholder="Alternatives considered (comma-separated)"
                className="w-full bg-[var(--surface-2)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] px-3 py-2 rounded-lg outline-none border border-[var(--border-subtle)]"
              />
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full bg-[var(--surface-2)] text-xs text-[var(--text-primary)] px-3 py-2 rounded-lg outline-none border border-[var(--border-subtle)]"
              >
                <option value="Accepted">Accepted</option>
                <option value="Final">Final</option>
                <option value="Proposed">Proposed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-xs bg-zinc-100 text-zinc-950 font-medium hover:bg-white"
            >
              Save Decision
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-tertiary)]">
              <th className="py-3 px-4 font-medium">Decision</th>
              <th className="py-3 px-4 font-medium">Rationale</th>
              <th className="py-3 px-4 font-medium">Alternatives</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Canvas Trace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {decisions.length === 0 && canvasDecisions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[var(--text-tertiary)]">
                  No decisions logged yet. Tag canvas items as 'Decision' or click 'Auto-Extract'.
                </td>
              </tr>
            ) : (
              [...decisions, ...canvasDecisions.filter(cd => !decisions.some(d => d.linkedElementIds?.includes(cd.id))).map(cd => ({
                decisionId: cd.id,
                title: cd.content || 'Untitled Decision',
                rationale: 'Marked on visual canvas board',
                alternatives: [],
                status: 'Accepted' as const,
                linkedElementIds: [cd.id],
              }))].map((d, i) => (
                <tr key={d.decisionId || i} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-3.5 px-4 font-medium text-[var(--text-primary)] max-w-xs">
                    {d.title}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--text-secondary)] max-w-sm">
                    {d.rationale || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--text-tertiary)]">
                    {d.alternatives && d.alternatives.length > 0
                      ? d.alternatives.join(', ')
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(d.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {d.linkedElementIds && d.linkedElementIds.length > 0 ? (
                      <button
                        onClick={() => focusElement(d.linkedElementIds[0])}
                        className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-zinc-300 hover:text-white transition-colors"
                        title="Jump to canvas node"
                      >
                        <Target className="w-3 h-3" />
                        <span>#{d.linkedElementIds[0].slice(0, 6)}</span>
                      </button>
                    ) : (
                      <span className="text-[var(--text-faint)]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
