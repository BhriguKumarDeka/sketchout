import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { SemanticType } from '../../types/canvas';
import { PALETTE_STROKE_COLORS, PALETTE_FILL_COLORS } from '../../utils/themeColors';
import {
  Tag,
  Share2,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  X,
  BringToFront,
  SendToBack,
  Zap,
  Loader2,
} from 'lucide-react';

export const ElementPropertiesBar: React.FC = () => {
  const {
    selectedIds,
    elements,
    theme,
    updateSelectedElements,
    deleteSelectedElements,
    duplicateSelected,
    bringToFront,
    sendToBack,
    setActiveStyle,
    completeFlowAction,
    isCompletingFlow,
  } = useCanvasStore();

  const isLight = theme === 'light';

  if (selectedIds.length === 0) return null;

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const primarySelected = selectedElements[0];
  if (!primarySelected) return null;

  const isArrowSelected = primarySelected.type === 'arrow';
  const isDrawSelected = primarySelected.type === 'draw';

  const semanticTypes: { type: SemanticType; label: string }[] = [
    { type: 'none', label: 'Plain' },
    { type: 'idea', label: 'Idea' },
    { type: 'question', label: 'Question' },
    { type: 'decision', label: 'Decision' },
    { type: 'requirement', label: 'Requirement' },
    { type: 'task', label: 'Task' },
    { type: 'risk', label: 'Risk' },
    { type: 'assumption', label: 'Assumption' },
  ];

  // Font sizes: Small (13px), Medium (16px), Large (22px)
  const fontSizes = [
    { label: 'S', size: 13, title: 'Small (13px)' },
    { label: 'M', size: 16, title: 'Medium (16px)' },
    { label: 'L', size: 22, title: 'Large (22px)' },
  ];

  const strokeWidths = [
    { value: 1.5, label: 'Thin' },
    { value: 2.5, label: 'Regular' },
    { value: 4.5, label: 'Bold' },
  ];

  const currentFontSize = primarySelected.style.fontSize || 16;
  const currentArrowLabel = primarySelected.content || (primarySelected.relationshipType && primarySelected.relationshipType !== 'NONE' ? primarySelected.relationshipType : '');

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl z-30 select-none max-w-[95vw] overflow-x-auto">
      {/* 0. AI Complete Flow Action (<150 tokens) */}
      {!isArrowSelected && !isDrawSelected && (
        <>
          <button
            onClick={() => completeFlowAction(primarySelected.id)}
            disabled={isCompletingFlow}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--surface-1)] hover:opacity-90 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 shrink-0"
            title="AI predicts and generates the next 2 downstream steps (<150 tokens)"
          >
            {isCompletingFlow ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            )}
            <span>{isCompletingFlow ? 'Completing...' : 'Complete Flow'}</span>
          </button>
          <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />
        </>
      )}

      {/* 1. Arrow Label Customization (Nameless or Custom Name) */}
      {isArrowSelected && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--surface-2)]">
          <Share2 className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
          <input
            type="text"
            value={currentArrowLabel}
            onChange={(e) => {
              const val = e.target.value;
              updateSelectedElements({
                content: val,
                relationshipType: val ? val : undefined,
              });
            }}
            placeholder="Arrow label (empty for none)"
            className="bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none w-32 font-sans"
          />
          {currentArrowLabel && (
            <button
              onClick={() => {
                updateSelectedElements({ content: '', relationshipType: undefined });
              }}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors"
              title="Clear label (make nameless)"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* 2. Semantic Classification Dropdown */}
      {!isArrowSelected && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--surface-2)]">
          <Tag className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          <select
            value={primarySelected.semanticType || 'none'}
            onChange={(e) => updateSelectedElements({ semanticType: e.target.value as SemanticType })}
            className="bg-transparent text-xs text-[var(--text-primary)] outline-none cursor-pointer"
          >
            {semanticTypes.map((st) => (
              <option key={st.type} value={st.type} className="bg-[var(--surface-1)] text-[var(--text-primary)]">
                {st.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />

      {/* 3. Three Font Sizes (S, M, L) for Text & Boxes */}
      {!isArrowSelected && !isDrawSelected && (
        <>
          <div className="flex items-center gap-1">
            <Type className="w-3 h-3 text-[var(--text-tertiary)] ml-0.5" />
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--surface-2)]">
              {fontSizes.map((f) => {
                const isActive = Math.abs(currentFontSize - f.size) <= 2;
                return (
                  <button
                    key={f.label}
                    onClick={() => {
                      updateSelectedElements({
                        style: { ...primarySelected.style, fontSize: f.size },
                      });
                      setActiveStyle({ fontSize: f.size });
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      isActive
                        ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                    title={f.title}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />
        </>
      )}

      {/* 4. Stroke Color Swatches (Theme-Adapted) */}
      <div className="flex items-center gap-1 px-1">
        <span className="text-[10px] text-[var(--text-tertiary)] mr-0.5">Stroke:</span>
        {PALETTE_STROKE_COLORS.map((c) => {
          const displayColor =
            theme === 'cutting-mat'
              ? c.cuttingMat || c.dark
              : isLight
              ? c.light
              : c.dark;
          const isSelectedColor =
            primarySelected.style.strokeColor?.toLowerCase() === displayColor.toLowerCase() ||
            primarySelected.style.strokeColor?.toLowerCase() === c.dark.toLowerCase() ||
            primarySelected.style.strokeColor?.toLowerCase() === c.light.toLowerCase() ||
            (c.cuttingMat && primarySelected.style.strokeColor?.toLowerCase() === c.cuttingMat.toLowerCase());

          return (
            <button
              key={c.dark}
              onClick={() => {
                updateSelectedElements({
                  style: { ...primarySelected.style, strokeColor: displayColor },
                });
                setActiveStyle({ strokeColor: displayColor });
              }}
              className={`w-4 h-4 rounded-full border transition-transform hover:scale-110 ${
                isSelectedColor
                  ? theme === 'cutting-mat'
                    ? 'ring-2 ring-yellow-400 scale-110 border-yellow-400'
                    : isLight
                    ? 'ring-2 ring-zinc-900 scale-110 border-zinc-900'
                    : 'ring-1 ring-white/80 scale-110 border-white'
                  : isLight
                  ? 'border-zinc-300'
                  : 'border-white/20'
              }`}
              style={{ backgroundColor: displayColor }}
              title={c.label}
            />
          );
        })}
      </div>

      {/* 5. Fill Color Swatches for Shapes */}
      {!isArrowSelected && !isDrawSelected && (
        <>
          <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-1 px-1">
            <span className="text-[10px] text-[var(--text-tertiary)] mr-0.5">Fill:</span>
            {PALETTE_FILL_COLORS.map((c) => {
              const displayColor =
                theme === 'cutting-mat'
                  ? c.cuttingMat || c.dark
                  : isLight
                  ? c.light
                  : c.dark;
              const isSelectedColor =
                primarySelected.style.fillColor?.toLowerCase() === displayColor.toLowerCase() ||
                primarySelected.style.fillColor?.toLowerCase() === c.dark.toLowerCase() ||
                primarySelected.style.fillColor?.toLowerCase() === c.light.toLowerCase() ||
                (c.cuttingMat && primarySelected.style.fillColor?.toLowerCase() === c.cuttingMat.toLowerCase());

              return (
                <button
                  key={c.dark}
                  onClick={() => {
                    updateSelectedElements({
                      style: { ...primarySelected.style, fillColor: displayColor },
                    });
                    setActiveStyle({ fillColor: displayColor });
                  }}
                  className={`w-4 h-4 rounded-md border transition-transform hover:scale-110 ${
                    isSelectedColor
                      ? theme === 'cutting-mat'
                        ? 'ring-2 ring-yellow-400 scale-110 border-yellow-400'
                        : isLight
                        ? 'ring-2 ring-zinc-900 scale-110 border-zinc-900'
                        : 'ring-1 ring-white/80 scale-110 border-white'
                      : isLight
                      ? 'border-zinc-300'
                      : 'border-white/20'
                  }`}
                  style={{
                    backgroundColor:
                      displayColor === 'transparent'
                        ? theme === 'cutting-mat'
                          ? '#143526'
                          : isLight
                          ? '#f4f4f5'
                          : '#18181b'
                        : displayColor,
                  }}
                  title={c.label}
                >
                  {displayColor === 'transparent' && (
                    <span className="block w-full h-[1px] bg-red-400 rotate-45" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />

      {/* 6. Stroke Width Selector */}
      <div className="flex items-center gap-0.5">
        {strokeWidths.map((sw) => {
          const isSelectedWidth = (primarySelected.style.strokeWidth || 2) === sw.value;
          return (
            <button
              key={sw.value}
              onClick={() => {
                updateSelectedElements({
                  style: { ...primarySelected.style, strokeWidth: sw.value },
                });
                setActiveStyle({ strokeWidth: sw.value });
              }}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                isSelectedWidth
                  ? 'bg-[var(--surface-3)] text-[var(--text-primary)] font-semibold shadow-2xs'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {sw.label}
            </button>
          );
        })}
      </div>

      <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />

      {/* 7. Text Alignment */}
      {!isArrowSelected && !isDrawSelected && (
        <>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() =>
                updateSelectedElements({
                  style: { ...primarySelected.style, textAlign: 'left' },
                })
              }
              className={`p-1.5 rounded transition-colors ${
                primarySelected.style.textAlign === 'left'
                  ? 'bg-[var(--surface-3)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                updateSelectedElements({
                  style: { ...primarySelected.style, textAlign: 'center' },
                })
              }
              className={`p-1.5 rounded transition-colors ${
                primarySelected.style.textAlign === 'center'
                  ? 'bg-[var(--surface-3)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                updateSelectedElements({
                  style: { ...primarySelected.style, textAlign: 'right' },
                })
              }
              className={`p-1.5 rounded transition-colors ${
                primarySelected.style.textAlign === 'right'
                  ? 'bg-[var(--surface-3)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />
        </>
      )}

      {/* 8. Layer Ordering */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={bringToFront}
          className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Bring to Front (])"
        >
          <BringToFront className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={sendToBack}
          className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Send to Back ([)"
        >
          <SendToBack className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />

      {/* 9. Duplicate */}
      <button
        onClick={duplicateSelected}
        className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        title="Duplicate (Ctrl+D)"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* 10. Delete */}
      <button
        onClick={deleteSelectedElements}
        className="p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
        title="Delete (Del)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
