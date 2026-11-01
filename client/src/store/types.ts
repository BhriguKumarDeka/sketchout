import type {
  CanvasElement,
  SemanticType,
  ToolType,
  Viewport,
  ViewMode,
  DecisionRecord,
  ArtifactRecord,
  ContextGap,
  RelationshipType,
  ElementStyle,
  ResizeHandle,
} from '../types/canvas';

export interface ToastInfo {
  id: string;
  message: string;
  type?: 'info' | 'error' | 'success';
}

export interface AIStatusInfo {
  activeEngine: string;
  isLiveGroq: boolean;
  groqConfigured: boolean;
}

export interface WorkspaceSummary {
  workspaceId: string;
  name: string;
  description?: string;
  updatedAt?: string;
}

export interface CanvasState {
  // Core Canvas State
  workspaceId: string;
  workspaceName: string;
  workspaces: WorkspaceSummary[];
  elements: CanvasElement[];
  selectedIds: string[];
  activeTool: ToolType;
  activeStyle: ElementStyle;
  viewport: Viewport;
  activeView: ViewMode;
  theme: 'dark' | 'light' | 'cutting-mat';
  isSyncing: boolean;
  isFallbackMode: boolean;
  highlightedElementId: string | null;
  activeDrawer: 'none' | 'ask' | 'gaps' | 'analysis' | 'generate';

  // Persistence & Data
  decisions: DecisionRecord[];
  artifacts: ArtifactRecord[];
  allDbArtifacts: ArtifactRecord[];
  gaps: ContextGap[];

  // AI & Feedback
  aiStatus: AIStatusInfo;
  isGeneratingArtifact: boolean;
  isCompletingFlow: boolean;
  aiNotice: string | null;
  toast: ToastInfo | null;

  // History stack for transactional undo/redo
  undoStack: CanvasElement[][];
  redoStack: CanvasElement[][];

  // Workspace Actions
  setWorkspaceId: (id: string) => void;
  setWorkspaceName: (name: string) => void;
  fetchWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  copyFromWorkspace: (sourceWorkspaceId: string) => Promise<void>;

  // Export / Import
  exportCanvasJson: () => void;
  importCanvasJson: (jsonString: string) => void;

  // Canvas Actions
  setActiveTool: (tool: ToolType) => void;
  setActiveStyle: (style: Partial<ElementStyle>) => void;
  setActiveView: (view: ViewMode) => void;
  setActiveDrawer: (drawer: 'none' | 'ask' | 'gaps' | 'analysis' | 'generate') => void;
  setTheme: (theme: 'dark' | 'light' | 'cutting-mat') => void;
  toggleTheme: () => void;
  setSelectedIds: (ids: string[]) => void;
  setViewport: (viewport: Viewport | ((prev: Viewport) => Viewport)) => void;

  // Element CRUD Operations
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>, saveHistory?: boolean) => void;
  updateSelectedElements: (updates: Partial<CanvasElement>) => void;
  resizeElement: (id: string, newBounds: { x: number; y: number; width: number; height: number }, handle?: ResizeHandle) => void;
  deleteSelectedElements: () => void;
  deleteElement: (id: string) => void;
  duplicateSelected: () => void;
  clearCanvas: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  setElements: (elements: CanvasElement[], saveHistory?: boolean) => void;

  // Semantic operations
  setSemanticType: (id: string, semanticType: SemanticType) => void;
  setRelationshipType: (id: string, relType: RelationshipType) => void;

  // Viewport navigation & Traceability
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  zoomToFit: () => void;
  focusElement: (elementId: string) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;

  // Persistence & Server sync
  loadWorkspace: (id?: string) => Promise<void>;
  syncToServer: () => Promise<void>;

  // AI Actions & Artifacts
  fetchAIStatus: () => Promise<void>;
  runGapDetection: () => Promise<void>;
  runSessionAnalysis: () => Promise<any>;
  generateArtifact: (type?: string) => Promise<any>;
  generateFunctionalDocs: () => Promise<any>;
  deleteArtifactRecord: (artifactId: string) => Promise<void>;
  fetchAllDbArtifacts: () => Promise<void>;
  importArtifactToWorkspace: (artifactId: string) => Promise<void>;
  completeFlowAction: (elementId?: string) => Promise<void>;
  setAiNotice: (notice: string | null) => void;
  showToast: (message: string, type?: 'info' | 'error' | 'success') => void;
  dismissToast: () => void;
  createDecisionRecord: (decision: Partial<DecisionRecord>) => Promise<void>;
}
