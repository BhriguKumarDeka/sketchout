import { CanvasElementData, DiagramFlowContext, FlowEdge } from './types.js';

export const getNodeKey = (el: any): string => String(el?.elementId || el?.id || '');

/**
 * Checks whether a 2D point is within or near the perimeter of a canvas shape
 */
function isPointNearShape(
  pt: { x: number; y: number },
  node: CanvasElementData,
  margin: number = 30
): boolean {
  const w = node.width || 120;
  const h = node.height || 70;
  const minX = node.x - margin;
  const maxX = node.x + w + margin;
  const minY = node.y - margin;
  const maxY = node.y + h + margin;
  return pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY;
}

/**
 * Calculates distance from a point to the nearest point on a shape's bounding box
 */
function distanceToShape(pt: { x: number; y: number }, node: CanvasElementData): number {
  const w = node.width || 120;
  const h = node.height || 70;
  const clampedX = Math.max(node.x, Math.min(pt.x, node.x + w));
  const clampedY = Math.max(node.y, Math.min(pt.y, node.y + h));
  return Math.hypot(pt.x - clampedX, pt.y - clampedY);
}

/**
 * Finds the closest diagram node to a given coordinate within a maximum search radius
 */
export function findClosestNode(
  pt: { x: number; y: number },
  nodes: CanvasElementData[],
  maxDistance: number = 220
): CanvasElementData | undefined {
  let closest: CanvasElementData | undefined = undefined;
  let minD = maxDistance;

  for (const node of nodes) {
    const d = distanceToShape(pt, node);
    if (d < minD) {
      minD = d;
      closest = node;
    }
  }
  return closest;
}

/**
 * Extracts visual diagram elements (rectangles, ellipses, diamonds, cylinders, stickies, text nodes, and directed connecting arrows).
 * Explicitly leaves all extraneous freehand pen drawings ('draw') out of documentation context.
 */
export function extractDiagramFlowContext(
  elements: CanvasElementData[],
  workspaceName: string = 'sketch out'
): DiagramFlowContext {
  // 1. Filter out freehand drawings and arrows to get all diagram entities
  const eligibleNodes = elements.filter((e) => {
    if (e.type === 'draw' || e.type === 'arrow') return false;
    const hasText = !!(e.content && e.content.trim().length > 0);
    const hasShapeSize = !!((e.width && e.width >= 10) && (e.height && e.height >= 10));
    return hasText || hasShapeSize;
  });

  const eligibleArrows = elements.filter((e) => e.type === 'arrow');

  const nodeMap = new Map<string, CanvasElementData>();
  const incomingMap = new Map<string, string[]>();
  const outgoingMap = new Map<string, string[]>();

  eligibleNodes.forEach((b) => {
    const key = getNodeKey(b);
    if (key) {
      nodeMap.set(key, b);
      incomingMap.set(key, []);
      outgoingMap.set(key, []);
    }
  });

  const connections: FlowEdge[] = [];

  // 2. Resolve arrow connections using multi-tiered resolution
  eligibleArrows.forEach((a: any) => {
    const directSrcId = a.sourceElementId || a.sourceId;
    const directTgtId = a.targetElementId || a.targetId;

    let src = directSrcId ? nodeMap.get(directSrcId) : undefined;
    let tgt = directTgtId ? nodeMap.get(directTgtId) : undefined;

    // Determine start and end points of arrow
    const startPt =
      a.points && a.points.length > 0
        ? a.points[0]
        : { x: a.x, y: a.y };

    const endPt =
      a.points && a.points.length > 1
        ? a.points[a.points.length - 1]
        : { x: a.x + (a.width || 0), y: a.y + (a.height || 0) };

    // Geometric hit-test fallback (if direct ID missing or didn't resolve)
    if (!src && startPt) {
      for (const node of eligibleNodes) {
        if (isPointNearShape(startPt, node, 40)) {
          src = node;
          break;
        }
      }
    }

    if (!tgt && endPt) {
      for (const node of eligibleNodes) {
        if (isPointNearShape(endPt, node, 40)) {
          tgt = node;
          break;
        }
      }
    }

    // Spatial proximity fallback with generous radius
    if (!src && startPt) {
      src = findClosestNode(startPt, eligibleNodes, 220);
    }
    if (!tgt && endPt) {
      tgt = findClosestNode(endPt, eligibleNodes, 220);
    }

    const srcKey = src ? getNodeKey(src) : '';
    const tgtKey = tgt ? getNodeKey(tgt) : '';

    // If arrow connects two distinct nodes
    if (src && tgt && srcKey && tgtKey && srcKey !== tgtKey) {
      const action =
        a.content?.trim() || a.relationshipType?.replace(/_/g, ' ') || 'leads to';

      const srcLabel = src.content?.trim() || `${src.type} node`;
      const tgtLabel = tgt.content?.trim() || `${tgt.type} node`;

      connections.push({
        sourceId: srcKey,
        sourceLabel: srcLabel,
        targetId: tgtKey,
        targetLabel: tgtLabel,
        action,
      });

      outgoingMap.get(srcKey)?.push(`-> "${tgtLabel}" via [${action}]`);
      incomingMap.get(tgtKey)?.push(`<- "${srcLabel}" via [${action}]`);
    } else if (src && srcKey && !tgt) {
      const action = a.content?.trim() || 'leads forward';
      outgoingMap.get(srcKey)?.push(`-> [Forward Step / Output] via (${action})`);
    } else if (!src && tgt && tgtKey) {
      const action = a.content?.trim() || 'originates from prior step';
      incomingMap.get(tgtKey)?.push(`<- [Prior Step / Input] via (${action})`);
    }
  });

  // 3. Extract Figma-Style Sections & Identify Contained Flows
  const sectionFrames = elements.filter((e) => e.type === 'frame');
  const sections = sectionFrames.map((frame, fIdx) => {
    const fKey = getNodeKey(frame);
    const title = frame.content?.trim() || `Section ${fIdx + 1}`;
    const frameMinX = frame.x;
    const frameMinY = frame.y;
    const frameMaxX = frame.x + (frame.width || 380);
    const frameMaxY = frame.y + (frame.height || 280);

    const enclosedNodes = eligibleNodes.filter((node) => {
      if (node.type === 'frame') return false;
      const cx = node.x + (node.width || 100) / 2;
      const cy = node.y + (node.height || 60) / 2;
      return cx >= frameMinX && cx <= frameMaxX && cy >= frameMinY && cy <= frameMaxY;
    });

    return {
      id: fKey,
      title,
      nodes: enclosedNodes,
    };
  });

  // 4. Format structured, human-readable text context
  let text = `CANVAS VISUAL DIAGRAM FLOW (${workspaceName}):\n`;
  text += `Identified Core Concepts/Entities: ${eligibleNodes.filter((e) => e.type !== 'frame').length}\n`;
  text += `Identified Diagram Sections/Frames: ${sections.length}\n`;
  text += `Identified Directional Transitions: ${connections.length}\n\n`;

  if (sections.length > 0) {
    text += `--- WHITEBOARD SECTIONS & WORKFLOW BOUNDARIES ---\n`;
    sections.forEach((s) => {
      const nodeLabels = s.nodes.map((n) => `"${n.content?.trim() || n.type}"`).join(', ');
      text += `* Section "${s.title}": contains ${s.nodes.length} concepts [${nodeLabels || 'Empty Section'}]\n`;
    });
    text += `\n`;
  }

  text += `--- CONCEPTS & CORE ENTITIES ---\n`;
  const nonFrameNodes = eligibleNodes.filter((b) => b.type !== 'frame');
  if (nonFrameNodes.length === 0) {
    text += `(No diagram shapes or concept nodes detected on the canvas.)\n`;
  } else {
    nonFrameNodes.forEach((b, idx) => {
      const key = getNodeKey(b);
      const label = b.content?.trim() || `${b.type.charAt(0).toUpperCase() + b.type.slice(1)} Concept ${idx + 1}`;
      const inFlows = incomingMap.get(key) || [];
      const outFlows = outgoingMap.get(key) || [];
      text += `* Concept "${label}"\n`;
      if (b.semanticType && b.semanticType !== 'none') {
        text += `  Category/Tag: ${b.semanticType}\n`;
      }
      if (inFlows.length > 0) {
        text += `  Inputs/Preceding: ${inFlows.join('; ')}\n`;
      }
      if (outFlows.length > 0) {
        text += `  Outputs/Transitions: ${outFlows.join('; ')}\n`;
      }
    });
  }

  text += `\n--- STEP-BY-STEP FLOW PROGRESSION ---\n`;
  if (connections.length === 0) {
    text += `(No direct arrow connections established between elements.)\n`;
  } else {
    connections.forEach((c, idx) => {
      text += `Step ${idx + 1}: "${c.sourceLabel}" ===( ${c.action} )===> "${c.targetLabel}"\n`;
    });
  }

  // Purely for the LLM to populate referencedElementIds JSON array without mentioning IDs in the text
  text += `\n--- NODE ID LOOKUP (DO NOT CITE THESE IDS IN YOUR PROSE. USE ONLY IN referencedElementIds ARRAY) ---\n`;
  eligibleNodes.forEach((b) => {
    const key = getNodeKey(b);
    const label = b.content?.trim() || `${b.type} concept`;
    text += `"${label}" -> ${key}\n`;
  });

  return {
    diagramContextStr: text,
    hasDiagramElements: eligibleNodes.length > 0,
    boxCount: eligibleNodes.length,
    connectionCount: connections.length,
    boxes: eligibleNodes,
    connections,
    sections,
  };
}
