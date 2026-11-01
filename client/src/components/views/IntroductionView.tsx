import React, { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { ChevronDown } from 'lucide-react';

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
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  return (
    // Strictly Light Mode canvas sketchbook aesthetic
    <div
      data-theme="light"
      className="w-full h-full overflow-y-auto bg-white text-zinc-900 select-text font-sans scroll-smooth"
    >
      {/* Top Header Bar */}
      <header className="w-full px-6 sm:px-12 py-5 flex items-center justify-between">
        <div className="font-semibold text-sm sm:text-base tracking-tight text-black select-none">
          sketch / out
        </div>
        <button
          onClick={() => setActiveView('canvas')}
          className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-md sm:rounded-lg bg-black hover:bg-zinc-800 text-white text-[11px] sm:text-xs font-semibold tracking-wider transition-colors cursor-pointer shadow-xs"
        >
          BACK TO CANVAS
        </button>
      </header>

      {/* Main Body */}
      <main className="w-full max-w-4xl mx-auto px-6 pt-2 pb-12 flex flex-col items-center relative">
        
        {/* HERO SECTION: "Sketch it out" with flanking grass and floating bees */}
        <div className="relative w-full flex justify-center items-center py-12 sm:py-16 md:py-24 min-h-[520px] sm:min-h-[620px] md:min-h-[700px] overflow-visible">
          
          {/* Right Grass Patch (Grass01.svg) - pinned to right edge */}
          <div className="absolute -right-6 sm:right-0 top-32 sm:top-40 md:top-48 w-44 sm:w-64 md:w-80 pointer-events-none select-none z-10">
            <img
              src="/assets/introduction/Grass01.svg"
              alt="Grass Right"
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Left Grass Patch (Grass02.svg) - pinned to left edge */}
          <div className="absolute -left-6 sm:left-0 bottom-6 sm:bottom-12 md:bottom-16 w-48 sm:w-72 md:w-88 pointer-events-none select-none z-10">
            <img
              src="/assets/introduction/Grass02.svg"
              alt="Grass Left"
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Bee 1 (Top right, above right grass patch) */}
          <div className="absolute right-10 sm:right-24 md:right-32 top-12 sm:top-16 md:top-20 z-20 pointer-events-none animate-bee-waggle-1">
            <img
              src="/assets/bee_cropped.png"
              alt="Bee"
              className="w-8 sm:w-10 h-auto select-none drop-shadow-xs"
            />
          </div>

          {/* Bee 2 (Mid-left, next to the word 'it') */}
          <div className="absolute left-20 sm:left-36 md:left-48 top-44 sm:top-56 md:top-64 z-20 pointer-events-none animate-bee-waggle-micro">
            <img
              src="/assets/bee_cropped.png"
              alt="Bee"
              className="w-5 sm:w-6 h-auto select-none drop-shadow-xs"
            />
          </div>

          {/* Bee 3 (Lower-left, above left grass patch) */}
          <div className="absolute left-10 sm:left-20 md:left-28 bottom-28 sm:bottom-40 md:bottom-48 z-20 pointer-events-none animate-bee-waggle-2">
            <img
              src="/assets/bee_cropped.png"
              alt="Bee"
              className="w-7 sm:w-9 h-auto select-none drop-shadow-xs"
            />
          </div>

          {/* Centerpiece Artwork: "Sketch it out.svg" */}
          <div className="relative z-10 max-w-[280px] sm:max-w-[380px] md:max-w-[460px] w-full flex justify-center">
            <img
              src="/assets/introduction/SketchItOut.svg"
              alt="Sketch it out"
              className="w-full h-auto object-contain select-none"
            />
          </div>
        </div>

        {/* NARRATIVE SECTION */}
        <div className="max-w-xl sm:max-w-2xl mx-auto mt-6 sm:mt-10 text-zinc-900 text-xs sm:text-sm leading-relaxed space-y-3 font-normal text-left">
          <p>
            Most whiteboard tools are digital scratchpads where ideas die as soon as the meeting ends. Most doc tools force you into rigid bullet points before you even know what you're trying to solve.
          </p>
          <p>
            Sketch Out is the tactile middle ground: raw pen-on-paper freedom where the board quietly builds an understanding of your architecture under the surface.
          </p>
        </div>

        {/* VISUAL FLOW DIAGRAM & TWO FEATURES */}
        <div className="w-full max-w-2xl mx-auto mt-14 sm:mt-18">
          {/* A -> B -> C Flow Illustration */}
          <div className="w-full flex justify-center py-4">
            <img
              src="/assets/introduction/arrowFlow.svg"
              alt="Visual Flow: A to B to C"
              className="w-full max-w-[480px] sm:max-w-[560px] h-auto object-contain select-none"
            />
          </div>

          {/* Feature Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 mt-6 text-left">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-950 mb-1.5">
                Arrows carry meaning
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-700 leading-relaxed">
                Connecting two shapes isn't just a line. It registers relationships, pipeline stages, and decision paths in real time.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-950 mb-1.5">
                Auto-Complete Flow
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-700 leading-relaxed">
                Stuck on where your flow goes next? Hit complete on any node. Hector predicts the downstream steps for under 150 tokens.
              </p>
            </div>
          </div>
        </div>

        {/* MEET HECTOR SECTION */}
        <div className="w-full max-w-2xl mx-auto mt-18 sm:mt-24 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
          {/* Left Column: Hector Capabilities List */}
          <div className="space-y-3 text-left">
            <h3 className="text-base sm:text-lg font-bold text-zinc-950">
              Meet Hector
            </h3>
            <p className="text-xs sm:text-[13px] text-zinc-700 leading-relaxed">
              Advanced AI with context awareness.
              <br />
              He can help you with many things.
            </p>
            <ol className="text-xs sm:text-[13px] text-zinc-800 space-y-1.5 list-decimal list-inside font-normal">
              <li>Ask Questions about the canvas</li>
              <li>Complete data flows</li>
              <li>Learn about existing gaps</li>
            </ol>
          </div>

          {/* Right Column: Word Cloud Speech Bubble & Hector Illustration */}
          <div className="flex flex-col items-center justify-center relative">
            {/* Word Cloud Speech Bubble ("Hola !!") */}
            <div className="mb-[-18px] sm:mb-[-24px] z-10 mr-10 sm:mr-16">
              <img
                src="/assets/introduction/wordCloud.svg"
                alt="Hola !!"
                className="w-24 sm:w-32 h-auto object-contain select-none"
              />
            </div>
            {/* Hector Full Standing Figure */}
            <img
              src="/assets/hector_full.png"
              alt="Hector AI"
              className="w-32 sm:w-40 md:w-44 h-auto object-contain select-none"
            />
          </div>
        </div>

        {/* FAQ SECTION WITH PENCIL */}
        <div className="w-full max-w-2xl mx-auto mt-18 sm:mt-24 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Slanted Pencil Illustration */}
          <div className="md:col-span-4 flex justify-center items-center">
            <img
              src="/assets/pencilLogo_cropped.png"
              alt="Pencil"
              className="w-16 sm:w-20 md:w-24 h-auto object-contain select-none"
            />
          </div>

          {/* Right Column: FAQ Accordion Cards */}
          <div className="md:col-span-8 space-y-2.5 w-full">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaqIndex === index;
              return (
                <div
                  key={index}
                  className="border border-zinc-300 rounded-xl bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isOpen ? null : index)}
                    className="w-full px-4 py-2.5 sm:py-3 flex items-center justify-between text-left text-xs sm:text-[13px] font-normal text-zinc-900 hover:bg-zinc-50/50 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM CTA: "back to canvas" */}
        <div className="mt-16 sm:mt-20 mb-4">
          <button
            onClick={() => setActiveView('canvas')}
            className="px-6 py-2 rounded-md bg-black hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-xs"
          >
            back to canvas
          </button>
        </div>

      </main>

      {/* FULL-WIDTH GRASS FOOTER */}
      <div className="w-full overflow-hidden leading-none select-none pointer-events-none">
        <img
          src="/assets/introduction/grassFooter.png"
          alt="Grass Footer"
          className="w-full h-auto min-h-[70px] sm:min-h-[100px] object-cover object-top"
        />
      </div>
    </div>
  );
};
