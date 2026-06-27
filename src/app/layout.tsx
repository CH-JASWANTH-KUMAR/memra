import type { Metadata } from "next";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Memra — Memories deserve better than a text file.",
  description: "A privacy-first memory archive that turns WhatsApp chat exports into beautiful, cinematic memoirs. Processed entirely on your device.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased bg-bg-dark text-[#f4f4f0]"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Instrument+Mono:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-serif selection:bg-[#c8956c]/20">
        {/* Persistent Privacy Banner */}
        <div className="w-full bg-[#121210] border-b border-[#c8956c]/10 py-2.5 px-4 text-center z-50">
          <p className="font-mono text-[10px] sm:text-xs text-[#c8956c] tracking-widest uppercase">
            Your chat is processed on your device. We never see it, store it, or share it.
          </p>
        </div>
        
        <ErrorBoundary>
          <ChatProvider>
            {/* Main Content wrapper */}
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </ChatProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
