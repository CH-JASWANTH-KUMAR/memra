"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cpu, ShieldAlert, Music, CreditCard, Shield } from "lucide-react";
import {
  SVG1_iOSChat,
  SVG2_iOSContactInfo,
  SVG3_iOSExportDialog,
  SVG4_AndroidChat,
  SVG5_AndroidMoreOptions,
  SVG6_AndroidExportDialog,
} from "@/components/ExportGuideMockups";

export default function HowItWorks() {
  const [deviceTab, setDeviceTab] = useState<"ios" | "android">("ios");

  return (
    <main className="flex-1 flex flex-col px-6 py-12 md:py-20 max-w-4xl mx-auto w-full space-y-16">
      {/* Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[10px] text-[#c8956c] tracking-widest uppercase hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Upload
        </Link>
      </div>

      {/* Header */}
      <section className="space-y-4">
        <h1 className="font-serif text-4xl md:text-5xl font-light text-[#f4f4f0] tracking-wide">
          The Memoir Pipeline
        </h1>
        <p className="font-mono text-xs text-[#c8956c] tracking-[0.2em] uppercase">
          A step-by-step breakdown of how Memra processes your data
        </p>
      </section>

      {/* Export Guide Section with SVGs */}
      <section className="w-full border-y border-[#c8956c]/10 py-12 space-y-10">
        <div className="text-center space-y-3">
          <h3 className="font-serif text-3xl text-[#f4f4f0]">
            How to Export Your Chat
          </h3>
          <p className="font-mono text-[10px] text-[#c8956c] tracking-widest uppercase">
            Visual step-by-step export walkthrough
          </p>
        </div>

        {/* Platform Toggle */}
        <div className="flex justify-center">
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

        {/* Timeline Guide with SVG Mockups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-[#121210] border border-[#c8956c]/5 p-6 rounded-sm space-y-6 flex flex-col justify-between items-center text-center">
            <div className="w-full text-left space-y-2">
              <span className="font-mono text-[10px] text-[#c8956c]/40 uppercase tracking-widest block">
                Step 01
              </span>
              <h4 className="font-serif text-lg text-[#f4f4f0]">Select Chat</h4>
              <p className="font-serif text-sm text-[#f4f4f0]/60 leading-relaxed italic min-h-[48px]">
                {deviceTab === "ios"
                  ? "Open WhatsApp, tap on the chat thread, and select the contact info header at the top of the screen."
                  : "Open WhatsApp, tap on the chat, and tap the three vertical dots menu in the top right corner."}
              </p>
            </div>
            
            <div className="w-full flex justify-center pt-2">
              {deviceTab === "ios" ? <SVG1_iOSChat /> : <SVG4_AndroidChat />}
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#121210] border border-[#c8956c]/5 p-6 rounded-sm space-y-6 flex flex-col justify-between items-center text-center">
            <div className="w-full text-left space-y-2">
              <span className="font-mono text-[10px] text-[#c8956c]/40 uppercase tracking-widest block">
                Step 02
              </span>
              <h4 className="font-serif text-lg text-[#f4f4f0]">Export Option</h4>
              <p className="font-serif text-sm text-[#f4f4f0]/60 leading-relaxed italic min-h-[48px]">
                {deviceTab === "ios"
                  ? "Scroll to the very bottom of the contact details page and tap on the 'Export Chat' button."
                  : "Select 'Export chat' from the dropdown menu options."}
              </p>
            </div>

            <div className="w-full flex justify-center pt-2">
              {deviceTab === "ios" ? <SVG2_iOSContactInfo /> : <SVG5_AndroidMoreOptions />}
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#121210] border border-[#c8956c]/5 p-6 rounded-sm space-y-6 flex flex-col justify-between items-center text-center">
            <div className="w-full text-left space-y-2">
              <span className="font-mono text-[10px] text-[#c8956c]/40 uppercase tracking-widest block">
                Step 03
              </span>
              <h4 className="font-serif text-lg text-[#f4f4f0]">Choose Without Media</h4>
              <p className="font-serif text-sm text-[#f4f4f0]/60 leading-relaxed italic min-h-[48px]">
                {deviceTab === "ios"
                  ? "Choose 'Without Media' to generate a lightweight .txt file. Share it to your Files app, then drag it here."
                  : "Choose 'Without Media' when prompted. Email or save the resulting .txt file, and upload it above."}
              </p>
            </div>

            <div className="w-full flex justify-center pt-2">
              {deviceTab === "ios" ? <SVG3_iOSExportDialog /> : <SVG6_AndroidExportDialog />}
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Pipeline */}
      <section className="space-y-12">
        {/* Step 1 */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-[#121210] border border-[#c8956c]/20 p-3.5 rounded-sm flex items-center justify-center">
            <Cpu className="w-6 h-6 text-[#c8956c] stroke-[1.2]" />
          </div>
          <div className="space-y-2 flex-1">
            <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
              Step 01 / Browser Loading
            </span>
            <h3 className="font-serif text-xl text-[#f4f4f0] font-normal">
              In-Memory File Reading
            </h3>
            <p className="font-serif text-base text-[#f4f4f0]/60 leading-relaxed italic">
              When you select your chat log, the browser's FileReader API reads the text directly into the browser's temporary memory. The file is never transmitted to our servers, and we do not use cookies or local storage to save your chat.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-[#121210] border border-[#c8956c]/20 p-3.5 rounded-sm flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[#c8956c] stroke-[1.2]" />
          </div>
          <div className="space-y-2 flex-1">
            <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
              Step 02 / Local Parser
            </span>
            <h3 className="font-serif text-xl text-[#f4f4f0] font-normal">
              Rule-Based Log Analysis
            </h3>
            <p className="font-serif text-base text-[#f4f4f0]/60 leading-relaxed italic">
              A local Javascript parser scans the messages. It checks the timestamps to log peak messaging hours, response time distributions, and conversation initiations. It cross-references words with a local, rule-based ruleset (<code className="font-mono text-[11px] text-[#c8956c]">flags.json</code>) to detect appreciation patterns and green/red indicators.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-[#121210] border border-[#c8956c]/20 p-3.5 rounded-sm flex items-center justify-center">
            <Music className="w-6 h-6 text-[#c8956c] stroke-[1.2]" />
          </div>
          <div className="space-y-2 flex-1">
            <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
              Step 03 / Anonymized AI Generation
            </span>
            <h3 className="font-serif text-xl text-[#f4f4f0] font-normal">
              The AI Narrative Boundary
            </h3>
            <p className="font-serif text-base text-[#f4f4f0]/60 leading-relaxed italic">
              To write the 5 chapters, we detect exactly 5 specific moments. We strip out all other messages and sender names. Only the dates, titles, and exact quotes for these 5 moments are sent to the Gemini 1.5 Flash API to generate a descriptive 3-4 sentence backstory. This keeps the raw chat entirely hidden from external servers.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-[#121210] border border-[#c8956c]/20 p-3.5 rounded-sm flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-[#c8956c] stroke-[1.2]" />
          </div>
          <div className="space-y-2 flex-1">
            <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase block">
              Step 04 / Checkout & Compilation
            </span>
            <h3 className="font-serif text-xl text-[#f4f4f0] font-normal">
              Razorpay & Client-Side PDF Compiler
            </h3>
            <p className="font-serif text-base text-[#f4f4f0]/60 leading-relaxed italic">
              Your cinematic archive is generated right on your dashboard. If you wish to purchase the physical-style Memory Book, a one-time charge of ₹199 is processed securely by Razorpay. Once paid, our local PDF generator (<code className="font-mono text-[11px] text-[#c8956c]">jsPDF</code>) compiles your chapters, stats, and archetype profiles into a beautiful printable document on your device.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Sandbox Summary */}
      <section className="bg-[#121210] border border-[#c8956c]/10 p-8 rounded-sm space-y-4">
        <h4 className="font-serif text-xl text-[#f4f4f0]">
          The Client-Side Sandbox
        </h4>
        <p className="font-serif text-sm text-[#f4f4f0]/60 leading-relaxed italic">
          Everything inside the dotted box below occurs inside your computer's browser session. The boundary is secure, ensuring zero leakage of your personal data.
        </p>

        <div className="border border-dashed border-[#c8956c]/30 rounded-sm p-6 bg-[#0b0b09] space-y-4 text-center">
          <span className="font-mono text-[8px] text-[#c8956c] tracking-widest uppercase bg-[#c8956c]/10 border border-[#c8956c]/20 px-2 py-0.5 rounded-sm">
            Local Sandbox (Your Device)
          </span>
          <div className="grid grid-cols-3 gap-3 text-center text-xs italic font-serif text-[#f4f4f0]/50 pt-2">
            <div className="border border-[#c8956c]/10 p-3 rounded-sm bg-[#121210]">
              1. Raw Chat .txt
            </div>
            <div className="border border-[#c8956c]/10 p-3 rounded-sm bg-[#121210]">
              2. Local JavaScript Parser
            </div>
            <div className="border border-[#c8956c]/10 p-3 rounded-sm bg-[#121210]">
              3. jsPDF Compiler
            </div>
          </div>
          <div className="pt-2">
            <span className="font-mono text-[9px] text-[#f4f4f0]/30 uppercase tracking-widest">
              ---------------- API Boundary ----------------
            </span>
          </div>
          <div className="text-center italic font-serif text-[#c8956c] text-xs pt-1">
            Sent: 5 Moment Quotes Only &rarr; Gemini Flash
          </div>
        </div>
      </section>

      {/* STEP 4 — Footer */}
      <footer className="w-full border-t border-[#c8956c]/10 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <p className="font-mono text-[9px] text-[#f4f4f0]/40 tracking-widest uppercase">
            &copy; 2026 Memra
          </p>
          <p className="font-serif text-[11px] italic text-[#f4f4f0]/40">
            Memories deserve better than a text file.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-1.5 bg-[#121210] border border-[#c8956c]/15 px-3 py-1.5 rounded-full">
          <Shield className="w-3 h-3 text-[#c8956c]" />
          <span className="font-mono text-[9px] text-[#f4f4f0]/50 tracking-widest uppercase">
            Zero server transmission
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[9px] text-[#f4f4f0]/40 tracking-widest uppercase">
          <Link
            href="/how-it-works"
            className="hover:text-[#c8956c] transition-colors"
          >
            How it Works
          </Link>
          <span>·</span>
          <Link
            href="/privacy"
            className="hover:text-[#c8956c] transition-colors"
          >
            Privacy Policy
          </Link>
          <span>·</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#c8956c] transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
