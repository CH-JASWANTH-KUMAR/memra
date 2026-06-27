"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseChatExport, ParsedMessage, ChatStats } from "../utils/chatParser";
import { calculateBothDNAs, calculateTextDNA, ArchetypeProfile } from "../utils/textDNA";
import { calculateCompatibility, CompatibilityReport } from "../utils/compatibility";
import { detectFlags, FlagReport, DetectedFlag } from "../utils/flagDetector";
import { detectCinematicMoments, CinematicMoment } from "../utils/moments";
import soundtrackData from "../config/soundtrack.json";

interface ChatContextType {
  rawText: string | null;
  messages: ParsedMessage[] | null;
  stats: ChatStats | null;
  moments: CinematicMoment[] | null;
  narratives: string[] | null;
  dnaA: ArchetypeProfile | null;
  dnaB: ArchetypeProfile | null;
  compatibility: CompatibilityReport | null;
  greenFlags: DetectedFlag[] | null;
  redFlags: DetectedFlag[] | null;
  showSafetyNotice: boolean;
  soundtrack: Array<{ title: string; artist: string; reason: string; spotifySearchUrl: string }> | null;
  pairingInsight: string | null;
  isAnalyzing: boolean;
  error: string | null;
  processChat: (text: string) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [rawText, setRawText] = useState<string | null>(null);
  const [messages, setMessages] = useState<ParsedMessage[] | null>(null);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [moments, setMoments] = useState<CinematicMoment[] | null>(null);
  const [narratives, setNarratives] = useState<string[] | null>(null);
  const [dnaA, setDnaA] = useState<ArchetypeProfile | any>(null);
  const [dnaB, setDnaB] = useState<ArchetypeProfile | any>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityReport | null>(null);
  const [greenFlags, setGreenFlags] = useState<DetectedFlag[] | null>(null);
  const [redFlags, setRedFlags] = useState<DetectedFlag[] | null>(null);
  const [showSafetyNotice, setShowSafetyNotice] = useState<boolean>(false);
  const [soundtrack, setSoundtrack] = useState<Array<{ title: string; artist: string; reason: string; spotifySearchUrl: string }> | null>(null);
  const [pairingInsight, setPairingInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load state from localStorage on mount
  useEffect(() => {
    let hasSavedData = false;
    try {
      const saved = localStorage.getItem("memra_archive_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        hasSavedData = true;

        // Hydrate dates inside messages
        if (parsed.messages && Array.isArray(parsed.messages)) {
          parsed.messages = parsed.messages.map((m: any) => ({
            ...m,
            date: m.date ? new Date(m.date) : m.date,
          }));
        }

        // Hydrate dates inside stats
        if (parsed.stats) {
          if (parsed.stats.gapsLongerThan24h && Array.isArray(parsed.stats.gapsLongerThan24h)) {
            parsed.stats.gapsLongerThan24h = parsed.stats.gapsLongerThan24h.map((g: any) => ({
              ...g,
              start: g.start ? new Date(g.start) : g.start,
              end: g.end ? new Date(g.end) : g.end,
            }));
          }
          if (parsed.stats.weeklyData && Array.isArray(parsed.stats.weeklyData)) {
            parsed.stats.weeklyData = parsed.stats.weeklyData.map((w: any) => ({
              ...w,
              date: w.date ? new Date(w.date) : w.date,
            }));
          }
          if (parsed.stats.messagesByDate && typeof parsed.stats.messagesByDate === "object") {
            for (const key of Object.keys(parsed.stats.messagesByDate)) {
              if (Array.isArray(parsed.stats.messagesByDate[key])) {
                parsed.stats.messagesByDate[key] = parsed.stats.messagesByDate[key].map((m: any) => ({
                  ...m,
                  date: m.date ? new Date(m.date) : m.date,
                }));
              }
            }
          }
        }

        // Hydrate dates inside greenFlags
        if (parsed.greenFlags && Array.isArray(parsed.greenFlags)) {
          parsed.greenFlags = parsed.greenFlags.map((f: any) => ({
            ...f,
            evidence: f.evidence
              ? f.evidence.map((ev: any) => ({
                  ...ev,
                  date: ev.date ? new Date(ev.date) : ev.date,
                }))
              : [],
          }));
        }

        // Hydrate dates inside redFlags
        if (parsed.redFlags && Array.isArray(parsed.redFlags)) {
          parsed.redFlags = parsed.redFlags.map((f: any) => ({
            ...f,
            evidence: f.evidence
              ? f.evidence.map((ev: any) => ({
                  ...ev,
                  date: ev.date ? new Date(ev.date) : ev.date,
                }))
              : [],
          }));
        }

        setMessages(parsed.messages || null);
        setStats(parsed.stats || null);
        setMoments(parsed.moments || null);
        setNarratives(parsed.narratives || null);
        setDnaA(parsed.dnaA || null);
        setDnaB(parsed.dnaB || null);
        setCompatibility(parsed.compatibility || null);
        setGreenFlags(parsed.greenFlags || null);
        setRedFlags(parsed.redFlags || null);
        setShowSafetyNotice(parsed.showSafetyNotice || false);
        setSoundtrack(parsed.soundtrack || null);
        setPairingInsight(parsed.pairingInsight || null);
      }
    } catch (e) {
      console.error("Failed to load archive from localStorage:", e);
    } finally {
      if (hasSavedData) {
        setTimeout(() => {
          setIsHydrating(false);
        }, 800);
      } else {
        setIsHydrating(false);
      }
    }
  }, []);

  const processChat = async (text: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Parse raw text
      const parsed = parseChatExport(text);
      if (parsed.messages.length < 5) {
        throw new Error("The chat export file is too short or doesn't match standard WhatsApp formatting.");
      }

      // Handle senders list. Must be exactly 2 for proper dual analysis.
      let finalMessages = parsed.messages;
      let senders = parsed.stats.senders;

      if (senders.length === 0) {
        throw new Error("No senders could be detected. Please ensure the file is a WhatsApp chat export (.txt format).");
      }

      if (senders.length > 2) {
        // Find the top 2 senders by message frequency
        const counts = parsed.stats.messagesPerSender;
        const sortedSenders = [...senders].sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
        const topTwo = sortedSenders.slice(0, 2);
        
        // Filter messages to only include the top 2 senders
        finalMessages = parsed.messages.filter(m => topTwo.includes(m.sender));
        senders = topTwo;
      }

      // If only 1 sender is detected, mock a second sender to avoid crashes
      if (senders.length === 1) {
        senders.push("Other");
      }

      // Re-run stats extraction for the final set of senders
      const reParsed = parseChatExport(
        finalMessages
          .map(m => {
            const dateStr = m.date.toLocaleDateString("en-GB"); // DD/MM/YYYY approx
            const timeStr = m.date.toLocaleTimeString("en-US", { hour12: true });
            return `${dateStr}, ${timeStr} - ${m.sender}: ${m.content}`;
          })
          .join("\n")
      );

      const finalStats = reParsed.stats;
      const finalMsgs = reParsed.messages;

      // 2. DNA Calculations
      const { dnaA: profileA, dnaB: profileB, pairingInsight: insight } = calculateBothDNAs(finalMsgs, finalStats);

      // 3. Compatibility Calculations
      const compatReport = calculateCompatibility(finalMsgs, finalStats, profileA, profileB);

      // 4. Flags Scan
      const flagReport = detectFlags(finalMsgs);

      // 5. Cinematic Moments
      const detectedMoments = detectCinematicMoments(finalMsgs);

      // 6. Narrative Generation (Fetch from API Route)
      const res = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moments: detectedMoments }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate cinematic narratives.");
      }

      const { narratives } = await res.json();

      // 7. Soundtrack Recommendation
      let category: "warm" | "melancholic" | "early_stage" = "early_stage";
      const gapCount = finalStats.gapsLongerThan24h.length;
      
      if (compatReport.overallScore >= 75 && compatReport.axes.emotionalAvailability >= 65) {
        category = "warm";
      } else if (gapCount >= 3 || compatReport.axes.responseConsistency < 50) {
        category = "melancholic";
      }

      const rawTracks = soundtrackData[category];
      const processedSoundtrack = rawTracks.map((track, idx) => {
        let reason = track.fallbackReason;
        if (idx === 0 && detectedMoments[0]) {
          reason = `Reflects the start of your journey and the unexpected spark on ${new Date(detectedMoments[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`;
        } else if (idx === 1 && detectedMoments[1]) {
          reason = `Complements the early appreciation shown when one of you said, "${detectedMoments[1].quote.slice(0, 30)}..."`;
        } else if (idx === 2 && detectedMoments[2]) {
          reason = `Captures the deeper emotional resonance around your check-in: "${detectedMoments[2].quote.slice(0, 30)}..."`;
        } else if (idx === 3 && detectedMoments[3]) {
          reason = `An echo of the warmth returning to your chat after the gap on ${new Date(detectedMoments[3].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`;
        } else if (idx === 4 && detectedMoments[4]) {
          reason = `Perfectly matches the high sentiment exchange: "${detectedMoments[4].quote.slice(0, 30)}..."`;
        }
        return {
          title: track.title,
          artist: track.artist,
          reason,
          spotifySearchUrl: track.spotifySearchUrl,
        };
      });

      // Update State
      setRawText(text);
      setMessages(finalMsgs);
      setStats(finalStats);
      setMoments(detectedMoments);
      setNarratives(narratives);
      setDnaA(profileA);
      setDnaB(profileB);
      setCompatibility(compatReport);
      setGreenFlags(flagReport.greenFlags);
      setRedFlags(flagReport.redFlags);
      setShowSafetyNotice(flagReport.showSafetyNotice);
      setSoundtrack(processedSoundtrack);
      setPairingInsight(insight);

      // Save to localStorage
      try {
        const archiveData = {
          messages: finalMsgs,
          stats: finalStats,
          moments: detectedMoments,
          narratives,
          dnaA: profileA,
          dnaB: profileB,
          compatibility: compatReport,
          greenFlags: flagReport.greenFlags,
          redFlags: flagReport.redFlags,
          showSafetyNotice: flagReport.showSafetyNotice,
          soundtrack: processedSoundtrack,
          pairingInsight: insight,
        };
        localStorage.setItem("memra_archive_v1", JSON.stringify(archiveData));
      } catch (err) {
        console.error("Failed to save archive to localStorage:", err);
      }

      // Navigate to full dashboard
      router.push("/archive");
    } catch (e: any) {
      console.error("Analysis failed:", e);
      setError(e.message || "An unexpected error occurred while processing the chat.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearChat = () => {
    try {
      localStorage.removeItem("memra_archive_v1");
    } catch (err) {
      console.error("Failed to clear localStorage:", err);
    }
    setRawText(null);
    setMessages(null);
    setStats(null);
    setMoments(null);
    setNarratives(null);
    setDnaA(null);
    setDnaB(null);
    setCompatibility(null);
    setGreenFlags(null);
    setRedFlags(null);
    setShowSafetyNotice(false);
    setSoundtrack(null);
    setPairingInsight(null);
    setError(null);
  };

  return (
    <ChatContext.Provider
      value={{
        rawText,
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
        isAnalyzing,
        error,
        processChat,
        clearChat,
      }}
    >
      {isHydrating ? (
        <div className="fixed inset-0 bg-[#0b0b09] z-[9999] flex flex-col items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="font-mono text-[9px] text-[#c8956c] tracking-[0.2em] uppercase">
              LOADING ARCHIVE...
            </div>
            <div className="w-48 h-[1px] bg-[#c8956c]/10 overflow-hidden relative mx-auto rounded-full">
              <div 
                className="absolute top-0 left-0 h-full bg-[#c8956c]"
                style={{
                  animation: 'progressLine 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
                }}
              />
            </div>
          </div>
          <style>{`
            @keyframes progressLine {
              0% { width: 0%; }
              100% { width: 100%; }
            }
          `}</style>
        </div>
      ) : (
        children
      )}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
