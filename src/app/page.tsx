"use client";

import React, { useState, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import { sampleChatText } from "@/utils/sampleChat";
import { Upload, ShieldCheck, HelpCircle, Film, Flag, BarChart2, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { processChat, isAnalyzing, error } = useChat();
  const [dragActive, setDragActive] = useState(false);
  const [deviceTab, setDeviceTab] = useState<"ios" | "android">("ios");
  const [loadingStep, setLoadingStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingTexts = [
    "Reading chat log...",
    "Scanning emotional patterns...",
    "Calculating Text DNA profiles...",
    "Identifying key cinematic moments...",
    "Formatting narrative chapters...",
    "Finalizing your memoir book..."
  ];

  const triggerLoadingSequence = async (text: string) => {
    // Elegant loading text stepper
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      await processChat(text);
    } catch (e) {
      console.error(e);
    } finally {
      clearInterval(interval);
      setLoadingStep(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            triggerLoadingSequence(event.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          triggerLoadingSequence(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleTrySample = () => {
    triggerLoadingSequence(sampleChatText);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-between px-6 py-12 md:py-20 max-w-5xl mx-auto w-full relative">
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-[#0b0b09]/95 z-50 flex flex-col items-center justify-center">
          <div className="max-w-md w-full px-8 text-center space-y-8">
            <div className="relative w-16 h-16 mx-auto">
              {/* Spinning elegant minimalist frame */}
              <div className="absolute inset-0 rounded-full border border-[#c8956c]/20"></div>
              <div className="absolute inset-0 rounded-full border-t border-[#c8956c] animate-spin"></div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-serif text-2xl tracking-wide text-[#f4f4f0]">
                Assembling Archive
              </h3>
              <p className="font-mono text-xs text-[#c8956c] tracking-widest uppercase h-4 animate-pulse">
                {loadingTexts[loadingStep]}
              </p>
            </div>
            
            <div className="pt-4 border-t border-[#c8956c]/10">
              <p className="font-serif text-xs italic text-[#f4f4f0]/40">
                Your messages never leave this screen. All computations occur in-browser.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className="text-center space-y-6 max-w-2xl mt-4">
        <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide text-[#f4f4f0]">
          Memra
        </h1>
        <p className="font-mono text-xs md:text-sm text-[#c8956c] tracking-[0.2em] uppercase">
          Memories deserve better than a text file
        </p>
        <p className="font-serif text-base md:text-lg text-[#f4f4f0]/60 italic max-w-lg mx-auto">
          Transform your WhatsApp chat exports into a beautiful, cinematic memory book. Entirely private. Processed completely on your device.
        </p>
      </section>

      {/* Main Actions Box */}
      <section className="w-full max-w-2xl mt-12 bg-[#121210] border border-[#c8956c]/15 rounded-sm p-8 md:p-12 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#c8956c]/30"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#c8956c]/30"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#c8956c]/30"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#c8956c]/30"></div>

        {/* Drag Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`border border-dashed rounded-sm p-8 md:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 ${
            dragActive
              ? "border-[#c8956c] bg-[#c8956c]/5 scale-[0.99]"
              : "border-[#c8956c]/20 hover:border-[#c8956c]/40 hover:bg-[#c8956c]/2"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-[#c8956c]/60 stroke-[1.2]" />
          <div className="space-y-1">
            <p className="font-serif text-lg text-[#f4f4f0]">
              Drop your chat export .txt file here
            </p>
            <p className="font-mono text-[10px] text-[#f4f4f0]/40 tracking-wider uppercase">
              Or click to browse files
            </p>
          </div>
        </div>

        {error && (
          <p className="font-mono text-xs text-red-400 text-center bg-red-950/20 border border-red-500/20 p-3 rounded-sm">
            {error}
          </p>
        )}

        {/* Trust Badge / Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#c8956c]/10">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#c8956c]" />
            <span className="font-mono text-[11px] text-[#c8956c] tracking-widest uppercase">
              Processed on your device. We see nothing.
            </span>
          </div>

          <button
            onClick={handleTrySample}
            className="w-full sm:w-auto font-mono text-[11px] text-[#f4f4f0] bg-[#c8956c]/10 border border-[#c8956c]/20 px-5 py-2.5 rounded-sm tracking-widest uppercase hover:bg-[#c8956c]/20 transition-all"
          >
            Try with Sample Chat
          </button>
        </div>
      </section>

      {/* Feature Overviews (Visible without scroll on large screens, key trust block) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-16 text-left">
        <div className="bg-[#121210]/40 border border-[#c8956c]/5 hover:border-[#c8956c]/10 p-6 rounded-sm space-y-3 transition-all">
          <div className="flex items-center gap-3">
            <Film className="w-5 h-5 text-[#c8956c] stroke-[1.5]" />
            <h4 className="font-serif text-lg text-[#f4f4f0]">Timeline Movie</h4>
          </div>
          <p className="font-serif text-sm text-[#f4f4f0]/50 leading-relaxed italic">
            Relive your history through 5 key cinematic milestones, complete with Roman numeral chapters and curated storylines.
          </p>
        </div>

        <div className="bg-[#121210]/40 border border-[#c8956c]/5 hover:border-[#c8956c]/10 p-6 rounded-sm space-y-3 transition-all">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-[#c8956c] stroke-[1.5]" />
            <h4 className="font-serif text-lg text-[#f4f4f0]">Flag Analysis</h4>
          </div>
          <p className="font-serif text-sm text-[#f4f4f0]/50 leading-relaxed italic">
            Analyze healthy communication trends (appreciation, showing up) and friction areas with absolute quote evidence.
          </p>
        </div>

        <div className="bg-[#121210]/40 border border-[#c8956c]/5 hover:border-[#c8956c]/10 p-6 rounded-sm space-y-3 transition-all">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-[#c8956c] stroke-[1.5]" />
            <h4 className="font-serif text-lg text-[#f4f4f0]">Text DNA</h4>
          </div>
          <p className="font-serif text-sm text-[#f4f4f0]/50 leading-relaxed italic">
            Uncover messaging archetypes like The Anchor or The Spark based on initiation rates, question depth, and affirmations.
          </p>
        </div>
      </section>

      {/* How to Export Instructions */}
      <section className="w-full mt-24 border-t border-[#c8956c]/10 pt-16">
        <div className="text-center space-y-3 mb-10">
          <h3 className="font-serif text-3xl text-[#f4f4f0]">
            How to Export Your Chat
          </h3>
          <p className="font-mono text-[10px] text-[#c8956c] tracking-widest uppercase">
            Simple 3-step export guidelines
          </p>
        </div>

        {/* Platform Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-[#121210] border border-[#c8956c]/10 p-1 rounded-sm flex">
            <button
              onClick={() => setDeviceTab("ios")}
              className={`font-mono text-[10px] tracking-widest uppercase px-5 py-2 transition-all rounded-sm ${
                deviceTab === "ios" ? "bg-[#c8956c] text-[#0b0b09]" : "text-[#f4f4f0]/60 hover:text-[#f4f4f0]"
              }`}
            >
              iOS / iPhone
            </button>
            <button
              onClick={() => setDeviceTab("android")}
              className={`font-mono text-[10px] tracking-widest uppercase px-5 py-2 transition-all rounded-sm ${
                deviceTab === "android" ? "bg-[#c8956c] text-[#0b0b09]" : "text-[#f4f4f0]/60 hover:text-[#f4f4f0]"
              }`}
            >
              Android
            </button>
          </div>
        </div>

        {/* Timeline Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#121210] border border-[#c8956c]/5 p-6 rounded-sm space-y-4 relative">
            <span className="absolute top-4 right-4 font-mono text-[10px] text-[#c8956c]/40 uppercase tracking-widest">
              Step 01
            </span>
            <h4 className="font-serif text-lg text-[#f4f4f0]">Select Chat</h4>
            <p className="font-serif text-sm text-[#f4f4f0]/60 leading-relaxed italic">
              {deviceTab === "ios"
                ? "Open WhatsApp, tap on the chat thread, and select the contact info header at the top of the screen."
                : "Open WhatsApp, tap on the chat, and tap the three vertical dots menu in the top right corner."}
            </p>
            {/* SVG Visual Mockup instead of placeholders */}
            <div className="border border-[#c8956c]/10 h-28 rounded-sm bg-[#0b0b09] flex items-center justify-center text-[#c8956c]/30 font-mono text-[9px] uppercase tracking-widest">
              [ Contact Info Screen ]
            </div>
          </div>

          <div className="bg-[#121210] border border-[#c8956c]/5 p-6 rounded-sm space-y-4 relative">
            <span className="absolute top-4 right-4 font-mono text-[10px] text-[#c8956c]/40 uppercase tracking-widest">
              Step 02
            </span>
            <h4 className="font-serif text-lg text-[#f4f4f0]">Export Option</h4>
            <p className="font-serif text-sm text-[#f4f4f0]/60 leading-relaxed italic">
              {deviceTab === "ios"
                ? "Scroll to the very bottom of the contact details page and tap on the 'Export Chat' button."
                : "Select 'More' from the dropdown list, then tap on the 'Export Chat' option."}
            </p>
            <div className="border border-[#c8956c]/10 h-28 rounded-sm bg-[#0b0b09] flex items-center justify-center text-[#c8956c]/30 font-mono text-[9px] uppercase tracking-widest">
              [ Tap Export Chat ]
            </div>
          </div>

          <div className="bg-[#121210] border border-[#c8956c]/5 p-6 rounded-sm space-y-4 relative">
            <span className="absolute top-4 right-4 font-mono text-[10px] text-[#c8956c]/40 uppercase tracking-widest">
              Step 03
            </span>
            <h4 className="font-serif text-lg text-[#f4f4f0]">Choose Without Media</h4>
            <p className="font-serif text-sm text-[#f4f4f0]/60 leading-relaxed italic">
              {deviceTab === "ios"
                ? "Choose 'Without Media' to generate a lightweight .txt file. Share it to your Files app, then drag it here."
                : "Choose 'Without Media' when prompted. Email or save the resulting .txt file, and upload it above."}
            </p>
            <div className="border border-[#c8956c]/10 h-28 rounded-sm bg-[#0b0b09] flex items-center justify-center text-[#c8956c]/30 font-mono text-[9px] uppercase tracking-widest">
              [ Select Without Media ]
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Links */}
      <footer className="w-full mt-24 border-t border-[#c8956c]/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-mono text-[10px] text-[#f4f4f0]/30 tracking-widest uppercase">
          &copy; {new Date().getFullYear()} Memra. Open Source Parser.
        </p>
        <div className="flex gap-6">
          <Link
            href="/how-it-works"
            className="font-mono text-[10px] text-[#c8956c] tracking-widest uppercase hover:underline"
          >
            How it works
          </Link>
          <Link
            href="/privacy"
            className="font-mono text-[10px] text-[#c8956c] tracking-widest uppercase hover:underline"
          >
            Privacy Policy
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-[#c8956c] tracking-widest uppercase hover:underline"
          >
            GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
