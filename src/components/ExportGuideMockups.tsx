"use client";

import React from "react";
import Image from "next/image";

export function SVG1_iOSChat() {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-[24px] border border-[#c8956c]/20 bg-[#0b0b09] shadow-2xl overflow-hidden group hover:border-[#c8956c]/40 transition-all duration-300">
        <Image
          src="/images/export-guide/ios_step1.png"
          alt="iOS WhatsApp Step 1 - Tap Contact Name"
          fill
          sizes="(max-width: 280px) 100vw, 280px"
          className="object-cover rounded-[24px]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b09]/80 via-transparent to-transparent pointer-events-none" />
      </div>
      <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase text-center font-semibold">
        TAP THE CONTACT NAME AT THE TOP
      </span>
    </div>
  );
}

export function SVG2_iOSContactInfo() {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-[24px] border border-[#c8956c]/20 bg-[#0b0b09] shadow-2xl overflow-hidden group hover:border-[#c8956c]/40 transition-all duration-300">
        <Image
          src="/images/export-guide/ios_step2.png"
          alt="iOS WhatsApp Step 2 - Scroll and Tap Export Chat"
          fill
          sizes="(max-width: 280px) 100vw, 280px"
          className="object-cover rounded-[24px]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b09]/80 via-transparent to-transparent pointer-events-none" />
      </div>
      <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase text-center font-semibold">
        SCROLL DOWN &amp; TAP EXPORT CHAT
      </span>
    </div>
  );
}

export function SVG3_iOSExportDialog() {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-[24px] border border-[#c8956c]/20 bg-[#0b0b09] shadow-2xl overflow-hidden group hover:border-[#c8956c]/40 transition-all duration-300">
        <Image
          src="/images/export-guide/ios_step3.png"
          alt="iOS WhatsApp Step 3 - Select Without Media"
          fill
          sizes="(max-width: 280px) 100vw, 280px"
          className="object-cover rounded-[24px]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b09]/80 via-transparent to-transparent pointer-events-none" />
      </div>
      <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase text-center font-semibold">
        CHOOSE WITHOUT MEDIA
      </span>
    </div>
  );
}

export function SVG4_AndroidChat() {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-[24px] border border-[#c8956c]/20 bg-[#0b0b09] shadow-2xl overflow-hidden group hover:border-[#c8956c]/40 transition-all duration-300">
        <Image
          src="/images/export-guide/android_step1.png"
          alt="Android WhatsApp Step 1 - Tap Three Dots Menu"
          fill
          sizes="(max-width: 280px) 100vw, 280px"
          className="object-cover rounded-[24px]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b09]/80 via-transparent to-transparent pointer-events-none" />
      </div>
      <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase text-center font-semibold">
        TAP THE THREE DOTS MENU
      </span>
    </div>
  );
}

export function SVG5_AndroidMoreOptions() {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-[24px] border border-[#c8956c]/20 bg-[#0b0b09] shadow-2xl overflow-hidden group hover:border-[#c8956c]/40 transition-all duration-300">
        <Image
          src="/images/export-guide/android_step2.png"
          alt="Android WhatsApp Step 2 - Select Export Chat"
          fill
          sizes="(max-width: 280px) 100vw, 280px"
          className="object-cover rounded-[24px]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b09]/80 via-transparent to-transparent pointer-events-none" />
      </div>
      <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase text-center font-semibold">
        TAP EXPORT CHAT
      </span>
    </div>
  );
}

export function SVG6_AndroidExportDialog() {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-[24px] border border-[#c8956c]/20 bg-[#0b0b09] shadow-2xl overflow-hidden group hover:border-[#c8956c]/40 transition-all duration-300">
        <Image
          src="/images/export-guide/android_step3.png"
          alt="Android WhatsApp Step 3 - Select Without Media"
          fill
          sizes="(max-width: 280px) 100vw, 280px"
          className="object-cover rounded-[24px]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b09]/80 via-transparent to-transparent pointer-events-none" />
      </div>
      <span className="font-mono text-[9px] text-[#c8956c] tracking-widest uppercase text-center font-semibold">
        SELECT WITHOUT MEDIA THEN EXPORT
      </span>
    </div>
  );
}
