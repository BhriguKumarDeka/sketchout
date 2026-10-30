import type { CanvasElement, Point } from '../../types/canvas';

/**
 * Calculates shortest distance from point p to line segment (v, w)
 */
export function distanceToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

/**
 * Returns the exact bounding box of any canvas element
 */
export function getElementBounds(el: CanvasElement): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (el.type === 'draw' && el.points && el.points.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const pt of el.points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
    const width = Math.max(maxX - minX, 10);
    const height = Math.max(maxY - minY, 10);
    return { minX, minY, maxX, maxY, width, height };
  }

  if (el.type === 'arrow' && el.points && el.points.length >= 2) {
    const p1 = el.points[0];
    const p2 = el.points[el.points.length - 1];
    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxX = Math.max(p1.x, p2.x);
    const maxY = Math.max(p1.y, p2.y);
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  const minX = el.x;
  const minY = el.y;
  const width = el.width || 100;
  const height = el.height || 60;
  return {
    minX,
    minY,
    maxX: minX + width,
    maxY: minY + height,
    width,
    height,
  };
}

/**
 * Robust mathematical hit testing for any element type
 */
export function isPointInElement(point: Point, el: CanvasElement, zoom: number = 1): boolean {
  const tolerance = Math.max(6, 10 / zoom);

  // 1. Freehand Draw
  if (el.type === 'draw') {
    if (!el.points || el.points.length < 2) return false;
    const b = getElementBounds(el);
    if (
      point.x < b.minX - tolerance ||
      point.x > b.maxX + tolerance ||
      point.y < b.minY - tolerance ||
      point.y > b.maxY + tolerance
    ) {
      return false;
    }
    const strokeTol = Math.max((el.style.strokeWidth || 2) + tolerance, 8);
    for (let i = 0; i < el.points.length - 1; i++) {
      const d = distanceToSegment(point, el.points[i], el.points[i + 1]);
      if (d <= strokeTol) return true;
    }
    return false;
  }

  // 2. Arrow Connector
  if (el.type === 'arrow') {
    const pts = el.points && el.points.length >= 2 ? el.points : [{ x: el.x, y: el.y }, { x: el.x + (el.width || 100), y: el.y + (el.height || 0) }];
    const strokeTol = Math.max((el.style.strokeWidth || 2) + tolerance, 10);
    for (let i = 0; i < pts.length - 1; i++) {
      const d = distanceToSegment(point, pts[i], pts[i + 1]);
      if (d <= strokeTol) return true;
    }
    return false;
  }

  // 3. Ellipse
  if (el.type === 'ellipse') {
    const rx = (el.width || 100) / 2;
    const ry = (el.height || 60) / 2;
    const cx = el.x + rx;
    const cy = el.y + ry;
    if (rx <= 0 || ry <= 0) return false;
    const normalized = ((point.x - cx) ** 2) / ((rx + tolerance) ** 2) + ((point.y - cy) ** 2) / ((ry + tolerance) ** 2);
    return normalized <= 1;
  }

  // 4. Diamond
  if (el.type === 'diamond') {
    const hw = (el.width || 100) / 2;
    const hh = (el.height || 60) / 2;
    const cx = el.x + hw;
    const cy = el.y + hh;
    if (hw <= 0 || hh <= 0) return false;
    const d = Math.abs(point.x - cx) / (hw + tolerance) + Math.abs(point.y - cy) / (hh + tolerance);
    return d <= 1;
  }

  // 5. Rectangles, Stickies, Text, Cylinder, Frame
  return (
    point.x >= el.x - tolerance &&
    point.x <= el.x + (el.width || 100) + tolerance &&
    point.y >= el.y - tolerance &&
    point.y <= el.y + (el.height || 60) + tolerance
  );
}

/**
 * Checks if element intersects or is enclosed by a marquee box
 */
export function isElementInBox(
  el: CanvasElement,
  box: { minX: number; minY: number; maxX: number; maxY: number }
): boolean {
  const b = getElementBounds(el);
  return !(b.maxX < box.minX || b.minX > box.maxX || b.maxY < box.minY || b.minY > box.maxY);
}

/**
 * Computes the union bounding box of multiple selected elements
 */
export function getSelectionBounds(elements: CanvasElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} | null {
  if (elements.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const b = getElementBounds(el);
    if (b.minX < minX) minX = b.minX;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxY > maxY) maxY = b.maxY;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculates anchor point on the perimeter of a shape directed towards a target point
 */
export function getShapeAnchor(el: CanvasElement, towards: Point): Point {
  const cx = el.x + (el.width || 100) / 2;
  const cy = el.y + (el.height || 60) / 2;
  const dx = towards.x - cx;
  const dy = towards.y - cy;

  if (Math.hypot(dx, dy) === 0) return { x: cx, y: cy };

  const hw = (el.width || 100) / 2;
  const hh = (el.height || 60) / 2;

  if (el.type === 'ellipse') {
    const angle = Math.atan2(dy, dx);
    return {
      x: cx + hw * Math.cos(angle),
      y: cy + hh * Math.sin(angle),
    };
  }

  if (el.type === 'diamond') {
    // Intersect ray with diamond edges
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const t = 1 / (absDx / hw + absDy / hh);
    return {
      x: cx + dx * t,
      y: cy + dy * t,
    };
  }

  // Rectangular bounding box anchor
  const tan = Math.abs(dy / dx);
  const rectTan = hh / hw;

  if (tan <= rectTan) {
    // Hits left or right edge
    const edgeX = dx > 0 ? hw : -hw;
    const edgeY = edgeX * (dy / dx);
    return { x: cx + edgeX, y: cy + edgeY };
  } else {
    // Hits top or bottom edge
    const edgeY = dy > 0 ? hh : -hh;
    const edgeX = edgeY * (dx / dy);
    return { x: cx + edgeX, y: cy + edgeY };
  }
}
