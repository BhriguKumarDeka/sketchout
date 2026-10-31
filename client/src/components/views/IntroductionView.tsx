import React, { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import {
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

const FAQS = [
  {
    question: "What makes Sketch Out different from other whiteboards?",
    answer:
      "Most whiteboards are dead drawings that get forgotten after a call. Sketch Out treats your canvas as an interconnected graph. Shapes have semantics, arrows represent real transitions, and Hector can synthesize the entire board into a clean, actionable spec.",
  },
  {
    question: "How does Hector know what I'm drawing?",
    answer:
      "Hector reads direct arrow connections, proximity clustering, and workflow frames. He doesn't recite raw IDs or shape coordinates—he talks like a design teammate who understands the intent behind your flow.",
  },
  {
    question: "Can I import and export Mermaid diagrams?",
    answer:
      "Yes. Paste any Mermaid flowchart code and it immediately converts into native canvas shapes and connected arrows. You can also export your canvas as JSON anytime.",
  },
  {
    question: "Does it work offline?",
    answer:
      "Yes. If your connection drops or MongoDB isn't running, Sketch Out continues operating seamlessly with an in-memory fallback context engine.",
  },
];

export const IntroductionView: React.FC = () => {
  const { setActiveView } = useCanvasStore();
  const [isHectorHovered, setIsHectorHovered] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  return (
    // Locked strictly to Light Mode with warm sketchbook paper aesthetic
    <div
      data-theme="light"
      className="w-full h-full overflow-y-auto bg-[#fafaf9] text-zinc-900 select-text font-sans scroll-smooth"
    >
      {/* Clean Single Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-[#fafaf9]/95 backdrop-blur-sm border-b border-zinc-200/70 px-6 sm:px-10 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Main Squircle Pen Icon */}
          <div className="w-7 h-7 rounded-[9px] bg-white flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.12)] border border-black/10 overflow-hidden p-1">
            <img
              src="/assets/penLogo_cropped.png"
              alt="Sketch Out"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-950">
            sketch out
          </span>
        </div>

        {/* Just the Back to Sketch button */}
        <button
          onClick={() => setActiveView('canvas')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sketch</span>
        </button>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 sm:pt-20 pb-20 px-6 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Exact Hero Text with generous breathing space below */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal text-zinc-800 tracking-tight leading-none mb-24 sm:mb-32">
          Learn about
          <br /> 
          <div className="flex items-center justify-center gap-3 sm:gap-5 text-zinc-950 mt-4">
            <span className="text-5xl sm:text-7xl md:text-8xl font-black">sketch</span>
            <img src="/assets/penLogo_cropped.png" alt="Sketch Out Pen" className="h-16 sm:h-20 md:h-24 w-auto object-contain select-none" />
            <span className="text-5xl sm:text-7xl md:text-8xl font-black">out</span>
          </div>
        </h1>

        {/* Standalone Hero Image with Four Waggle Bees (Two main non-mirrored + two smaller random micro-orbit bees) */}
        <div className="relative w-full max-w-3xl">
          {/* Four Bees buzzing across the upper floral region */}
          <div className="absolute inset-x-0 -top-8 h-20 pointer-events-none z-20 overflow-visible">
            {/* Bee 1: Wide asymmetrical sweeping traverse across the canopy */}
            <div className="absolute animate-bee-path-1">
              <img
                src="/assets/bee_cropped.png"
                alt="Explorer Bee"
                className="w-9 h-auto drop-shadow-xs select-none animate-bee-waggle-1"
              />
            </div>

            {/* Bee 2: Mid-sized bee with completely non-mirrored meandering arc and rhythm */}
            <div className="absolute animate-bee-path-2">
              <img
                src="/assets/bee_cropped.png"
                alt="Forager Bee"
                className="w-8 h-auto drop-shadow-xs select-none animate-bee-waggle-2"
              />
            </div>

            {/* Bee 3: Smaller body with small organic random fluttering over left flowers */}
            <div className="absolute animate-bee-path-3">
              <img
                src="/assets/bee_cropped.png"
                alt="Little Bee"
                className="w-5 h-auto drop-shadow-xs select-none animate-bee-waggle-micro"
              />
            </div>

            {/* Bee 4: Tiny body with small random inquisitive motion over right flowers */}
            <div className="absolute animate-bee-path-4">
              <img
                src="/assets/bee_cropped.png"
                alt="Tiny Bee"
                className="w-4 h-auto drop-shadow-xs select-none animate-bee-waggle-micro"
              />
            </div>
          </div>

          {/* Standalone Artwork - Completely removed any background, box, or border */}
          <div className="relative w-full flex items-center justify-center">
            <img
              src="/assets/heroImage.png"
              alt="Sketch Out Artwork"
              className="w-full h-auto object-contain max-h-[520px] select-none"
            />
          </div>
        </div>
      </section>

      {/* SVG Handdrawn Filter Definition for Uneven Sketch Lines */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="sketch-filter" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Sketched Bento Grid: Objective & Features (B&W, Colorless Sketch UI, Gapless, Uneven Hand-drawn Borders) */}
      <section className="py-20 px-6 max-w-4xl mx-auto border-t border-zinc-200/70">
        <div
          style={{ filter: 'url(#sketch-filter)' }}
          className="border-2 border-zinc-950 bg-white grid grid-cols-1 md:grid-cols-3 gap-0 shadow-xs"
        >
          {/* Cell 1: Core Objective / Manifesto (Spans 2 cols) */}
          <div className="md:col-span-2 p-8 md:p-10 border-b md:border-r border-zinc-950 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight leading-snug">
                Thinking shouldn't feel like filling out forms.
              </h2>
              <div className="space-y-3 text-zinc-700 text-sm leading-relaxed">
                <p>
                  Most whiteboard tools are digital scratchpads where ideas die as soon as the meeting ends. Most doc tools force you into rigid bullet points before you even know what you're trying to solve.
                </p>
                <p>
                  Sketch Out is the tactile middle ground: raw pen-on-paper freedom where the board quietly builds an understanding of your architecture under the surface.
                </p>
              </div>
            </div>

            {/* Sketched Diagram Doodle */}
            <div className="pt-4 flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-800">
              <div className="px-2.5 py-1 border border-zinc-950 rounded-xs">
                [ raw idea ]
              </div>
              <span>──( evolves into )──&gt;</span>
              <div className="px-2.5 py-1 border border-zinc-950 rounded-xs">
                [ living architecture ]
              </div>
            </div>
          </div>

          {/* Cell 2: The Box Is The Canvas (1 col) */}
          <div className="md:col-span-1 p-6 md:p-8 border-b border-zinc-950 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <h3 className="font-extrabold text-base text-zinc-950">The box is the canvas</h3>
              <p className="text-xs text-zinc-700 leading-relaxed">
                No floating cards, modal prompts, or plastic gimmicks. Double-click any rectangle or diamond and type directly into the ink.
              </p>
            </div>
            {/* Sketched Doodle */}
            <div className="p-3 border border-dashed border-zinc-950 rounded-xs bg-[#fafaf9] font-mono text-xs text-zinc-900 flex items-center justify-between">
              <span>auth_gateway</span>
              <span className="w-1.5 h-3.5 bg-zinc-950 animate-pulse" />
            </div>
          </div>

          {/* Cell 3: Arrows Carry Meaning (1 col) */}
          <div className="md:col-span-1 p-6 md:p-8 border-b md:border-r border-zinc-950 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <h3 className="font-extrabold text-base text-zinc-950">Arrows carry meaning</h3>
              <p className="text-xs text-zinc-700 leading-relaxed">
                Connecting two shapes isn't just a line. It registers relationships, pipeline stages, and decision paths in real time.
              </p>
            </div>
            {/* Sketched Doodle */}
            <div className="flex items-center justify-between text-xs font-mono text-zinc-800 py-2">
              <span className="w-8 h-8 rounded-full border border-zinc-950 flex items-center justify-center text-[11px]">A</span>
              <span className="text-[11px]">──[ verifies ]──&gt;</span>
              <span className="w-8 h-8 rounded-full border border-zinc-950 flex items-center justify-center text-[11px]">B</span>
            </div>
          </div>

          {/* Cell 4: Auto-Complete Flow (1 col) */}
          <div className="md:col-span-1 p-6 md:p-8 border-b md:border-r border-zinc-950 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <h3 className="font-extrabold text-base text-zinc-950">Auto-Complete Flow</h3>
              <p className="text-xs text-zinc-700 leading-relaxed">
                Stuck on where your flow goes next? Hit complete on any node. Hector predicts the downstream steps for under 150 tokens.
              </p>
            </div>
            {/* Sketched Doodle */}
            <div className="text-xs font-mono text-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="border border-zinc-950 px-1.5 py-0.5 text-[10px]">Step 1</span>
                <span>─&gt;</span>
                <span className="border border-dashed border-zinc-950 px-1.5 py-0.5 text-[10px] text-zinc-600">+2 steps</span>
              </div>
            </div>
          </div>

          {/* Cell 5: Mermaid Code to Canvas (1 col) */}
          <div className="md:col-span-1 p-6 md:p-8 border-b border-zinc-950 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <h3 className="font-extrabold text-base text-zinc-950">Mermaid to canvas</h3>
              <p className="text-xs text-zinc-700 leading-relaxed">
                Paste raw Mermaid flowchart code and watch it instantiate shapes, connectors, and subgraphs with clean topological layout.
              </p>
            </div>
            {/* Sketched Doodle */}
            <div className="p-2 border border-zinc-950 font-mono text-[10px] text-zinc-800 bg-[#fafaf9]">
              <div>graph TD;</div>
              <div className="pl-2">API ──&gt; Cache;</div>
            </div>
          </div>

          {/* Cell 6: Sketches Become Specs (2 cols) */}
          <div className="md:col-span-2 p-8 md:p-10 border-b md:border-b-0 md:border-r border-zinc-950 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-zinc-950">Sketches become living specs</h3>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
                When the brainstorm wraps up, your flow synthesizes directly into structured PRDs with interactive trace tags that focus and zoom right back to each whiteboard shape.
              </p>
            </div>
            {/* Sketched Doodle */}
            <div className="p-3 border border-zinc-950 font-mono text-xs text-zinc-800 flex items-center justify-between">
              <span># Functional_Spec.md</span>
              <span className="text-[10px] text-zinc-500 border border-zinc-400 px-1.5 py-0.5">@trace:node-4</span>
            </div>
          </div>

          {/* Cell 7: Real Data Flow (1 col) */}
          <div className="md:col-span-1 p-6 md:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <h3 className="font-extrabold text-base text-zinc-950">Real data flow</h3>
              <p className="text-xs text-zinc-700 leading-relaxed">
                Zero plastic gimmick toys. Backed by atomic MongoDB upserts, multi-workspace isolation, and offline heuristic sync.
              </p>
            </div>
            {/* Sketched Doodle */}
            <div className="text-xs font-mono text-zinc-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 border border-zinc-950 rounded-full bg-zinc-950" />
              <span>synced to mongodb</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hector AI Interactive Section (hectorImage.png in middle, left & right dialogue on hover) */}
      <section className="py-24 px-6 bg-white border-y border-zinc-200/70 overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col items-center">

          {/* Hector Showcase Area */}
          <div
            className="relative w-full max-w-2xl py-6 flex items-center justify-center cursor-pointer select-none"
            onMouseEnter={() => setIsHectorHovered(true)}
            onMouseLeave={() => setIsHectorHovered(false)}
            onClick={() => setIsHectorHovered(!isHectorHovered)}
          >
            {/* Left Dialogue Cloud (Appears on Hover) */}
            <div
              className={`absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-56 sm:w-64 p-4 rounded-2xl bg-white border border-zinc-200 shadow-xl transition-all duration-300 pointer-events-none ${
                isHectorHovered
                  ? 'opacity-100 translate-x-0 scale-100'
                  : 'opacity-0 -translate-x-6 scale-95'
              }`}
            >
              <div className="text-xs font-bold text-zinc-950 mb-1">
                "I'm your design colleague."
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                I don't recite raw coordinates or technical IDs. I look at your shapes, follow your arrows, and discuss the core intention behind what you're sketching.
              </p>
              {/* Right pointing bubble tail */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-t border-r border-zinc-200 rotate-45" />
            </div>

            {/* Middle Hector Image */}
            <div className="relative z-10 w-60 sm:w-72 transition-transform duration-300 hover:scale-105">
              <img
                src="/assets/hectorImage.png"
                alt="Hector AI"
                className="w-full h-auto object-contain drop-shadow-sm select-none"
              />
            </div>

            {/* Right Dialogue Cloud (Appears on Hover) */}
            <div
              className={`absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-56 sm:w-64 p-4 rounded-2xl bg-white border border-zinc-200 shadow-xl transition-all duration-300 pointer-events-none ${
                isHectorHovered
                  ? 'opacity-100 translate-x-0 scale-100'
                  : 'opacity-0 translate-x-6 scale-95'
              }`}
            >
              <div className="text-xs font-bold text-zinc-950 mb-1">
                "Stuck? I can complete your flow."
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Select any shape and hit [⚡ Complete Flow]. I'll predict the downstream steps and connect them for under 150 tokens.
              </p>
              {/* Left pointing bubble tail */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-b border-l border-zinc-200 rotate-45" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion (No uppercase section header) */}
      <section className="py-20 px-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-zinc-950 tracking-tight text-center mb-8">
          Frequently asked questions
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = expandedFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-zinc-200/80 shadow-xs overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-zinc-950 cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-zinc-950' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Minimal Footer: Just the Back to Sketch Button */}
      <footer className="py-16 px-6 flex flex-col items-center justify-center border-t border-zinc-200/70">
        <button
          onClick={() => setActiveView('canvas')}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm shadow-sm transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sketch</span>
        </button>
      </footer>
    </div>
  );
};
