import React, { useEffect, useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { api } from '../../services/api';
import {
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  ListTodo,
  AlertTriangle,
  FileText,
  Bookmark,
  ArrowRight,
  Target,
} from 'lucide-react';

export const ContextGraphView: React.FC = () => {
  const { workspaceId, elements, focusElement } = useCanvasStore();
  const [, setGraphData] = useState<any>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await api.getContextGraph(workspaceId);
        if (res.graph) {
          setGraphData(res.graph);
        }
      } catch {
        // fallback
      }
    };
    fetchGraph();
  }, [workspaceId, elements]);

  const nonArrows = elements.filter((e) => e.type !== 'arrow');
  const arrows = elements.filter((e) => e.type === 'arrow');

  const categories = [
    { key: 'decision', label: 'Decisions', icon: <CheckCircle2 className="w-3.5 h-3.5 text-zinc-100" /> },
    { key: 'idea', label: 'Ideas & Concepts', icon: <Lightbulb className="w-3.5 h-3.5 text-zinc-300" /> },
    { key: 'requirement', label: 'Requirements', icon: <FileText className="w-3.5 h-3.5 text-zinc-300" /> },
    { key: 'question', label: 'Questions & Inquiries', icon: <HelpCircle className="w-3.5 h-3.5 text-zinc-300" /> },
    { key: 'task', label: 'Tasks & Actions', icon: <ListTodo className="w-3.5 h-3.5 text-zinc-300" /> },
    { key: 'risk', label: 'Risks & Unknowns', icon: <AlertTriangle className="w-3.5 h-3.5 text-zinc-300" /> },
    { key: 'assumption', label: 'Assumptions', icon: <Bookmark className="w-3.5 h-3.5 text-zinc-300" /> },
  ];

  return (
    <div className="w-full h-full bg-[var(--bg-canvas)] overflow-y-auto p-8 max-w-6xl mx-auto space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Semantic Context Model
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Structured relational graph extracted from spatial canvas topology and connectors.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] font-mono">
          <span>Total Nodes: {nonArrows.length}</span>
          <span>•</span>
          <span>Relationships: {arrows.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const items = nonArrows.filter(
            (e) => (e.semanticType === cat.key) || (cat.key === 'idea' && e.semanticType === 'none')
          );

          return (
            <div
              key={cat.key}
              className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                    {cat.icon}
                    <span>{cat.label}</span>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-tertiary)]">
                    {items.length}
                  </span>
                </div>

                <div className="pt-2 space-y-2 max-h-60 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="text-[11px] text-[var(--text-tertiary)] italic py-2">
                      No nodes classified under this category.
                    </div>
                  ) : (
                    items.map((it) => (
                      <div
                        key={it.id}
                        onClick={() => focusElement(it.id)}
                        className="p-2.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border-subtle)] cursor-pointer transition-colors space-y-1"
                      >
                        <div className="text-xs text-[var(--text-primary)] font-medium line-clamp-2">
                          {it.content || 'Untitled Canvas Element'}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                          <span className="font-mono">#{it.id.slice(0, 6)}</span>
                          <span className="flex items-center gap-0.5 text-zinc-300">
                            <Target className="w-2.5 h-2.5" /> View on Canvas
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-3">
        <div className="text-xs font-semibold text-[var(--text-primary)]">
          Relational Connector Map
        </div>
        {arrows.length === 0 ? (
          <div className="text-xs text-[var(--text-tertiary)] py-4">
            No directional relationships drawn yet. Use the Connector tool (A) on the canvas to link ideas with relationship semantics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {arrows.map((arr) => {
              const src = nonArrows.find((e) => e.id === arr.sourceElementId);
              const tgt = nonArrows.find((e) => e.id === arr.targetElementId);

              return (
                <div
                  key={arr.id}
                  onClick={() => focusElement(arr.id)}
                  className="p-2.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors"
                >
                  <span className="truncate max-w-[140px] text-[var(--text-primary)]">
                    {src?.content || 'Source Node'}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--text-tertiary)] bg-[var(--surface-1)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                    <span>{arr.relationshipType || 'RELATED_TO'}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-400" />
                  </div>
                  <span className="truncate max-w-[140px] text-[var(--text-primary)] text-right">
                    {tgt?.content || 'Target Node'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
