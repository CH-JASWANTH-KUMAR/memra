"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import { useRouter } from "next/navigation";
import { generateMemoryBookPDF } from "@/utils/pdfGenerator";
import { generateRelationshipAwareSoundtrack } from "@/utils/moments";
import { Film, BarChart2, Flag, Music, Download, ChevronLeft, ChevronRight, Lock, Sparkles, AlertTriangle, MessageSquare, ChevronUp, Search, X } from "lucide-react";
import Link from "next/link";
import { captureElement } from "@/utils/captureElement";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface WeekData {
  week: string;
  label: string;
  countA: number;
  countB: number;
  total: number;
  startDate: Date;
}

function getWeeklyData(messages: any[], senderA: string, senderB: string): WeekData[] {
  if (!messages || messages.length === 0) return [];

  const groups: Record<string, { countA: number; countB: number; dates: Date[] }> = {};

  const getISOWeek = (d: Date) => {
    const temp = new Date(d.getTime());
    temp.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    temp.setDate(temp.getDate() + 3 - (temp.getDay() + 6) % 7);
    const week1 = new Date(temp.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((temp.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${temp.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
  };

  messages.forEach((m) => {
    if (m.isSystem) return;
    const dateObj = new Date(m.date);
    if (isNaN(dateObj.getTime())) return;

    const key = getISOWeek(dateObj);
    if (!groups[key]) {
      groups[key] = { countA: 0, countB: 0, dates: [] };
    }

    if (m.sender === senderA) {
      groups[key].countA++;
    } else {
      groups[key].countB++;
    }
    groups[key].dates.push(dateObj);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const [yA, wA] = a.split("-W").map(Number);
    const [yB, wB] = b.split("-W").map(Number);
    if (yA !== yB) return yA - yB;
    return wA - wB;
  });

  return sortedKeys.map((key) => {
    const g = groups[key];
    const minDate = new Date(Math.min(...g.dates.map((d) => d.getTime())));
    const label = minDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      week: key,
      label,
      countA: g.countA,
      countB: g.countB,
      total: g.countA + g.countB,
      startDate: minDate,
    };
  });
}

function useCountUp(target: number, duration: number, active: boolean): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    setCount(0);
    const steps = 40;
    const increment = target / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return count;
}


export default function Archive() {
  const {
    messages,
    stats,
    moments,
    narratives,
    dnaA,
    dnaB,
    compatibility,
    greenFlags,
    redFlags,
    showSafetyNotice,
    soundtrack,
    pairingInsight,
    clearChat,
  } = useChat();

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"timeline" | "analytics" | "journey" | "chat" | "flags" | "soundtrack">("timeline");
  const [currentChapter, setCurrentChapter] = useState(0);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

    // Chat explorer state
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Wrap state
  const [showWrap, setShowWrap] = useState(false);
  const [wrapSlide, setWrapSlide] = useState(0);
  const isLastSlide = wrapSlide === 7;

  // Hydration state
  const [hydrationChecked, setHydrationChecked] = useState(false);

  // Dynamic soundtrack calculation
  const dynamicSoundtrack = React.useMemo(() => {
    if (!moments || moments.length === 0 || !stats) return [];
    return generateRelationshipAwareSoundtrack(moments[0]?.blendedRelationships || [], stats, moments);
  }, [moments, stats]);

  useEffect(() => {
    const cached = localStorage.getItem("memra_archive_v1");
    if (!cached && (!stats || !messages)) {
      window.location.href = "/";
      return;
    }
    setHydrationChecked(true);
  }, []);

  // useCountUp hooks
  const countSenderA = useCountUp(stats?.messagesPerSender[stats?.senders[0]] || 0, 1200, wrapSlide === 1);
  const countSenderB = useCountUp(stats?.messagesPerSender[stats?.senders[1] || "Other"] || 0, 1200, wrapSlide === 1);

  const longestGapHours = React.useMemo(() => {
    if (!stats || !messages) return 0;
    let longestGapHours = 0;
    if (stats.gapsLongerThan24h && stats.gapsLongerThan24h.length > 0) {
      longestGapHours = Math.max(...stats.gapsLongerThan24h.map((g) => g.hours));
    } else if (messages.length > 1) {
      let maxMs = 0;
      for (let i = 1; i < messages.length; i++) {
        const diff = new Date(messages[i].date).getTime() - new Date(messages[i - 1].date).getTime();
        if (diff > maxMs) maxMs = diff;
      }
      longestGapHours = Math.round(maxMs / (1000 * 60 * 60));
    }
    return longestGapHours;
  }, [stats, messages]);

  const countGaps = useCountUp(stats?.gapsLongerThan24h.length || 0, 1200, wrapSlide === 3);
  const countLongestGap = useCountUp(longestGapHours, 1200, wrapSlide === 3);

  const countCompatibility = useCountUp(compatibility?.overallScore || 0, 1200, wrapSlide === 6);

  // 1. Build Lookup Map of Significant Messages (Chapter quotes & Green/Red Flag evidence)
  const significantMap = React.useMemo(() => {
    const sigMap = new Map<string, { type: "chapter" | "green" | "red"; label: string }>();

    // A. Chapter quotes
    moments?.forEach((m) => {
      const mDate = new Date(m.date);
      const dateKey = isNaN(mDate.getTime()) ? "" : mDate.toDateString();
      const key = `${m.sender.trim()}_${m.quote.trim()}_${dateKey}`;
      sigMap.set(key, { type: "chapter", label: `Chapter ${m.chapter}` });
    });

    // B. Green flag evidence
    greenFlags?.forEach((flag) => {
      flag.evidence.forEach((ev) => {
        const evDate = new Date(ev.date);
        const dateKey = isNaN(evDate.getTime()) ? "" : evDate.toDateString();
        const key = `${ev.sender.trim()}_${ev.content.trim()}_${dateKey}`;
        if (!sigMap.has(key)) {
          sigMap.set(key, { type: "green", label: flag.label });
        }
      });
    });

    // C. Red flag evidence
    redFlags?.forEach((flag) => {
      flag.evidence.forEach((ev) => {
        const evDate = new Date(ev.date);
        const dateKey = isNaN(evDate.getTime()) ? "" : evDate.toDateString();
        const key = `${ev.sender.trim()}_${ev.content.trim()}_${dateKey}`;
        if (!sigMap.has(key)) {
          sigMap.set(key, { type: "red", label: flag.label });
        }
      });
    });

    return sigMap;
  }, [moments, greenFlags, redFlags]);

  // 2. Precompute dates for each message in the full list to avoid render lag
  const processedMessages = React.useMemo(() => {
    if (!messages) return [];
    return messages.map((m, idx) => {
      const d = new Date(m.date);
      const dateStr = d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const showDateHeader =
        idx === 0 ||
        new Date(messages[idx - 1].date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }) !== dateStr;

      return {
        ...m,
        dateStr,
        showDateHeader,
        originalIndex: idx,
      };
    });
  }, [messages]);

    // 3. Filter messages based on search query
  const filteredMessages = React.useMemo(() => {
    if (!processedMessages) return [];
    return processedMessages.filter((m) => {
      if (m.isSystem) return false;

      const matchesSearch =
        debouncedQuery.trim() === "" ||
        m.content.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        m.sender.toLowerCase().includes(debouncedQuery.toLowerCase());

      return matchesSearch;
    });
  }, [processedMessages, debouncedQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 200);
  };

  const scrollToTop = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Scroll event listener on chat container ref to show scroll-to-top button
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScrollEvent = () => {
      const sTop = container.scrollTop;
      setShowScrollTop(sTop > 200);
    };

    container.addEventListener("scroll", handleScrollEvent);
    handleScrollEvent();

    return () => {
      container.removeEventListener("scroll", handleScrollEvent);
    };
  }, [activeTab]);

  // Scroll to first chapter quote on tab mount
  useEffect(() => {
    if (activeTab === "chat" && messages) {
      const firstChIdx = filteredMessages.findIndex((m) => {
        const dateKey = isNaN(new Date(m.date).getTime()) ? "" : new Date(m.date).toDateString();
        const key = `${m.sender.trim()}_${m.content.trim()}_${dateKey}`;
        const match = significantMap.get(key);
        return match?.type === "chapter";
      });

      if (firstChIdx !== -1) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = firstChIdx * 90;
          }
        }, 300);
      }
    }
  }, [activeTab, filteredMessages, messages, significantMap]);

  // Autoplay Wrap slideshow (stopping at slide 8 / index 7)
  useEffect(() => {
    if (!showWrap) return;
    if (wrapSlide >= 7) return; // stop at last slide, 0-indexed
    const timer = setInterval(() => {
      setWrapSlide(prev => prev < 7 ? prev + 1 : prev);
    }, 3000);
    return () => clearInterval(timer);
  }, [showWrap, wrapSlide]);

  // Load Razorpay Script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Listen to keyboard arrow keys for cinematic chapter navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "timeline" || !moments) return;
      if (e.key === "ArrowLeft") {
        setCurrentChapter((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "ArrowRight") {
        setCurrentChapter((prev) => (prev < moments.length - 1 ? prev + 1 : prev));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTab, moments]);

  if (!hydrationChecked || !stats || !messages || !moments || !narratives || !dnaA || !dnaB || !compatibility || !soundtrack) {
    return (
      <div style={{
        background: "#0b0b09",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px"
      }}>
        <div style={{
          fontFamily: "monospace",
          fontSize: "9px",
          letterSpacing: "0.25em",
          color: "#c8956c",
          textTransform: "uppercase"
        }}>
          Loading Archive...
        </div>
        <div style={{
          width: "200px",
          height: "1px",
          background: "#1a1a14",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            background: "#c8956c",
            animation: "loadingBar 0.8s ease forwards"
          }} />
        </div>
        <style>{`
          @keyframes loadingBar {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  const dateRangeStr = (() => {
    if (messages.length === 0) return "";
    const start = new Date(messages[0].date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const end = new Date(messages[messages.length - 1].date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return `${start} - ${end}`;
  })();

  // Trigger PDF compiling on client side
  const triggerPDFDownload = () => {
    generateMemoryBookPDF({
      senderA: stats.senders[0],
      senderB: stats.senders[1] || "Other",
      moments,
      narratives,
      stats,
      dnaA,
      dnaB,
      compatibility,
      greenFlags: greenFlags || [],
      redFlags: redFlags || [],
      soundtrack: dynamicSoundtrack,
      dateRange: dateRangeStr,
    });
  };

  // Share card generator using html2canvas shared utility
  const shareCard = async (elementId: string, fileName: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;

    const noShareEls = el.querySelectorAll(".no-share");
    noShareEls.forEach((nse: any) => {
      nse.style.visibility = "hidden";
    });

    try {
      await captureElement(el, {
        fileName,
        watermark: isUnlocked ? undefined : "Preserved with Memra — memra.app",
        backgroundColor: "#0b0b09"
      });
    } catch (err) {
      console.error("Failed to share card:", err);
    } finally {
      noShareEls.forEach((nse: any) => {
        nse.style.visibility = "visible";
      });
    }
  };

  // Checkout flow
  const handlePayment = () => {
    if (!razorpayLoaded) {
      alert("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    setPaymentLoading(true);

    const options = {
      key: "rzp_test_mockkeyhere", // Test Mode Key placeholder
      amount: 19900, // INR 199 in paise
      currency: "INR",
      name: "Memra",
      description: "Compile and download your premium Memory Book PDF",
      image: "",
      handler: function (response: any) {
        setPaymentLoading(false);
        setIsUnlocked(true);
        setShowPaywallModal(false);
        // Automatically trigger download
        setTimeout(() => {
          triggerPDFDownload();
        }, 300);
      },
      prefill: {
        name: "Memra Explorer",
      },
      theme: {
        color: "#c8956c",
      },
      modal: {
        ondismiss: function () {
          setPaymentLoading(false);
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setPaymentLoading(false);
      alert("Could not load payment checkout. You can bypass using 'Simulate Success' for testing.");
    }
  };

  // Test Mode Simulation Bypass
  const handleSimulatePayment = () => {
    setIsUnlocked(true);
    setShowPaywallModal(false);
    setTimeout(() => {
      triggerPDFDownload();
    }, 300);
  };

  // Cinematic backgrounds for moments to set the mood
  const moodGradients = [
    "from-[#c8956c]/10 via-transparent to-transparent", // Amber check-in (warm)
    "from-teal-950/20 via-transparent to-transparent",    // Appreciation (growth)
    "from-slate-900/40 via-transparent to-transparent",    // Struggle (reflective)
    "from-indigo-950/20 via-transparent to-transparent",   // Resumption (evening spark)
    "from-[#c8956c]/15 via-transparent to-transparent",  // Sentiment peak (warm glow)
  ];

  return (
    <main className="flex-1 flex flex-col bg-[#0b0b09] text-[#f4f4f0] w-full min-h-screen">
      {/* Top Header */}
      <header className="border-b border-[#c8956c]/10 py-4 px-4 md:py-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#121210]/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={clearChat}
            className="font-serif text-2xl tracking-wide text-[#f4f4f0] hover:text-[#c8956c] transition-colors"
          >
            Memra
          </Link>
          <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase border border-[#c8956c]/20 px-2 py-0.5 rounded-sm">
            Archive Mode
          </span>
        </div>

        {/* Tab Controls */}
        <nav className="flex items-center gap-1.5 bg-[#0b0b09] border border-[#c8956c]/10 p-1 rounded-sm max-w-full overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-all rounded-sm shrink-0 ${
              activeTab === "timeline" ? "bg-[#c8956c] text-[#0b0b09]" : "text-[#f4f4f0]/60 hover:text-[#f4f4f0]"
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movie
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-all rounded-sm shrink-0 ${
              activeTab === "analytics" ? "bg-[#c8956c] text-[#0b0b09]" : "text-[#f4f4f0]/60 hover:text-[#f4f4f0]"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> DNA & Stats
          </button>
          <button
            onClick={() => setActiveTab("journey")}
            className={`flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-all rounded-sm shrink-0 ${
              activeTab === "journey" ? "bg-[#c8956c] text-[#0b0b09]" : "text-[#f4f4f0]/60 hover:text-[#f4f4f0]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Journey
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-all rounded-sm shrink-0 ${
              activeTab === "chat" ? "bg-[#c8956c] text-[#0b0b09]" : "text-[#f4f4f0]/60 hover:text-[#f4f4f0]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </button>
          <button
            onClick={() => setActiveTab("flags")}
            className={`flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-all rounded-sm shrink-0 ${
              activeTab === "flags" ? "bg-[#c8956c] text-[#0b0b09]" : "text-[#f4f4f0]/60 hover:text-[#f4f4f0]"
            }`}
          >
            <Flag className="w-3.5 h-3.5" /> Flags
          </button>
          <button
            onClick={() => setActiveTab("soundtrack")}
            className={`flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-all rounded-sm shrink-0 ${
              activeTab === "soundtrack" ? "bg-[#c8956c] text-[#0b0b09]" : "text-[#f4f4f0]/60 hover:text-[#f4f4f0]"
            }`}
          >
            <Music className="w-3.5 h-3.5" /> Soundtrack
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setWrapSlide(0);
              setShowWrap(true);
            }}
            className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase bg-[#c8956c] text-[#0b0b09] px-4.5 py-2.5 rounded-sm hover:bg-[#c8956c]/90 transition-all shadow-md font-bold cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Wrap
          </button>
          <button
            onClick={() => (isUnlocked ? triggerPDFDownload() : setShowPaywallModal(true))}
            className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase bg-[#c8956c] text-[#0b0b09] px-4.5 py-2.5 rounded-sm hover:bg-[#c8956c]/90 transition-all shadow-md font-bold"
          >
            <Download className="w-4 h-4" /> Book Memoir
          </button>
        </div>
      </header>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col relative">
        <ErrorBoundary>
        
        {/* ================= TAB 1: TIMELINE MOVIE ================= */}
        {activeTab === "timeline" && (
          <section className={`flex-1 flex flex-col justify-between p-4 md:p-16 relative bg-gradient-to-b ${moodGradients[currentChapter]} transition-all duration-1000`}>
            
            {/* Top Chapter info */}
            <div className="flex items-center justify-between w-full max-w-4xl mx-auto border-b border-[#c8956c]/10 pb-4">
              <span className="font-mono text-xs text-[#c8956c] tracking-widest uppercase">
                Chapter {moments[currentChapter].chapter}
              </span>
              <span className="font-mono text-[10px] text-[#f4f4f0]/40 tracking-wider uppercase">
                {new Date(moments[currentChapter].date).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Central Movie Screen */}
            <div className="my-auto max-w-3xl mx-auto w-full text-center space-y-6 md:space-y-10 py-6 md:py-10">
              <span className="font-serif text-lg md:text-xl italic text-[#c8956c]">
                {moments[currentChapter].title}
              </span>

              {/* Large quote block */}
              <div className="space-y-4 relative">
                {/* Visual quote indicator (minimalist lines instead of emojis) */}
                <div className="w-8 h-[1px] bg-[#c8956c]/30 mx-auto"></div>
                <h2 className="font-serif text-2xl md:text-5xl font-light italic leading-normal text-[#f4f4f0] max-w-2xl mx-auto px-4">
                  "{moments[currentChapter].quote}"
                </h2>
                <p className="font-mono text-[10px] text-[#f4f4f0]/50 tracking-wider uppercase">
                  — {moments[currentChapter].sender}
                </p>
              </div>

              <div className="w-12 h-[1px] bg-[#c8956c]/20 mx-auto"></div>

              {/* Cinematic AI story text */}
              <p className="font-serif text-base md:text-lg text-[#f4f4f0]/70 leading-relaxed italic max-w-2xl mx-auto px-6">
                {narratives[currentChapter]}
              </p>

              {/* Memory Confidence Banner */}
              <div className="bg-[#121210]/50 border border-[#c8956c]/10 rounded-sm p-4 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="space-y-1">
                  <span className="font-mono text-[8px] text-[#c8956c] tracking-widest uppercase block">
                    Memory Authenticity
                  </span>
                  <div className="font-mono text-[10px] text-[#f4f4f0]/60">
                    Evidence: {moments[currentChapter].evidenceList?.join(", ") || "Contextual Alignment"}
                  </div>
                  {moments[currentChapter].supportingSignals && moments[currentChapter].supportingSignals.length > 0 && (
                    <div className="font-mono text-[9px] text-[#f4f4f0]/40">
                      Signals: {moments[currentChapter].supportingSignals.join(" · ")}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-[8px] text-[#f4f4f0]/30 uppercase block">
                    Confidence
                  </span>
                  <span className="font-serif text-xl text-[#c8956c]">
                    {moments[currentChapter].confidenceScore || 85}%
                  </span>
                </div>
              </div>
            </div>

            {/* Footer / Movie controls */}
            <div className="w-full max-w-4xl mx-auto space-y-6">
              {/* Progress Indicator */}
              <div className="relative w-full h-[2px] bg-[#c8956c]/10">
                <div
                  className="absolute top-0 left-0 h-full bg-[#c8956c] transition-all duration-500"
                  style={{ width: `${((currentChapter + 1) / moments.length) * 100}%` }}
                ></div>
              </div>

              {/* Nav actions */}
              <div className="flex items-center justify-between">
                <button
                  disabled={currentChapter === 0}
                  onClick={() => setCurrentChapter((prev) => prev - 1)}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase disabled:opacity-20 text-[#f4f4f0] hover:text-[#c8956c] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="flex gap-2">
                  {moments.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentChapter(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentChapter 
                          ? "bg-[#c8956c]" 
                          : "border border-[#c8956c]/50 bg-transparent hover:border-[#c8956c]"
                      }`}
                      aria-label={`Jump to chapter ${idx + 1}`}
                    />
                  ))}
                </div>
                <button
                  disabled={currentChapter === moments.length - 1}
                  onClick={() => setCurrentChapter((prev) => prev + 1)}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase disabled:opacity-20 text-[#f4f4f0] hover:text-[#c8956c] transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 2: ANALYTICS & DNA ================= */}
        {activeTab === "analytics" && (
          <section className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 space-y-12 animate-fade-in">
            {/* Header info */}
            <div className="border-b border-[#c8956c]/10 pb-4">
              <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase">
                Conversational Genetics
              </span>
              <h2 className="font-serif text-3xl text-[#f4f4f0] font-light mt-1">
                Text DNA &amp; Compatibility
              </h2>
            </div>

            {/* Double card for Archetypes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profile A */}
              <div id="dna-card-alpha" className="bg-[#121210] border border-[#c8956c]/10 rounded-sm p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 font-mono text-[8px] text-[#c8956c]/30 uppercase tracking-widest bg-[#c8956c]/5 border-b border-l border-[#c8956c]/10 px-3 py-1">
                  Sender Alpha
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl text-[#f4f4f0]">{dnaA.name}</h3>
                  <p className="font-serif text-sm italic text-[#c8956c]">{dnaA.tagline}</p>
                </div>
                
                <div className="h-[1px] bg-[#c8956c]/10"></div>

                <div className="space-y-4">
                  <p className="font-mono text-[10px] text-[#f4f4f0]/40 tracking-wider uppercase">
                    Traits Breakdown
                  </p>
                  <ul className="space-y-2.5 font-serif text-sm italic text-[#f4f4f0]/70">
                    {dnaA.traits.map((trait, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#c8956c]">&bull;</span>
                        <span>{trait}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="h-[1px] bg-[#c8956c]/10"></div>

                {/* Conversational Archetypes */}
                <div className="space-y-3">
                  <p className="font-mono text-[10px] text-[#f4f4f0]/40 tracking-wider uppercase">
                    Conversational Archetypes
                  </p>
                  <div className="space-y-2">
                    {(moments[0]?.archetypesA || []).map((arch, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-[#f4f4f0]/60">
                          <span>{arch.archetype}</span>
                          <span>{arch.score}%</span>
                        </div>
                        <div className="w-full h-[2px] bg-[#c8956c]/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#c8956c]" style={{ width: `${arch.score}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <p className="font-mono text-[10px] text-[#f4f4f0]/30 uppercase tracking-widest">
                    Avg message length: {dnaA.avgMessageLength} chars
                  </p>
                  <button
                    onClick={() => shareCard("dna-card-alpha", `memra-dna-${stats.senders[0]}.png`)}
                    className="no-share text-[#c8956c] border border-[#c8956c]/20 rounded-sm px-2.5 py-1 text-[9px] uppercase tracking-widest hover:bg-[#c8956c]/10 transition-all font-mono font-bold"
                  >
                    Share
                  </button>
                </div>
              </div>

              {/* Profile B */}
              <div id="dna-card-beta" className="bg-[#121210] border border-[#c8956c]/10 rounded-sm p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 font-mono text-[8px] text-[#c8956c]/30 uppercase tracking-widest bg-[#c8956c]/5 border-b border-l border-[#c8956c]/10 px-3 py-1">
                  Sender Beta
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl text-[#f4f4f0]">{dnaB.name}</h3>
                  <p className="font-serif text-sm italic text-[#c8956c]">{dnaB.tagline}</p>
                </div>
                
                <div className="h-[1px] bg-[#c8956c]/10"></div>

                <div className="space-y-4">
                  <p className="font-mono text-[10px] text-[#f4f4f0]/40 tracking-wider uppercase">
                    Traits Breakdown
                  </p>
                  <ul className="space-y-2.5 font-serif text-sm italic text-[#f4f4f0]/70">
                    {dnaB.traits.map((trait, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#c8956c]">&bull;</span>
                        <span>{trait}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="h-[1px] bg-[#c8956c]/10"></div>

                {/* Conversational Archetypes */}
                <div className="space-y-3">
                  <p className="font-mono text-[10px] text-[#f4f4f0]/40 tracking-wider uppercase">
                    Conversational Archetypes
                  </p>
                  <div className="space-y-2">
                    {(moments[0]?.archetypesB || []).map((arch, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-[#f4f4f0]/60">
                          <span>{arch.archetype}</span>
                           <span>{arch.score}%</span>
                        </div>
                        <div className="w-full h-[2px] bg-[#c8956c]/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#c8956c]" style={{ width: `${arch.score}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <p className="font-mono text-[10px] text-[#f4f4f0]/30 uppercase tracking-widest">
                    Avg message length: {dnaB.avgMessageLength} chars
                  </p>
                  <button
                    onClick={() => shareCard("dna-card-beta", `memra-dna-${stats.senders[1] || "Other"}.png`)}
                    className="no-share text-[#c8956c] border border-[#c8956c]/20 rounded-sm px-2.5 py-1 text-[9px] uppercase tracking-widest hover:bg-[#c8956c]/10 transition-all font-mono font-bold"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* Pairing Insight Card */}
            {pairingInsight && (
              <div className="bg-[#121210] border border-[#c8956c]/20 rounded-sm p-6 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 font-mono text-[8px] text-[#c8956c]/30 uppercase tracking-widest bg-[#c8956c]/5 border-b border-l border-[#c8956c]/10 px-3 py-1">
                  Combined Insight
                </div>
                <div className="space-y-2">
                  <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
                    You Two Together
                  </span>
                  <p className="font-serif text-lg text-[#f4f4f0]/95 italic leading-relaxed">
                    "{pairingInsight}"
                  </p>
                </div>
              </div>
            )}

            {/* Compatibility Section */}
            <div id="compatibility-card" className="bg-[#121210] border border-[#c8956c]/10 rounded-sm p-8 space-y-8 relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase">
                    Calculated Affinity
                  </span>
                  <h3 className="font-serif text-2xl text-[#f4f4f0]">Compatibility Ledger</h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[10px] text-[#f4f4f0]/40 uppercase tracking-wider block">
                    Weighted Balance
                  </span>
                  <span className="font-serif text-4xl text-[#c8956c] font-light">
                    {compatibility.overallScore}%
                  </span>
                </div>
              </div>

              <div className="h-[1px] bg-[#c8956c]/10"></div>

              {/* Axes Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {(() => {
                  const relType = moments?.[0]?.relationshipType || "Friendship";
                  let axesList = [
                    { label: "Communication Balance", score: compatibility.axes.communicationBalance },
                    { label: "Initiation Equity", score: compatibility.axes.initiationEquity },
                    { label: "Emotional Availability", score: compatibility.axes.emotionalAvailability },
                    { label: "Response Consistency", score: compatibility.axes.responseConsistency },
                    { label: "Depth Progression", score: compatibility.axes.depthProgression },
                  ];

                  if (relType === "Classmate" || relType === "Friendship") {
                    axesList = [
                      { label: "Collaboration", score: Math.min(95, compatibility.axes.communicationBalance) },
                      { label: "Initiative Balance", score: compatibility.axes.initiationEquity },
                      { label: "Supportiveness", score: Math.min(95, compatibility.axes.emotionalAvailability + 15) },
                      { label: "Responsiveness", score: compatibility.axes.responseConsistency },
                      { label: "Reliability", score: Math.min(95, compatibility.axes.depthProgression + 20) },
                    ];
                  } else if (relType === "Romantic") {
                    axesList = [
                      { label: "Emotional Reciprocity", score: compatibility.axes.communicationBalance },
                      { label: "Affection Balance", score: compatibility.axes.initiationEquity },
                      { label: "Vulnerability", score: compatibility.axes.emotionalAvailability },
                      { label: "Response Consistency", score: compatibility.axes.responseConsistency },
                      { label: "Conflict Recovery", score: compatibility.axes.depthProgression },
                    ];
                  }

                  return axesList.map((axis, idx) => (
                    <div key={idx} className="border border-[#c8956c]/5 p-4 rounded-sm bg-[#0b0b09]/50 flex flex-col justify-between space-y-3">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#f4f4f0]/50 h-8 leading-tight">
                        {axis.label}
                      </span>
                      <div className="space-y-1">
                        <div className="font-serif text-2xl text-[#c8956c] font-light">
                          {axis.score}%
                        </div>
                        <div className="w-full h-[1.5px] bg-[#c8956c]/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#c8956c]" style={{ width: `${axis.score}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="h-[1px] bg-[#c8956c]/10"></div>

              {/* Blended Relationship Confidences */}
              <div className="space-y-4">
                <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
                  Blended Relationship Profile
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(moments[0]?.blendedRelationships || []).map((rel, idx) => (
                    <div key={idx} className="bg-[#0b0b09]/50 border border-[#c8956c]/10 p-4 rounded-sm space-y-2">
                      <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-[#f4f4f0]/70">
                        <span>{rel.type}</span>
                        <span className="text-[#c8956c] font-bold">{Math.round(rel.confidence * 100)}%</span>
                      </div>
                      <div className="w-full h-[2.5px] bg-[#c8956c]/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#c8956c]" style={{ width: `${rel.confidence * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-[#c8956c]/10"></div>

              {/* Relationship Evolution Timeline */}
              {moments[0]?.relationshipTimeline && (
                <div className="space-y-4 pt-2">
                  <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
                    Relationship Evolution Timeline
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {moments[0].relationshipTimeline.map((item, idx) => {
                      const formatTimelineYear = (y: number) => {
                        const base = Math.floor(y);
                        const dec = Math.round((y - base) * 10);
                        if (dec === 1) return `Mid ${base}`;
                        if (dec === 2) return `Late ${base}`;
                        if (dec === 0) return String(base);
                        return `Early ${base}`;
                      };

                      return (
                        <div key={idx} className="bg-[#0b0b09]/30 border border-[#c8956c]/5 p-4 rounded-sm space-y-3">
                          <div className="font-mono text-xs text-[#c8956c] font-bold border-b border-[#c8956c]/10 pb-1.5">
                            {formatTimelineYear(item.year)}
                          </div>
                          <div className="space-y-2">
                            {item.blended.map((b, bIdx) => (
                              <div key={bIdx} className="space-y-1">
                                <div className="flex justify-between text-[9.5px] font-mono text-[#f4f4f0]/60 uppercase">
                                  <span>{b.type}</span>
                                  <span>{Math.round(b.confidence * 100)}%</span>
                                </div>
                                <div className="w-full h-[1.5px] bg-[#c8956c]/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#c8956c]" style={{ width: `${b.confidence * 100}%` }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="h-[1px] bg-[#c8956c]/10"></div>

              {/* Analyst Note */}
              <div className="bg-[#0b0b09] border border-[#c8956c]/15 p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
                    Analyst Assessment
                  </span>
                  <p className="font-serif text-base text-[#f4f4f0]/70 italic leading-relaxed">
                    {compatibility.analystNote}
                  </p>
                </div>
                <button
                  onClick={() => shareCard("compatibility-card", "memra-compatibility.png")}
                  className="no-share text-[#c8956c] border border-[#c8956c]/20 rounded-sm px-3 py-1.5 text-[9px] uppercase tracking-widest hover:bg-[#c8956c]/10 transition-all font-mono font-bold shrink-0"
                >
                  Share Card
                </button>
              </div>
            </div>

            {/* Core Stats Overview */}
            <div className="bg-[#121210]/40 border border-[#c8956c]/5 p-8 rounded-sm space-y-6">
              <h3 className="font-serif text-xl text-[#f4f4f0]">Frictional Metrics Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-[#f4f4f0]/40 uppercase tracking-wider">Total Messages</span>
                  <p className="font-serif text-2xl text-[#c8956c]">{stats.totalMessages}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-[#f4f4f0]/40 uppercase tracking-wider">Peak Day</span>
                  <p className="font-serif text-2xl text-[#c8956c]">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][[...stats.activeDayOfWeek].sort((a,b)=>b.count-a.count)[0].dayIndex]}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-[#f4f4f0]/40 uppercase tracking-wider">Peak Hour</span>
                  <p className="font-serif text-2xl text-[#c8956c]">
                    {(() => {
                      const peakIdx = stats.peakHours.indexOf(Math.max(...stats.peakHours));
                      return `${peakIdx % 12 || 12}:00 ${peakIdx >= 12 ? "PM" : "AM"}`;
                    })()}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-[#f4f4f0]/40 uppercase tracking-wider">Silence Gaps (&gt;24h)</span>
                  <p className="font-serif text-2xl text-[#c8956c]">{stats.gapsLongerThan24h.length}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 3: RELATIONSHIP JOURNEY GRAPH ================= */}
        {activeTab === "journey" && (
          <section className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 space-y-12 animate-fade-in" id="journey-chart-card">
            <div className="border-b border-[#c8956c]/10 pb-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase">
                  Temporal Journey
                </span>
                <h2 className="font-serif text-3xl text-[#f4f4f0] font-light mt-1">
                  Relationship Journey
                </h2>
              </div>
              {(() => {
                const sA = stats.senders[0] || "Alpha";
                const sB = stats.senders[1] || "Beta";
                const wks = getWeeklyData(messages, sA, sB);
                return wks.length >= 2 ? (
                  <button
                    onClick={() => shareCard("journey-chart-card", "memra-journey.png")}
                    className="no-share text-[#c8956c] border border-[#c8956c]/20 rounded-sm px-2.5 py-1 text-[9px] uppercase tracking-widest hover:bg-[#c8956c]/10 transition-all font-mono font-bold"
                  >
                    Share
                  </button>
                ) : null;
              })()}
            </div>

            {(() => {
              const senderA = stats.senders[0] || "Alpha";
              const senderB = stats.senders[1] || "Beta";
              const weeks = getWeeklyData(messages, senderA, senderB);

              if (weeks.length < 2) {
                return (
                  <div className="flex items-center justify-center p-12 border border-[#c8956c]/15 bg-[#121210]/20 rounded-sm">
                    <p className="font-mono text-sm text-[#c8956c]/70 tracking-wider text-center max-w-md">
                      Not enough data to render the journey chart. Upload a longer conversation for this feature.
                    </p>
                  </div>
                );
              }

              const maxCount = Math.max(...weeks.map(w => w.total), 10);
              const svgWidth = 600;
              const svgHeight = 200;
              const padX = 40;
              const padY = 20;

              const points = weeks.map((w, i) => ({
                x: padX + (i / (weeks.length - 1)) * (svgWidth - padX * 2),
                y: padY + (1 - w.total / maxCount) * (svgHeight - padY * 2)
              }));

              const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - padY} L ${points[0].x} ${svgHeight - padY} Z`;

              // X Axis Month Labels
              const xAxisLabels: Array<{ x: number; label: string }> = [];
              let lastMonth = "";
              weeks.forEach((w, i) => {
                const monthName = w.startDate.toLocaleDateString("en-US", { month: "short" });
                if (monthName !== lastMonth) {
                  xAxisLabels.push({ x: points[i].x, label: monthName });
                  lastMonth = monthName;
                }
              });
              let finalXLabels = xAxisLabels;
              if (xAxisLabels.length > 5) {
                const step = Math.ceil(xAxisLabels.length / 5);
                finalXLabels = xAxisLabels.filter((_, idx) => idx % step === 0);
              }

              // Stats Calculations
              const mostActive = weeks.reduce((max, w) => w.total > max.total ? w : max, weeks[0]);
              
              // Longest Silence
              let longestGap = { hours: 0, dateStr: "N/A" };
              if (stats.gapsLongerThan24h && stats.gapsLongerThan24h.length > 0) {
                const maxGap = stats.gapsLongerThan24h.reduce((max, g) => g.hours > max.hours ? g : max, stats.gapsLongerThan24h[0]);
                longestGap = {
                  hours: maxGap.hours,
                  dateStr: new Date(maxGap.start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                };
              } else if (messages.length > 1) {
                let maxMs = 0;
                let maxStartDate = messages[0].date;
                for (let i = 1; i < messages.length; i++) {
                  const diff = new Date(messages[i].date).getTime() - new Date(messages[i-1].date).getTime();
                  if (diff > maxMs) {
                    maxMs = diff;
                    maxStartDate = messages[i-1].date;
                  }
                }
                longestGap = {
                  hours: Math.round(maxMs / (1000 * 60 * 60)),
                  dateStr: new Date(maxStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                };
              }

              // Trend
              const totalWeeks = weeks.length;
              let trend = "Stable";
              if (totalWeeks >= 3) {
                const oneThird = Math.ceil(totalWeeks / 3);
                const firstThirdWeeks = weeks.slice(0, oneThird);
                const lastThirdWeeks = weeks.slice(totalWeeks - oneThird);
                
                const firstVolume = firstThirdWeeks.reduce((sum, w) => sum + w.total, 0) / oneThird;
                const lastVolume = lastThirdWeeks.reduce((sum, w) => sum + w.total, 0) / oneThird;
                
                const diffPct = (lastVolume - firstVolume) / (firstVolume || 1);
                if (diffPct > 0.15) {
                  trend = "Growing";
                } else if (diffPct < -0.15) {
                  trend = "Fading";
                } else {
                  trend = "Stable";
                }
              }

              return (
                <div className="space-y-8">
                  {/* SVG Chart Wrapper */}
                  <div className="bg-[#0b0b09] border border-[#c8956c]/10 rounded-sm p-6 relative overflow-hidden">
                    <div className="w-full overflow-x-auto select-none">
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" className="overflow-visible min-w-[500px]">
                        <defs>
                          <linearGradient id="journeyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c8956c" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#c8956c" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Grid Y lines */}
                        {[0, 0.5, 1].map((ratio, idx) => {
                          const y = padY + ratio * (svgHeight - padY * 2);
                          return (
                            <line
                              key={idx}
                              x1={padX}
                              y1={y}
                              x2={svgWidth - padX}
                              y2={y}
                              stroke="#c8956c"
                              strokeOpacity="0.05"
                              strokeWidth="0.8"
                            />
                          );
                        })}

                        {/* Y Axis Count Labels */}
                        <text x={padX - 8} y={padY + 3} fill="#c8956c" fillOpacity="0.6" fontSize="8" fontFamily="monospace" textAnchor="end">
                          {maxCount}
                        </text>
                        <text x={padX - 8} y={padY + (svgHeight - padY * 2) / 2 + 3} fill="#c8956c" fillOpacity="0.6" fontSize="8" fontFamily="monospace" textAnchor="end">
                          {Math.round(maxCount / 2)}
                        </text>
                        <text x={padX - 8} y={svgHeight - padY + 3} fill="#c8956c" fillOpacity="0.6" fontSize="8" fontFamily="monospace" textAnchor="end">
                          0
                        </text>

                        {/* X Axis Line */}
                        <line x1={padX} y1={svgHeight - padY} x2={svgWidth - padX} y2={svgHeight - padY} stroke="#c8956c" strokeOpacity="0.15" strokeWidth="1" />

                        {/* Area Gradient Fill */}
                        <path d={areaD} fill="url(#journeyAreaGrad)" />

                        {/* Line Path */}
                        <path d={pathD} fill="none" stroke="#c8956c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Dots */}
                        {points.map((p, idx) => (
                          <circle
                            key={idx}
                            cx={p.x}
                            cy={p.y}
                            r="3"
                            fill="#c8956c"
                            stroke="#0b0b09"
                            strokeWidth="1"
                            className="transition-all hover:r-4 cursor-pointer"
                          >
                            <title>{`${weeks[idx].label}: ${weeks[idx].total} messages`}</title>
                          </circle>
                        ))}

                        {/* X Axis Labels */}
                        {finalXLabels.map((lbl, idx) => (
                          <text
                            key={idx}
                            x={lbl.x}
                            y={svgHeight - padY + 12}
                            fill="#f4f4f0"
                            fillOpacity="0.4"
                            fontSize="8"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {lbl.label}
                          </text>
                        ))}
                      </svg>
                    </div>
                  </div>

                  {/* 3 Stat Cards in a row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stat Card 1 */}
                    <div className="bg-[#121210] border border-[#c8956c]/10 p-5 rounded-sm space-y-1.5 animate-fade-in">
                      <span className="font-mono text-[9px] text-[#f4f4f0]/40 uppercase tracking-widest block">
                        Most Active Week
                      </span>
                      <p className="font-serif text-lg text-[#f4f4f0] leading-snug">
                        Week of {mostActive.label}
                      </p>
                      <p className="font-mono text-xs text-[#c8956c] font-bold">
                        {mostActive.total} messages
                      </p>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-[#121210] border border-[#c8956c]/10 p-5 rounded-sm space-y-1.5 animate-fade-in">
                      <span className="font-mono text-[9px] text-[#f4f4f0]/40 uppercase tracking-widest block">
                        Longest Silence
                      </span>
                      <p className="font-serif text-lg text-[#f4f4f0] leading-snug">
                        {longestGap.hours > 0 ? `${longestGap.hours}h silence` : "No quiet gaps"}
                      </p>
                      <p className="font-mono text-xs text-[#c8956c]/60">
                        Happened on {longestGap.dateStr}
                      </p>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-[#121210] border border-[#c8956c]/10 p-5 rounded-sm space-y-1.5 animate-fade-in">
                      <span className="font-mono text-[9px] text-[#f4f4f0]/40 uppercase tracking-widest block">
                        Conversation Trend
                      </span>
                      <p className="font-serif text-lg text-[#f4f4f0] leading-snug">
                        {trend} Trend
                      </p>
                      <p className="font-mono text-xs text-[#c8956c] font-bold uppercase tracking-wider">
                        {trend === "Growing" ? "Increasing affinity" : trend === "Fading" ? "Cooling contact" : "Steady rhythm"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* ================= TAB: INTERACTIVE CHAT EXPLORER ================= */}
        {activeTab === "chat" && (() => {
          const RENDER_LIMIT = 3000;
          const hasSearch = debouncedQuery.trim() !== "";
          const displayMessages = (filteredMessages.length > RENDER_LIMIT && !hasSearch)
            ? filteredMessages.filter((m, idx) => {
                const dateKey = isNaN(new Date(m.date).getTime()) ? "" : new Date(m.date).toDateString();
                const key = `${m.sender.trim()}_${m.content.trim()}_${dateKey}`;
                return significantMap.has(key) || (idx % 3 === 0);
              }).slice(0, RENDER_LIMIT)
            : filteredMessages;

          return (
            <section className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12 space-y-6 animate-fade-in relative">
              {/* Header info */}
              <div className="border-b border-[#c8956c]/10 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase">
                    Chat Explorer
                  </span>
                  <h2 className="font-serif text-3xl text-[#f4f4f0] font-light mt-1">
                    Interactive Conversation
                  </h2>
                </div>

                {/* Search bar */}
                <div className="relative max-w-xs w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full bg-[#121210] border border-[#c8956c]/20 rounded-sm px-3.5 py-2 pl-9 font-mono text-[11px] text-[#f4f4f0] focus:outline-none focus:border-[#c8956c] transition-all placeholder-[#f4f4f0]/20"
                  />
                  <Search className="w-3.5 h-3.5 text-[#c8956c]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setDebouncedQuery("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-[#c8956c] text-[#f4f4f0]/40 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages box */}
              <div
                ref={chatContainerRef}
                className="bg-[#0b0b09] border border-[#c8956c]/10 rounded-sm p-4 md:p-6 overflow-y-auto max-h-[70vh] scrollbar-thin select-text scroll-smooth"
              >
                {filteredMessages.length > RENDER_LIMIT && !hasSearch && (
                  <div style={{
                    textAlign: "center",
                    padding: "12px",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "#c8956c",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #1a1a14",
                    marginBottom: "16px"
                  }}>
                    Large archive — showing {RENDER_LIMIT} messages including all highlights
                  </div>
                )}

                {displayMessages.length === 0 ? (
                  <div className="py-20 text-center font-mono text-[10px] text-[#f4f4f0]/40 tracking-wider">
                    No messages found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayMessages.map((m) => {
                      const isSenderA = m.sender === stats.senders[0];
                      const dateKey = isNaN(new Date(m.date).getTime()) ? "" : new Date(m.date).toDateString();
                      const sigKey = `${m.sender.trim()}_${m.content.trim()}_${dateKey}`;
                      const sigMatch = significantMap.get(sigKey);

                      return (
                        <div key={m.originalIndex} className="space-y-4">
                          {m.showDateHeader && (
                            <div className="text-center font-mono text-[9px] text-[#c8956c] tracking-widest uppercase my-6">
                              {m.dateStr}
                            </div>
                          )}

                          <div className={`flex flex-col ${isSenderA ? "items-end" : "items-start"} w-full`}>
                            {/* Highlight Tag */}
                            {sigMatch && (
                              <div className="mb-1">
                                {sigMatch.type === "chapter" && (
                                  <span className="bg-[#c8956c]/15 text-[#c8956c] border border-[#c8956c]/30 px-2 py-0.5 rounded-sm text-[8px] font-mono tracking-widest uppercase font-bold">
                                    {sigMatch.label}
                                  </span>
                                )}
                                {sigMatch.type === "green" && (
                                  <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-sm text-[8px] font-mono uppercase font-bold">
                                    {sigMatch.label}
                                  </span>
                                )}
                                {sigMatch.type === "red" && (
                                  <span className="bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-sm text-[8px] font-mono uppercase font-bold">
                                    {sigMatch.label}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Message bubble */}
                            <div
                              className={`max-w-[68%] p-3.5 font-serif text-[13.5px] leading-[1.65] border transition-all ${
                                isSenderA
                                  ? "bg-[#1a1a14] border-[#2a2a22] text-[#c8b89a] rounded-sm rounded-br-none text-right"
                                  : "bg-[#0f0f0c] border-[#1e1e18] text-[#8a8470] rounded-sm rounded-bl-none text-left"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            </div>

                            {/* Info */}
                            <div className="mt-1 font-mono text-[8px] text-[#f4f4f0]/30 uppercase tracking-widest flex items-center gap-1.5 px-1">
                              <span>{m.sender}</span>
                              <span>•</span>
                              <span>
                                {new Date(m.date).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Scroll-to-Top Button */}
              {showScrollTop && (
                <button
                  onClick={scrollToTop}
                  className="fixed bottom-8 right-8 z-30 bg-[#c8956c] text-[#0b0b09] p-3 rounded-full hover:bg-[#c8956c]/90 transition-all shadow-lg animate-fade-in no-share cursor-pointer"
                >
                  <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </section>
          );
        })()}

        {/* ================= TAB 3: FLAG ANALYSIS ================= */}
        {activeTab === "flags" && (
          <section className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 space-y-10 animate-fade-in">
            {/* Header info */}
            <div className="border-b border-[#c8956c]/10 pb-4">
              <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase">
                Pattern Audit
              </span>
              <h2 className="font-serif text-3xl text-[#f4f4f0] font-light mt-1">
                Flags &amp; Evidence
              </h2>
            </div>

            {/* Safety notice banner */}
            {showSafetyNotice && (
              <div className="bg-red-950/20 border border-red-500/20 p-5 rounded-sm flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-red-400 tracking-widest uppercase font-bold">
                    Communication Advisory
                  </span>
                  <p className="font-serif text-base text-[#f4f4f0]/80 italic">
                    Some patterns here may be worth discussing with someone you trust.
                  </p>
                </div>
              </div>
            )}

            {/* Flags Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {/* Green Flags Column */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#c8956c]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <h3 className="font-serif text-xl text-[#f4f4f0]">Positive Indicators</h3>
                  </div>
                  {greenFlags && greenFlags.length > 0 && (
                    <button
                      onClick={() => shareCard("green-flags-column-container", "memra-green-flags.png")}
                      className="no-share text-emerald-400 border border-emerald-500/20 rounded-sm px-2.5 py-1 text-[9px] uppercase tracking-widest hover:bg-emerald-500/10 transition-all font-mono font-bold"
                    >
                      Share Report
                    </button>
                  )}
                </div>

                {greenFlags && greenFlags.length > 0 ? (
                  <div id="green-flags-column-container" className="space-y-6 bg-[#0b0b09] p-4 rounded-sm border border-[#c8956c]/5 animate-fade-in">
                    {greenFlags.map((flag) => (
                      <div key={flag.id} className="bg-[#121210] border border-[#c8956c]/5 p-6 rounded-sm space-y-4 animate-fade-in">
                        <div className="space-y-1">
                          <h4 className="font-serif text-lg text-[#f4f4f0]">{flag.label}</h4>
                          <p className="font-serif text-xs text-[#f4f4f0]/40 italic">{flag.description}</p>
                        </div>
                        
                        <div className="border-l border-[#c8956c]/20 pl-4 space-y-3">
                          {flag.evidence.map((ev, i) => (
                            <div key={i} className="space-y-1">
                              <p className="font-serif text-sm italic text-[#f4f4f0]/70">
                                "{ev.content}"
                              </p>
                              <div className="flex justify-between font-mono text-[8px] uppercase tracking-wider text-[#f4f4f0]/30">
                                <span>— {ev.sender}</span>
                                <span>{new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-serif text-sm text-[#f4f4f0]/40 italic p-6 border border-[#c8956c]/5 rounded-sm bg-[#121210]/20 text-center">
                    No positive patterns matched the criteria in the ruleset.
                  </p>
                )}
              </div>

              {/* Red Flags Column */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-[#c8956c]/10 pb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <h3 className="font-serif text-xl text-[#f4f4f0]">Friction Indicators</h3>
                </div>

                {redFlags && redFlags.length > 0 ? (
                  <div className="space-y-6">
                    {redFlags.map((flag) => (
                      <div key={flag.id} className="bg-[#121210] border border-[#c8956c]/5 p-6 rounded-sm space-y-4">
                        <div className="space-y-1">
                          <h4 className="font-serif text-lg text-[#f4f4f0]">{flag.label}</h4>
                          <p className="font-serif text-xs text-[#f4f4f0]/40 italic">{flag.description}</p>
                        </div>
                        
                        <div className="border-l border-red-500/20 pl-4 space-y-4">
                          {flag.evidence.map((ev, i) => (
                            <div key={i} className="space-y-1.5">
                              {ev.context && (
                                <p className="font-mono text-[9px] uppercase tracking-wider text-red-400/40">
                                  Context: {ev.context}
                                </p>
                              )}
                              <p className="font-serif text-sm italic text-[#f4f4f0]/70">
                                "{ev.content}"
                              </p>
                              <div className="flex justify-between font-mono text-[8px] uppercase tracking-wider text-[#f4f4f0]/30">
                                <span>— {ev.sender}</span>
                                <span>{new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-serif text-sm text-[#f4f4f0]/40 italic p-6 border border-[#c8956c]/5 rounded-sm bg-[#121210]/20 text-center">
                    No friction patterns matched the criteria in the ruleset.
                  </p>
                )}
              </div>

            </div>
          </section>
        )}

        {/* ================= TAB 4: SOUNDTRACK ================= */}
        {activeTab === "soundtrack" && (
          <section className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12 space-y-10 animate-fade-in">
            {/* Header info */}
            <div className="border-b border-[#c8956c]/10 pb-4">
              <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase">
                Musical Resonance
              </span>
              <h2 className="font-serif text-3xl text-[#f4f4f0] font-light mt-1">
                Relationship Playlist
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {dynamicSoundtrack.map((song, idx) => (
                <div
                  key={idx}
                  className="bg-[#121210] border border-[#c8956c]/10 rounded-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#c8956c]/20 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Visual Cassette Icon */}
                    <div className="bg-[#0b0b09] border border-[#c8956c]/20 p-4 rounded-sm flex items-center justify-center shrink-0 group-hover:border-[#c8956c]/40 transition-colors">
                      <Music className="w-5 h-5 text-[#c8956c] stroke-[1.2]" />
                    </div>
                    
                    <div className="space-y-1">
                      <a
                        href={song.spotifySearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif text-lg text-[#f4f4f0] hover:underline hover:text-[#c8956c] transition-colors"
                      >
                        {song.title}
                      </a>
                      <p className="font-serif text-sm italic text-[#c8956c]">by {song.artist}</p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md border-l border-[#c8956c]/10 md:pl-6 pl-0 md:pt-0 pt-3">
                    <span className="font-mono text-[8px] text-[#f4f4f0]/40 tracking-widest uppercase block mb-1">
                      Archive Context
                    </span>
                    <p className="font-serif text-sm text-[#f4f4f0]/60 italic leading-relaxed">
                      {song.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        </ErrorBoundary>

      </div>

      {/* Paywall Purchase Modal */}
      {showPaywallModal && (
        <div className="fixed inset-0 bg-[#0b0b09]/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#121210] border border-[#c8956c]/20 rounded-sm p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            
            {/* Corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#c8956c]/30"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#c8956c]/30"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#c8956c]/30"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#c8956c]/30"></div>

            <div className="text-center space-y-3">
              <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block border border-[#c8956c]/15 px-3 py-1 rounded-sm w-fit mx-auto">
                Memory Book Compiler
              </span>
              <h3 className="font-serif text-2xl text-[#f4f4f0] font-normal">
                Download Your Memoir Book
              </h3>
              <p className="font-serif text-sm text-[#f4f4f0]/50 italic leading-relaxed">
                Compile all timeline chapters, emotional story narratives, Text DNA communicators, Flag analyses, and your relationship playlist into an 11-page printable book.
              </p>
            </div>

            <div className="border-t border-b border-[#c8956c]/10 py-4 text-center">
              <span className="font-mono text-[10px] text-[#f4f4f0]/40 uppercase tracking-widest block mb-1">
                One-time charge
              </span>
              <span className="font-serif text-3xl text-[#c8956c] font-light">
                &#8377;199
              </span>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full font-mono text-[10px] tracking-widest uppercase bg-[#c8956c] text-[#0b0b09] py-3.5 rounded-sm hover:bg-[#c8956c]/90 transition-all font-bold shadow-md disabled:opacity-50"
              >
                {paymentLoading ? "Connecting..." : "Pay via Razorpay"}
              </button>

              <button
                onClick={handleSimulatePayment}
                className="w-full font-mono text-[10px] tracking-widest uppercase bg-transparent text-[#c8956c] border border-[#c8956c]/20 py-3.5 rounded-sm hover:bg-[#c8956c]/10 transition-all font-bold"
              >
                Test Bypass: Simulate Success
              </button>

              <button
                onClick={() => setShowPaywallModal(false)}
                className="w-full font-mono text-[9px] tracking-wider uppercase text-[#f4f4f0]/40 hover:text-[#f4f4f0] transition-all text-center block pt-2"
              >
                Cancel
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="font-mono text-[8px] text-[#f4f4f0]/30 tracking-widest uppercase">
                Secure checkout. 100% Client-side delivery.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Memra Wrap Slideshow Overlay (Task 4) */}
      {showWrap && (
        <div className="fixed inset-0 bg-[#0b0b09] z-50 flex flex-col justify-between p-6 md:p-12 select-none overflow-hidden animate-fade-in">
          {/* Top Close Button */}
          <button
            onClick={() => {
              setShowWrap(false);
              setWrapSlide(0);
            }}
            className="absolute top-6 right-6 text-[#f4f4f0]/40 hover:text-[#f4f4f0] transition-colors p-2 no-share cursor-pointer"
            aria-label="Close slideshow"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top progress dots */}
          <div className="w-full max-w-lg mx-auto flex gap-2 pt-4">
            {Array.from({ length: 8 }).map((_, idx) => {
              let fillWidth = "0%";
              let isAnimating = false;

              if (idx < wrapSlide) {
                fillWidth = "100%";
              } else if (idx === wrapSlide) {
                if (isLastSlide) {
                  fillWidth = "100%";
                } else {
                  fillWidth = "0%";
                  isAnimating = true;
                }
              }

              return (
                <div key={idx} className="flex-1 h-[2px] bg-[#c8956c]/10 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute top-0 left-0 h-full bg-[#c8956c] ${
                      isAnimating ? "animate-progress-dot" : ""
                    }`}
                    style={{
                      width: isAnimating ? undefined : fillWidth,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Central slideshow wrapper */}
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={wrapSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-xl mx-auto text-center space-y-6 md:space-y-10 py-12 relative flex flex-col items-center justify-center min-h-[50vh] bg-[#0b0b09] border border-[#c8956c]/5 rounded-sm p-8 shadow-2xl"
                id="memra-wrap-slide-container"
              >
                {/* Small Top Logo */}
                <div className="absolute top-4 left-4 font-mono text-[9px] text-[#c8956c]/60 tracking-widest uppercase no-share">
                  Memra
                </div>

                {/* Slide 1: Welcome / Date Range */}
                {wrapSlide === 0 && (
                  <div className="space-y-4 md:space-y-6 animate-fade-in">
                    <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase border border-[#c8956c]/15 px-2.5 py-1 rounded-sm w-fit mx-auto">
                      Your Archive Summary
                    </span>
                    <h2 className="font-serif text-4xl md:text-6xl font-light text-[#f4f4f0] leading-tight">
                      Memra Wrapped
                    </h2>
                    <p className="font-serif text-base md:text-xl italic text-[#f4f4f0]/60 max-w-md mx-auto">
                      {(() => {
                        const dates = messages.map((m) => new Date(m.date).getTime()).filter((t) => !isNaN(t));
                        const minDate = new Date(Math.min(...dates));
                        const maxDate = new Date(Math.max(...dates));
                        return `${minDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })} – ${maxDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}`;
                      })()}
                    </p>
                    <div className="w-8 h-[1px] bg-[#c8956c]/30 mx-auto"></div>
                    <p className="font-mono text-[10px] text-[#c8956c] uppercase tracking-wider">
                      Analyzing {messages.length} messages
                    </p>
                  </div>
                )}

                {/* Slide 2: Senders message counts */}
                {wrapSlide === 1 && (
                  <div className="space-y-8 w-full animate-fade-in">
                    <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block mb-4">
                      Volume Split
                    </span>
                    <div className="grid grid-cols-2 gap-6 md:gap-8 divide-x divide-[#c8956c]/10">
                      <div className="space-y-2">
                        <h3 className="font-serif text-base md:text-lg text-[#f4f4f0]/70 italic">{stats.senders[0] || "Alpha"}</h3>
                        <p className="font-serif text-4xl md:text-6xl font-light text-[#c8956c]">
                          {countSenderA}
                        </p>
                        <span className="font-mono text-[8px] text-[#f4f4f0]/30 uppercase tracking-widest block">messages</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-serif text-base md:text-lg text-[#f4f4f0]/70 italic">{stats.senders[1] || "Beta"}</h3>
                        <p className="font-serif text-4xl md:text-6xl font-light text-[#c8956c]">
                          {countSenderB}
                        </p>
                        <span className="font-mono text-[8px] text-[#f4f4f0]/30 uppercase tracking-widest block">messages</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 3: Peak Hour SVG */}
                {wrapSlide === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
                      Peak Messaging Hours
                    </span>
                    {(() => {
                      const peakIdx = stats.peakHours.indexOf(Math.max(...stats.peakHours));
                      const peakHourStr = `${peakIdx % 12 || 12}:00 ${peakIdx >= 12 ? "PM" : "AM"}`;
                      const angle = 180 - (peakIdx / 23) * 180;
                      const rad = (angle * Math.PI) / 180;
                      const cx = 50 + 40 * Math.cos(rad);
                      const cy = 45 - 40 * Math.sin(rad);

                      return (
                        <div className="space-y-4 md:space-y-6">
                          <svg viewBox="0 0 100 55" className="w-56 h-28 mx-auto overflow-visible">
                            <path
                              d="M 10 45 A 40 40 0 0 1 90 45"
                              fill="none"
                              stroke="#c8956c"
                              strokeOpacity="0.15"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle cx={cx} cy={cy} r="4" fill="#c8956c" className="animate-ping" style={{ transformOrigin: `${cx}px ${cy}px` }} />
                            <circle cx={cx} cy={cy} r="2.5" fill="#c8956c" />
                            <text x="50" y="42" fill="#c8956c" fontSize="7" fontFamily="monospace" textAnchor="middle">
                              {peakHourStr}
                            </text>
                          </svg>
                          <h3 className="font-serif text-2xl md:text-3xl text-[#f4f4f0] font-light">
                            Your Peak Hour was {peakHourStr}
                          </h3>
                          <p className="font-serif text-xs md:text-sm italic text-[#f4f4f0]/50 max-w-sm mx-auto">
                            That is when your messaging activity reached its maximum velocity.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Slide 4: Silence Gaps */}
                {wrapSlide === 3 && (
                  <div className="space-y-6 animate-fade-in w-full">
                    <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
                      Silence Gaps
                    </span>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6 divide-x divide-[#c8956c]/10">
                        <div className="space-y-1">
                          <p className="font-serif text-4xl md:text-6xl font-light text-[#c8956c]">
                            {countGaps}
                          </p>
                          <span className="font-mono text-[8px] text-[#f4f4f0]/40 uppercase tracking-widest block">Gaps &gt; 24h</span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-serif text-4xl md:text-6xl font-light text-[#c8956c]">
                            {countLongestGap}
                          </p>
                          <span className="font-mono text-[8px] text-[#f4f4f0]/40 uppercase tracking-widest block">Longest Gap Hours</span>
                        </div>
                      </div>
                      <p className="font-serif text-xs md:text-sm italic text-[#f4f4f0]/50 max-w-sm mx-auto pt-4">
                        Resuming contact after long pauses tests and solidifies connection quality.
                      </p>
                    </div>
                  </div>
                )}

                {/* Slide 5: Sender A archetype */}
                {wrapSlide === 4 && (
                  <div className="space-y-4 md:space-y-6 max-w-md mx-auto animate-fade-in">
                    <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
                      Communicator Archetype
                    </span>
                    <h3 className="font-serif text-base text-[#f4f4f0]/70 italic">{stats.senders[0] || "Alpha"}</h3>
                    <h2 className="font-serif text-3xl md:text-5xl font-light text-[#c8956c]">
                      {dnaA?.name || "The Anchor"}
                    </h2>
                    <p className="font-serif text-xs md:text-sm italic text-[#f4f4f0]/60 leading-relaxed">
                      "{dnaA?.tagline}"
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                      {dnaA?.traits.map((trait: string, idx: number) => (
                        <span key={idx} className="font-mono text-[8px] border border-[#c8956c]/20 text-[#c8956c] px-2 py-0.5 rounded-sm uppercase tracking-wide">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Slide 6: Sender B archetype */}
                {wrapSlide === 5 && (
                  <div className="space-y-4 md:space-y-6 max-w-md mx-auto animate-fade-in">
                    <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
                      Communicator Archetype
                    </span>
                    <h3 className="font-serif text-base text-[#f4f4f0]/70 italic">{stats.senders[1] || "Beta"}</h3>
                    <h2 className="font-serif text-3xl md:text-5xl font-light text-[#c8956c]">
                      {dnaB?.name || "The Spark"}
                    </h2>
                    <p className="font-serif text-xs md:text-sm italic text-[#f4f4f0]/60 leading-relaxed">
                      "{dnaB?.tagline}"
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                      {dnaB?.traits.map((trait: string, idx: number) => (
                        <span key={idx} className="font-mono text-[8px] border border-[#c8956c]/20 text-[#c8956c] px-2 py-0.5 rounded-sm uppercase tracking-wide">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Slide 7: Compatibility Score */}
                {wrapSlide === 6 && (
                  <div className="space-y-4 md:space-y-6 animate-fade-in">
                    <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
                      Compatibility Match
                    </span>
                    <h2 className="font-serif text-6xl md:text-8xl font-light text-[#c8956c]">
                      {countCompatibility}%
                    </h2>
                    <h3 className="font-serif text-lg md:text-xl text-[#f4f4f0] font-light">Compatibility Rating</h3>
                    <p className="font-serif text-xs md:text-sm italic text-[#f4f4f0]/50 max-w-sm mx-auto leading-relaxed">
                      "{compatibility.analystNote}"
                    </p>
                  </div>
                )}

                {/* Slide 8: Green Flag Highlight */}
                {wrapSlide === 7 && (
                  <div className="space-y-4 md:space-y-6 max-w-xl mx-auto animate-fade-in">
                    <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
                      Green Flag Highlight
                    </span>
                    {(() => {
                      const topGreen = greenFlags && greenFlags.length > 0
                        ? [...greenFlags].sort((a, b) => b.evidence.length - a.evidence.length)[0]
                        : null;
                      const topEvidence = topGreen && topGreen.evidence.length > 0
                        ? topGreen.evidence[0]
                        : null;

                      return topGreen && topEvidence ? (
                        <div className="space-y-4">
                          <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-sm text-[8px] font-mono uppercase tracking-wider font-bold">
                            {topGreen.label}
                          </span>
                          <blockquote className="font-serif text-lg md:text-2xl italic text-[#f4f4f0] leading-snug">
                            "{topEvidence.content}"
                          </blockquote>
                          <cite className="font-mono text-[8px] text-[#f4f4f0]/40 uppercase tracking-widest block">
                            — {topEvidence.sender}
                          </cite>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <blockquote className="font-serif text-lg md:text-xl italic text-[#f4f4f0] leading-snug">
                            "I'm so incredibly happy we did this. It was perfect."
                          </blockquote>
                        </div>
                      );
                    })()}
                    
                    <div className="w-8 h-[1px] bg-[#c8956c]/30 mx-auto pt-4"></div>
                    <p className="font-serif text-xs text-[#c8956c] italic tracking-wide">
                      Memories deserve better than a text file.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation actions / dots */}
          <div className="w-full flex flex-col items-center gap-4 pb-8 no-share">
            <div className="flex items-center gap-4">
              {wrapSlide < 7 ? (
                <>
                  <button
                    onClick={() => {
                      setShowWrap(false);
                      setWrapSlide(0);
                    }}
                    className="font-mono text-[9px] tracking-widest uppercase border border-[#c8956c]/20 text-[#f4f4f0]/60 px-5 py-2.5 rounded-sm hover:text-[#f4f4f0] transition-all cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => setWrapSlide((prev) => prev + 1)}
                    className="font-mono text-[10px] tracking-widest uppercase bg-[#c8956c] text-[#0b0b09] px-7 py-2.5 rounded-sm hover:bg-[#c8956c]/90 transition-all font-bold cursor-pointer"
                  >
                    Next
                  </button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in">
                  <button
                    onClick={() => shareCard("memra-wrap-slide-container", "memra-wrapped.png")}
                    className="font-mono text-[10px] tracking-widest uppercase bg-[#c8956c] text-[#0b0b09] px-6 py-3 rounded-sm hover:bg-[#c8956c]/90 transition-all font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Share Your Wrap
                  </button>
                  <button
                    onClick={() => {
                      setShowWrap(false);
                      setWrapSlide(0);
                    }}
                    className="font-mono text-[10px] tracking-widest uppercase bg-[#1a1a14] border border-[#c8956c]/30 text-[#c8956c] px-6 py-3 rounded-sm hover:bg-[#c8956c]/10 transition-all font-bold cursor-pointer"
                  >
                    Close Slideshow
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Inline CSS animation for progress dots */}
          <style>{`
            @keyframes progressDot {
              0% { width: 0%; }
              100% { width: 100%; }
            }
            .animate-progress-dot {
              animation: progressDot 3000ms linear forwards;
            }
          `}</style>
        </div>
      )}
    </main>
  );
}
