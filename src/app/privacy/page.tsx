import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Terminal } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <main className="flex-1 flex flex-col px-6 py-12 md:py-20 max-w-3xl mx-auto w-full space-y-12">
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
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-[#c8956c] stroke-[1.2]" />
          <h1 className="font-serif text-4xl md:text-5xl font-light text-[#f4f4f0] tracking-wide">
            Privacy Architecture
          </h1>
        </div>
        <p className="font-mono text-xs text-[#c8956c] tracking-[0.2em] uppercase">
          Your conversations are not our business
        </p>
      </section>

      {/* Plain English Policy */}
      <section className="space-y-6 font-serif text-lg text-[#f4f4f0]/80 leading-relaxed italic">
        <p>
          Memra was built on a simple, non-negotiable premise: your private conversations are sacred. We believe that turning your chats into memories should not require trading away your privacy.
        </p>
        <p>
          Unlike traditional web apps that upload your files to a cloud server to process them, Memra runs entirely inside your browser. The moment you drop a <code className="font-mono text-xs text-[#c8956c] bg-[#121210] px-1.5 py-0.5 border border-[#c8956c]/10 rounded-sm">.txt</code> export, our client-side JavaScript engine parses the dates, message counts, and keywords locally.
        </p>
        <p>
          The raw text of your conversation never leaves your computer or phone. We do not store it in a database, we do not log it in cache, and we do not write it to local storage. When you close or refresh this tab, the chat is completely deleted from your browser's temporary memory.
        </p>
        <p>
          To generate the cinematic narrative summaries for the Timeline Movie, we compile a small, strictly anonymized summary containing only five specific dates, short titles, and quotes extracted for the moments. No other messages, names, or metadata are transmitted. This represents the only API call in the entire product.
        </p>
      </section>

      {/* Table of Data Flows */}
      <section className="space-y-4 pt-4 border-t border-[#c8956c]/10">
        <h3 className="font-serif text-2xl text-[#f4f4f0]">
          Data Processing Ledger
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-serif border-collapse">
            <thead>
              <tr className="border-b border-[#c8956c]/20 font-mono text-[9px] uppercase tracking-widest text-[#c8956c]">
                <th className="py-3 pr-4">Data Type</th>
                <th className="py-3 px-4">Where it stays</th>
                <th className="py-3 pl-4 text-right">Destination</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#f4f4f0]/60 italic">
              <tr className="border-b border-[#c8956c]/5">
                <td className="py-4 pr-4 font-serif text-[#f4f4f0] font-medium">Raw Chat Log (.txt)</td>
                <td className="py-4 px-4">Browser Session Memory</td>
                <td className="py-4 pl-4 text-right text-red-400 font-mono text-xs">Never Sent Anywhere</td>
              </tr>
              <tr className="border-b border-[#c8956c]/5">
                <td className="py-4 pr-4 font-serif text-[#f4f4f0] font-medium">Message Counts & Analytics</td>
                <td className="py-4 px-4">Computed Client-side</td>
                <td className="py-4 pl-4 text-right text-red-400 font-mono text-xs">Never Sent Anywhere</td>
              </tr>
              <tr className="border-b border-[#c8956c]/5">
                <td className="py-4 pr-4 font-serif text-[#f4f4f0] font-medium">5 Moments (Dates & Quotes)</td>
                <td className="py-4 px-4">Browser Memory</td>
                <td className="py-4 pl-4 text-right text-amber-500 font-mono text-xs">Gemini Flash (Summarizer)</td>
              </tr>
              <tr>
                <td className="py-4 pr-4 font-serif text-[#f4f4f0] font-medium">Payment Data (Razorpay)</td>
                <td className="py-4 px-4">Razorpay Sandbox</td>
                <td className="py-4 pl-4 text-right text-amber-500 font-mono text-xs">Razorpay API</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Technical Deep Dive */}
      <section className="space-y-6 pt-6 border-t border-[#c8956c]/10">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-[#c8956c]" />
          <h3 className="font-serif text-2xl text-[#f4f4f0]">
            Developer Verification
          </h3>
        </div>

        <p className="font-serif text-base text-[#f4f4f0]/70 italic">
          To ensure complete auditability, we open source the exact Javascript parser we use. Below is a simplified representation of the client-side log scanner. You can verify in your browser's Developer Tools (Network Tab) that no payload containing your chat is ever uploaded.
        </p>

        <div className="bg-[#121210] border border-[#c8956c]/10 p-5 rounded-sm overflow-x-auto">
          <pre className="font-mono text-xs text-[#c8956c] leading-relaxed">
{`// Executed entirely within the user's browser context
export function parseChatExport(rawText) {
  const lines = rawText.split('\\n');
  const messages = [];

  // Match: DD/MM/YYYY, HH:MM - Sender: Message
  const regex = /^\\s*\\[?(\\d{2}\\/\\d{2}\\/\\d{4}),?\\s+(\\d{2}:\\d{2})\\]?\\s*-\\s*([^:]+):\\s*(.*)$/;

  for (let line of lines) {
    const match = line.match(regex);
    if (match) {
      messages.push({
        date: parseDate(match[1], match[2]),
        sender: match[3].trim(),
        content: match[4].trim(),
        isSystem: false
      });
    }
  }

  // All stats aggregated locally in memory
  return compileStats(messages);
}`}
          </pre>
        </div>
      </section>

      {/* Closing notice */}
      <section className="bg-[#121210] border border-[#c8956c]/10 p-6 rounded-sm text-center">
        <p className="font-serif text-base italic text-[#f4f4f0]/70">
          "No trackers. No cookies. No server-side storage. Just your memories, preserved with the dignity they deserve."
        </p>
      </section>
    </main>
  );
}
