import {
  CanvasContextPayload,
  IAIProvider,
  SessionAnalysisResult,
  GapDetectionResult,
  ArtifactGenerationResult,
  AskCanvasResult,
} from './types.js';
import { extractDiagramFlowContext } from './contextExtractor.js';

export class HeuristicAIProvider implements IAIProvider {
  name = 'SketchOut Context Engine (Local)';

  isLive(): boolean {
    return false;
  }

  async analyzeSession(context: CanvasContextPayload): Promise<SessionAnalysisResult> {
    const { elements } = context;
    const decisions: SessionAnalysisResult['decisions'] = [];
    const questions: SessionAnalysisResult['questions'] = [];
    const actionItems: SessionAnalysisResult['actionItems'] = [];
    const assumptions: SessionAnalysisResult['assumptions'] = [];
    const risks: SessionAnalysisResult['risks'] = [];

    const nonArrowElements = elements.filter((e) => e.type !== 'arrow' && e.content?.trim().length > 0);

    for (const el of nonArrowElements) {
      const text = el.content.trim();
      const sem = el.semanticType || 'none';
      const id = el.elementId || el.id || '';

      if (sem === 'decision' || text.toLowerCase().includes('decision:') || text.toLowerCase().startsWith('decided:')) {
        decisions.push({
          title: text.replace(/^(decision:|decided:)\s*/i, ''),
          rationale: 'Extracted from visual structure and semantic canvas tag.',
          alternatives: ['Alternative explored on canvas'],
          status: 'Accepted',
          sourceElementId: id,
        });
      } else if (sem === 'question' || text.endsWith('?') || text.toLowerCase().startsWith('how') || text.toLowerCase().startsWith('why')) {
        questions.push({
          question: text,
          status: 'Open',
          sourceElementId: id,
        });
      } else if (sem === 'task' || text.toLowerCase().startsWith('todo') || text.toLowerCase().startsWith('[ ]')) {
        actionItems.push({
          task: text.replace(/^(todo:|\[ \])\s*/i, ''),
          priority: 'Medium',
          sourceElementId: id,
        });
      } else if (sem === 'assumption' || text.toLowerCase().includes('assume')) {
        assumptions.push({
          assumption: text,
          risk: 'Potential dependency on unverified assumption.',
          sourceElementId: id,
        });
      } else if (sem === 'risk' || text.toLowerCase().includes('risk:') || text.toLowerCase().includes('danger:')) {
        risks.push({
          risk: text.replace(/^(risk:|danger:)\s*/i, ''),
          impact: 'High',
          sourceElementId: id,
        });
      } else {
        if (text.length > 3) {
          decisions.push({
            title: text,
            rationale: 'Canvas node registered in conceptual map.',
            alternatives: [],
            status: 'Proposed',
            sourceElementId: id,
          });
        }
      }
    }

    const summary = `Synthesized ${nonArrowElements.length} canvas nodes across ${decisions.length} decisions/ideas, ${questions.length} questions, and ${actionItems.length} action items.`;

    return {
      summary,
      decisions,
      questions,
      actionItems,
      assumptions,
      risks,
    };
  }

  async detectGaps(context: CanvasContextPayload): Promise<GapDetectionResult> {
    const { elements } = context;
    const gaps: GapDetectionResult['gaps'] = [];
    const nonArrows = elements.filter((e) => e.type !== 'arrow');
    const arrows = elements.filter((e) => e.type === 'arrow');

    const connectedIds = new Set<string>();
    arrows.forEach((a) => {
      const s = a.sourceElementId || a.sourceId;
      const t = a.targetElementId || a.targetId;
      if (s) connectedIds.add(s);
      if (t) connectedIds.add(t);
    });

    const orphaned = nonArrows.filter(
      (e) => !connectedIds.has(e.elementId || e.id || '') && e.content?.trim().length > 0
    );

    if (orphaned.length > 0) {
      gaps.push({
        id: 'gap-orphan',
        type: 'UNDEFINED_DEPENDENCY',
        title: `${orphaned.length} Isolated Canvas Elements`,
        description: `Elements such as "${orphaned[0].content.slice(0, 30)}..." lack explicit relational connectors or parent groups.`,
        severity: 'low',
        suggestedResolution: 'Connect with directional arrows to anchor flow.',
        relatedElementIds: orphaned.map((o) => o.elementId || o.id || ''),
      });
    }

    const questions = nonArrows.filter((e) => e.semanticType === 'question' || e.content?.includes('?'));
    if (questions.length > 0) {
      gaps.push({
        id: 'gap-questions',
        type: 'AMBIGUOUS_SCOPE',
        title: `${questions.length} Unresolved Questions`,
        description: `Open questions remain without linked resolution decisions.`,
        severity: 'medium',
        suggestedResolution: 'Add decision nodes answering each question.',
        relatedElementIds: questions.map((q) => q.elementId || q.id || ''),
      });
    }

    return { gaps };
  }

  async generateArtifact(artifactType: string, context: CanvasContextPayload): Promise<ArtifactGenerationResult> {
    const { elements, workspaceName = 'sketch out' } = context;
    const traceableNodes: ArtifactGenerationResult['traceableNodes'] = [];

    const flowContext = extractDiagramFlowContext(elements, workspaceName);
    const nodes = flowContext.boxes;
    const connections = flowContext.connections;

    const firstLabel = nodes[0]?.content?.trim() || 'Visual Flow';
    const title = `${firstLabel} — Flow Documentation`;

    let markdown = `# ${title}\n\n`;
    markdown += `> Synthesized from the ${workspaceName} canvas.\n\n`;

    markdown += `## 1. Overview & Core Concept\n`;
    if (nodes.length === 0) {
      markdown += `This canvas does not yet contain structured shapes or concept elements.\n\n`;
    } else {
      markdown += `This diagram maps out a sequence of **${nodes.length} core concepts** connected across **${connections.length} transitional steps**.\n\n`;
    }

    markdown += `## 2. Key Elements & Roles\n`;
    if (nodes.length > 0) {
      nodes.forEach((node, idx) => {
        const label = node.content?.trim() || `${node.type.toUpperCase()} Concept ${idx + 1}`;
        const nodeId = `elem-${idx + 1}`;
        const id = node.elementId || node.id || '';
        traceableNodes.push({
          nodeId,
          section: 'Key Elements & Roles',
          text: label,
          sourceElementId: id,
          semanticType: node.semanticType || 'concept',
        });
        markdown += `- **${label}** (${node.type}) <!-- trace:${id} -->\n`;
      });
    } else {
      markdown += `_No concept nodes registered on canvas yet._\n`;
    }
    markdown += `\n`;

    markdown += `## 3. Step-by-Step Flow & Transitions\n`;
    if (connections.length > 0) {
      connections.forEach((c, idx) => {
        markdown += `${idx + 1}. **${c.sourceLabel}** ➔ **${c.targetLabel}** (${c.action})\n`;
      });
    } else {
      markdown += `_No direct connecting arrows between elements._\n`;
    }
    markdown += `\n`;

    markdown += `## 4. Key Takeaways for Quick Recall\n`;
    if (nodes.length > 0) {
      nodes.forEach((n) => {
        const text = n.content?.trim() || `${n.type} element`;
        markdown += `- Remember: **${text}** forms an integral part of this flow.\n`;
      });
    } else {
      markdown += `- Add shapes and connect them with arrows to build your visual flow.\n`;
    }

    return {
      title,
      type: artifactType || 'prd',
      markdown,
      traceableNodes,
    };
  }

  async askCanvas(question: string, context: CanvasContextPayload): Promise<AskCanvasResult> {
    const { elements, workspaceName = 'sketch out', mode = 'casual' } = context;
    const flow = extractDiagramFlowContext(elements, workspaceName);
    const lower = question.toLowerCase();

    // Check direct content matches
    const matches = elements.filter(
      (e) => e.content && lower.includes(e.content.toLowerCase())
    );

    if (flow.connections.length > 0) {
      const first = flow.connections[0];
      const last = flow.connections[flow.connections.length - 1];
      const chain = flow.connections.map((c) => `**${c.sourceLabel}** ➔ **${c.targetLabel}**`).join('; ');

      const casualAnswer = `Looking at the board, there's a clear flow here: it starts with **${first.sourceLabel}** and progresses through to **${last.targetLabel}** (${chain}). In essence, it maps out a progression between these concepts.`;
      const techAnswer = `The workflow defines a sequential pipeline starting at **${first.sourceLabel}** and culminating in **${last.targetLabel}** across ${flow.connections.length} stages: ${chain}.`;

      return {
        answer: mode === 'technical' ? techAnswer : casualAnswer,
        referencedElementIds: flow.boxes.map((b) => b.elementId || b.id || ''),
        suggestedFollowUps: ['What is the core essence?', 'Can we elaborate on each transition?', 'Generate full documentation'],
      };
    }

    if (matches.length > 0) {
      return {
        answer: `I see what you're working on with "${matches.map((m) => m.content).join('", "')}". How would you like to develop these ideas further?`,
        referencedElementIds: matches.map((m) => m.elementId || m.id || ''),
        suggestedFollowUps: ['How do these connect?', 'Document these concepts'],
      };
    }

    return {
      answer: `Looking over the ${workspaceName} canvas, you have ${flow.boxCount} concepts mapped out. Connecting them with arrows will help trace their story.`,
      referencedElementIds: flow.boxes.slice(0, 3).map((b) => b.elementId || b.id || ''),
      suggestedFollowUps: ['Explain canvas flow', 'Generate flow documentation'],
    };
  }
}
