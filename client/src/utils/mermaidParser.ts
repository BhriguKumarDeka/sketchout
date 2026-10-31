import type { CanvasElement, ElementType, Point } from '../types/canvas';
import { syncConnectedArrows } from '../store/arrowSync';

interface ParsedNode {
  id: string;
  label: string;
  type: ElementType;
  subgraph?: string;
}

interface ParsedEdge {
  fromId: string;
  toId: string;
  label: string;
  style: 'solid' | 'dashed' | 'bold';
}

interface ParsedSubgraph {
  id: string;
  title: string;
  nodeIds: string[];
}

export function parseMermaidCode(mermaidCode: string): {
  success: boolean;
  elements: CanvasElement[];
  error?: string;
} {
  try {
    if (!mermaidCode || !mermaidCode.trim()) {
      return { success: false, elements: [], error: 'Mermaid code is empty' };
    }

    const lines = mermaidCode.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('%%'));

    let direction: 'TD' | 'TB' | 'LR' | 'RL' = 'TD';
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('flowchart') || firstLine.includes('graph')) {
      if (firstLine.includes('lr')) direction = 'LR';
      else if (firstLine.includes('rl')) direction = 'RL';
      else if (firstLine.includes('td')) direction = 'TD';
      else if (firstLine.includes('tb')) direction = 'TB';
    }

    const nodeMap = new Map<string, ParsedNode>();
    const edges: ParsedEdge[] = [];
    const subgraphs: ParsedSubgraph[] = [];
    let currentSubgraph: ParsedSubgraph | null = null;

    // Helper to register node
    const getOrCreateNode = (rawId: string, label?: string, type: ElementType = 'rectangle'): ParsedNode => {
      const cleanId = rawId.trim();
      const existing = nodeMap.get(cleanId);
      if (existing) {
        if (label && (!existing.label || existing.label === cleanId)) {
          existing.label = label;
          existing.type = type;
        }
        if (currentSubgraph && !existing.subgraph) {
          existing.subgraph = currentSubgraph.id;
          currentSubgraph.nodeIds.push(cleanId);
        }
        return existing;
      }

      const node: ParsedNode = {
        id: cleanId,
        label: label || cleanId,
        type,
        subgraph: currentSubgraph?.id,
      };
      if (currentSubgraph) {
        currentSubgraph.nodeIds.push(cleanId);
      }
      nodeMap.set(cleanId, node);
      return node;
    };

    // Parse shape syntax
    const parseNodeSyntax = (token: string): { id: string; label: string; type: ElementType } | null => {
      // Cylinder: id[(label)]
      let m = token.match(/^([a-zA-Z0-9_-]+)\s*\[\((.*?)\)\]$/);
      if (m) return { id: m[1], label: m[2], type: 'cylinder' };

      // Diamond: id{label}
      m = token.match(/^([a-zA-Z0-9_-]+)\s*\{(.*?)\}$/);
      if (m) return { id: m[1], label: m[2], type: 'diamond' };

      // Pill / Stadium: id([label])
      m = token.match(/^([a-zA-Z0-9_-]+)\s*\(\[(.*?)\]\)$/);
      if (m) return { id: m[1], label: m[2], type: 'ellipse' };

      // Circle / Ellipse: id(label)
      m = token.match(/^([a-zA-Z0-9_-]+)\s*\((.*?)\)$/);
      if (m) return { id: m[1], label: m[2], type: 'ellipse' };

      // Sticky: id>label]
      m = token.match(/^([a-zA-Z0-9_-]+)\s*>(.*?)\]$/);
      if (m) return { id: m[1], label: m[2], type: 'sticky' };

      // Rectangle: id[label]
      m = token.match(/^([a-zA-Z0-9_-]+)\s*\[(.*?)\]$/);
      if (m) return { id: m[1], label: m[2], type: 'rectangle' };

      // Plain ID
      m = token.match(/^([a-zA-Z0-9_-]+)$/);
      if (m) return { id: m[1], label: m[1], type: 'rectangle' };

      return null;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Skip chart declaration
      if (/^(graph|flowchart)\s+/i.test(line)) continue;

      // Subgraph start: subgraph Title or subgraph id [Title]
      const subMatch = line.match(/^subgraph\s+([a-zA-Z0-9_-]+)?\s*(\[?([^\]]*)\]?)?$/i);
      if (subMatch && !line.includes('-->') && !line.includes('---')) {
        const subId = subMatch[1] || `sub_${subgraphs.length + 1}`;
        const subTitle = subMatch[3]?.trim() || subMatch[1]?.trim() || `Section ${subgraphs.length + 1}`;
        currentSubgraph = { id: subId, title: subTitle, nodeIds: [] };
        subgraphs.push(currentSubgraph);
        continue;
      }

      // Subgraph end
      if (line.toLowerCase() === 'end') {
        currentSubgraph = null;
        continue;
      }

      // Edge patterns:
      // A -->|text| B
      // A -- text --> B
      // A -.-> B
      // A ==> B
      // A --> B
      // A --- B
      const edgeRegex = /(.*?)(-->\|(.*?)\||--\s*(.*?)\s*-->|-->|-\.->|==>|---\s*\|(.*?)\||---)(.*)/;
      const match = line.match(edgeRegex);

      if (match) {
        const leftPart = match[1].trim();
        const edgeSyntax = match[2];
        const rightPart = match[match.length - 1].trim();

        // Extract label
        let edgeLabel = '';
        if (match[3]) edgeLabel = match[3].trim();
        else if (match[4]) edgeLabel = match[4].trim();
        else if (match[5]) edgeLabel = match[5].trim();

        let edgeStyle: 'solid' | 'dashed' | 'bold' = 'solid';
        if (edgeSyntax.includes('-.->')) edgeStyle = 'dashed';
        else if (edgeSyntax.includes('==>')) edgeStyle = 'bold';

        const parsedLeft = parseNodeSyntax(leftPart);
        const parsedRight = parseNodeSyntax(rightPart);

        if (parsedLeft && parsedRight) {
          getOrCreateNode(parsedLeft.id, parsedLeft.label, parsedLeft.type);
          getOrCreateNode(parsedRight.id, parsedRight.label, parsedRight.type);

          edges.push({
            fromId: parsedLeft.id,
            toId: parsedRight.id,
            label: edgeLabel,
            style: edgeStyle,
          });
          continue;
        }
      }

      // Single standalone node declaration: e.g. A[Start]
      const singleNode = parseNodeSyntax(line);
      if (singleNode) {
        getOrCreateNode(singleNode.id, singleNode.label, singleNode.type);
      }
    }

    if (nodeMap.size === 0) {
      return { success: false, elements: [], error: 'No recognizable nodes found in Mermaid code' };
    }

    // Graph Layout Calculation (Layered Topological Ordering)
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    nodeMap.forEach((_, id) => {
      inDegree.set(id, 0);
      adj.set(id, []);
    });

    edges.forEach((e) => {
      if (adj.has(e.fromId) && inDegree.has(e.toId)) {
        adj.get(e.fromId)!.push(e.toId);
        inDegree.set(e.toId, (inDegree.get(e.toId) || 0) + 1);
      }
    });

    // Compute levels (ranks)
    const nodeLevels = new Map<string, number>();
    const queue: string[] = [];

    nodeMap.forEach((_, id) => {
      if ((inDegree.get(id) || 0) === 0) {
        queue.push(id);
        nodeLevels.set(id, 0);
      }
    });

    // BFS for longest path ranking
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currLevel = nodeLevels.get(curr) || 0;
      const neighbors = adj.get(curr) || [];

      for (const next of neighbors) {
        const nextLevel = Math.max(nodeLevels.get(next) ?? 0, currLevel + 1);
        nodeLevels.set(next, nextLevel);
        queue.push(next);
      }
    }

    // Default level for any disconnected nodes
    nodeMap.forEach((_, id) => {
      if (!nodeLevels.has(id)) {
        nodeLevels.set(id, 0);
      }
    });

    // Group nodes by level
    const levelsMap = new Map<number, string[]>();
    nodeLevels.forEach((level, id) => {
      if (!levelsMap.has(level)) levelsMap.set(level, []);
      levelsMap.get(level)!.push(id);
    });

    // Map each node to its CanvasElement
    const idToElemId = new Map<string, string>();
    const nodeElements: CanvasElement[] = [];

    const isHorizontal = direction === 'LR' || direction === 'RL';
    const xSpacing = isHorizontal ? 260 : 220;
    const ySpacing = isHorizontal ? 150 : 170;

    levelsMap.forEach((nodeIdsInLevel, level) => {
      nodeIdsInLevel.forEach((nodeId, idxInLevel) => {
        const node = nodeMap.get(nodeId)!;
        const elemId = `elem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        idToElemId.set(nodeId, elemId);

        let x = isHorizontal ? level * xSpacing : idxInLevel * xSpacing;
        let y = isHorizontal ? idxInLevel * ySpacing : level * ySpacing;

        // Offset inverted directions
        if (direction === 'RL') x = -x;

        const defaultW = node.type === 'cylinder' ? 140 : node.type === 'sticky' ? 180 : 160;
        const defaultH = node.type === 'cylinder' ? 90 : node.type === 'sticky' ? 120 : 80;

        nodeElements.push({
          id: elemId,
          type: node.type,
          semanticType: node.type === 'sticky' ? 'idea' : node.type === 'diamond' ? 'decision' : 'none',
          confidence: 'FACT',
          x,
          y,
          width: defaultW,
          height: defaultH,
          content: node.label,
          style: {
            strokeColor: '#f4f4f5',
            fillColor: node.type === 'sticky' ? '#27272a' : 'transparent',
            strokeWidth: 2,
            fontSize: 14,
            textAlign: node.type === 'diamond' || node.type === 'ellipse' ? 'center' : 'left',
          },
          zIndex: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });
    });

    // Subgraphs / Sections creation
    const sectionElements: CanvasElement[] = [];
    subgraphs.forEach((sub, sIdx) => {
      const childElems = sub.nodeIds
        .map((nid) => idToElemId.get(nid))
        .map((eid) => nodeElements.find((e) => e.id === eid))
        .filter((e): e is CanvasElement => !!e);

      if (childElems.length > 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        childElems.forEach((e) => {
          minX = Math.min(minX, e.x);
          minY = Math.min(minY, e.y);
          maxX = Math.max(maxX, e.x + (e.width || 140));
          maxY = Math.max(maxY, e.y + (e.height || 80));
        });

        const padX = 40;
        const padY = 50;

        sectionElements.push({
          id: `elem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'frame',
          semanticType: 'none',
          confidence: 'FACT',
          x: minX - padX,
          y: minY - padY,
          width: Math.max(maxX - minX + padX * 2, 280),
          height: Math.max(maxY - minY + padY * 2, 200),
          content: sub.title || `Section ${sIdx + 1}`,
          style: {
            strokeColor: '#3f3f46',
            fillColor: 'rgba(255, 255, 255, 0.015)',
            strokeWidth: 1,
            strokeStyle: 'dashed',
            fontSize: 12,
          },
          zIndex: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    });

    // Arrow connectors creation
    const arrowElements: CanvasElement[] = [];
    edges.forEach((edge) => {
      const srcElemId = idToElemId.get(edge.fromId);
      const tgtElemId = idToElemId.get(edge.toId);

      const src = nodeElements.find((e) => e.id === srcElemId);
      const tgt = nodeElements.find((e) => e.id === tgtElemId);

      if (src && tgt && src.id !== tgt.id) {
        const startPt: Point = {
          x: src.x + (src.width || 140) / 2,
          y: src.y + (src.height || 80) / 2,
        };
        const endPt: Point = {
          x: tgt.x + (tgt.width || 140) / 2,
          y: tgt.y + (tgt.height || 80) / 2,
        };

        arrowElements.push({
          id: `arrow-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'arrow',
          semanticType: 'none',
          confidence: 'FACT',
          x: Math.min(startPt.x, endPt.x),
          y: Math.min(startPt.y, endPt.y),
          width: Math.abs(endPt.x - startPt.x),
          height: Math.abs(endPt.y - startPt.y),
          content: edge.label || '',
          points: [startPt, endPt],
          sourceElementId: src.id,
          targetElementId: tgt.id,
          relationshipType: edge.label ? edge.label.replace(/\s+/g, '_').toUpperCase() as any : 'LEADS_TO' as any,
          style: {
            strokeColor: '#a1a1aa',
            strokeWidth: edge.style === 'bold' ? 3 : 2,
            strokeStyle: edge.style === 'dashed' ? 'dashed' : 'solid',
          },
          zIndex: 3,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    });

    // Combine all elements and run arrow anchor snap
    const combined = [...sectionElements, ...nodeElements, ...arrowElements];
    const synchronized = syncConnectedArrows(combined);

    return {
      success: true,
      elements: synchronized,
    };
  } catch (err: any) {
    return {
      success: false,
      elements: [],
      error: err.message || 'Failed to parse Mermaid code',
    };
  }
}
