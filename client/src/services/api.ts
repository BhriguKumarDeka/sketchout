import type { CanvasElement, DecisionRecord, ArtifactRecord } from '../types/canvas';

const API_BASE = '/api';

export interface WorkspaceData {
  workspace: {
    workspaceId: string;
    name: string;
    description: string;
    activeView: string;
    viewport: { x: number; y: number; zoom: number };
  };
  elements: any[];
  decisions: DecisionRecord[];
  artifacts: ArtifactRecord[];
}

export interface WorkspaceSummary {
  workspaceId: string;
  name: string;
  description?: string;
  updatedAt?: string;
}

export const api = {
  // 1. Workspaces
  async getWorkspaces(): Promise<{ success: boolean; workspaces: WorkspaceSummary[] }> {
    try {
      const res = await fetch(`${API_BASE}/workspaces`);
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      return await res.json();
    } catch {
      return {
        success: true,
        workspaces: [{ workspaceId: 'default', name: 'sketch out', description: 'Default workspace' }],
      };
    }
  },

  async createWorkspace(name: string, description?: string): Promise<{ success: boolean; workspace: WorkspaceSummary }> {
    const res = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    return res.json();
  },

  async deleteWorkspace(workspaceId: string) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async copyWorkspaceContext(targetWorkspaceId: string, sourceWorkspaceId: string) {
    const res = await fetch(`${API_BASE}/workspaces/${targetWorkspaceId}/copy-from/${sourceWorkspaceId}`, {
      method: 'POST',
    });
    return res.json();
  },

  async getWorkspace(workspaceId: string = 'default'): Promise<WorkspaceData> {
    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch workspace');
      return await res.json();
    } catch {
      return {
        workspace: {
          workspaceId,
          name: workspaceId === 'default' ? 'sketch out' : 'Workspace',
          description: 'Context-Aware Visual Thinking & Execution Workspace',
          activeView: 'canvas',
          viewport: { x: 0, y: 0, zoom: 1 },
        },
        elements: [],
        decisions: [],
        artifacts: [],
      };
    }
  },

  async updateWorkspace(workspaceId: string, data: Partial<WorkspaceData['workspace']>) {
    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { success: true, isFallbackMode: true };
    }
  },

  async syncElements(workspaceId: string, elements: CanvasElement[]) {
    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/elements/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elements }),
      });
      if (!res.ok) return { success: true, count: elements.length, isFallbackMode: true };
      return await res.json();
    } catch {
      return { success: true, count: elements.length, isFallbackMode: true };
    }
  },

  async getContextGraph(workspaceId: string) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/graph`);
    return res.json();
  },

  // 2. Decisions
  async getDecisions(workspaceId: string) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/decisions`);
    return res.json();
  },

  async createDecision(workspaceId: string, decision: Partial<DecisionRecord>) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decision),
    });
    return res.json();
  },

  // 3. Artifacts (with delete)
  async getArtifacts(workspaceId: string) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/artifacts`);
    return res.json();
  },

  async createArtifact(workspaceId: string, artifact: Partial<ArtifactRecord>) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/artifacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artifact),
    });
    return res.json();
  },

  async deleteArtifact(workspaceId: string, artifactId: string) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/artifacts/${artifactId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // 4. AI Endpoints
  async getAIStatus() {
    try {
      const res = await fetch(`${API_BASE}/ai/status`);
      return await res.json();
    } catch {
      return { activeEngine: 'Local Heuristic Engine', isLiveGroq: false, groqConfigured: false };
    }
  },

  async askCanvas(question: string, workspaceId: string, elements: CanvasElement[], mode: 'casual' | 'technical' = 'casual') {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, workspaceId, elements, mode }),
    });
    return res.json();
  },

  async analyzeSession(workspaceId: string, elements: CanvasElement[]) {
    const res = await fetch(`${API_BASE}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, elements }),
    });
    return res.json();
  },

  async detectGaps(workspaceId: string, elements: CanvasElement[]) {
    const res = await fetch(`${API_BASE}/ai/gaps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, elements }),
    });
    return res.json();
  },

  async generateArtifact(type: string, workspaceId: string, elements: CanvasElement[]) {
    const res = await fetch(`${API_BASE}/ai/generate-artifact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, workspaceId, elements }),
    });
    return res.json();
  },
};
