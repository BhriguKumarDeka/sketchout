import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { ChevronDown } from 'lucide-react';
import { SketchItOutSvg } from './SketchItOutSvg';

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
  const [isHectorHovered, setIsHectorHovered] = useState(false);

  return (
    // Full desktop width layout strictly in Light Mode
    <div
      data-theme="light"
      className="w-full min-h-screen overflow-x-hidden overflow-y-auto bg-white text-zinc-900 select-text font-sans scroll-smooth flex flex-col justify-between"
    >
      {/* Top Header Bar spanning full viewport width */}
      <header className="w-full px-6 sm:px-12 md:px-16 lg:px-24 py-5 flex items-center justify-between border-b border-zinc-100/60 bg-white/95 backdrop-blur-xs sticky top-0 z-40">
        <div className="font-semibold text-sm sm:text-base tracking-tight text-black select-none">
          sketch / out
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveView('canvas')}
          className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-md sm:rounded-lg bg-black hover:bg-zinc-800 text-white text-[11px] sm:text-xs font-semibold tracking-wider transition-colors cursor-pointer shadow-xs"
        >
          BACK TO CANVAS
        </motion.button>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 flex flex-col items-center">
        
        {/* HERO SECTION: Spans full width of desktop with responsive scaling grass and hopping waggle bees */}
        <section className="relative w-full overflow-hidden py-10 sm:py-16 md:py-20 lg:py-24 flex items-center justify-center min-h-[560px] sm:min-h-[660px] md:min-h-[760px]">
          
          {/* Right Grass Patch (Grass01.svg) - Anchored to right screen edge, scales with desktop width */}
          <div className="absolute right-0 top-20 sm:top-28 md:top-36 lg:top-40 w-[30vw] min-w-[240px] max-w-[620px] pointer-events-none select-none z-10">
            <img
              src="/assets/introduction/Grass01.svg"
              alt="Grass Right"
              className="w-full h-auto object-contain object-right"
            />
          </div>

          {/* Left Grass Patch (Grass02.svg) - Anchored to left screen edge, scales with desktop width */}
          <div className="absolute left-0 bottom-4 sm:bottom-8 md:bottom-12 lg:bottom-16 w-[34vw] min-w-[260px] max-w-[680px] pointer-events-none select-none z-10">
            <img
              src="/assets/introduction/Grass02.svg"
              alt="Grass Left"
              className="w-full h-auto object-contain object-left"
            />
          </div>

          {/* Bee 1 (Top right, above right grass): Hopping & signature waggle movement roaming in upper right space */}
          <motion.div
            className="absolute right-12 sm:right-28 md:right-40 lg:right-60 top-10 sm:top-14 md:top-18 z-20 pointer-events-none"
            animate={{
              x: [0, 22, -14, 28, -8, 0],
              y: [0, -20, 10, -26, 8, 0],
              rotate: [0, 10, -8, 14, -5, 0],
            }}
            transition={{
              duration: 7.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Signature rapid waggle dance vibration */}
            <motion.div
              animate={{
                rotate: [-12, 12, -10, 14, -12],
                y: [-2, 2, -1, 2, -2],
              }}
              transition={{
                duration: 0.28,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img
                src="/assets/bee_cropped.png"
                alt="Bee"
                className="w-8 sm:w-10 h-auto select-none drop-shadow-xs"
              />
            </motion.div>
          </motion.div>

          {/* Bee 2 (Mid-left, next to the word 'it'): Inquisitive roaming hop and waggle */}
          <motion.div
            className="absolute left-20 sm:left-36 md:left-52 lg:left-72 top-48 sm:top-60 md:top-68 z-20 pointer-events-none"
            animate={{
              x: [0, -18, 12, -22, 8, 0],
              y: [0, 16, -18, 10, -12, 0],
              rotate: [0, -12, 8, -10, 6, 0],
            }}
            transition={{
              duration: 6.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.div
              animate={{
                rotate: [14, -14, 12, -12, 14],
                y: [-2, 2, -1, 1, -2],
              }}
              transition={{
                duration: 0.22,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img
                src="/assets/bee_cropped.png"
                alt="Bee"
                className="w-5 sm:w-6 h-auto select-none drop-shadow-xs"
              />
            </motion.div>
          </motion.div>

          {/* Bee 3 (Lower-left, hovering above left grass): Forager hopping patrol */}
          <motion.div
            className="absolute left-10 sm:left-24 md:left-36 lg:left-48 bottom-28 sm:bottom-40 md:bottom-48 z-20 pointer-events-none"
            animate={{
              x: [0, 26, -16, 20, -10, 0],
              y: [0, -18, 14, -22, 6, 0],
              rotate: [0, 8, -12, 10, -6, 0],
            }}
            transition={{
              duration: 8.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.div
              animate={{
                rotate: [-14, 14, -12, 12, -14],
                y: [2, -2, 1, -2, 2],
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img
                src="/assets/bee_cropped.png"
                alt="Bee"
                className="w-7 sm:w-9 h-auto select-none drop-shadow-xs"
              />
            </motion.div>
          </motion.div>

          {/* Central Hero Artwork: Pure SVG allowing direct manipulation of strokes, width, size, and color */}
          <div className="relative z-10 w-[85vw] max-w-[320px] sm:max-w-[420px] md:max-w-[490px] lg:max-w-[540px] flex justify-center">
            <SketchItOutSvg
              strokeWidth={2.4}
              strokeColor="#09090b"
              className="w-full h-auto object-contain select-none text-zinc-950 transition-colors"
            />
          </div>
        </section>

        {/* NARRATIVE SECTION */}
        <section className="w-full max-w-2xl px-6 mx-auto mt-6 sm:mt-10 text-zinc-900 text-xs sm:text-sm leading-relaxed space-y-3 font-normal text-left">
          <p>
            Most whiteboard tools are digital scratchpads where ideas die as soon as the meeting ends. Most doc tools force you into rigid bullet points before you even know what you're trying to solve.
          </p>
          <p>
            Sketch Out is the tactile middle ground: raw pen-on-paper freedom where the board quietly builds an understanding of your architecture under the surface.
          </p>
        </section>

        {/* VISUAL FLOW DIAGRAM & TWO FEATURES */}
        <section className="w-full max-w-2xl px-6 mx-auto mt-14 sm:mt-20">
          {/* A -> B -> C Flow Diagram */}
          <div className="w-full flex justify-center py-4">
            <img
              src="/assets/introduction/arrowFlow.svg"
              alt="Visual Flow: A to B to C"
              className="w-full max-w-[480px] sm:max-w-[560px] h-auto object-contain select-none"
            />
          </div>

          {/* Two Feature Columns */}
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
        </section>

        {/* MEET HECTOR SECTION (Hola speech cloud appears strictly on Hector hover) */}
        <section className="w-full max-w-2xl px-6 mx-auto mt-18 sm:mt-24 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
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

          {/* Right Column: Hector & Interactive Hola Speech Bubble */}
          <div
            className="flex flex-col items-center justify-center relative group cursor-pointer"
            onMouseEnter={() => setIsHectorHovered(true)}
            onMouseLeave={() => setIsHectorHovered(false)}
          >
            {/* Word Cloud Speech Bubble ("Hola !!") - Revealed exclusively on Hector hover via Motion */}
            <motion.div
              initial={false}
              animate={
                isHectorHovered
                  ? { opacity: 1, scale: 1, y: 0, rotate: 0 }
                  : { opacity: 0, scale: 0.65, y: 14, rotate: -4 }
              }
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="pointer-events-none mb-[-18px] sm:mb-[-24px] z-10 mr-10 sm:mr-16"
            >
              <img
                src="/assets/introduction/wordCloud.svg"
                alt="Hola !!"
                className="w-24 sm:w-32 h-auto object-contain select-none drop-shadow-xs"
              />
            </motion.div>

            {/* Hector Full Standing Figure with subtle hover lift */}
            <motion.div
              animate={isHectorHovered ? { scale: 1.03, y: -2 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              <img
                src="/assets/hector_full.png"
                alt="Hector AI"
                className="w-32 sm:w-40 md:w-44 h-auto object-contain select-none"
              />
            </motion.div>
          </div>
        </section>

        {/* FAQ SECTION WITH PENCIL TWIRL */}
        <section className="w-full max-w-2xl px-6 mx-auto mt-18 sm:mt-24 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Slanted Pencil Illustration with Motion Twirl on Hover */}
          <div className="md:col-span-4 flex justify-center items-center">
            <motion.div
              whileHover={{
                rotate: [0, -22, 360, 338, 360],
                scale: 1.1,
                transition: { duration: 0.72, ease: "easeInOut" },
              }}
              whileTap={{ scale: 0.94 }}
              className="cursor-pointer select-none"
              title="Click or hover to twirl!"
            >
              <img
                src="/assets/pencilLogo_cropped.png"
                alt="Pencil"
                className="w-16 sm:w-20 md:w-24 h-auto object-contain pointer-events-auto drop-shadow-xs"
              />
            </motion.div>
          </div>

          {/* Right Column: FAQ Accordion Cards with Smooth Motion Transitions */}
          <div className="md:col-span-8 space-y-2.5 w-full">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaqIndex === index;
              return (
                <div
                  key={index}
                  className="border border-zinc-300 rounded-xl bg-white overflow-hidden transition-colors shadow-2xs"
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isOpen ? null : index)}
                    className="w-full px-4 py-2.5 sm:py-3 flex items-center justify-between text-left text-xs sm:text-[13px] font-normal text-zinc-900 hover:bg-zinc-50/70 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 text-zinc-500 ml-2"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="faq-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3.5 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* BOTTOM CTA: "back to canvas" */}
        <div className="mt-16 sm:mt-20 mb-6">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveView('canvas')}
            className="px-6 py-2 rounded-md bg-black hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-xs"
          >
            back to canvas
          </motion.button>
        </div>

      </main>

      {/* FULL-WIDTH GRASS FOOTER: Stretches edge-to-edge across 100% desktop width */}
      <footer className="w-full overflow-hidden leading-none select-none pointer-events-none mt-4 sm:mt-8">
        <div className="w-full flex justify-center items-end overflow-hidden">
          <img
            src="/assets/introduction/GrassFooter.svg"
            alt="Grass Footer"
            className="w-full min-w-full h-auto min-h-[70px] sm:min-h-[105px] md:min-h-[135px] max-h-[170px] object-cover object-bottom block"
          />
        </div>
      </footer>
    </div>
  );
};
