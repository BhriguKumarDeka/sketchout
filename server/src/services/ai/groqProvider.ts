import Groq from 'groq-sdk';
import {
  CanvasContextPayload,
  IAIProvider,
  SessionAnalysisResult,
  GapDetectionResult,
  ArtifactGenerationResult,
  AskCanvasResult,
  FlowCompletionResult,
} from './types.js';
import { extractDiagramFlowContext } from './contextExtractor.js';
import { HeuristicAIProvider } from './heuristicProvider.js';

export class GroqAIProvider implements IAIProvider {
  name = 'Groq Cloud Engine';
  private groq: Groq;
  private model: string;
  private fallback: HeuristicAIProvider;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
    this.model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    this.fallback = new HeuristicAIProvider();
  }

  isLive(): boolean {
    return true;
  }

  private buildContextString(context: CanvasContextPayload): string {
    const { elements, decisions, workspaceName } = context;
    const diagram = extractDiagramFlowContext(elements, workspaceName);
    let text = diagram.diagramContextStr;

    if (decisions && decisions.length > 0) {
      text += `\n--- REGISTERED ARCHITECTURE DECISIONS ---\n`;
      decisions.forEach((d) => {
        text += `- Decision [ID: ${d.decisionId}]: ${d.title} (Status: ${d.status}, Rationale: ${d.rationale})\n`;
      });
    }
    return text;
  }

  async analyzeSession(context: CanvasContextPayload): Promise<SessionAnalysisResult> {
    try {
      const contextStr = this.buildContextString(context);
      const systemPrompt = `You are a thoughtful, experienced colleague and co-designer on "sketch out".
You're reviewing a whiteboard canvas session with your teammate.
Synthesize the flow, concepts, states, and transitions into crisp, natural insights that a team can immediately act on.
Avoid robotic boilerplate. Never mention internal technical IDs in your prose.
Respond ONLY in valid JSON matching this schema:
{
  "summary": "Clear, engaging summary of the flow and ideas like a colleague recapping a brainstorm",
  "decisions": [{"title": "...", "rationale": "...", "alternatives": ["..."], "status": "Proposed|Accepted|Final", "sourceElementId": "node id if applicable"}],
  "questions": [{"question": "...", "status": "Open|Resolved", "sourceElementId": "node id"}],
  "actionItems": [{"task": "...", "owner": "...", "priority": "High|Medium|Low", "sourceElementId": "node id"}],
  "assumptions": [{"assumption": "...", "risk": "...", "sourceElementId": "node id"}],
  "risks": [{"risk": "...", "impact": "...", "relatedDecision": "...", "sourceElementId": "node id"}]
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please review this whiteboard session with me:\n\n${contextStr}` },
        ],
        model: this.model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        summary: parsed.summary || 'Diagram flow analyzed.',
        decisions: parsed.decisions || [],
        questions: parsed.questions || [],
        actionItems: parsed.actionItems || [],
        assumptions: parsed.assumptions || [],
        risks: parsed.risks || [],
      };
    } catch (err: any) {
      console.warn('[Groq Provider] analyzeSession failed, using heuristic fallback:', err?.message);
      return this.fallback.analyzeSession(context);
    }
  }

  async detectGaps(context: CanvasContextPayload): Promise<GapDetectionResult> {
    try {
      const contextStr = this.buildContextString(context);
      const systemPrompt = `You are a helpful teammate reviewing a diagram on "sketch out".
Spot any missing steps, orphaned ideas, open questions, or logical jumps in the board.
Talk like a peer pointing out constructive suggestions over coffee.
Never recite raw element IDs in your description or title.
Respond ONLY in valid JSON matching this schema:
{
  "gaps": [
    {
      "id": "gap-1",
      "type": "MISSING_STEP|DISCONNECTED_CONCEPT|UNANSWERED_QUESTION|AMBIGUOUS_LABEL",
      "title": "Friendly, short title",
      "description": "Clear explanation of what's missing or how to connect the dots",
      "severity": "high|medium|low",
      "suggestedResolution": "Actionable, helpful next step",
      "relatedElementIds": ["node-id-1"]
    }
  ]
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Let's check if we missed anything on this canvas:\n\n${contextStr}` },
        ],
        model: this.model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"gaps": []}');
      return { gaps: parsed.gaps || [] };
    } catch (err: any) {
      console.warn('[Groq Provider] detectGaps failed, using heuristic fallback:', err?.message);
      return this.fallback.detectGaps(context);
    }
  }

  async generateArtifact(artifactType: string, context: CanvasContextPayload): Promise<ArtifactGenerationResult> {
    try {
      const contextStr = this.buildContextString(context);
      const systemPrompt = `You are a documentation and synthesis partner on "sketch out".
Write a clear, beautifully structured markdown document from this whiteboard diagram.
Write naturally, capturing the real-world context and intent behind the diagram.
Do NOT use stiff corporate or software engineering buzzwords unless the diagram is explicitly software architecture.
Embed <!-- trace:NODE_ID --> tags for all key elements so they link directly to the canvas elements.

OUTPUT FORMAT:
# [Descriptive, Natural Title]

## 1. Overview & Context
A friendly, crisp explanation of what this flow represents and why it matters.

## 2. Key Stages & Concepts
Walk through the elements in the sequence. Explain each piece and its purpose. Embed <!-- trace:NODE_ID --> tags.

## 3. Step-by-Step Flow & Transitions
Walk through the sequence along the arrows. Explain the logic and story behind each step.

## 4. Key Takeaways for Quick Recall
High-impact, memorable takeaways that anyone on the team can grasp instantly.

Respond ONLY in valid JSON matching this schema:
{
  "title": "Natural Document Title",
  "type": "${artifactType}",
  "markdown": "Complete formatted markdown document",
  "traceableNodes": [
    {
      "nodeId": "step-1",
      "section": "Key Stages & Concepts",
      "text": "Name of concept",
      "sourceElementId": "node-id-from-canvas",
      "semanticType": "concept"
    }
  ]
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Synthesize this board into documentation:\n\n${contextStr}` },
        ],
        model: this.model,
        temperature: 0.25,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        title: parsed.title || `${context.workspaceName || 'sketch out'} Documentation`,
        type: artifactType,
        markdown: parsed.markdown || '# Generated Flow Documentation\n\nNo content produced.',
        traceableNodes: parsed.traceableNodes || [],
      };
    } catch (err: any) {
      console.warn('[Groq Provider] generateArtifact failed, using heuristic fallback:', err?.message);
      return this.fallback.generateArtifact(artifactType, context);
    }
  }

  async askCanvas(question: string, context: CanvasContextPayload): Promise<AskCanvasResult> {
    try {
      const contextStr = this.buildContextString(context);
      const isCasual = context.mode !== 'technical';

      const modePrompt = isCasual
        ? `MODE: CASUAL & ESSENCE (Brainstorming & Human Story)
- Focus entirely on the human intention, essence, metaphor, story, and creative reasoning behind what was sketched.
- Absolutely FORBIDDEN phrases and mechanics: NEVER say words like "node", "box", "ellipse", "rectangle", "shape", "arrow", "connector", or IDs like "(ID elem-...)".
- Instead, talk purely about the concepts, entities, stages, and meanings. For example, instead of "Node A connects to Apple via connector alphabet", say: "It looks like you're playing with alphabet associations or wordplay—starting with the letter 'A' leading into Apple, and tracing tech giants from Apple to Samsung and its home in Korea."
- Tone: Warm, perceptive, witty, like a brilliant creative collaborator sitting beside you with a coffee.`
        : `MODE: TECHNICAL & ARCHITECTURE (Deep Systems & Engineering)
- Focus on system design, component boundaries, data contracts, communication protocols, state transitions, failure modes, and scalability.
- Discuss components by their functional role (e.g. "Identity Provider", "Event Queue", "Payment Gateway", "Client App") rather than raw diagram boxes.
- Analyze architectural trade-offs, potential bottlenecks, and missing infrastructure pieces.
- Absolutely FORBIDDEN: DO NOT recite raw internal IDs like "(ID elem-1793384291283-1ter)" or say "this box connects to that box with that arrow".`;

      const systemPrompt = `You are a sharp, insightful colleague and whiteboard collaborator on "sketch out".
You're reviewing a whiteboard diagram session with your teammate. Talk like a real human peer sitting next to them.

${modePrompt}

CORE RULES:
1. TALK LIKE A REAL COLLEAGUE, NOT AN AI BOT:
   - Cut out stiff bureaucratic intros and robotic parser speech (e.g. "The diagram depicts a straightforward linear architecture").
   - Jump straight into the insight with natural cadence.
2. NEVER RECITE RAW INTERNAL IDs IN YOUR TEXT:
   - Talk about elements strictly by their labels or names: **Apple**, **Samsung**, **Korea**, or "the letter 'A'".
   - Put IDs ONLY in the "referencedElementIds" JSON array so the UI can highlight them.
3. COLLABORATIVE & THOUGHTFUL:
   - Provide 1-2 constructive, natural follow-ups for the team.

Respond ONLY in valid JSON matching this schema:
{
  "answer": "Clear, engaging, human colleague answer grounded in the diagram and its domain context",
  "referencedElementIds": ["node-id-1", "node-id-2"],
  "suggestedFollowUps": ["Collaborative peer follow-up 1", "Collaborative peer follow-up 2"]
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Teammate Question: "${question}"\n\n${contextStr}` },
        ],
        model: this.model,
        temperature: 0.35,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        answer: parsed.answer || 'I looked over the board but could not find a clear match for that.',
        referencedElementIds: parsed.referencedElementIds || [],
        suggestedFollowUps: parsed.suggestedFollowUps || [],
      };
    } catch (err: any) {
      console.warn('[Groq Provider] askCanvas failed, using heuristic fallback:', err?.message);
      return this.fallback.askCanvas(question, context);
    }
  }

  async completeFlow(elementId: string, context: CanvasContextPayload): Promise<FlowCompletionResult> {
    try {
      const { elements, workspaceName = 'sketch out' } = context;
      const flow = extractDiagramFlowContext(elements, workspaceName);

      let targetNode = elements.find(
        (e) => (e.elementId === elementId || e.id === elementId) && e.type !== 'arrow'
      );
      if (!targetNode && flow.boxes.length > 0) {
        targetNode = flow.boxes[flow.boxes.length - 1];
      }

      const activeLabel = targetNode?.content?.trim() || 'Active Step';
      const flowSummary = flow.connections.map((c) => `${c.sourceLabel} -> ${c.targetLabel}`).join(', ') || activeLabel;

      const systemPrompt = `You are an expert whiteboard partner. Suggest exactly 2 logical downstream next steps and transitions to complete the active flow. Keep labels under 4 words. Use minimal tokens.
Respond ONLY in valid JSON matching this schema:
{
  "suggestions": [
    { "label": "Short Next Step", "type": "rectangle|ellipse|diamond|cylinder", "relation": "short verb" },
    { "label": "Short Final Outcome", "type": "rectangle|ellipse|diamond|cylinder", "relation": "short verb" }
  ],
  "rationale": "One brief sentence"
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Current Flow: [${flowSummary}]. Active Step: "${activeLabel}". Suggest the next 2 steps.` },
        ],
        model: this.model,
        temperature: 0.3,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        suggestions: parsed.suggestions || [],
        rationale: parsed.rationale || 'Suggested downstream flow steps.',
      };
    } catch (err: any) {
      console.warn('[Groq Provider] completeFlow failed, using heuristic fallback:', err?.message);
      return this.fallback.completeFlow(elementId, context);
    }
  }
}
