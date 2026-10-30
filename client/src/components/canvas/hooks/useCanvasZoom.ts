import { useEffect, type RefObject } from 'react';
import type { Viewport } from '../../../types/canvas';

interface UseCanvasZoomProps {
  containerRef: RefObject<HTMLDivElement | null>;
  setViewport: (viewport: Viewport | ((prev: Viewport) => Viewport)) => void;
}

export function useCanvasZoom({ containerRef, setViewport }: UseCanvasZoomProps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch-to-zoom or mouse wheel with Ctrl
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = Math.exp(-e.deltaY * 0.005);
        setViewport((prev) => {
          const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.1), 5);
          const factor = newZoom / prev.zoom;
          return {
            zoom: newZoom,
            x: mouseX - (mouseX - prev.x) * factor,
            y: mouseY - (mouseY - prev.y) * factor,
          };
        });
      } else {
        // 2-finger trackpad panning or normal mouse wheel scroll
        setViewport((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [containerRef, setViewport]);
}
