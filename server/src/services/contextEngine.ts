import { CanvasElementModel, ICanvasElement } from '../models/CanvasElement.js';
import { DecisionModel, IDecision } from '../models/Decision.js';
import { ArtifactModel, IArtifact } from '../models/Artifact.js';
import { WorkspaceModel } from '../models/Workspace.js';
import { getAIProvider, CanvasContextPayload } from './aiProvider.js';

export interface SemanticGraphNode {
  id: string;
  type: string;
  semanticType: string;
  confidence: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  connectedIn: string[];
  connectedOut: string[];
}

export interface SemanticKnowledgeGraph {
  nodes: SemanticGraphNode[];
  relationships: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
  }>;
  clusters: Array<{
    name: string;
    elementIds: string[];
  }>;
  stats: {
    totalElements: number;
    ideas: number;
    decisions: number;
    questions: number;
    requirements: number;
    tasks: number;
    risks: number;
    assumptions: number;
  };
}

export class ContextEngine {
  /**
   * Builds the structured semantic knowledge graph from canvas state
   */
  static async extractKnowledgeGraph(workspaceId: string): Promise<SemanticKnowledgeGraph> {
    const elements = await CanvasElementModel.find({ workspaceId });
    const nodes: SemanticGraphNode[] = [];
    const relationships: SemanticKnowledgeGraph['relationships'] = [];

    const nonArrows = elements.filter((e) => e.type !== 'arrow');
    const arrows = elements.filter((e) => e.type === 'arrow');

    const inMap = new Map<string, string[]>();
    const outMap = new Map<string, string[]>();

    arrows.forEach((arr) => {
      const src = arr.sourceElementId;
      const tgt = arr.targetElementId;
      const relType = arr.relationshipType || 'RELATED_TO';

      if (src && tgt) {
        relationships.push({
          id: arr.elementId,
          source: src,
          target: tgt,
          type: relType,
        });

        if (!outMap.has(src)) outMap.set(src, []);
        outMap.get(src)!.push(tgt);

        if (!inMap.has(tgt)) inMap.set(tgt, []);
        inMap.get(tgt)!.push(src);
      }
    });

    const stats = {
      totalElements: nonArrows.length,
      ideas: 0,
      decisions: 0,
      questions: 0,
      requirements: 0,
      tasks: 0,
      risks: 0,
      assumptions: 0,
    };

    nonArrows.forEach((el) => {
      const sem = el.semanticType || 'none';
      if (sem === 'idea') stats.ideas++;
      else if (sem === 'decision') stats.decisions++;
      else if (sem === 'question') stats.questions++;
      else if (sem === 'requirement') stats.requirements++;
      else if (sem === 'task') stats.tasks++;
      else if (sem === 'risk') stats.risks++;
      else if (sem === 'assumption') stats.assumptions++;

      nodes.push({
        id: el.elementId,
        type: el.type,
        semanticType: sem,
        confidence: el.confidence || 'FACT',
        content: el.content || '',
        x: el.x,
        y: el.y,
        width: el.width || 160,
        height: el.height || 100,
        connectedIn: inMap.get(el.elementId) || [],
        connectedOut: outMap.get(el.elementId) || [],
      });
    });

    // Spatial clustering heuristic (elements within 150px proximity)
    const clusters: SemanticKnowledgeGraph['clusters'] = [];
    const visited = new Set<string>();

    nodes.forEach((node) => {
      if (visited.has(node.id)) return;
      const cluster: string[] = [node.id];
      visited.add(node.id);

      nodes.forEach((other) => {
        if (visited.has(other.id)) return;
        const dx = Math.abs(node.x - other.x);
        const dy = Math.abs(node.y - other.y);
        if (dx < 250 && dy < 200) {
          cluster.push(other.id);
          visited.add(other.id);
        }
      });

      if (cluster.length > 1) {
        clusters.push({
          name: `Cluster ${clusters.length + 1} (${node.content.slice(0, 20) || 'Region'})`,
          elementIds: cluster,
        });
      }
    });

    return {
      nodes,
      relationships,
      clusters,
      stats,
    };
  }

  /**
   * Check for document drift when canvas changes occur
   */
  static async evaluateDocumentDrift(workspaceId: string): Promise<void> {
    const artifacts = await ArtifactModel.find({ workspaceId });
    const elements = await CanvasElementModel.find({ workspaceId });
    const elementMap = new Map(elements.map((e) => [e.elementId, e]));

    for (const artifact of artifacts) {
      let isStale = false;
      let staleReason = '';

      for (const node of artifact.traceableNodes) {
        if (node.sourceElementId) {
          const el = elementMap.get(node.sourceElementId);
          if (!el) {
            isStale = true;
            staleReason = `Source canvas node #${node.sourceElementId.slice(0, 6)} was deleted from canvas.`;
            break;
          } else if (el.updatedAt && el.updatedAt > artifact.updatedAt) {
            isStale = true;
            staleReason = `Canvas node "${el.content.slice(0, 25)}..." was modified after document generation.`;
            break;
          }
        }
      }

      if (artifact.isStale !== isStale) {
        artifact.isStale = isStale;
        artifact.staleReason = staleReason;
        await artifact.save();
      }
    }
  }
}
