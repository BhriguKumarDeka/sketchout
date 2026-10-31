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
      <section className="pt-16 sm:pt-20 pb-20 px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Exact Hero Text with generous breathing space below */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-zinc-950 tracking-tight leading-none mb-24 sm:mb-32">
          welcome to sketch out
        </h1>

        {/* Standalone Hero Image with Exactly Two Waggle Bees moving from end to end */}
        <div className="relative w-full max-w-3xl">
          {/* Exactly Two Bees traversing the upper floral region with signature waggle */}
          <div className="absolute inset-x-0 -top-8 h-20 pointer-events-none z-20 overflow-visible">
            {/* Bee 1: Left to right waggle patrol */}
            <div className="absolute animate-bee-patrol-1">
              <img
                src="/assets/bee_cropped.png"
                alt="Waggle Bee"
                className="w-9 h-auto drop-shadow-xs select-none animate-bee-waggle-1"
              />
            </div>

            {/* Bee 2: Right to left waggle patrol */}
            <div className="absolute animate-bee-patrol-2">
              <img
                src="/assets/bee_cropped.png"
                alt="Waggle Bee"
                className="w-8 h-auto drop-shadow-xs select-none animate-bee-waggle-2"
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

      {/* The Essence of Sketch Out (No AI slop, no meta tags) */}
      <section className="py-20 px-6 max-w-3xl mx-auto border-t border-zinc-200/70">
        <div className="space-y-6 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight leading-snug">
            Thinking shouldn't feel like filling out forms.
          </h2>
          <div className="space-y-4 text-zinc-600 text-base leading-relaxed">
            <p>
              Most whiteboard apps are digital scratchpads where ideas die as soon as the meeting ends. Most documentation tools force you into rigid bullet points before you even know what you're trying to solve.
            </p>
            <p>
              Sketch Out lives in the space between. It gives you the raw, effortless freedom of pen on paper—place a box, connect an arrow, jot a note—while quietly building an understanding of how everything fits together under the surface.
            </p>
          </div>
        </div>

        {/* 3 Core Groundings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-zinc-100">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-zinc-950">The box is the canvas</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              No modal cards or awkward floating prompts. Double-click any shape and the box itself becomes the typing space.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-zinc-950">Arrows carry meaning</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Connecting two shapes isn't just drawing a line. It creates a relationship, a pipeline step, or a decision path.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-zinc-950">Sketches become specs</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              When the brainstorm wraps up, your flow synthesizes directly into living documentation with clickable canvas trace links.
            </p>
          </div>
        </div>
      </section>

      {/* Hector AI Interactive Section (hectorImage.png in middle, left & right dialogue on hover) */}
      <section className="py-24 px-6 bg-white border-y border-zinc-200/70 overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="text-center mb-6">
            <p className="text-xs text-zinc-400">
              (Hover over Hector to see what he's thinking)
            </p>
          </div>

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
