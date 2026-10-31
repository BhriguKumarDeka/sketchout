import React, { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { ToolType } from '../../types/canvas';
import { PALETTE_STROKE_COLORS } from '../../utils/themeColors';
import {
  MousePointer,
  Hand,
  StickyNote,
  Square,
  Circle,
  Diamond,
  Database,
  ArrowUpRight,
  Type,
  Eraser,
  Frame,
  Undo2,
  Redo2,
  Trash2,
  Palette,
  RotateCcw,
} from 'lucide-react';

interface ToolButton {
  tool: ToolType;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

export const Toolbar: React.FC = () => {
  const {
    activeTool,
    activeStyle,
    theme,
    setActiveTool,
    setActiveStyle,
    undo,
    redo,
    undoStack,
    redoStack,
    selectedIds,
    deleteSelectedElements,
    clearCanvas,
    elements,
  } = useCanvasStore();

  const isLight = theme === 'light';
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools: ToolButton[] = [
    { tool: 'select', label: 'Select', icon: <MousePointer className="w-4 h-4" />, shortcut: 'V' },
    { tool: 'pan', label: 'Hand', icon: <Hand className="w-4 h-4" />, shortcut: 'H' },
    {
      tool: 'draw',
      label: 'Pen / Draw',
      icon: <img src="/assets/pencil_cursor.png" alt="Pen" className="w-3.5 h-3.5 object-contain" />,
      shortcut: 'P',
    },
    { tool: 'sticky', label: 'Sticky Note', icon: <StickyNote className="w-4 h-4" />, shortcut: 'S' },
    { tool: 'rectangle', label: 'Rectangle', icon: <Square className="w-4 h-4" />, shortcut: 'R' },
    { tool: 'ellipse', label: 'Ellipse', icon: <Circle className="w-4 h-4" />, shortcut: 'O' },
    { tool: 'diamond', label: 'Diamond', icon: <Diamond className="w-4 h-4" />, shortcut: 'D' },
    { tool: 'cylinder', label: 'Database', icon: <Database className="w-4 h-4" />, shortcut: 'C' },
    { tool: 'frame', label: 'Section / Frame', icon: <Frame className="w-4 h-4" />, shortcut: 'F' },
    { tool: 'arrow', label: 'Connector', icon: <ArrowUpRight className="w-4 h-4" />, shortcut: 'A' },
    { tool: 'text', label: 'Text', icon: <Type className="w-4 h-4" />, shortcut: 'T' },
    { tool: 'eraser', label: 'Eraser', icon: <Eraser className="w-4 h-4" />, shortcut: 'E' },
  ];

  const strokeWidths = [
    { value: 1.5, label: 'Thin' },
    { value: 2.5, label: 'Regular' },
    { value: 4.5, label: 'Bold' },
  ];

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl z-30 select-none">
      {/* Tool Buttons */}
      {tools.map((t) => {
        const isActive = activeTool === t.tool;
        return (
          <button
            key={t.tool}
            onClick={() => setActiveTool(t.tool)}
            className={`relative p-2 rounded-lg transition-colors flex items-center justify-center ${
              isActive
                ? 'bg-zinc-100 text-zinc-950 font-medium shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title={`${t.label} (${t.shortcut})`}
          >
            {t.icon}
          </button>
        );
      })}

      <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1" />

      {/* Quick Color / Stroke Picker Toggle */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors border ${
            showColorPicker
              ? 'bg-[var(--surface-2)] text-[var(--text-primary)] border-[var(--border-focus)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border-transparent'
          }`}
          title="Stroke & Pen Color Swapper"
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
            style={{ backgroundColor: activeStyle.strokeColor || (isLight ? '#18181b' : '#f4f4f5') }}
          />
          <Palette className="w-3.5 h-3.5" />
        </button>

        {/* Dropdown Floating Color Swapper */}
        {showColorPicker && (
          <div className="absolute top-11 left-0 p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl z-50 w-52 space-y-3">
            <div>
              <div className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1.5">
                Active Stroke Color
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {PALETTE_STROKE_COLORS.map((c) => {
                  const displayColor = isLight ? c.light : c.dark;
                  const isSelectedColor =
                    activeStyle.strokeColor?.toLowerCase() === c.dark.toLowerCase() ||
                    activeStyle.strokeColor?.toLowerCase() === c.light.toLowerCase();

                  return (
                    <button
                      key={c.dark}
                      onClick={() => {
                        setActiveStyle({ strokeColor: displayColor });
                      }}
                      className={`w-7 h-7 rounded-md border flex items-center justify-center transition-transform hover:scale-105 ${
                        isSelectedColor
                          ? 'border-white ring-1 ring-white/60'
                          : 'border-[var(--border-subtle)]'
                      }`}
                      style={{ backgroundColor: displayColor }}
                      title={c.label}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1.5">
                Stroke Thickness
              </div>
              <div className="flex items-center gap-1.5">
                {strokeWidths.map((sw) => (
                  <button
                    key={sw.value}
                    onClick={() => setActiveStyle({ strokeWidth: sw.value })}
                    className={`flex-1 py-1 rounded text-[11px] border transition-colors ${
                      activeStyle.strokeWidth === sw.value
                        ? 'bg-[var(--surface-2)] text-[var(--text-primary)] border-white/40 font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border-transparent'
                    }`}
                  >
                    {sw.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1" />

      {/* Undo & Redo */}
      <button
        onClick={undo}
        disabled={undoStack.length === 0}
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      <button
        onClick={redo}
        disabled={redoStack.length === 0}
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      {/* Delete selected if any */}
      {selectedIds.length > 0 && (
        <>
          <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1" />
          <button
            onClick={deleteSelectedElements}
            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            title="Delete Selected (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Clear Canvas if elements exist */}
      {elements.length > 0 && (
        <>
          <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1" />
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Clear Entire Canvas"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};
