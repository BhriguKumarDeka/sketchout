import { useState, useCallback, useRef } from 'react';
import type { CanvasElement, Point, ResizeHandle } from '../../../types/canvas';
import { useCanvasStore } from '../../../store/useCanvasStore';
import {
  isPointInElement,
  isElementInBox,
} from '../geometry';
import { adaptColorForTheme } from '../../../utils/themeColors';

interface UseCanvasInteractionProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onStartTextEdit: (el: CanvasElement) => void;
  onStartNewText: (x: number, y: number) => void;
  onFinishEditing: () => void;
  isSpacePressed: boolean;
}

export function useCanvasInteraction({
  containerRef,
  onStartTextEdit,
  onStartNewText,
  onFinishEditing,
  isSpacePressed,
}: UseCanvasInteractionProps) {
  const {
    elements,
    selectedIds,
    activeTool,
    activeStyle,
    viewport,
    theme,
    setViewport,
    setSelectedIds,
    setActiveTool,
    addElement,
    updateElement,
    deleteElement,
    resizeElement,
  } = useCanvasStore();

  const isLight = theme === 'light';

  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef<Point>({ x: 0, y: 0 });

  const [isDraggingElements, setIsDraggingElements] = useState(false);
  const [dragStartMouse, setDragStartMouse] = useState<Point>({ x: 0, y: 0 });
  const [initialElementPositions, setInitialElementPositions] = useState<
    Map<string, { x: number; y: number; points?: Point[] }>
  >(new Map());

  const [resizingState, setResizingState] = useState<{
    elementId: string;
    handle: ResizeHandle;
    startMouse: Point;
    initBounds: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const [marqueeBox, setMarqueeBox] = useState<{ start: Point; current: Point } | null>(null);

  // Shape and connector drafting
  const [shapeDraft, setShapeDraft] = useState<{ type: string; start: Point; current: Point } | null>(null);
  const [arrowDraft, setArrowDraft] = useState<{ start: Point; current: Point; sourceId?: string } | null>(null);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<Point[]>([]);
  const [isErasing, setIsErasing] = useState(false);

  // Arrow endpoint dragging (re-routing)
  const [draggingArrowEndpoint, setDraggingArrowEndpoint] = useState<{
    arrowId: string;
    endpointIndex: 0 | 1;
  } | null>(null);
  const [hoveredAnchorElementId, setHoveredAnchorElementId] = useState<string | null>(null);

  // Screen to world coordinates conversion
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      if (!containerRef.current) return { x: screenX, y: screenY };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (screenX - rect.left - viewport.x) / viewport.zoom;
      const y = (screenY - rect.top - viewport.y) / viewport.zoom;
      return { x, y };
    },
    [containerRef, viewport]
  );

  // Hit test helper: Tests non-frame elements top to bottom first, then tests frames.
  // This guarantees elements enclosed in a Figma-style Section remain selectable and editable!
  const findElementAt = useCallback(
    (worldX: number, worldY: number): CanvasElement | undefined => {
      // Pass 1: Test non-frame elements first
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.type === 'frame') continue;
        if (isPointInElement({ x: worldX, y: worldY }, el, viewport.zoom)) {
          return el;
        }
      }
      // Pass 2: Test frame container sections
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.type === 'frame') {
          if (isPointInElement({ x: worldX, y: worldY }, el, viewport.zoom)) {
            return el;
          }
        }
      }
      return undefined;
    },
    [elements, viewport.zoom]
  );

  // Connectable shape finder for arrows with generous tolerance (50px snap radius)
  const findConnectableElementAt = useCallback(
    (worldPt: Point, snapRadius: number = 50): CanvasElement | undefined => {
      // 1. Exact hit test first
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.type === 'arrow' || el.type === 'draw') continue;
        if (isPointInElement(worldPt, el, viewport.zoom)) {
          return el;
        }
      }

      // 2. Proximity check for nearby shape perimeters
      let closest: CanvasElement | undefined = undefined;
      let minDistance = snapRadius;

      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.type === 'arrow' || el.type === 'draw') continue;

        const clampedX = Math.max(el.x, Math.min(worldPt.x, el.x + (el.width || 100)));
        const clampedY = Math.max(el.y, Math.min(worldPt.y, el.y + (el.height || 60)));
        const dist = Math.hypot(worldPt.x - clampedX, worldPt.y - clampedY);

        if (dist < minDistance) {
          minDistance = dist;
          closest = el;
        }
      }

      return closest;
    },
    [elements, viewport.zoom]
  );

  const handleStartArrowEndpointDrag = (e: React.MouseEvent, arrow: CanvasElement, endpointIndex: 0 | 1) => {
    e.stopPropagation();
    setSelectedIds([arrow.id]);
    setDraggingArrowEndpoint({ arrowId: arrow.id, endpointIndex });
  };

  const handleStartResize = (e: React.MouseEvent, handle: ResizeHandle, el: CanvasElement) => {
    e.stopPropagation();
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const bounds = el;
    setResizingState({
      elementId: el.id,
      handle,
      startMouse: worldPos,
      initBounds: { x: el.x, y: el.y, width: bounds.width, height: bounds.height },
    });
  };

  // MOUSE DOWN
  const handleMouseDown = (e: React.MouseEvent) => {
    onFinishEditing();
    const worldPos = screenToWorld(e.clientX, e.clientY);

    // 1. Pan Mode
    if (e.button === 1 || isSpacePressed || activeTool === 'pan') {
      e.preventDefault();
      isPanningRef.current = true;
      setIsPanning(true);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button !== 0) return;

    // 2. Eraser Tool
    if (activeTool === 'eraser') {
      setIsErasing(true);
      const hit = findElementAt(worldPos.x, worldPos.y);
      if (hit) deleteElement(hit.id);
      return;
    }

    // 3. Freehand Draw (Pen) Tool
    if (activeTool === 'draw') {
      setCurrentDrawPoints([worldPos]);
      return;
    }

    // 4. Arrow Connector Tool
    if (activeTool === 'arrow') {
      const sourceEl = findConnectableElementAt(worldPos, 50);
      setArrowDraft({
        start: worldPos,
        current: worldPos,
        sourceId: sourceEl?.id,
      });
      return;
    }

    // 5. Text Tool
    if (activeTool === 'text') {
      const hit = findElementAt(worldPos.x, worldPos.y);
      if (hit && hit.type !== 'arrow' && hit.type !== 'draw') {
        onStartTextEdit(hit);
        return;
      }
      onStartNewText(worldPos.x, worldPos.y);
      setActiveTool('select');
      return;
    }

    // 6. Shape Creation Tools
    if (
      activeTool === 'rectangle' ||
      activeTool === 'ellipse' ||
      activeTool === 'diamond' ||
      activeTool === 'cylinder' ||
      activeTool === 'sticky' ||
      activeTool === 'frame'
    ) {
      setShapeDraft({
        type: activeTool,
        start: worldPos,
        current: worldPos,
      });
      return;
    }

    // 7. Select Tool
    if (activeTool === 'select') {
      const hit = findElementAt(worldPos.x, worldPos.y);

      if (hit) {
        let newSelection = [hit.id];
        if (e.shiftKey) {
          if (selectedIds.includes(hit.id)) {
            newSelection = selectedIds.filter((id) => id !== hit.id);
          } else {
            newSelection = [...selectedIds, hit.id];
          }
        } else if (selectedIds.includes(hit.id)) {
          newSelection = selectedIds;
        }

        // Expand dragging set: if any selected element is a frame/section, drag all child elements inside it
        const dragSet = new Set<string>(newSelection);
        newSelection.forEach((selId) => {
          const selEl = elements.find((el) => el.id === selId);
          if (selEl && selEl.type === 'frame') {
            const frameBounds = {
              minX: selEl.x,
              minY: selEl.y,
              maxX: selEl.x + (selEl.width || 380),
              maxY: selEl.y + (selEl.height || 280),
            };
            elements.forEach((child) => {
              if (child.id !== selEl.id && child.type !== 'frame') {
                const cx = child.x + (child.width || 100) / 2;
                const cy = child.y + (child.height || 60) / 2;
                if (
                  cx >= frameBounds.minX &&
                  cx <= frameBounds.maxX &&
                  cy >= frameBounds.minY &&
                  cy <= frameBounds.maxY
                ) {
                  dragSet.add(child.id);
                }
              }
            });
          }
        });

        setSelectedIds(newSelection);
        setIsDraggingElements(true);
        setDragStartMouse(worldPos);

        const posMap = new Map();
        elements.forEach((el) => {
          if (dragSet.has(el.id)) {
            posMap.set(el.id, {
              x: el.x,
              y: el.y,
              points: el.points ? el.points.map((p) => ({ ...p })) : undefined,
            });
          }
        });
        setInitialElementPositions(posMap);
      } else {
        if (!e.shiftKey) {
          setSelectedIds([]);
        }
        setMarqueeBox({ start: worldPos, current: worldPos });
      }
    }
  };

  // MOUSE MOVE
  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    // 1. Panning
    if (isPanningRef.current || isPanning) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setViewport((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      return;
    }

    // 2. Eraser dragging
    if (isErasing) {
      const hit = findElementAt(worldPos.x, worldPos.y);
      if (hit) deleteElement(hit.id);
      return;
    }

    // 3. Arrow endpoint re-routing
    if (draggingArrowEndpoint) {
      const { arrowId, endpointIndex } = draggingArrowEndpoint;
      const arrow = elements.find((el) => el.id === arrowId);
      if (arrow) {
        const pts: Point[] =
          arrow.points && arrow.points.length >= 2
            ? [...arrow.points]
            : [
                { x: arrow.x, y: arrow.y },
                { x: arrow.x + arrow.width, y: arrow.y + arrow.height },
              ];

        pts[endpointIndex] = worldPos;
        const hovered = findConnectableElementAt(worldPos, 50);
        setHoveredAnchorElementId(hovered && hovered.id !== arrowId ? hovered.id : null);

        updateElement(
          arrowId,
          {
            points: pts,
            x: Math.min(...pts.map((p) => p.x)),
            y: Math.min(...pts.map((p) => p.y)),
            width: Math.abs(pts[1].x - pts[0].x),
            height: Math.abs(pts[1].y - pts[0].y),
          },
          false
        );
      }
      return;
    }

    // 4. Element Resizing
    if (resizingState) {
      const { elementId, handle, startMouse, initBounds } = resizingState;
      const dx = worldPos.x - startMouse.x;
      const dy = worldPos.y - startMouse.y;

      let newX = initBounds.x;
      let newY = initBounds.y;
      let newW = initBounds.width;
      let newH = initBounds.height;
      const minSize = 20;

      if (handle.includes('e')) newW = Math.max(initBounds.width + dx, minSize);
      if (handle.includes('s')) newH = Math.max(initBounds.height + dy, minSize);
      if (handle.includes('w')) {
        const wCandidate = initBounds.width - dx;
        if (wCandidate > minSize) {
          newX = initBounds.x + dx;
          newW = wCandidate;
        }
      }
      if (handle.includes('n')) {
        const hCandidate = initBounds.height - dy;
        if (hCandidate > minSize) {
          newY = initBounds.y + dy;
          newH = hCandidate;
        }
      }

      resizeElement(elementId, { x: newX, y: newY, width: newW, height: newH });
      return;
    }

    // 5. Dragging Elements
    if (isDraggingElements) {
      const dx = worldPos.x - dragStartMouse.x;
      const dy = worldPos.y - dragStartMouse.y;

      initialElementPositions.forEach((initialPos, id) => {
        const updates: Partial<CanvasElement> = {
          x: initialPos.x + dx,
          y: initialPos.y + dy,
        };
        if (initialPos.points) {
          updates.points = initialPos.points.map((p) => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
        }
        updateElement(id, updates, false);
      });
      return;
    }

    // 6. Freehand Draw
    if (activeTool === 'draw' && currentDrawPoints.length > 0) {
      setCurrentDrawPoints((prev) => [...prev, worldPos]);
      return;
    }

    // 7. Arrow Draft
    if (arrowDraft) {
      setArrowDraft((prev) => (prev ? { ...prev, current: worldPos } : null));
      const targetEl = findConnectableElementAt(worldPos, 50);
      setHoveredAnchorElementId(targetEl && targetEl.id !== arrowDraft.sourceId ? targetEl.id : null);
      return;
    }

    // 8. Shape Draft
    if (shapeDraft) {
      setShapeDraft((prev) => (prev ? { ...prev, current: worldPos } : null));
      return;
    }

    // 9. Marquee Selection
    if (marqueeBox) {
      setMarqueeBox((prev) => (prev ? { ...prev, current: worldPos } : null));
      const box = {
        minX: Math.min(marqueeBox.start.x, worldPos.x),
        minY: Math.min(marqueeBox.start.y, worldPos.y),
        maxX: Math.max(marqueeBox.start.x, worldPos.x),
        maxY: Math.max(marqueeBox.start.y, worldPos.y),
      };
      const enclosedIds = elements.filter((el) => isElementInBox(el, box)).map((el) => el.id);
      setSelectedIds(enclosedIds);
    }
  };

  // MOUSE UP
  const handleMouseUp = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    if (isPanningRef.current || isPanning) {
      isPanningRef.current = false;
      setIsPanning(false);
    }
    if (isErasing) setIsErasing(false);

    if (draggingArrowEndpoint) {
      const { arrowId, endpointIndex } = draggingArrowEndpoint;
      const arrow = elements.find((el) => el.id === arrowId);
      if (arrow) {
        const hit = findConnectableElementAt(worldPos, 50);
        const updates: Partial<CanvasElement> = {};
        if (endpointIndex === 0) {
          updates.sourceElementId = hit && hit.id !== arrowId ? hit.id : undefined;
        } else {
          updates.targetElementId = hit && hit.id !== arrowId ? hit.id : undefined;
        }
        updateElement(arrowId, updates, true);
      }
      setDraggingArrowEndpoint(null);
      setHoveredAnchorElementId(null);
    }

    if (resizingState) setResizingState(null);

    if (isDraggingElements) {
      setIsDraggingElements(false);
      initialElementPositions.forEach((_, id) => {
        const el = elements.find((item) => item.id === id);
        if (el) updateElement(id, { x: el.x, y: el.y }, true);
      });
      setInitialElementPositions(new Map());
    }

    if (marqueeBox) setMarqueeBox(null);

    // Finish Freehand Pen Draw
    if (activeTool === 'draw' && currentDrawPoints.length > 1) {
      const effectiveStroke = adaptColorForTheme(activeStyle.strokeColor || '#f4f4f5', isLight);
      const minX = Math.min(...currentDrawPoints.map((p) => p.x));
      const minY = Math.min(...currentDrawPoints.map((p) => p.y));
      const maxX = Math.max(...currentDrawPoints.map((p) => p.x));
      const maxY = Math.max(...currentDrawPoints.map((p) => p.y));

      const newDraw: CanvasElement = {
        id: `draw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'draw',
        semanticType: 'none',
        confidence: 'FACT',
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 10),
        height: Math.max(maxY - minY, 10),
        content: '',
        points: currentDrawPoints,
        style: {
          ...activeStyle,
          strokeColor: effectiveStroke,
          strokeWidth: activeStyle.strokeWidth || 2,
        },
        zIndex: elements.length + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addElement(newDraw);
      setCurrentDrawPoints([]);
      setActiveTool('select');
    }

    // Finish Arrow Connector
    if (arrowDraft) {
      const targetEl = findConnectableElementAt(worldPos, 50);
      const startPt = arrowDraft.start;
      const endPt = worldPos;
      const effectiveStroke = adaptColorForTheme(activeStyle.strokeColor || '#a1a1aa', isLight);

      const newArrow: CanvasElement = {
        id: `arrow-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'arrow',
        semanticType: 'none',
        confidence: 'FACT',
        x: Math.min(startPt.x, endPt.x),
        y: Math.min(startPt.y, endPt.y),
        width: Math.abs(endPt.x - startPt.x),
        height: Math.abs(endPt.y - startPt.y),
        content: '',
        points: [startPt, endPt],
        sourceElementId: arrowDraft.sourceId,
        targetElementId: targetEl?.id,
        relationshipType: '',
        style: {
          ...activeStyle,
          strokeColor: effectiveStroke,
          strokeWidth: activeStyle.strokeWidth || 2,
        },
        zIndex: elements.length + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addElement(newArrow);
      setArrowDraft(null);
      setHoveredAnchorElementId(null);
      setActiveTool('select');
    }

    // Finish Shape Draft
    if (shapeDraft) {
      const minX = Math.min(shapeDraft.start.x, worldPos.x);
      const minY = Math.min(shapeDraft.start.y, worldPos.y);
      const rawW = Math.abs(worldPos.x - shapeDraft.start.x);
      const rawH = Math.abs(worldPos.y - shapeDraft.start.y);

      const isFrameShape = shapeDraft.type === 'frame';
      const defaultW = shapeDraft.type === 'sticky' ? 220 : isFrameShape ? 380 : 180;
      const defaultH = shapeDraft.type === 'sticky' ? 140 : isFrameShape ? 280 : 100;

      const finalW = rawW > 10 ? rawW : defaultW;
      const finalH = rawH > 10 ? rawH : defaultH;
      const finalX = rawW > 10 ? minX : Math.round(shapeDraft.start.x - defaultW / 2);
      const finalY = rawH > 10 ? minY : Math.round(shapeDraft.start.y - defaultH / 2);

      const effectiveStroke = adaptColorForTheme(
        activeStyle.strokeColor || (isLight ? '#18181b' : '#f4f4f5'),
        isLight
      );
      const effectiveFill = adaptColorForTheme(
        activeStyle.fillColor !== 'transparent'
          ? activeStyle.fillColor
          : shapeDraft.type === 'sticky'
          ? isLight
            ? '#f4f4f5'
            : '#18181b'
          : isFrameShape
          ? isLight
            ? 'rgba(0, 0, 0, 0.02)'
            : 'rgba(255, 255, 255, 0.02)'
          : isLight
          ? '#ffffff'
          : '#121215',
        isLight
      );

      const newShape: CanvasElement = {
        id: `elem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: shapeDraft.type as any,
        semanticType: shapeDraft.type === 'sticky' ? 'idea' : 'none',
        confidence: 'FACT',
        x: finalX,
        y: finalY,
        width: finalW,
        height: finalH,
        content: isFrameShape ? `Section ${elements.filter((e) => e.type === 'frame').length + 1}` : '',
        style: {
          ...activeStyle,
          fillColor: effectiveFill,
          strokeColor: effectiveStroke,
          strokeWidth: activeStyle.strokeWidth || 2,
          fontSize: activeStyle.fontSize || 16,
        },
        zIndex: isFrameShape ? 1 : elements.length + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addElement(newShape);
      setShapeDraft(null);
      setSelectedIds([newShape.id]);
      setActiveTool('select');
    }
  };

  return {
    isPanning,
    marqueeBox,
    shapeDraft,
    arrowDraft,
    currentDrawPoints,
    hoveredAnchorElementId,
    screenToWorld,
    findElementAt,
    findConnectableElementAt,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleStartResize,
    handleStartArrowEndpointDrag,
  };
}
