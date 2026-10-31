import { create } from 'zustand';
import type { CanvasElement } from '../types/canvas';
import { api } from '../services/api';
import { syncConnectedArrows } from './arrowSync';
import type { CanvasState } from './types';

export * from './types';
export * from './arrowSync';

let syncTimeout: any = null;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Core State
  workspaceId: 'default',
  workspaceName: 'sketch out',
  workspaces: [{ workspaceId: 'default', name: 'sketch out' }],
  elements: [],
  selectedIds: [],
  activeTool: 'select',
  activeStyle: {
    strokeColor: '#f4f4f5',
    fillColor: 'transparent',
    strokeWidth: 2,
    strokeStyle: 'solid',
    fontSize: 14,
    textAlign: 'left',
    opacity: 1,
  },
  viewport: { x: 0, y: 0, zoom: 1 },
  activeView: 'canvas',
  theme: 'dark',
  isSyncing: false,
  isFallbackMode: false,
  highlightedElementId: null,
  activeDrawer: 'none',

  // Persistence & Data
  decisions: [],
  artifacts: [],
  allDbArtifacts: [],
  gaps: [],

  // AI & Feedback
  aiStatus: { activeEngine: 'Local Heuristic Engine', isLiveGroq: false, groqConfigured: false },
  isGeneratingArtifact: false,
  isCompletingFlow: false,
  aiNotice: null,
  toast: null,

  // History stack for transactional undo/redo
  undoStack: [],
  redoStack: [],

  // Workspace & Navigation
  setWorkspaceId: (id) => set({ workspaceId: id }),
  setWorkspaceName: (name) => {
    set({ workspaceName: name });
    const { workspaceId } = get();
    api.updateWorkspace(workspaceId, { name });
  },

  setActiveTool: (activeTool) => set({ activeTool }),

  setActiveStyle: (styleUpdates) => {
    const { activeStyle, selectedIds, elements, undoStack } = get();
    const updatedStyle = { ...activeStyle, ...styleUpdates };

    if (selectedIds.length > 0) {
      const setIds = new Set(selectedIds);
      const updatedElements = elements.map((el) => {
        if (!setIds.has(el.id)) return el;
        return {
          ...el,
          style: {
            ...el.style,
            ...styleUpdates,
          },
          updatedAt: Date.now(),
        };
      });

      set({
        activeStyle: updatedStyle,
        elements: updatedElements,
        undoStack: [...undoStack.slice(-30), elements],
        redoStack: [],
      });
      get().syncToServer();
    } else {
      set({ activeStyle: updatedStyle });
    }
  },

  setActiveView: (activeView) => set({ activeView }),
  setActiveDrawer: (activeDrawer) => set({ activeDrawer }),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    set({ theme: nextTheme });
  },

  setSelectedIds: (selectedIds) => set({ selectedIds }),

  setViewport: (viewport) => {
    set((state) => ({
      viewport: typeof viewport === 'function' ? viewport(state.viewport) : viewport,
    }));
  },

  // Element Operations
  setElements: (elements, saveHistory = true) => {
    const synchronized = syncConnectedArrows(elements);
    if (saveHistory) {
      const { elements: current, undoStack } = get();
      set({
        elements: synchronized,
        undoStack: [...undoStack.slice(-30), current],
        redoStack: [],
      });
    } else {
      set({ elements: synchronized });
    }
    get().syncToServer();
  },

  addElement: (element) => {
    // Sanity filter: Ignore accidental negligible elements to prevent graph pollution
    if (element.type === 'text' && (!element.content || element.content.trim().length === 0)) {
      return;
    }
    if (element.type === 'draw') {
      if (!element.points || element.points.length < 2) return;
      const minX = Math.min(...element.points.map((p) => p.x));
      const maxX = Math.max(...element.points.map((p) => p.x));
      const minY = Math.min(...element.points.map((p) => p.y));
      const maxY = Math.max(...element.points.map((p) => p.y));
      if (maxX - minX < 4 && maxY - minY < 4) return;
    } else if (element.type === 'arrow') {
      if (element.points && element.points.length >= 2) {
        const dist = Math.hypot(element.points[1].x - element.points[0].x, element.points[1].y - element.points[0].y);
        if (dist < 8) return;
      }
    } else {
      if ((element.width || 0) < 10 && (element.height || 0) < 10) return;
    }

    const { elements, undoStack } = get();
    const updated = syncConnectedArrows([...elements, element]);
    set({
      elements: updated,
      undoStack: [...undoStack.slice(-30), elements],
      redoStack: [],
      selectedIds: [element.id],
    });
    get().syncToServer();
  },

  updateElement: (id, updates, saveHistory = true) => {
    const { elements, undoStack } = get();
    const updated = elements.map((el) => (el.id === id ? { ...el, ...updates, updatedAt: Date.now() } : el));
    const synchronized = syncConnectedArrows(updated);

    if (saveHistory) {
      set({
        elements: synchronized,
        undoStack: [...undoStack.slice(-30), elements],
        redoStack: [],
      });
    } else {
      set({ elements: synchronized });
    }
    get().syncToServer();
  },

  updateSelectedElements: (updates) => {
    const { elements, selectedIds, undoStack } = get();
    if (selectedIds.length === 0) return;
    const setIds = new Set(selectedIds);
    const updated = elements.map((el) => (setIds.has(el.id) ? { ...el, ...updates, updatedAt: Date.now() } : el));
    const synchronized = syncConnectedArrows(updated);

    set({
      elements: synchronized,
      undoStack: [...undoStack.slice(-30), elements],
      redoStack: [],
    });
    get().syncToServer();
  },

  resizeElement: (id, newBounds) => {
    get().updateElement(id, newBounds, false);
  },

  deleteSelectedElements: () => {
    const { elements, selectedIds, undoStack } = get();
    if (selectedIds.length === 0) return;
    const setIds = new Set(selectedIds);
    const remaining = elements.filter((el) => !setIds.has(el.id));
    const synchronized = syncConnectedArrows(remaining);

    set({
      elements: synchronized,
      selectedIds: [],
      undoStack: [...undoStack.slice(-30), elements],
      redoStack: [],
    });
    get().syncToServer();
  },

  deleteElement: (id) => {
    const { elements, undoStack } = get();
    const remaining = elements.filter((el) => el.id !== id);
    const synchronized = syncConnectedArrows(remaining);
    set({
      elements: synchronized,
      selectedIds: get().selectedIds.filter((sid) => sid !== id),
      undoStack: [...undoStack.slice(-30), elements],
      redoStack: [],
    });
    get().syncToServer();
  },

  clearCanvas: () => {
    const { elements, undoStack } = get();
    if (elements.length === 0) return;
    set({
      elements: [],
      selectedIds: [],
      undoStack: [...undoStack.slice(-30), elements],
      redoStack: [],
    });
    get().syncToServer();
  },

  duplicateSelected: () => {
    const { elements, selectedIds, undoStack } = get();
    if (selectedIds.length === 0) return;
    const setIds = new Set(selectedIds);
    const newItems: CanvasElement[] = [];

    elements.forEach((el) => {
      if (setIds.has(el.id)) {
        newItems.push({
          ...el,
          id: `elem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          x: el.x + 25,
          y: el.y + 25,
          points: el.points?.map((p) => ({ x: p.x + 25, y: p.y + 25 })),
          sourceElementId: undefined,
          targetElementId: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    });

    const combined = [...elements, ...newItems];
    set({
      elements: combined,
      selectedIds: newItems.map((n) => n.id),
      undoStack: [...undoStack.slice(-30), elements],
      redoStack: [],
    });
    get().syncToServer();
  },

  bringToFront: () => {
    const { elements, selectedIds, undoStack } = get();
    if (selectedIds.length === 0) return;
    const setIds = new Set(selectedIds);
    const unselected = elements.filter((el) => !setIds.has(el.id));
    const selected = elements.filter((el) => setIds.has(el.id));
    set({
      elements: [...unselected, ...selected],
      undoStack: [...undoStack.slice(-30), elements],
      redoStack: [],
    });
    get().syncToServer();
  },

  sendToBack: () => {
    const { elements, selectedIds, undoStack } = get();
    if (selectedIds.length === 0) return;
    const setIds = new Set(selectedIds);
    const unselected = elements.filter((el) => !setIds.has(el.id));
    const selected = elements.filter((el) => setIds.has(el.id));
    set({
      elements: [...selected, ...unselected],
      undoStack: [...undoStack.slice(-30), elements],
      redoStack: [],
    });
    get().syncToServer();
  },

  bringForward: () => {
    const { elements, selectedIds, undoStack } = get();
    if (selectedIds.length === 0) return;
    const newElements = [...elements];
    const setIds = new Set(selectedIds);
    for (let i = newElements.length - 2; i >= 0; i--) {
      if (setIds.has(newElements[i].id) && !setIds.has(newElements[i + 1].id)) {
        const temp = newElements[i];
        newElements[i] = newElements[i + 1];
        newElements[i + 1] = temp;
      }
    }
    set({
      elements: newElements,
      undoStack: [...undoStack.slice(-30), elements],
      redoStack: [],
    });
    get().syncToServer();
  },

  sendBackward: () => {
    const { elements, selectedIds, undoStack } = get();
    if (selectedIds.length === 0) return;
    const newElements = [...elements];
    const setIds = new Set(selectedIds);
    for (let i = 1; i < newElements.length; i++) {
      if (setIds.has(newElements[i].id) && !setIds.has(newElements[i - 1].id)) {
        const temp = newElements[i];
        newElements[i] = newElements[i - 1];
        newElements[i - 1] = temp;
      }
    }
    set({
      elements: newElements,
      undoStack: [...undoStack.slice(-30), elements],
      redoStack: [],
    });
    get().syncToServer();
  },

  setSemanticType: (id, semanticType) => {
    get().updateElement(id, { semanticType });
  },

  setRelationshipType: (id, relationshipType) => {
    get().updateElement(id, { relationshipType });
  },

  // Viewport & Zoom Navigation
  zoomIn: () => {
    set((state) => {
      const zoomFactor = 1.25;
      const newZoom = Math.min(state.viewport.zoom * zoomFactor, 5);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const factor = newZoom / state.viewport.zoom;
      return {
        viewport: {
          zoom: newZoom,
          x: cx - (cx - state.viewport.x) * factor,
          y: cy - (cy - state.viewport.y) * factor,
        },
      };
    });
  },

  zoomOut: () => {
    set((state) => {
      const zoomFactor = 0.8;
      const newZoom = Math.max(state.viewport.zoom * zoomFactor, 0.1);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const factor = newZoom / state.viewport.zoom;
      return {
        viewport: {
          zoom: newZoom,
          x: cx - (cx - state.viewport.x) * factor,
          y: cy - (cy - state.viewport.y) * factor,
        },
      };
    });
  },

  resetZoom: () => {
    set((state) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const factor = 1 / state.viewport.zoom;
      return {
        viewport: {
          zoom: 1,
          x: cx - (cx - state.viewport.x) * factor,
          y: cy - (cy - state.viewport.y) * factor,
        },
      };
    });
  },

  zoomToFit: () => {
    const { elements } = get();
    if (elements.length === 0) {
      set({ viewport: { x: 0, y: 0, zoom: 1 } });
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach((el) => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + (el.width || 100));
      maxY = Math.max(maxY, el.y + (el.height || 60));
    });

    const padding = 120;
    const width = Math.max(maxX - minX + padding * 2, 200);
    const height = Math.max(maxY - minY + padding * 2, 200);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const zoom = Math.min(Math.max(Math.min(viewportWidth / width, viewportHeight / height), 0.2), 2);
    const x = (viewportWidth - (maxX + minX) * zoom) / 2;
    const y = (viewportHeight - (maxY + minY) * zoom) / 2;

    set({ viewport: { x, y, zoom } });
  },

  focusElement: (elementId) => {
    const { elements, viewport } = get();
    const target = elements.find((e) => e.id === elementId);
    if (!target) return;

    set({ activeView: 'canvas', highlightedElementId: target.id, selectedIds: [target.id] });

    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    const targetCenterX = target.x + (target.width || 150) / 2;
    const targetCenterY = target.y + (target.height || 100) / 2;

    const newX = screenCenterX - targetCenterX * viewport.zoom;
    const newY = screenCenterY - targetCenterY * viewport.zoom;

    set({
      viewport: {
        ...viewport,
        x: newX,
        y: newY,
      },
    });

    setTimeout(() => {
      if (get().highlightedElementId === target.id) {
        set({ highlightedElementId: null });
      }
    }, 3500);
  },

  undo: () => {
    const { undoStack, redoStack, elements } = get();
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    set({
      elements: previous,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, elements],
    });
    get().syncToServer();
  },

  redo: () => {
    const { undoStack, redoStack, elements } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      elements: next,
      undoStack: [...undoStack, elements],
      redoStack: redoStack.slice(0, -1),
    });
    get().syncToServer();
  },

  // Persistence & Server Sync
  loadWorkspace: async (id = 'default') => {
    try {
      const data = await api.getWorkspace(id);
      const rawElements = (data.elements || []).map((e: any) => ({
        ...e,
        id: e.elementId || e.id,
        x: Number(e.x) || 0,
        y: Number(e.y) || 0,
        width: Math.abs(Number(e.width) || 120),
        height: Math.abs(Number(e.height) || 80),
        style: e.style || {},
      }));
      const synchronized = syncConnectedArrows(rawElements);

      set({
        workspaceId: data.workspace.workspaceId,
        workspaceName: data.workspace.name || 'sketch out',
        elements: synchronized,
        selectedIds: [],
        activeTool: 'select',
        highlightedElementId: null,
        decisions: data.decisions || [],
        artifacts: data.artifacts || [],
        viewport: data.workspace.viewport || { x: 0, y: 0, zoom: 1 },
        isFallbackMode: false,
      });
      try {
        localStorage.setItem(`sketchout_workspace_${id}`, JSON.stringify(data));
      } catch {}
    } catch {
      console.warn('Backend server connecting, checking local cached canvas state...');
      try {
        const local = localStorage.getItem(`sketchout_workspace_${id}`);
        if (local) {
          const parsed = JSON.parse(local);
          const rawElements = (parsed.elements || []).map((e: any) => ({
            ...e,
            id: e.elementId || e.id,
            x: Number(e.x) || 0,
            y: Number(e.y) || 0,
            width: Math.abs(Number(e.width) || 120),
            height: Math.abs(Number(e.height) || 80),
            style: e.style || {},
          }));
          const synchronized = syncConnectedArrows(rawElements);
          set({
            elements: synchronized,
            selectedIds: [],
            activeTool: 'select',
            highlightedElementId: null,
            decisions: parsed.decisions || [],
            artifacts: parsed.artifacts || [],
          });
        }
      } catch {}
      set({ isFallbackMode: true });
    }
    get().fetchAIStatus();
  },

  syncToServer: async () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      const { workspaceId, elements } = get();
      // Always store local snapshot to prevent data loss
      try {
        localStorage.setItem(`sketchout_elements_${workspaceId}`, JSON.stringify(elements));
      } catch {}

      set({ isSyncing: true });
      try {
        const res = await api.syncElements(workspaceId, elements);
        if (res && res.isFallbackMode) {
          set({ isFallbackMode: true });
        } else {
          set({ isFallbackMode: false });
        }
      } catch {
        set({ isFallbackMode: true });
      } finally {
        set({ isSyncing: false });
      }
    }, 600);
  },

  fetchAIStatus: async () => {
    const status = await api.getAIStatus();
    set({ aiStatus: status });
  },

  showToast: (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    set({
      toast: {
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        message,
        type,
      },
      aiNotice: message,
    });
  },

  dismissToast: () => {
    set({ toast: null, aiNotice: null });
  },

  runGapDetection: async () => {
    const { workspaceId, elements } = get();
    try {
      const res = await api.detectGaps(workspaceId, elements);
      if (res.error) {
        get().showToast(res.error, 'error');
        return;
      }
      if (res.result?.gaps) {
        set({ gaps: res.result.gaps, activeDrawer: 'gaps' });
      }
    } catch (err: any) {
      console.error('Gap detection failed:', err);
      get().showToast(err.message || 'Gap detection failed', 'error');
    }
  },

  runSessionAnalysis: async () => {
    const { workspaceId, elements } = get();
    try {
      const res = await api.analyzeSession(workspaceId, elements);
      if (res.error) {
        get().showToast(res.error, 'error');
        return null;
      }
      if (res.result?.decisions) {
        set({ decisions: res.result.decisions });
      }
      return res.result;
    } catch (err: any) {
      console.error('Session analysis failed:', err);
      get().showToast(err.message || 'Session analysis failed', 'error');
      return null;
    }
  },

  setAiNotice: (aiNotice) => {
    if (!aiNotice) {
      set({ aiNotice: null, toast: null });
    } else {
      const isError = /error|failed|not found|404|500|429/i.test(aiNotice);
      const isSuccess = /generated|synced|retrieved|saved|success/i.test(aiNotice);
      get().showToast(aiNotice, isError ? 'error' : isSuccess ? 'success' : 'info');
    }
  },

  generateArtifact: async (type: string = 'prd') => {
    const { workspaceId, elements } = get();
    set({ isGeneratingArtifact: true });
    get().dismissToast();
    try {
      const res = await api.generateArtifact(type, workspaceId, elements);
      if (res.error) {
        set({ isGeneratingArtifact: false });
        get().showToast(res.error, 'error');
        return null;
      }
      if (res.result) {
        const artifacts = await api.getArtifacts(workspaceId);
        const notice = res.isCached
          ? 'Retrieved from cache (0 Groq tokens)'
          : `Documentation generated successfully`;
        set({
          artifacts: artifacts.artifacts || [res.result],
          aiNotice: notice,
          isGeneratingArtifact: false,
          activeView: 'artifacts',
        });
        get().showToast(notice, 'success');
      }
      return res.result;
    } catch (err: any) {
      console.error('Artifact generation failed:', err);
      set({ isGeneratingArtifact: false });
      get().showToast(err.message || 'Documentation generation failed', 'error');
      return null;
    }
  },

  generateFunctionalDocs: async () => {
    return get().generateArtifact('prd');
  },

  deleteArtifactRecord: async (artifactId: string) => {
    const { workspaceId, artifacts, allDbArtifacts } = get();
    try {
      await api.deleteArtifact(workspaceId, artifactId);
      set({
        artifacts: artifacts.filter((a) => a.artifactId !== artifactId),
        allDbArtifacts: allDbArtifacts.filter((a) => a.artifactId !== artifactId),
      });
      get().showToast('Artifact deleted from database', 'info');
    } catch (err: any) {
      console.error('Failed to delete artifact:', err);
      get().showToast('Failed to delete artifact', 'error');
    }
  },

  fetchAllDbArtifacts: async () => {
    const { workspaceId } = get();
    try {
      const res = await api.getArtifacts(workspaceId, 'all');
      if (res && res.artifacts) {
        set({ allDbArtifacts: res.artifacts });
      }
    } catch (err: any) {
      console.warn('Failed to fetch all DB artifacts:', err);
    }
  },

  importArtifactToWorkspace: async (artifactId: string) => {
    const { workspaceId, artifacts, allDbArtifacts } = get();
    try {
      const res = await api.importArtifact(workspaceId, artifactId);
      if (res && res.artifact) {
        set({
          artifacts: [res.artifact, ...artifacts.filter((a) => a.artifactId !== res.artifact.artifactId)],
          allDbArtifacts: [res.artifact, ...allDbArtifacts],
        });
        get().showToast(`Artifact "${res.artifact.title}" linked to workspace!`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to import artifact:', err);
      get().showToast('Failed to import artifact to workspace', 'error');
    }
  },

  completeFlowAction: async (targetElementId?: string) => {
    const { workspaceId, elements, selectedIds, undoStack } = get();
    set({ isCompletingFlow: true });

    try {
      const activeId =
        targetElementId ||
        selectedIds[0] ||
        elements.filter((e) => e.type !== 'arrow').slice(-1)[0]?.id ||
        '';

      const res = await api.completeFlow(workspaceId, activeId, elements);

      if (res && res.createdElements && res.createdElements.length > 0) {
        const newElements = [...elements, ...res.createdElements];
        const lastNode = res.createdElements.filter((e: any) => e.type !== 'arrow').slice(-1)[0];

        set({
          elements: newElements,
          selectedIds: lastNode ? [lastNode.id] : selectedIds,
          undoStack: [...undoStack.slice(-30), elements],
          redoStack: [],
          isCompletingFlow: false,
        });

        get().syncToServer();
        get().showToast(`AI added ${res.suggestions?.length || 2} steps to complete the flow!`, 'success');
      } else {
        set({ isCompletingFlow: false });
        get().showToast('Could not suggest completion for this step.', 'info');
      }
    } catch (err: any) {
      console.error('completeFlowAction failed:', err);
      set({ isCompletingFlow: false });
      get().showToast('Flow completion unavailable', 'error');
    }
  },

  fetchWorkspaces: async () => {
    try {
      const res = await api.getWorkspaces();
      if (res && res.workspaces) {
        set({ workspaces: res.workspaces });
      }
    } catch (err) {
      console.warn('Could not fetch workspaces:', err);
    }
  },

  switchWorkspace: async (targetWorkspaceId: string) => {
    const { syncToServer } = get();
    await syncToServer();
    await get().loadWorkspace(targetWorkspaceId);
    set({
      activeTool: 'select',
      selectedIds: [],
      highlightedElementId: null,
      activeDrawer: 'none',
    });
    get().showToast(`Switched to workspace`, 'info');
  },

  createWorkspace: async (name: string) => {
    try {
      const res = await api.createWorkspace(name);
      if (res && res.workspace) {
        await get().fetchWorkspaces();
        await get().switchWorkspace(res.workspace.workspaceId);
        get().showToast(`Created workspace: ${res.workspace.name}`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to create workspace:', err);
      get().showToast('Failed to create workspace', 'error');
    }
  },

  deleteWorkspace: async (targetWorkspaceId: string) => {
    const { workspaceId, workspaces } = get();
    if (workspaces.length <= 1) {
      get().showToast('Cannot delete the only workspace', 'error');
      return;
    }
    try {
      await api.deleteWorkspace(targetWorkspaceId);
      const remaining = workspaces.filter((w) => w.workspaceId !== targetWorkspaceId);
      set({ workspaces: remaining });
      if (workspaceId === targetWorkspaceId) {
        await get().switchWorkspace(remaining[0].workspaceId);
      }
      get().showToast('Workspace deleted', 'info');
    } catch (err: any) {
      console.error('Failed to delete workspace:', err);
      get().showToast('Failed to delete workspace', 'error');
    }
  },

  copyFromWorkspace: async (sourceWorkspaceId: string) => {
    const { workspaceId, loadWorkspace } = get();
    try {
      const res = await api.copyWorkspaceContext(workspaceId, sourceWorkspaceId);
      if (res && res.elements) {
        await loadWorkspace(workspaceId);
        get().showToast(`Imported ${res.count} elements from workspace`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to copy workspace elements:', err);
      get().showToast(err.message || 'Failed to copy elements', 'error');
    }
  },

  exportCanvasJson: () => {
    const { workspaceName, elements, decisions, artifacts } = get();
    const data = {
      workspaceName,
      exportedAt: new Date().toISOString(),
      elements,
      decisions,
      artifacts,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workspaceName.toLowerCase().replace(/\s+/g, '-')}-canvas-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    get().showToast('Canvas exported as JSON', 'success');
  },

  importCanvasJson: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.elements)) {
        const { elements: existingElements, undoStack } = get();

        // Calculate offset if canvas already has elements so imported items don't overlap
        let offsetX = 0;
        let offsetY = 0;
        if (existingElements.length > 0) {
          let maxX = -Infinity;
          let minY = Infinity;
          existingElements.forEach((el) => {
            const right = (Number(el.x) || 0) + (Math.abs(Number(el.width)) || 120);
            if (right > maxX) maxX = right;
            if (el.y < minY) minY = el.y;
          });
          offsetX = isFinite(maxX) ? maxX + 80 : 80;
          offsetY = isFinite(minY) ? minY : 0;
        }

        // Remap IDs to guarantee zero key collisions
        const idMap = new Map<string, string>();
        parsed.elements.forEach((el: any) => {
          const oldId = el.elementId || el.id;
          const newId = `elem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          if (oldId) idMap.set(oldId, newId);
        });

        const importedClones: any[] = parsed.elements.map((el: any) => {
          const oldId = el.elementId || el.id;
          const newId = (oldId && idMap.get(oldId)) || `elem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

          const isArrowOrDraw = el.type === 'arrow' || el.type === 'draw';
          let points = undefined;
          if (el.points && Array.isArray(el.points) && el.points.length > 0) {
            points = el.points.map((p: any) => ({
              x: Number(p.x) + offsetX,
              y: Number(p.y) + offsetY,
            }));
          }

          const rawX = Number(el.x) || 0;
          const rawY = Number(el.y) || 0;
          const width = Math.abs(Number(el.width) || 120);
          const height = Math.abs(Number(el.height) || 80);

          let finalX = rawX + offsetX;
          let finalY = rawY + offsetY;
          if (isArrowOrDraw && points && points.length >= 2) {
            finalX = Math.min(...points.map((p: any) => p.x));
            finalY = Math.min(...points.map((p: any) => p.y));
          }

          return {
            ...el,
            id: newId,
            elementId: newId,
            x: finalX,
            y: finalY,
            width,
            height,
            points,
            sourceElementId: el.sourceElementId ? (idMap.get(el.sourceElementId) || el.sourceElementId) : undefined,
            targetElementId: el.targetElementId ? (idMap.get(el.targetElementId) || el.targetElementId) : undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        });

        const mergedElements = syncConnectedArrows([...existingElements, ...importedClones]);
        set({
          elements: mergedElements,
          undoStack: [...undoStack.slice(-30), existingElements],
          redoStack: [],
          selectedIds: importedClones.map((e) => e.id),
          activeTool: 'select',
        });
        get().syncToServer();

        // Merge decisions and artifacts if present without replacing existing
        if (Array.isArray(parsed.decisions) && parsed.decisions.length > 0) {
          const { decisions: existingDecisions } = get();
          const existingTitles = new Set(existingDecisions.map((d) => d.title.toLowerCase()));
          const newDecisions = parsed.decisions.filter((d: any) => !existingTitles.has((d.title || '').toLowerCase()));
          if (newDecisions.length > 0) {
            set({ decisions: [...existingDecisions, ...newDecisions] });
          }
        }

        get().showToast(`Imported and merged ${importedClones.length} elements`, 'success');
      } else {
        get().showToast('Invalid JSON file format (missing elements array)', 'error');
      }
    } catch (err: any) {
      get().showToast('Failed to parse JSON file', 'error');
    }
  },

  createDecisionRecord: async (decision) => {
    const { workspaceId } = get();
    try {
      await api.createDecision(workspaceId, decision);
      const updated = await api.getDecisions(workspaceId);
      set({ decisions: updated.decisions || [] });
    } catch (err) {
      console.error('Failed to create decision:', err);
    }
  },
}));
