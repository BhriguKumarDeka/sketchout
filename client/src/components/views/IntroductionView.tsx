import React, { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  FileCode2,
  GitGraph,
  Layers,
  Zap,
  ChevronDown,
  ShieldCheck,
  Compass,
  Edit3,
} from 'lucide-react';

interface BeeConfig {
  id: number;
  leftPercent: number;
  topPx: number;
  sizePx: number;
  animClass: string;
  delaySec: number;
}

const BEES: BeeConfig[] = [
  { id: 1, leftPercent: 20, topPx: -24, sizePx: 38, animClass: 'animate-bee-1', delaySec: 0 },
  { id: 2, leftPercent: 34, topPx: -36, sizePx: 32, animClass: 'animate-bee-2', delaySec: 0.8 },
  { id: 3, leftPercent: 52, topPx: -42, sizePx: 42, animClass: 'animate-bee-3', delaySec: 1.4 },
  { id: 4, leftPercent: 68, topPx: -28, sizePx: 30, animClass: 'animate-bee-4', delaySec: 0.3 },
  { id: 5, leftPercent: 82, topPx: -34, sizePx: 36, animClass: 'animate-bee-1', delaySec: 1.9 },
  { id: 6, leftPercent: 44, topPx: -16, sizePx: 26, animClass: 'animate-bee-2', delaySec: 2.2 },
];

const HECTOR_DIALOGUES = [
  {
    prompt: "👋 Who are you, Hector?",
    reply: "I'm Hector, your canvas partner! I don't just stare at isolated text—I map out the arrows, spatial sections, and state transitions of your whiteboard in real time, so you can brainstorm freely without documentation drift.",
  },
  {
    prompt: "🧠 How do you understand the canvas?",
    reply: "Unlike chatbots that recite boring technical IDs like 'elem-1234', I speak like an experienced colleague over coffee. I read direct connectors, geometric proximity, and workflow frames, synthesizing the human essence of what you sketched.",
  },
  {
    prompt: "⚡ What is Auto-Complete Flow?",
    reply: "Stuck on where your diagram should head next? Hit [⚡ Complete Flow] on any shape and I'll predict the next 2 logical steps and connect them for under 150 tokens—super fast, lightweight, and token-efficient!",
  },
  {
    prompt: "📄 How do you generate PRDs & Specs?",
    reply: "I trace the path of your directed arrows and convert your visual sketches into structured, production-ready PRDs with interactive bidirectional node badges. Click any cited concept, and the canvas instantly focuses it.",
  },
  {
    prompt: "💡 What is the Sketch Out philosophy?",
    reply: "Zero plastic gimmick toys! Every shape, connector, and section is backed by an atomic MongoDB sync, full offline resilience, and clean modular code. Visual freedom meets rock-solid engineering.",
  },
];

const FAQS = [
  {
    question: "How is Sketch Out different from Miro, FigJam, or Excalidraw?",
    answer:
      "Most whiteboards treat drawings as dead vectors that get lost after a meeting. Sketch Out understands the topological relationships between shapes. Hector AI extracts system boundaries, records architectural decisions in a live ledger, and synthesizes living functional specs directly from your arrows.",
  },
  {
    question: "Can I import existing Mermaid diagrams?",
    answer:
      "Yes! Click 'Mermaid' in the top bar to paste any flowchart or state diagram. Sketch Out parses nodes, shapes, connectors, and subgraphs, laying them out automatically on the canvas with native arrow snapping.",
  },
  {
    question: "Is Sketch Out available offline?",
    answer:
      "Absolutely. If MongoDB or network connectivity is unavailable, Sketch Out's local heuristic context engine and in-memory sync take over seamlessly without blocking your work.",
  },
  {
    question: "How does the AI keep token usage low?",
    answer:
      "Our context extractor filters out noise (like freehand pen strokes) and builds high-density relational summaries with topological hashing. Auto-Complete Flow is specifically budgeted to execute in under 150 tokens on Groq 120B.",
  },
  {
    question: "Can I manage multiple projects and workspaces?",
    answer:
      "Yes. You can create multiple workspaces, switch between them, clone elements, and view all generated database artifacts across your entire MongoDB instance.",
  },
];

export const IntroductionView: React.FC = () => {
  const { setActiveView } = useCanvasStore();
  const [activeDialogueIndex, setActiveDialogueIndex] = useState(0);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const activeDialogue = HECTOR_DIALOGUES[activeDialogueIndex];

  return (
    // Locked strictly to Light Mode with warm sketchbook paper vibe
    <div
      data-theme="light"
      className="w-full h-full overflow-y-auto bg-[#fafaf9] text-zinc-900 select-text font-sans scroll-smooth"
    >
      {/* Sticky Top Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-[#fafaf9]/90 backdrop-blur-md border-b border-zinc-200/80 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Main Pen Squircle Icon */}
          <div className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.1)] border border-black/10 overflow-hidden p-1.5 transition-transform hover:scale-105">
            <img
              src="/assets/penLogo_cropped.png"
              alt="Sketch Out Icon"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-950">
            sketch out
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-200/60 text-zinc-600 border border-zinc-300/40">
            Introduction & Guide
          </span>
        </div>

        {/* Section Links & Return Button */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-5 text-xs font-medium text-zinc-600">
            <a href="#hero" className="hover:text-zinc-950 transition-colors">
              Overview
            </a>
            <a href="#objective" className="hover:text-zinc-950 transition-colors">
              Objective
            </a>
            <a href="#features" className="hover:text-zinc-950 transition-colors">
              Features
            </a>
            <a href="#hector" className="hover:text-zinc-950 transition-colors">
              Hector AI
            </a>
            <a href="#faq" className="hover:text-zinc-950 transition-colors">
              FAQ
            </a>
          </div>

          {/* Primary Return to Canvas CTA */}
          <button
            onClick={() => setActiveView('canvas')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sketch</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-12 pb-20 px-6 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 shadow-xs text-xs font-medium text-zinc-700 mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>The Living Whiteboard & Architecture Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-zinc-950 tracking-tight max-w-3xl leading-[1.12]">
          Where loose sketches take shape, and diagrams understand themselves.
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed">
          Sketch Out merges the frictionless feel of pen and paper with <strong>Hector</strong>—an embedded AI colleague that reads your spatial graph, tracks architectural decisions, and turns visual flows into living specs.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setActiveView('canvas')}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          >
            <img src="/assets/penLogo_cropped.png" alt="Pen" className="w-4 h-4 object-contain invert" />
            <span>Launch Canvas & Start Sketching</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <a
            href="#hector"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-sm border border-zinc-200 shadow-xs transition-colors"
          >
            <img src="/assets/hector_avatar.png" alt="Hector" className="w-4 h-4 rounded-full object-cover" />
            <span>Meet Hector AI</span>
          </a>
        </div>

        {/* Centerpiece: Hero Image with Floating Bees */}
        <div className="relative mt-16 w-full max-w-3xl">
          {/* Floating Bees hovered across the upper floral side of the hero image */}
          <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-20">
            {BEES.map((b) => (
              <div
                key={b.id}
                className={`absolute ${b.animClass}`}
                style={{
                  left: `${b.leftPercent}%`,
                  top: `${b.topPx}px`,
                  animationDelay: `${b.delaySec}s`,
                }}
              >
                <img
                  src="/assets/bee_cropped.png"
                  alt="Floating Bee"
                  className="drop-shadow-md select-none transition-transform"
                  style={{ width: `${b.sizePx}px`, height: 'auto' }}
                />
              </div>
            ))}
          </div>

          {/* Hero Image Canvas Frame */}
          <div className="relative rounded-3xl bg-white p-3 sm:p-4 border border-zinc-200/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Top Window Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="text-[11px] font-mono text-zinc-400">sketchout-board.canvas</div>
              <div className="w-10" />
            </div>

            {/* Hero Artwork */}
            <div className="relative rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center">
              <img
                src="/assets/heroImage.png"
                alt="Sketch Out Hero Whiteboard Illustration"
                className="w-full h-auto object-cover max-h-[460px] select-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Objective Section */}
      <section id="objective" className="py-20 px-6 bg-white border-y border-zinc-200/80">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Our Core Objective
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mt-2 tracking-tight">
              Moving past plastic gimmick whiteboards into real data flow.
            </h2>
            <p className="mt-4 text-zinc-600 leading-relaxed">
              Traditional whiteboards are visual graveyards: you draw rectangles and arrows, take a screenshot, and the context dies in Slack. Sketch Out changes that equation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#fafaf9] border border-zinc-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-xs text-zinc-900">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-950">1. Spatial Ideation</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Draw, type, and connect thoughts with genuine in-shape editing. Zero modal chrome or clunky popups—the shape itself is your typing canvas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#fafaf9] border border-zinc-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-xs text-zinc-900">
                <GitGraph className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-950">2. Real Topology</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Connectors aren’t dumb line segments. They register relational flow edges, state progressions, and system boundaries in a living context graph.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#fafaf9] border border-zinc-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-xs text-zinc-900">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-950">3. Fail-Proof Sync</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Backed by atomic MongoDB upserts and debounced batching. Work is persisted reliably across workspaces with full offline resilience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section id="features" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Crafted for Thinking
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mt-2 tracking-tight">
            Features that feel like a colleague, not an AI bot.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Edit3 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-zinc-950">In-Shape Seamless Text Editing</h3>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Double-click any rectangle, diamond, or cylinder and type straight into the shape. No distracting cards, placeholders, or modal boxes.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-zinc-950">Mermaid Code Import & Layout</h3>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Paste standard Mermaid flowchart code and watch Sketch Out instantiate shapes, arrow connectors, and subgraphs with topological positioning.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-amber-500">
                <Zap className="w-4 h-4 fill-amber-500" />
              </div>
              <h3 className="font-bold text-base text-zinc-950">One-Click Flow Auto-Completion</h3>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Select any node and click <strong>[⚡ Complete Flow]</strong>. Hector analyzes the preceding sequence and generates the next 2 downstream stages under 150 tokens.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-zinc-950">Figma-Style Workflow Sections</h3>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Draw section frames around sub-flows to visually and semantically cluster subsystems (e.g. Auth, Order Processing, Data Lake).
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <FileCode2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-zinc-950">Living PRD & Spec Synthesis</h3>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Synthesize production-grade PRDs and technical specs with interactive trace tags linking every requirement directly to its whiteboard shape.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-zinc-950">Multi-Workspace & Context Portability</h3>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Switch workspaces seamlessly, clone canvas elements, and browse or link artifacts across your database without orphaned records.
            </p>
          </div>
        </div>
      </section>

      {/* Hector AI Interactive Dialogue Cloud Spotlight */}
      <section id="hector" className="py-20 px-6 bg-white border-y border-zinc-200/80">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Meet Your Collaborator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mt-2 tracking-tight">
              Hector: The Resident AI of Sketch Out
            </h2>
            <p className="mt-3 text-zinc-600">
              Click any question below to see how Hector thinks and talks with you.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-[#fafaf9] border border-zinc-200/90 shadow-sm flex flex-col md:flex-row items-center gap-8">
            {/* Hector Character Art */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white border border-zinc-200 shadow-md p-3 flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105">
                <img
                  src="/assets/hectorAI.png"
                  alt="Hector AI Character"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-3 text-center">
                <div className="text-sm font-bold text-zinc-950">Hector AI</div>
                <div className="text-xs text-zinc-500 font-mono">Whiteboard Strategist</div>
              </div>
            </div>

            {/* Interactive Comic Dialogue Cloud */}
            <div className="flex-1 w-full space-y-4">
              {/* Comic Speech Cloud Bubble */}
              <div className="relative p-5 sm:p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm">
                {/* Speech tail for desktop */}
                <div className="hidden md:block absolute -left-2.5 top-10 w-5 h-5 bg-white border-l border-b border-zinc-200 rotate-45" />

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Hector's Perspective
                  </span>
                </div>

                <p className="text-sm sm:text-base text-zinc-800 leading-relaxed font-medium">
                  "{activeDialogue.reply}"
                </p>
              </div>

              {/* Clickable Question Chips */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                  Ask Hector a topic:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HECTOR_DIALOGUES.map((d, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveDialogueIndex(idx)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                        activeDialogueIndex === idx
                          ? 'bg-zinc-950 text-white shadow-xs'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      {d.prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-950 mt-2 tracking-tight">
            Everything you need to know.
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = expandedFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-zinc-200/90 shadow-xs overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-zinc-950 cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-zinc-950' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action Footer */}
      <section className="py-16 px-6 bg-zinc-950 text-white text-center">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Main Squircle Icon in Footer */}
          <div className="w-12 h-12 rounded-2xl bg-white mx-auto flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.2)] p-2">
            <img src="/assets/penLogo_cropped.png" alt="Sketch Out" className="w-full h-full object-contain" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to bring your ideas to life?
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Jump back to your infinite canvas. Hector is waiting to brainstorm and complete your flows.
          </p>

          <button
            onClick={() => setActiveView('canvas')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sketch</span>
          </button>

          <div className="pt-8 border-t border-zinc-800 text-xs text-zinc-500 font-mono">
            sketch out • visual ideation & architecture reasoning
          </div>
        </div>
      </section>
    </div>
  );
};
