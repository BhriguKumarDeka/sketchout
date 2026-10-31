import React, { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { parseMermaidCode } from '../../utils/mermaidParser';
import { syncConnectedArrows } from '../../store/arrowSync';
import { X, Code2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

interface MermaidImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_TEMPLATES = [
  {
    name: 'Microservice Flow',
    code: `flowchart LR
subgraph Auth Domain
    client[Client App] --> login(Login Endpoint)
    login --> jwt([Generate Token])
end

subgraph Core Services
    gateway[API Gateway] --> orders[Order Service]
    orders --> db[(PostgreSQL)]
end

jwt --> gateway`,
  },
  {
    name: 'Decision Flow',
    code: `flowchart TD
start[Incoming Order] --> check{Inventory Available?}
check -->|Yes| pay[Authorize Payment]
check -->|No| backorder[Create Backorder]
pay --> ship[Ship Package]
backorder --> notify[Notify Customer]`,
  },
];

export const MermaidImportModal: React.FC<MermaidImportModalProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState(SAMPLE_TEMPLATES[0].code);
  const [error, setError] = useState<string | null>(null);

  const { elements, setElements, setSelectedIds, showToast, zoomToFit } = useCanvasStore();

  if (!isOpen) return null;

  const handleImport = () => {
    setError(null);
    const result = parseMermaidCode(code);

    if (!result.success || result.elements.length === 0) {
      setError(result.error || 'Failed to parse Mermaid code. Please check syntax.');
      return;
    }

    // Offset imported elements so they don't overlap existing canvas
    let offsetX = 50;
    let offsetY = 50;

    if (elements.length > 0) {
      let maxX = -Infinity;
      let minY = Infinity;
      elements.forEach((el) => {
        const right = el.x + (el.width || 120);
        if (right > maxX) maxX = right;
        if (el.y < minY) minY = el.y;
      });
      offsetX = isFinite(maxX) ? maxX + 100 : 100;
      offsetY = isFinite(minY) ? minY : 50;
    }

    const shiftedElements = result.elements.map((el) => {
      const isArrow = el.type === 'arrow';
      let pts = el.points;
      if (isArrow && el.points && el.points.length >= 2) {
        pts = el.points.map((p) => ({ x: p.x + offsetX, y: p.y + offsetY }));
      }

      return {
        ...el,
        x: el.x + offsetX,
        y: el.y + offsetY,
        points: pts,
      };
    });

    const synchronized = syncConnectedArrows([...elements, ...shiftedElements]);
    setElements(synchronized);
    setSelectedIds(shiftedElements.map((e) => e.id));
    showToast(`Imported ${shiftedElements.length} elements from Mermaid`, 'success');
    onClose();
    setTimeout(() => {
      zoomToFit();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Import Mermaid Diagram
              </h2>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Paste flowchart or graph code to generate canvas elements and sections automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Quick templates */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-400" /> Templates:
            </span>
            {SAMPLE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => {
                  setCode(tmpl.code);
                  setError(null);
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
              >
                {tmpl.name}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              rows={11}
              className="w-full p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none leading-relaxed"
              placeholder="flowchart LR&#10;  A[Start] --> B[(Database)]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--surface-2)]/40 border-t border-[var(--border-subtle)]">
          <span className="text-[11px] text-[var(--text-tertiary)]">
            Supports flowchart TD/LR, subgraphs, cylinder, diamond, and pill shapes
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-white flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Import to Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
