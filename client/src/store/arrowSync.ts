import type { CanvasElement } from '../types/canvas';
import { getShapeAnchor } from '../components/canvas/geometry';

/**
 * Recomputes connected arrow anchors when shapes move, resize, or are drafted.
 * Preserves explicit sourceElementId and targetElementId bindings.
 */
export function syncConnectedArrows(elements: CanvasElement[]): CanvasElement[] {
  const elMap = new Map<string, CanvasElement>();
  elements.forEach((el) => elMap.set(el.id, el));

  return elements.map((el) => {
    if (el.type !== 'arrow') return el;
    const src = el.sourceElementId ? elMap.get(el.sourceElementId) : undefined;
    const tgt = el.targetElementId ? elMap.get(el.targetElementId) : undefined;

    if (!src && !tgt) return el;

    const currentPts =
      el.points && el.points.length >= 2
        ? el.points
        : [{ x: el.x, y: el.y }, { x: el.x + el.width, y: el.y + el.height }];

    let startPt = currentPts[0];
    let endPt = currentPts[currentPts.length - 1];

    if (src && tgt) {
      const srcCenter = { x: src.x + (src.width || 100) / 2, y: src.y + (src.height || 60) / 2 };
      const tgtCenter = { x: tgt.x + (tgt.width || 100) / 2, y: tgt.y + (tgt.height || 60) / 2 };
      startPt = getShapeAnchor(src, tgtCenter);
      endPt = getShapeAnchor(tgt, srcCenter);
    } else if (src) {
      startPt = getShapeAnchor(src, endPt);
    } else if (tgt) {
      endPt = getShapeAnchor(tgt, startPt);
    }

    return {
      ...el,
      x: Math.min(startPt.x, endPt.x),
      y: Math.min(startPt.y, endPt.y),
      width: Math.abs(endPt.x - startPt.x),
      height: Math.abs(endPt.y - startPt.y),
      points: [startPt, endPt],
    };
  });
}
