"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CinematicMoment } from "@/utils/moments";

const MOOD_GRADIENTS: Record<string, string> = {
  surprise: "radial-gradient(ellipse at 50% 100%, rgba(200,149,108,0.12) 0%, transparent 70%)",
  appreciation: "radial-gradient(ellipse at 100% 100%, rgba(100,160,140,0.10) 0%, transparent 70%)",
  struggle: "radial-gradient(ellipse at 0% 0%, rgba(80,100,140,0.12) 0%, transparent 70%)",
  resumption: "radial-gradient(ellipse at 50% 50%, rgba(60,60,50,0.15) 0%, transparent 70%)",
  sentiment: "radial-gradient(ellipse at 50% 80%, rgba(200,149,108,0.18) 0%, transparent 60%)",
};

const useTypewriter = (text: string, speed: number, active: boolean) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, active]);
  return displayed;
};

const useWordReveal = (text: string, delay: number, active: boolean) => {
  const [count, setCount] = useState(0);
  const words = text ? text.split(" ") : [];
  useEffect(() => {
    if (!active) {
      setCount(0);
      return;
    }
    setCount(0);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setCount(i);
      if (i >= words.length) clearInterval(timer);
    }, delay);
    return () => clearInterval(timer);
  }, [text, active]);
  return words.slice(0, count).join(" ");
};

interface TimelineMovieProps {
  moments: CinematicMoment[];
  narratives: string[];
  totalMessages: number;
  greenFlagsCount: number;
}

export function TimelineMovie({
  moments,
  narratives,
  totalMessages,
  greenFlagsCount,
}: TimelineMovieProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const isClosingSlide = currentChapter === 5;

  const currentMoment = moments[currentChapter] || moments[0];
  const currentNarrative = narratives[currentChapter] || "";
  const momentType = currentMoment?.type?.toLowerCase() || "sentiment";
  const currentGradient = isClosingSlide
    ? MOOD_GRADIENTS.sentiment
    : MOOD_GRADIENTS[momentType] || MOOD_GRADIENTS.sentiment;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentChapter((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "ArrowRight") {
        setCurrentChapter((prev) => (prev < 5 ? prev + 1 : prev));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section
      className="flex-1 flex flex-col justify-between p-4 md:p-12 relative min-h-[80vh] w-full transition-all duration-1000 overflow-hidden"
      style={{
        background: currentGradient,
        transition: "background 1s ease",
      }}
    >
      <AnimatePresence mode="wait">
        {isClosingSlide ? (
          /* ================= CLOSING CHAPTER VI CARD ================= */
          <motion.div
            key="chapter-vi-closing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="my-auto max-w-2xl mx-auto w-full text-center space-y-8 py-12 px-6"
          >
            <div className="space-y-6">
              {/* Line 1: [total human messages] messages. */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="font-serif text-3xl md:text-5xl font-light text-[#f4f4f0] tracking-tight"
              >
                {totalMessages.toLocaleString()} messages.
              </motion.p>

              {/* Line 2: [top green flag count] moments that mattered. */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="font-serif text-3xl md:text-5xl font-light text-[#c8956c] tracking-tight"
              >
                {greenFlagsCount > 0 ? greenFlagsCount : moments.length} moments that mattered.
              </motion.p>

              {/* Line 3: This archive holds all of them. */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.6 }}
                className="font-serif text-xl md:text-2xl text-[#f4f4f0]/80 italic pt-4"
              >
                This archive holds all of them.
              </motion.p>

              {/* Line 4: — Memra */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 2.2 }}
                className="font-mono text-sm text-[#c8956c] tracking-widest uppercase pt-6"
              >
                — Memra
              </motion.p>
            </div>

            {/* Subtle previous button for closing slide */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.5 }}
              className="pt-12 flex justify-start"
            >
              <button
                onClick={() => setCurrentChapter(4)}
                className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-[#f4f4f0]/50 hover:text-[#c8956c] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Chapter
              </button>
            </motion.div>
          </motion.div>
        ) : (
          /* ================= CHAPTER SLIDE (CHAPTERS 1 - 5) ================= */
          <ChapterSlide
            key={`chapter-${currentChapter}`}
            chapterIndex={currentChapter}
            moment={currentMoment}
            narrative={currentNarrative}
            totalMoments={moments.length}
            onNext={() => setCurrentChapter((prev) => Math.min(prev + 1, 5))}
            onPrev={() => setCurrentChapter((prev) => Math.max(prev - 1, 0))}
            onSelectChapter={(idx) => setCurrentChapter(idx)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

interface ChapterSlideProps {
  chapterIndex: number;
  moment: CinematicMoment;
  narrative: string;
  totalMoments: number;
  onNext: () => void;
  onPrev: () => void;
  onSelectChapter: (idx: number) => void;
}

function ChapterSlide({
  chapterIndex,
  moment,
  narrative,
  totalMoments,
  onNext,
  onPrev,
  onSelectChapter,
}: ChapterSlideProps) {
  // Step sequence timing states
  const [quoteActive, setQuoteActive] = useState(false);
  const [narrativeActive, setNarrativeActive] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Step 5: Activate Quote Typewriter after Title animation completes (at 1100ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuoteActive(true);
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  // Step 5 typewriter hook (35ms per character)
  const displayedQuote = useTypewriter(moment.quote, 35, quoteActive);
  const isQuoteFinished =
    quoteActive && displayedQuote.length === moment.quote.length && moment.quote.length > 0;

  // Step 6 & 7: When quote finishes typing, trigger narrative word reveal
  useEffect(() => {
    if (isQuoteFinished) {
      const timer = setTimeout(() => {
        setNarrativeActive(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isQuoteFinished]);

  // Step 7 word reveal hook (60ms delay per word)
  const displayedNarrative = useWordReveal(narrative, 60, narrativeActive);
  const totalWords = narrative ? narrative.split(" ").length : 0;
  const revealedWords = displayedNarrative ? displayedNarrative.split(" ").length : 0;
  const isNarrativeFinished = narrativeActive && revealedWords >= totalWords && totalWords > 0;

  // Step 8: Show controls last after narrative finishes or fallback delay
  useEffect(() => {
    if (isNarrativeFinished) {
      const timer = setTimeout(() => {
        setShowControls(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isNarrativeFinished]);

  // Safety fallback for controls if user wants to skip typing
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setShowControls(true);
    }, 12000);
    return () => clearTimeout(fallbackTimer);
  }, []);

  const formattedDate = React.useMemo(() => {
    const d = new Date(moment.date);
    return isNaN(d.getTime())
      ? moment.date
      : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }, [moment.date]);

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full space-y-6">
      {/* Top Bar: Step 2 (Chapter number) & Step 3 (Date) */}
      <div className="flex items-center justify-between w-full border-b border-[#c8956c]/10 pb-4">
        {/* Step 2 — Chapter number fades in from opacity 0 over 400ms */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="font-mono text-xs text-[#c8956c] tracking-widest uppercase"
        >
          Chapter {moment.chapter}
        </motion.span>

        {/* Step 3 — Date appears 300ms later */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="font-mono text-[10px] text-[#f4f4f0]/40 tracking-wider uppercase"
        >
          {formattedDate}
        </motion.span>
      </div>

      {/* Main Content Area */}
      <div className="my-auto max-w-3xl mx-auto w-full text-center space-y-6 md:space-y-8 py-4">
        {/* Step 4 — Chapter title slides up from y:20 over 500ms */}
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="font-serif text-lg md:text-xl italic text-[#c8956c]"
        >
          {moment.title}
        </motion.h3>

        {/* Step 5 — Quote types out character by character at 35ms per char */}
        <div className="space-y-4 relative min-h-[100px] flex flex-col justify-center items-center">
          <div className="w-8 h-[1px] bg-[#c8956c]/30 mx-auto"></div>
          <h2 className="font-serif text-2xl md:text-4xl font-light italic leading-relaxed text-[#f4f4f0] max-w-2xl mx-auto px-4">
            "{displayedQuote}"
            {quoteActive && !isQuoteFinished && (
              <span className="inline-block w-1.5 h-6 bg-[#c8956c] ml-1 animate-pulse" />
            )}
          </h2>

          {/* Step 6 — Sender attribution fades in when typing completes */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: isQuoteFinished ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[10px] text-[#f4f4f0]/50 tracking-wider uppercase pt-1"
          >
            — {moment.sender}
          </motion.p>
        </div>

        <div className="w-12 h-[1px] bg-[#c8956c]/20 mx-auto"></div>

        {/* Step 7 — Narrative paragraph appears word by word */}
        <div className="min-h-[80px] flex items-center justify-center">
          <p className="font-serif text-base md:text-lg text-[#f4f4f0]/80 leading-relaxed italic max-w-2xl mx-auto px-4">
            {displayedNarrative}
            {narrativeActive && !isNarrativeFinished && (
              <span className="inline-block w-1 h-4 bg-[#c8956c]/70 ml-1 animate-pulse" />
            )}
          </p>
        </div>

        {/* Authenticity Badge (fades in with Step 8 / controls) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#121210]/50 border border-[#c8956c]/10 rounded-sm p-3.5 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-left"
        >
          <div className="space-y-0.5">
            <span className="font-mono text-[8px] text-[#c8956c] tracking-widest uppercase block">
              Memory Authenticity
            </span>
            <div className="font-mono text-[10px] text-[#f4f4f0]/60">
              Evidence: {moment.evidenceList?.join(", ") || "Contextual Alignment"}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-mono text-[8px] text-[#f4f4f0]/30 uppercase block">
              Confidence
            </span>
            <span className="font-serif text-lg text-[#c8956c]">
              {moment.confidenceScore || 85}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Step 8 — Navigation controls fade in last */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-4 pt-2"
      >
        {/* Real-time Progress Bar */}
        <div className="relative w-full h-[2px] bg-[#c8956c]/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-[#c8956c]"
            initial={{ width: `${(chapterIndex / 5) * 100}%` }}
            animate={{ width: `${((chapterIndex + 1) / 5) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            disabled={chapterIndex === 0}
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase disabled:opacity-20 text-[#f4f4f0] hover:text-[#c8956c] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {/* Chapter dots (Chapters 1 to 5) */}
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((idx) => (
              <button
                key={idx}
                onClick={() => onSelectChapter(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === chapterIndex
                    ? "bg-[#c8956c] scale-125"
                    : "border border-[#c8956c]/50 bg-transparent hover:border-[#c8956c]"
                }`}
                aria-label={`Jump to chapter ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase text-[#f4f4f0] hover:text-[#c8956c] transition-colors cursor-pointer"
          >
            {chapterIndex === 4 ? "Closing" : "Next"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
