import { Router, Request, Response } from 'express';
import { getAIProvider, CanvasContextPayload } from '../services/aiProvider.js';
import { CanvasElementModel } from '../models/CanvasElement.js';
import { DecisionModel } from '../models/Decision.js';
import { ArtifactModel } from '../models/Artifact.js';
import { aiCache, AICache } from '../services/aiCache.js';
import { aiRateLimiter } from '../services/aiRateLimiter.js';

const router = Router();

// Check AI Engine Status (Instant check, zero LLM calls)
router.get('/status', (req: Request, res: Response) => {
  const provider = getAIProvider();
  return res.json({
    activeEngine: provider.name,
    isLiveGroq: provider.isLive(),
    groqConfigured: !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 5),
  });
});

// Helper to sanitize diagram elements for caching key (all diagram shapes & arrows, excluding freehand pen strokes)
function getDiagramCacheSignature(elements: any[] = []): any {
  return elements
    .filter((e) => e.type !== 'draw')
    .map((e) => ({
      id: e.elementId || e.id,
      content: e.content?.trim(),
      type: e.type,
      src: e.sourceElementId || e.sourceId,
      tgt: e.targetElementId || e.targetId,
      rel: e.relationshipType,
    }));
}

// Normalizes element IDs so both client-sent (id) and DB-stored (elementId) shapes & arrows match flawlessly
function normalizeElements(elements: any[] = []): any[] {
  return elements.map((e) => ({
    ...e,
    elementId: e.elementId || e.id,
    id: e.id || e.elementId,
    sourceElementId: e.sourceElementId || e.sourceId,
    targetElementId: e.targetElementId || e.targetId,
  }));
}

// Ask Canvas (Explicit User Prompts Only)
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question, workspaceId, elements, decisions, mode = 'casual' } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    const rateCheck = aiRateLimiter.checkRateLimit(req.ip || 'global');
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: rateCheck.reason,
        rateLimited: true,
        retryAfter: rateCheck.retryAfterSeconds,
      });
    }

    let canvasElements = elements;
    let canvasDecisions = decisions;

    if (!canvasElements && workspaceId) {
      canvasElements = await CanvasElementModel.find({ workspaceId });
      canvasDecisions = await DecisionModel.find({ workspaceId });
    }
    canvasElements = normalizeElements(canvasElements);

    const cacheKey = AICache.generateKey('ask', {
      q: question.trim().toLowerCase(),
      mode: mode || 'casual',
      diagram: getDiagramCacheSignature(canvasElements),
      workspaceId,
    });

    const cached = aiCache.get(cacheKey);
    const provider = getAIProvider();

    if (cached) {
      return res.json({ success: true, result: cached, isCached: true, engine: provider.name });
    }

    const payload: CanvasContextPayload = {
      elements: canvasElements || [],
      decisions: canvasDecisions || [],
      userQuery: question,
      mode: (mode === 'technical' ? 'technical' : 'casual'),
    };

    const result = await aiRateLimiter.executeDeduplicated(cacheKey, async () => {
      const computed = await provider.askCanvas(question, payload);
      aiCache.set(cacheKey, computed);
      return computed;
    });

    return res.json({ success: true, result, isCached: false, engine: provider.name });
  } catch (err: any) {
    console.error('AI Ask error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process question' });
  }
});

// Session Analysis (Explicit User Request Only)
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { workspaceId, elements, decisions } = req.body;

    const rateCheck = aiRateLimiter.checkRateLimit(req.ip || 'global');
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: rateCheck.reason,
        rateLimited: true,
        retryAfter: rateCheck.retryAfterSeconds,
      });
    }

    let canvasElements = elements;
    let canvasDecisions = decisions;

    if (!canvasElements && workspaceId) {
      canvasElements = await CanvasElementModel.find({ workspaceId });
      canvasDecisions = await DecisionModel.find({ workspaceId });
    }
    canvasElements = normalizeElements(canvasElements);

    const cacheKey = AICache.generateKey('analyze', {
      diagram: getDiagramCacheSignature(canvasElements),
      workspaceId,
    });

    const cached = aiCache.get(cacheKey);
    const provider = getAIProvider();

    if (cached) {
      return res.json({ success: true, result: cached, isCached: true, engine: provider.name });
    }

    const payload: CanvasContextPayload = {
      elements: canvasElements || [],
      decisions: canvasDecisions || [],
    };

    const result = await aiRateLimiter.executeDeduplicated(cacheKey, async () => {
      const computed = await provider.analyzeSession(payload);
      aiCache.set(cacheKey, computed);
      return computed;
    });

    return res.json({ success: true, result, isCached: false, engine: provider.name });
  } catch (err: any) {
    console.error('AI Analysis error:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze session' });
  }
});

// Gap Detection (Explicit User Request Only)
router.post('/gaps', async (req: Request, res: Response) => {
  try {
    const { workspaceId, elements, decisions } = req.body;

    const rateCheck = aiRateLimiter.checkRateLimit(req.ip || 'global');
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: rateCheck.reason,
        rateLimited: true,
        retryAfter: rateCheck.retryAfterSeconds,
      });
    }

    let canvasElements = elements;
    let canvasDecisions = decisions;

    if (!canvasElements && workspaceId) {
      canvasElements = await CanvasElementModel.find({ workspaceId });
      canvasDecisions = await DecisionModel.find({ workspaceId });
    }
    canvasElements = normalizeElements(canvasElements);

    const cacheKey = AICache.generateKey('gaps', {
      diagram: getDiagramCacheSignature(canvasElements),
      workspaceId,
    });

    const cached = aiCache.get(cacheKey);
    const provider = getAIProvider();

    if (cached) {
      return res.json({ success: true, result: cached, isCached: true, engine: provider.name });
    }

    const payload: CanvasContextPayload = {
      elements: canvasElements || [],
      decisions: canvasDecisions || [],
    };

    const result = await aiRateLimiter.executeDeduplicated(cacheKey, async () => {
      const computed = await provider.detectGaps(payload);
      aiCache.set(cacheKey, computed);
      return computed;
    });

    return res.json({ success: true, result, isCached: false, engine: provider.name });
  } catch (err: any) {
    console.error('AI Gap Detection error:', err);
    return res.status(500).json({ error: err.message || 'Failed to detect gaps' });
  }
});

// Functional Documentation / Artifact Generation (PRDs, Specs, Functional Summaries)
router.post('/generate-artifact', async (req: Request, res: Response) => {
  try {
    const { workspaceId, type = 'prd', elements, decisions } = req.body;

    const rateCheck = aiRateLimiter.checkRateLimit(req.ip || 'global');
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: rateCheck.reason,
        rateLimited: true,
        retryAfter: rateCheck.retryAfterSeconds,
      });
    }

    let canvasElements = elements;
    let canvasDecisions = decisions;

    if (!canvasElements && workspaceId) {
      canvasElements = await CanvasElementModel.find({ workspaceId });
      canvasDecisions = await DecisionModel.find({ workspaceId });
    }
    canvasElements = normalizeElements(canvasElements);

    const cacheKey = AICache.generateKey(`artifact:${type}`, {
      diagram: getDiagramCacheSignature(canvasElements),
      workspaceId,
      type,
    });

    const cached = aiCache.get(cacheKey);
    const provider = getAIProvider();

    if (cached) {
      return res.json({ success: true, result: cached, isCached: true, engine: provider.name });
    }

    const payload: CanvasContextPayload = {
      workspaceName: 'sketch out',
      elements: canvasElements || [],
      decisions: canvasDecisions || [],
    };

    const result = await aiRateLimiter.executeDeduplicated(cacheKey, async () => {
      const computed = await provider.generateArtifact(type, payload);
      aiCache.set(cacheKey, computed);
      return computed;
    });

    // Save as artifact if workspaceId provided
    if (workspaceId) {
      try {
        const artifactId = `art-${Date.now()}`;
        await ArtifactModel.create({
          artifactId,
          workspaceId,
          type: result.type,
          title: result.title,
          content: result.markdown,
          traceableNodes: result.traceableNodes,
        });
      } catch (saveErr) {
        console.warn('Artifact autosave to MongoDB failed, returning result directly:', saveErr);
      }
    }

    return res.json({ success: true, result, isCached: false, engine: provider.name });
  } catch (err: any) {
    console.error('Artifact Generation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate artifact' });
  }
});

// AI Flow Completion: Generates 2 downstream nodes and connecting arrows (<150 tokens)
router.post('/complete-flow', async (req: Request, res: Response) => {
  try {
    const { workspaceId, elementId, elements } = req.body;

    const rateCheck = aiRateLimiter.checkRateLimit(req.ip || 'global');
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: rateCheck.reason,
        rateLimited: true,
        retryAfter: rateCheck.retryAfterSeconds,
      });
    }

    let canvasElements = elements;
    if (!canvasElements && workspaceId) {
      canvasElements = await CanvasElementModel.find({ workspaceId });
    }
    canvasElements = normalizeElements(canvasElements);

    const provider = getAIProvider();
    const payload: CanvasContextPayload = {
      workspaceName: 'sketch out',
      elements: canvasElements,
      decisions: [],
    };

    const completion = await provider.completeFlow(elementId, payload);
    const suggestions = completion.suggestions || [];

    // Find reference node to position downstream elements
    const refNode = canvasElements.find(
      (e: any) => (e.elementId === elementId || e.id === elementId) && e.type !== 'arrow'
    ) || canvasElements.filter((e: any) => e.type !== 'arrow').slice(-1)[0];

    let startX = refNode ? refNode.x + (refNode.width || 160) + 90 : 300;
    let startY = refNode ? refNode.y : 200;
    let prevId = refNode ? (refNode.elementId || refNode.id) : '';
    let prevX = refNode ? refNode.x : startX - 160;
    let prevY = refNode ? refNode.y : startY;
    let prevW = refNode ? (refNode.width || 160) : 160;
    let prevH = refNode ? (refNode.height || 80) : 80;

    const createdElements: any[] = [];

    suggestions.forEach((s, idx) => {
      const nodeW = 160;
      const nodeH = 80;
      const nodeX = startX + idx * (nodeW + 90);
      const nodeY = startY;
      const newNodeId = `elem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // 1. Create connecting arrow from previous node
      if (prevId) {
        const arrowId = `elem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        createdElements.push({
          id: arrowId,
          elementId: arrowId,
          workspaceId: workspaceId || 'default',
          type: 'arrow',
          content: s.relation || '',
          sourceElementId: prevId,
          targetElementId: newNodeId,
          sourceId: prevId,
          targetId: newNodeId,
          relationshipType: 'LEADS_TO',
          x: prevX + prevW,
          y: prevY + prevH / 2,
          width: nodeX - (prevX + prevW),
          height: 0,
          points: [
            { x: prevX + prevW, y: prevY + prevH / 2 },
            { x: nodeX, y: nodeY + nodeH / 2 },
          ],
          style: {
            strokeColor: '#ffffff',
            strokeWidth: 2,
            roughness: 0,
            opacity: 1,
          },
          zIndex: 5,
        });
      }

      // 2. Create the downstream node
      createdElements.push({
        id: newNodeId,
        elementId: newNodeId,
        workspaceId: workspaceId || 'default',
        type: s.type || 'rectangle',
        content: s.label,
        semanticType: s.semanticType || 'idea',
        confidence: 'SUGGESTION',
        x: nodeX,
        y: nodeY,
        width: nodeW,
        height: nodeH,
        style: {
          strokeColor: '#ffffff',
          fillColor: '#18181b',
          fontSize: 14,
          textAlign: 'center',
          strokeWidth: 2,
          roughness: 0,
          opacity: 1,
        },
        zIndex: 10,
      });

      // Advance previous pointer for chaining
      prevId = newNodeId;
      prevX = nodeX;
      prevY = nodeY;
      prevW = nodeW;
      prevH = nodeH;
    });

    return res.json({
      success: true,
      suggestions,
      rationale: completion.rationale,
      createdElements,
      engine: provider.name,
    });
  } catch (err: any) {
    console.error('Flow Completion error:', err);
    return res.status(500).json({ error: err.message || 'Failed to complete flow' });
  }
});

export default router;
