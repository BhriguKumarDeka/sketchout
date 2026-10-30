export type ElementType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'cylinder'
  | 'sticky'
  | 'text'
  | 'draw'
  | 'arrow'
  | 'frame';

export type SemanticType =
  | 'none'
  | 'idea'
  | 'question'
  | 'decision'
  | 'requirement'
  | 'task'
  | 'assumption'
  | 'risk'
  | 'research'
  | 'note';

export type ConfidenceType = 'FACT' | 'DECISION' | 'SUGGESTION' | 'ASSUMPTION' | 'INFERENCE' | 'UNKNOWN';

export type RelationshipType =
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'DEPENDS_ON'
  | 'DERIVED_FROM'
  | 'RELATED_TO'
  | 'REPLACES'
  | 'REJECTED_BY'
  | 'RESULTS_IN'
  | 'IMPLEMENTS'
  | 'NONE'
  | ''
  | (string & {});

export type ToolType =
  | 'select'
  | 'pan'
  | 'sticky'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'cylinder'
  | 'arrow'
  | 'draw'
  | 'text'
  | 'frame'
  | 'eraser';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export type ViewMode = 'canvas' | 'graph' | 'ledger' | 'artifacts';

export interface Point {
  x: number;
  y: number;
}

export interface ElementStyle {
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  roughness?: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  semanticType: SemanticType;
  confidence: ConfidenceType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  points?: Point[];
  style: ElementStyle;
  groupId?: string;
  sourceElementId?: string;
  targetElementId?: string;
  relationshipType?: RelationshipType;
  zIndex: number;
  author?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface DecisionRecord {
  decisionId: string;
  title: string;
  rationale: string;
  alternatives: string[];
  status: 'Proposed' | 'Accepted' | 'Rejected' | 'Superseded' | 'Final';
  linkedElementIds: string[];
  createdAt?: string;
}

export interface TraceableNode {
  nodeId: string;
  section: string;
  text: string;
  sourceElementId?: string;
  semanticType?: string;
}

export interface ArtifactRecord {
  artifactId: string;
  type: 'prd' | 'tech_spec' | 'action_items' | 'meeting_summary' | 'risk_assessment' | 'synthesis';
  title: string;
  content: string;
  traceableNodes: TraceableNode[];
  isStale?: boolean;
  staleReason?: string;
  createdAt?: string;
}

export interface ContextGap {
  id: string;
  type: 'MISSING_REQUIREMENT' | 'CONTRADICTION' | 'UNSUPPORTED_ASSUMPTION' | 'UNDEFINED_DEPENDENCY' | 'AMBIGUOUS_SCOPE';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestedResolution: string;
  relatedElementIds: string[];
}
