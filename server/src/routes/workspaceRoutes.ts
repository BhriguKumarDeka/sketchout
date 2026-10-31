import { Router, Request, Response } from 'express';
import { WorkspaceModel } from '../models/Workspace.js';
import { CanvasElementModel } from '../models/CanvasElement.js';
import { DecisionModel } from '../models/Decision.js';
import { ArtifactModel } from '../models/Artifact.js';
import { ContextEngine } from '../services/contextEngine.js';

const router = Router();

// In-memory fallback cache in case MongoDB is temporarily offline
const memoryDb = {
  workspaces: new Map<string, any>(),
  elements: new Map<string, any[]>(),
  decisions: new Map<string, any[]>(),
  artifacts: new Map<string, any[]>(),
};

// 1. List all available workspaces
router.get('/', async (_req: Request, res: Response) => {
  try {
    const workspaces = await WorkspaceModel.find({}).sort({ updatedAt: -1 });
    if (workspaces.length === 0) {
      // Ensure default workspace exists
      const defaultWs = await WorkspaceModel.create({
        workspaceId: 'default',
        name: 'sketch out',
        description: 'Context-Aware Visual Thinking & Execution Workspace',
      });
      return res.json({ success: true, workspaces: [defaultWs] });
    }
    return res.json({ success: true, workspaces });
  } catch (err) {
    if (memoryDb.workspaces.size === 0) {
      memoryDb.workspaces.set('default', {
        workspaceId: 'default',
        name: 'sketch out',
        description: 'Context-Aware Visual Thinking & Execution Workspace',
      });
    }
    return res.json({
      success: true,
      workspaces: Array.from(memoryDb.workspaces.values()),
      isFallbackMode: true,
    });
  }
});

// 2. Create a new workspace
router.post('/', async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const workspaceId = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const wsData = {
    workspaceId,
    name: name?.trim() || 'New Workspace',
    description: description?.trim() || 'Visual canvas workspace',
    activeView: 'canvas',
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  try {
    const created = await WorkspaceModel.create(wsData);
    return res.json({ success: true, workspace: created });
  } catch (err) {
    memoryDb.workspaces.set(workspaceId, wsData);
    return res.json({ success: true, workspace: wsData, isFallbackMode: true });
  }
});

// 3. Delete a workspace
router.delete('/:workspaceId', async (req: Request, res: Response) => {
  const workspaceId = String(req.params.workspaceId);
  try {
    await WorkspaceModel.deleteOne({ workspaceId });
    await CanvasElementModel.deleteMany({ workspaceId });
    await DecisionModel.deleteMany({ workspaceId });
    await ArtifactModel.deleteMany({ workspaceId });
    return res.json({ success: true, workspaceId });
  } catch (err) {
    memoryDb.workspaces.delete(workspaceId);
    memoryDb.elements.delete(workspaceId);
    memoryDb.decisions.delete(workspaceId);
    memoryDb.artifacts.delete(workspaceId);
    return res.json({ success: true, workspaceId, isFallbackMode: true });
  }
});

// 4. Copy/Export/Load Canvas context from another workspace
router.post('/:workspaceId/copy-from/:sourceWorkspaceId', async (req: Request, res: Response) => {
  const targetWorkspaceId = String(req.params.workspaceId);
  const sourceWorkspaceId = String(req.params.sourceWorkspaceId);

  try {
    let sourceElements = await CanvasElementModel.find({ workspaceId: sourceWorkspaceId });
    if (sourceElements.length === 0) {
      sourceElements = memoryDb.elements.get(sourceWorkspaceId) || [];
    }

    if (sourceElements.length === 0) {
      return res.status(404).json({ error: 'Source workspace contains no canvas elements' });
    }

    // Check target workspace existing elements to calculate clean non-overlapping offset
    let targetElements: any[] = [];
    try {
      targetElements = await CanvasElementModel.find({ workspaceId: targetWorkspaceId });
    } catch {
      targetElements = memoryDb.elements.get(targetWorkspaceId) || [];
    }

    let offsetX = 50;
    let offsetY = 50;
    if (targetElements.length > 0) {
      let maxX = -Infinity;
      targetElements.forEach((e: any) => {
        const right = (Number(e.x) || 0) + Math.abs(Number(e.width) || 120);
        if (right > maxX) maxX = right;
      });
      if (isFinite(maxX)) {
        offsetX = maxX + 80;
        offsetY = 0;
      }
    }

    // Remap element IDs to prevent key collisions
    const idMap = new Map<string, string>();
    const clonedElements = sourceElements.map((el: any) => {
      const raw = typeof el.toObject === 'function' ? el.toObject() : JSON.parse(JSON.stringify(el));
      delete raw._id;
      delete raw.__v;
      delete raw.createdAt;
      delete raw.updatedAt;

      const oldId = raw.elementId || raw.id;
      const newId = `elem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      if (oldId) idMap.set(oldId, newId);

      const isArrowOrDraw = raw.type === 'arrow' || raw.type === 'draw';
      let points = undefined;
      if (raw.points && Array.isArray(raw.points) && raw.points.length > 0) {
        points = raw.points.map((p: any) => ({
          x: Number(p.x) + offsetX,
          y: Number(p.y) + offsetY,
        }));
      }

      const rawX = Number(raw.x) || 0;
      const rawY = Number(raw.y) || 0;
      const width = Math.abs(Number(raw.width) || 120);
      const height = Math.abs(Number(raw.height) || 80);

      let finalX = rawX + offsetX;
      let finalY = rawY + offsetY;
      if (isArrowOrDraw && points && points.length >= 2) {
        finalX = Math.min(...points.map((p: any) => p.x));
        finalY = Math.min(...points.map((p: any) => p.y));
      }

      return {
        ...raw,
        elementId: newId,
        id: newId,
        workspaceId: targetWorkspaceId,
        x: finalX,
        y: finalY,
        width,
        height,
        points,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Update connector bindings
    clonedElements.forEach((el: any) => {
      if (el.sourceElementId && idMap.has(el.sourceElementId)) {
        el.sourceElementId = idMap.get(el.sourceElementId);
      }
      if (el.targetElementId && idMap.has(el.targetElementId)) {
        el.targetElementId = idMap.get(el.targetElementId);
      }
    });

    try {
      await CanvasElementModel.insertMany(clonedElements);
    } catch {
      const existing = memoryDb.elements.get(targetWorkspaceId) || [];
      memoryDb.elements.set(targetWorkspaceId, [...existing, ...clonedElements]);
    }

    return res.json({ success: true, count: clonedElements.length, elements: clonedElements });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to copy canvas context' });
  }
});

// 5. Get or create workspace
router.get('/:workspaceId', async (req: Request, res: Response) => {
  const workspaceId = String(req.params.workspaceId);
  try {
    let workspace = await WorkspaceModel.findOne({ workspaceId });
    if (!workspace) {
      workspace = await WorkspaceModel.create({
        workspaceId,
        name: workspaceId === 'default' ? 'sketch out' : 'Workspace',
        description: 'Context-Aware Visual Thinking & Execution Workspace',
      });
    }

    const elements = await CanvasElementModel.find({ workspaceId }).sort({ zIndex: 1 });
    const decisions = await DecisionModel.find({ workspaceId }).sort({ createdAt: -1 });
    const artifacts = await ArtifactModel.find({ workspaceId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      workspace,
      elements,
      decisions,
      artifacts,
    });
  } catch (err) {
    // Memory fallback
    if (!memoryDb.workspaces.has(workspaceId)) {
      memoryDb.workspaces.set(workspaceId, {
        workspaceId,
        name: workspaceId === 'default' ? 'sketch out' : 'Workspace',
        description: 'Context-Aware Visual Thinking & Execution Workspace',
        activeView: 'canvas',
        viewport: { x: 0, y: 0, zoom: 1 },
      });
    }

    return res.json({
      success: true,
      workspace: memoryDb.workspaces.get(workspaceId),
      elements: memoryDb.elements.get(workspaceId) || [],
      decisions: memoryDb.decisions.get(workspaceId) || [],
      artifacts: memoryDb.artifacts.get(workspaceId) || [],
      isFallbackMode: true,
    });
  }
});

// 6. Update workspace meta / viewport
router.patch('/:workspaceId', async (req: Request, res: Response) => {
  const workspaceId = String(req.params.workspaceId);
  const { name, description, activeView, viewport } = req.body;

  try {
    const updated = await WorkspaceModel.findOneAndUpdate(
      { workspaceId },
      { $set: { ...(name && { name }), ...(description && { description }), ...(activeView && { activeView }), ...(viewport && { viewport }) } },
      { new: true, upsert: true }
    );
    return res.json({ success: true, workspace: updated });
  } catch (err) {
    const current = memoryDb.workspaces.get(workspaceId) || { workspaceId, name: 'sketch out' };
    const updated = { ...current, ...req.body };
    memoryDb.workspaces.set(workspaceId, updated);
    return res.json({ success: true, workspace: updated, isFallbackMode: true });
  }
});

// 7. Batch sync elements (Save canvas state)
router.post('/:workspaceId/elements/sync', async (req: Request, res: Response) => {
  const workspaceId = String(req.params.workspaceId);
  const { elements } = req.body;

  if (!Array.isArray(elements)) {
    return res.status(400).json({ error: 'elements must be an array' });
  }

  try {
    await CanvasElementModel.deleteMany({ workspaceId });
    if (elements.length > 0) {
      const formatted = elements.map((e: any) => ({
        ...e,
        elementId: e.elementId || e.id,
        workspaceId,
      }));
      await CanvasElementModel.insertMany(formatted);
    }

    await ContextEngine.evaluateDocumentDrift(workspaceId);

    return res.json({ success: true, count: elements.length });
  } catch (err) {
    memoryDb.elements.set(workspaceId, elements);
    return res.json({ success: true, count: elements.length, isFallbackMode: true });
  }
});

// 8. Get Context Knowledge Graph
router.get('/:workspaceId/graph', async (req: Request, res: Response) => {
  const workspaceId = String(req.params.workspaceId);
  try {
    const graph = await ContextEngine.extractKnowledgeGraph(workspaceId);
    return res.json({ success: true, graph });
  } catch (err) {
    const elements = memoryDb.elements.get(workspaceId) || [];
    const nonArrows = elements.filter((e: any) => e.type !== 'arrow');
    return res.json({
      success: true,
      graph: {
        nodes: nonArrows,
        relationships: elements.filter((e: any) => e.type === 'arrow'),
        clusters: [],
        stats: {
          totalElements: nonArrows.length,
          ideas: nonArrows.filter((e: any) => e.semanticType === 'idea').length,
          decisions: nonArrows.filter((e: any) => e.semanticType === 'decision').length,
          questions: nonArrows.filter((e: any) => e.semanticType === 'question').length,
          requirements: nonArrows.filter((e: any) => e.semanticType === 'requirement').length,
          tasks: nonArrows.filter((e: any) => e.semanticType === 'task').length,
          risks: nonArrows.filter((e: any) => e.semanticType === 'risk').length,
          assumptions: nonArrows.filter((e: any) => e.semanticType === 'assumption').length,
        },
      },
      isFallbackMode: true,
    });
  }
});

// 9. Decisions CRUD
router.get('/:workspaceId/decisions', async (req: Request, res: Response) => {
  const workspaceId = String(req.params.workspaceId);
  try {
    const decisions = await DecisionModel.find({ workspaceId }).sort({ createdAt: -1 });
    return res.json({ success: true, decisions });
  } catch (err) {
    return res.json({ success: true, decisions: memoryDb.decisions.get(workspaceId) || [] });
  }
});

router.post('/:workspaceId/decisions', async (req: Request, res: Response) => {
  const workspaceId = String(req.params.workspaceId);
  const decisionData = { ...req.body, workspaceId, decisionId: req.body.decisionId || `dec-${Date.now()}` };

  try {
    const created = await DecisionModel.create(decisionData);
    return res.json({ success: true, decision: created });
  } catch (err) {
    const list = memoryDb.decisions.get(workspaceId) || [];
    list.unshift(decisionData);
    memoryDb.decisions.set(workspaceId, list);
    return res.json({ success: true, decision: decisionData, isFallbackMode: true });
  }
});

// 10. Artifacts CRUD (with Global Search, Unconditional Delete, and Cross-Workspace Import)
router.get('/:workspaceId/artifacts', async (req: Request, res: Response) => {
  const workspaceId = String(req.params.workspaceId);
  const scope = req.query.scope as string;

  try {
    const filter = scope === 'all' ? {} : { workspaceId };
    const artifacts = await ArtifactModel.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, artifacts, scope: scope || 'workspace' });
  } catch (err) {
    if (scope === 'all') {
      const all: any[] = [];
      memoryDb.artifacts.forEach((list) => all.push(...list));
      return res.json({ success: true, artifacts: all, scope: 'all' });
    }
    return res.json({ success: true, artifacts: memoryDb.artifacts.get(workspaceId) || [], scope: 'workspace' });
  }
});

router.post('/:workspaceId/artifacts', async (req: Request, res: Response) => {
  const workspaceId = String(req.params.workspaceId);
  const artifactData = { ...req.body, workspaceId, artifactId: req.body.artifactId || `art-${Date.now()}` };

  try {
    const created = await ArtifactModel.create(artifactData);
    return res.json({ success: true, artifact: created });
  } catch (err) {
    const list = memoryDb.artifacts.get(workspaceId) || [];
    list.unshift(artifactData);
    memoryDb.artifacts.set(workspaceId, list);
    return res.json({ success: true, artifact: artifactData, isFallbackMode: true });
  }
});

router.post('/:workspaceId/artifacts/:artifactId/import', async (req: Request, res: Response) => {
  const workspaceId = String(req.params.workspaceId);
  const artifactId = String(req.params.artifactId);

  try {
    const existing = await ArtifactModel.findOne({ artifactId });
    if (!existing) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    if (existing.workspaceId === workspaceId) {
      return res.json({ success: true, artifact: existing, message: 'Already belongs to this workspace' });
    }

    const newArtifactId = `art-${Date.now()}`;
    const cloned = await ArtifactModel.create({
      artifactId: newArtifactId,
      workspaceId,
      type: existing.type,
      title: `${existing.title} (Imported)`,
      content: existing.content,
      traceableNodes: existing.traceableNodes,
    });

    return res.json({ success: true, artifact: cloned });
  } catch (err: any) {
    // Memory fallback
    let found: any = null;
    memoryDb.artifacts.forEach((list) => {
      const match = list.find((a: any) => a.artifactId === artifactId);
      if (match) found = match;
    });

    if (found) {
      const cloned = { ...found, artifactId: `art-${Date.now()}`, workspaceId, title: `${found.title} (Imported)` };
      const current = memoryDb.artifacts.get(workspaceId) || [];
      current.unshift(cloned);
      memoryDb.artifacts.set(workspaceId, current);
      return res.json({ success: true, artifact: cloned, isFallbackMode: true });
    }
    return res.status(500).json({ error: err?.message || 'Failed to import artifact' });
  }
});

router.delete('/:workspaceId/artifacts/:artifactId', async (req: Request, res: Response) => {
  const artifactId = String(req.params.artifactId);

  try {
    // Unconditionally delete by artifactId so orphaned records across any workspace are genuinely erased
    await ArtifactModel.deleteMany({ artifactId });
    return res.json({ success: true, artifactId });
  } catch (err) {
    memoryDb.artifacts.forEach((list, key) => {
      memoryDb.artifacts.set(key, list.filter((a: any) => a.artifactId !== artifactId));
    });
    return res.json({ success: true, artifactId, isFallbackMode: true });
  }
});

export default router;
