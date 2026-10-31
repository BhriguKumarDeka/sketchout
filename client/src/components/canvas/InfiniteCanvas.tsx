import React, { useRef, useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { CanvasElementView } from './CanvasElementView';
import { adaptColorForTheme } from '../../utils/themeColors';
import { useCanvasZoom } from './hooks/useCanvasZoom';
import { useCanvasKeyboard } from './hooks/useCanvasKeyboard';
import { useTextEditing } from './hooks/useTextEditing';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';

export const InfiniteCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const {
    elements,
    selectedIds,
    activeTool,
    activeStyle,
    viewport,
    theme,
    setViewport,
    highlightedElementId,
  } = useCanvasStore();

  const isLight = theme === 'light';

  // 1. Text editing hook
  const {
    editingState,
    setEditingState,
    editTextareaRef,
    handleStartTextEdit,
    handleStartNewText,
    handleFinishEditing,
  } = useTextEditing();

  // 2. Mouse & Pointer interaction hook
  const {
    isPanning,
    marqueeBox,
    shapeDraft,
    arrowDraft,
    currentDrawPoints,
    hoveredAnchorElementId,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleStartResize,
    handleStartArrowEndpointDrag,
  } = useCanvasInteraction({
    containerRef,
    onStartTextEdit: handleStartTextEdit,
    onStartNewText: handleStartNewText,
    onFinishEditing: handleFinishEditing,
    isSpacePressed,
  });

  // 3. Zoom hook
  useCanvasZoom({ containerRef, setViewport });

  // 4. Keyboard shortcuts hook
  useCanvasKeyboard({
    isEditingText: !!editingState,
    onFinishEditing: handleFinishEditing,
    isSpacePressed,
    setIsSpacePressed,
  });

  // Global mouseup listener so dragging or panning releases cleanly even outside container bounds
  useEffect(() => {
    const onWindowMouseUp = (e: MouseEvent) => {
      handleMouseUp(e as unknown as React.MouseEvent);
    };
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => window.removeEventListener('mouseup', onWindowMouseUp);
  }, [handleMouseUp]);

  // Keep section frames at the visual back layer so nodes and connectors sit naturally on top
  const sortedElements = [...elements].sort((a, b) => {
    if (a.type === 'frame' && b.type !== 'frame') return -1;
    if (b.type === 'frame' && a.type !== 'frame') return 1;
    return (a.zIndex || 0) - (b.zIndex || 0);
  });

  const getCursorClass = () => {
    if (isPanning || isSpacePressed || activeTool === 'pan') return 'cursor-grab active:cursor-grabbing';
    if (activeTool === 'draw') return 'cursor-crosshair';
    if (activeTool === 'arrow') return 'cursor-crosshair';
    if (activeTool === 'eraser') return 'cursor-not-allowed';
    if (
      activeTool === 'rectangle' ||
      activeTool === 'ellipse' ||
      activeTool === 'diamond' ||
      activeTool === 'cylinder' ||
      activeTool === 'sticky' ||
      activeTool === 'text' ||
      activeTool === 'frame'
    ) {
      return 'cursor-crosshair';
    }
    return 'cursor-default';
  };

  const effectiveDrawStroke = adaptColorForTheme(activeStyle.strokeColor || '#f4f4f5', isLight);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none touch-none ${getCursorClass()}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Background Dots Canvas Grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <pattern
            id="dot-grid"
            width={24 * viewport.zoom}
            height={24 * viewport.zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${viewport.x % (24 * viewport.zoom)}, ${viewport.y % (24 * viewport.zoom)})`}
          >
            <circle
              cx={2}
              cy={2}
              r={Math.max(1 * Math.min(viewport.zoom, 1.2), 0.75)}
              fill={isLight ? '#cbd5e1' : '#27272a'}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* Main World SVG Layer */}
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Elements list */}
          {sortedElements.map((el) => (
            <CanvasElementView
              key={el.id}
              element={el}
              isSelected={selectedIds.includes(el.id)}
              isHighlighted={highlightedElementId === el.id}
              isEditing={editingState?.id === el.id}
              onStartResize={handleStartResize}
              onStartTextEdit={handleStartTextEdit}
              onStartArrowEndpointDrag={handleStartArrowEndpointDrag}
            />
          ))}

          {/* Hovered shape anchor indicator during arrow connection */}
          {hoveredAnchorElementId && (
            (() => {
              const target = elements.find((e) => e.id === hoveredAnchorElementId);
              if (!target) return null;
              return (
                <rect
                  x={target.x - 4}
                  y={target.y - 4}
                  width={(target.width || 100) + 8}
                  height={(target.height || 60) + 8}
                  rx={target.type === 'ellipse' ? (target.height || 60) / 2 + 4 : 8}
                  fill="none"
                  stroke={isLight ? 'rgba(59, 130, 246, 0.8)' : 'rgba(96, 165, 250, 0.8)'}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  className="pointer-events-none"
                />
              );
            })()
          )}

          {/* Realtime Arrow draft preview */}
          {arrowDraft && (
            <line
              x1={arrowDraft.start.x}
              y1={arrowDraft.start.y}
              x2={arrowDraft.current.x}
              y2={arrowDraft.current.y}
              stroke={adaptColorForTheme(activeStyle.strokeColor || '#a1a1aa', isLight)}
              strokeWidth={activeStyle.strokeWidth || 2}
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}

          {/* Realtime Shape draft preview */}
          {shapeDraft && (
            <rect
              x={Math.min(shapeDraft.start.x, shapeDraft.current.x)}
              y={Math.min(shapeDraft.start.y, shapeDraft.current.y)}
              width={Math.max(Math.abs(shapeDraft.current.x - shapeDraft.start.x), 5)}
              height={Math.max(Math.abs(shapeDraft.current.y - shapeDraft.start.y), 5)}
              rx={shapeDraft.type === 'ellipse' ? 9999 : shapeDraft.type === 'sticky' ? 8 : 4}
              fill="transparent"
              stroke={isLight ? '#18181b' : '#f4f4f5'}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}

          {/* Active Freehand Draw Preview */}
          {currentDrawPoints.length > 1 && (
            <path
              d={currentDrawPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')}
              fill="none"
              stroke={effectiveDrawStroke}
              strokeWidth={activeStyle.strokeWidth || 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Multi-selection Marquee Box */}
          {marqueeBox && (
            <rect
              x={Math.min(marqueeBox.start.x, marqueeBox.current.x)}
              y={Math.min(marqueeBox.start.y, marqueeBox.current.y)}
              width={Math.abs(marqueeBox.current.x - marqueeBox.start.x)}
              height={Math.abs(marqueeBox.current.y - marqueeBox.start.y)}
              fill={isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.05)'}
              stroke={isLight ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.4)'}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}
        </g>
      </svg>

      {/* Seamless In-Shape Text Editor (Miro / FigJam style) */}
      {editingState && (
        (() => {
          const isSection = editingState.elementType === 'frame';
          const isCenter =
            editingState.textAlign === 'center' ||
            editingState.elementType === 'ellipse' ||
            editingState.elementType === 'diamond';

          // For Section frame, position the editor directly over its top header tab pill
          const left = editingState.x * viewport.zoom + viewport.x;
          const top = isSection
            ? (editingState.y - 26) * viewport.zoom + viewport.y
            : editingState.y * viewport.zoom + viewport.y;
          const width = isSection
            ? Math.max(Math.min((editingState.text.length || 7) * 9 + 40, editingState.width) * viewport.zoom, 100)
            : Math.max(editingState.width * viewport.zoom, 60);
          const height = isSection
            ? 26 * viewport.zoom
            : Math.max(editingState.height * viewport.zoom, 32);

          const fontSize = Math.max((editingState.fontSize || (isSection ? 12 : 16)) * viewport.zoom, 11);
          const textColor = adaptColorForTheme(
            editingState.strokeColor || (isLight ? '#18181b' : '#f4f4f5'),
            isLight
          );

          return (
            <div
              className="absolute z-50 pointer-events-auto"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div
                className={`w-full h-full flex ${
                  isSection
                    ? 'items-center px-2 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-md shadow-xs'
                    : editingState.elementType === 'sticky'
                    ? 'items-start p-3'
                    : isCenter
                    ? 'items-center justify-center p-2'
                    : 'items-center px-3'
                }`}
              >
                <textarea
                  ref={editTextareaRef}
                  value={editingState.text}
                  onChange={(e) =>
                    setEditingState((prev) => (prev ? { ...prev, text: e.target.value } : null))
                  }
                  onBlur={handleFinishEditing}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleFinishEditing();
                    } else if (e.key === 'Enter' && (!e.shiftKey && (isSection || editingState.elementType !== 'sticky'))) {
                      e.preventDefault();
                      handleFinishEditing();
                    }
                  }}
                  style={{
                    fontSize: `${fontSize}px`,
                    textAlign: isCenter ? 'center' : 'left',
                    color: textColor,
                    fontWeight: isSection ? 600 : 400,
                    lineHeight: 1.4,
                  }}
                  placeholder={isSection ? 'Section name...' : 'Type text...'}
                  className="w-full h-full bg-transparent border-0 outline-none ring-0 shadow-none resize-none font-sans p-0 m-0 overflow-hidden leading-relaxed placeholder:text-zinc-500/50"
                  autoFocus
                />
              </div>
            </div>
          );
        })()
      )}

      {/* Floating Canvas Meta HUD: Zoom percentage */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] shadow-sm select-none z-10">
        <span>{Math.round(viewport.zoom * 100)}%</span>
        <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
        <span>{elements.length} items</span>
      </div>
    </div>
  );
};
