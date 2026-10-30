export interface CanvasElementData {
  elementId: string;
  id?: string;
  type: string;
  semanticType?: string;
  confidence?: string;
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number }>;
  relationshipType?: string;
  sourceElementId?: string;
  targetElementId?: string;
  sourceId?: string;
  targetId?: string;
}

export interface CanvasContextPayload {
  workspaceName?: string;
  elements: CanvasElementData[];
  decisions?: any[];
  userQuery?: string;
  mode?: 'casual' | 'technical';
}

export interface SessionAnalysisResult {
  summary: string;
  decisions: Array<{
    title: string;
    rationale: string;
    alternatives: string[];
    status: string;
    sourceElementId?: string;
  }>;
  questions: Array<{
    question: string;
    status: string;
    sourceElementId?: string;
  }>;
  actionItems: Array<{
    task: string;
    owner?: string;
    priority: string;
    sourceElementId?: string;
  }>;
  assumptions: Array<{
    assumption: string;
    risk: string;
    sourceElementId?: string;
  }>;
  risks: Array<{
    risk: string;
    impact: string;
    relatedDecision?: string;
    sourceElementId?: string;
  }>;
}

export interface ContextGapItem {
  id: string;
  type: 'MISSING_REQUIREMENT' | 'CONTRADICTION' | 'UNSUPPORTED_ASSUMPTION' | 'UNDEFINED_DEPENDENCY' | 'AMBIGUOUS_SCOPE' | 'MISSING_STEP' | 'DISCONNECTED_CONCEPT' | 'UNANSWERED_QUESTION' | 'AMBIGUOUS_LABEL';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestedResolution: string;
  relatedElementIds: string[];
}

export interface GapDetectionResult {
  gaps: ContextGapItem[];
}

export interface TraceableNodeItem {
  nodeId: string;
  section: string;
  text: string;
  sourceElementId?: string;
  semanticType?: string;
}

export interface ArtifactGenerationResult {
  title: string;
  type: string;
  markdown: string;
  traceableNodes: TraceableNodeItem[];
}

export interface AskCanvasResult {
  answer: string;
  referencedElementIds: string[];
  suggestedFollowUps: string[];
}

export interface FlowEdge {
  sourceId: string;
  sourceLabel: string;
  targetId: string;
  targetLabel: string;
  action: string;
}

export interface DiagramFlowContext {
  diagramContextStr: string;
  hasDiagramElements: boolean;
  boxCount: number;
  connectionCount: number;
  boxes: CanvasElementData[];
  connections: FlowEdge[];
  sections?: Array<{ id: string; title: string; nodes: CanvasElementData[] }>;
}

export interface IAIProvider {
  name: string;
  isLive(): boolean;
  analyzeSession(context: CanvasContextPayload): Promise<SessionAnalysisResult>;
  detectGaps(context: CanvasContextPayload): Promise<GapDetectionResult>;
  generateArtifact(artifactType: string, context: CanvasContextPayload): Promise<ArtifactGenerationResult>;
  askCanvas(question: string, context: CanvasContextPayload): Promise<AskCanvasResult>;
}
