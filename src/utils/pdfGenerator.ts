import { jsPDF } from "jspdf";
import { CinematicMoment } from "./moments";
import { ChatStats } from "./chatParser";
import { ArchetypeProfile } from "./textDNA";
import { CompatibilityReport } from "./compatibility";
import { DetectedFlag } from "./flagDetector";

interface PDFData {
  senderA: string;
  senderB: string;
  moments: CinematicMoment[];
  narratives: string[];
  stats: ChatStats;
  dnaA: ArchetypeProfile;
  dnaB: ArchetypeProfile;
  compatibility: CompatibilityReport;
  greenFlags: DetectedFlag[];
  redFlags: DetectedFlag[];
  soundtrack: Array<{ title: string; artist: string; reason: string }>;
  dateRange: string;
}

export function generateMemoryBookPDF(data: PDFData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 25;
  const contentWidth = pageWidth - marginX * 2; // 160mm

  // Helpers
  const addPageBorder = () => {
    doc.setDrawColor(200, 149, 108, 20); // Very faint amber border
    doc.setLineWidth(0.2);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);
  };

  const drawVectorQRCode = (x: number, y: number, size: number) => {
    // Draw outer frame
    doc.setDrawColor(200, 149, 108, 50); // Amber accent
    doc.setLineWidth(0.3);
    doc.rect(x, y, size, size);

    // Finder patterns: top-left, top-right, bottom-left
    const finderSize = size * 0.22; // ~22% of size
    const drawFinder = (px: number, py: number) => {
      // Outer square
      doc.setFillColor(200, 149, 108);
      doc.rect(px, py, finderSize, finderSize, "F");
      // White inner square (off-black background matching #0b0b09)
      doc.setFillColor(11, 11, 9);
      doc.rect(px + finderSize * 0.15, py + finderSize * 0.15, finderSize * 0.7, finderSize * 0.7, "F");
      // Center filled square
      doc.setFillColor(200, 149, 108);
      doc.rect(px + finderSize * 0.3, py + finderSize * 0.3, finderSize * 0.4, finderSize * 0.4, "F");
    };

    // Draw finder patterns
    drawFinder(x + 2, y + 2); // Top-left
    drawFinder(x + size - finderSize - 2, y + 2); // Top-right
    drawFinder(x + 2, y + size - finderSize - 2); // Bottom-left

    // Draw stylized random blocks representing QR payload
    doc.setFillColor(200, 149, 108);
    const blockSize = size * 0.065;
    const drawBlock = (bx: number, by: number) => {
      doc.rect(x + bx, y + by, blockSize, blockSize, "F");
    };

    const dataBlocks = [
      [5, 1], [5, 2], [5, 3],
      [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [8, 5],
      [8, 1], [9, 1], [10, 1],
      [1, 8], [2, 8], [3, 8],
      [7, 7], [8, 7], [7, 8], [8, 9],
      [9, 9], [10, 9], [9, 10], [10, 10],
      [11, 5], [11, 6], [11, 7],
      [5, 11], [6, 11], [7, 11]
    ];

    dataBlocks.forEach(([row, col]) => {
      drawBlock(row * blockSize * 1.15 + size * 0.1, col * blockSize * 1.15 + size * 0.1);
    });

    // Label below QR Code
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("SCAN TO PRESERVE YOURS", x + size / 2, y + size + 5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(200, 149, 108);
    doc.text("MEMRA.APP", x + size / 2, y + size + 9, { align: "center" });
  };

  const addFooter = (pageNum: number) => {
    addPageBorder();
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(58, 58, 50); // #3a3a32
    doc.text(
      "Generated on your device by Memra · memra.app · Your conversation was never transmitted",
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" }
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${pageNum}`, pageWidth - marginX - 5, pageHeight - 15);
  };

  const drawDivider = (y: number) => {
    doc.setDrawColor(200, 149, 108, 50); // Light amber divider
    doc.setLineWidth(0.2);
    doc.line(marginX, y, pageWidth - marginX, y);
  };

  const drawHeader = (title: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 149, 108);
    doc.text(title.toUpperCase(), marginX, 21);
    drawDivider(24);
  };

  // ================= PAGE 1: COVER PAGE =================
  doc.setFillColor(11, 11, 9); // #0b0b09 background
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Border frame
  doc.setDrawColor(200, 149, 108, 40);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Cover Text
  doc.setFont("times", "normal");
  doc.setFontSize(42);
  doc.setTextColor(244, 244, 240); // Off white
  doc.text("MEMRA", pageWidth / 2, 110, { align: "center" });

  // Thin horizontal rule 2px high (0.6mm) in color #c8956c at 20% opacity (mixed color: 49, 39, 29 on background #0b0b09)
  // Spanning 80% of page width (168mm) positioned 10mm below the title (y = 120)
  doc.setFillColor(200, 149, 108);
  try {
    const gState = new (doc as any).GState({ opacity: 0.2 });
    doc.setGState(gState);
    doc.rect(21, 120, 168, 0.6, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
  } catch {
    doc.setFillColor(49, 39, 29);
    doc.rect(21, 120, 168, 0.6, "F");
  }

  // Tagline below the rule (y = 130)
  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.setTextColor(200, 184, 154); // #c8b89a
  doc.text("Memories deserve better than a text file.", pageWidth / 2, 130, { align: "center" });

  // Sender names and date range at the bottom third in Courier 9pt spaced tracking muted
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(106, 100, 88); // #6a6458
  try {
    (doc as any).setCharSpace(1.5);
  } catch {}

  const senderNamesText = `${data.senderA.toUpperCase()}  &  ${data.senderB.toUpperCase()}`;
  doc.text(senderNamesText, pageWidth / 2, 195, { align: "center" });

  const dateRangeText = `ARCHIVE TIMELINE: ${data.dateRange.toUpperCase()}`;
  doc.text(dateRangeText, pageWidth / 2, 203, { align: "center" });

  const primaryRel = data.moments[0]?.blendedRelationships || [];
  const blendLabel = primaryRel.map(r => `${r.type.toUpperCase()} ${Math.round(r.confidence * 100)}%`).join(" · ");
  const blendText = `BLENDED RELATIONSHIP PROFILE: ${blendLabel}`;
  doc.text(blendText, pageWidth / 2, 211, { align: "center" });

  try {
    (doc as any).setCharSpace(0);
  } catch {}

  data.moments.forEach((moment, idx) => {
    doc.addPage();
    // Fill white background for printability
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Left border full vertical rectangle at 15% opacity
    doc.setFillColor(200, 149, 108);
    try {
      const gState = new (doc as any).GState({ opacity: 0.15 });
      doc.setGState(gState);
      doc.rect(10, 10, 2, pageHeight - 20, "F");
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    } catch {
      doc.setFillColor(247, 239, 233);
      doc.rect(10, 10, 2, pageHeight - 20, "F");
    }

    // Watermark Roman numeral behind chapter title (72pt, 6% opacity)
    doc.setFont("times", "normal");
    doc.setFontSize(72);
    doc.setTextColor(200, 149, 108);
    try {
      const gState = new (doc as any).GState({ opacity: 0.06 });
      doc.setGState(gState);
      doc.text(moment.chapter, pageWidth - marginX - 10, 42, { align: "right" });
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    } catch {
      doc.setTextColor(252, 249, 246);
      doc.text(moment.chapter, pageWidth - marginX - 10, 42, { align: "right" });
    }

    drawHeader(`Chapter ${moment.chapter} / The Timeline Movie`);

    // Chapter Header
    doc.setFont("times", "normal");
    doc.setFontSize(28);
    doc.setTextColor(11, 11, 9);
    doc.text(`Chapter ${moment.chapter}`, marginX, 45);

    doc.setFont("times", "italic");
    doc.setFontSize(16);
    doc.setTextColor(200, 149, 108);
    doc.text(moment.title, marginX, 55);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const dateFormatted = new Date(moment.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(dateFormatted.toUpperCase(), marginX, 63);

    // Quote Block (Times Italic, indented 4mm, left border line)
    doc.setFont("times", "italic");
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    
    const quoteText = `"${moment.quote}"`;
    const splitQuote = doc.splitTextToSize(quoteText, contentWidth - 8);
    const startQuoteY = 78;
    doc.text(splitQuote, marginX + 4, startQuoteY);

    const lineCount = splitQuote.length;
    const quoteHeight = lineCount * 6.5; // ~6.5mm height per line for 16pt font
    const endQuoteY = startQuoteY + quoteHeight;

    // Draw solid left border line
    doc.setDrawColor(200, 149, 108);
    doc.setLineWidth(0.5);
    doc.line(marginX, startQuoteY - 4, marginX, endQuoteY - 2);

    // Sender attribution in Courier, 8pt, uppercase, muted
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`— ${moment.sender.toUpperCase()}`, marginX + 4, endQuoteY + 4);

    // Narrative Summary (Cormorant-style Times Regular)
    doc.setFont("times", "normal");
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    
    const story = data.narratives[idx] || "";
    const splitStory = doc.splitTextToSize(story, contentWidth);
    doc.text(splitStory, marginX, endQuoteY + 16, { baseline: "top" });

    // Memory Confidence Banner at bottom of chapter page
    const bannerY = 210;
    doc.setDrawColor(200, 149, 108, 40);
    doc.setLineWidth(0.2);
    doc.setFillColor(250, 248, 245);
    doc.rect(marginX, bannerY, contentWidth, 22, "FD");

    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 149, 108);
    doc.text("MEMORY AUTHENTICITY AUDIT", marginX + 4, bannerY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    const evidenceText = `Evidence: ${moment.evidenceList?.join(", ") || "Contextual Alignment"}`;
    doc.text(evidenceText, marginX + 4, bannerY + 11);

    const signalsText = `Supporting Signals: ${moment.supportingSignals?.join(" · ") || "N/A"}`;
    doc.text(signalsText, marginX + 4, bannerY + 17);

    doc.setFont("times", "normal");
    doc.setFontSize(18);
    doc.setTextColor(200, 149, 108);
    doc.text(`${moment.confidenceScore || 85}%`, pageWidth - marginX - 16, bannerY + 14, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("CONFIDENCE", pageWidth - marginX - 4, bannerY + 13, { align: "right" });

    addFooter(idx + 2);
  });

  // ================= PAGE 7: CORE STATS =================
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  drawHeader("Frictional Signals / Chat Analytics");

  doc.setFont("times", "normal");
  doc.setFontSize(24);
  doc.setTextColor(11, 11, 9);
  doc.text("Conversational Metrics", marginX, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("ANALYTICS COMPILED ENTIRELY VIA LOCAL SCRIPT SCAN", marginX, 51);

  // Helper to format response times
  const formatRespTime = (sec: number) => {
    if (!sec) return "N/A";
    if (sec < 60) return `${sec}s`;
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m`;
    return `${Math.round(min / 60)}h`;
  };

  // Helper to draw a single stat block in 2x2 grid
  const drawStatBlock = (x: number, y: number, w: number, h: number, valueText: string, labelText: string, detailText: string) => {
    // Draw thin border #c8956c at 10% opacity (mixed color: 245, 239, 235 on white bg)
    doc.setDrawColor(200, 149, 108);
    try {
      const gState = new (doc as any).GState({ opacity: 0.1 });
      doc.setGState(gState);
      doc.setLineWidth(0.3);
      doc.rect(x, y, w, h);
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    } catch {
      doc.setDrawColor(245, 239, 235);
      doc.setLineWidth(0.3);
      doc.rect(x, y, w, h);
    }

    // Value: 24pt serif
    doc.setFont("times", "normal");
    doc.setFontSize(24);
    doc.setTextColor(11, 11, 9);
    doc.text(valueText, x + 4, y + 15);

    // Label: 8pt Courier uppercase muted
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(labelText.toUpperCase(), x + 4, y + 25);

    // Details: 8pt Helvetica muted
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(detailText, x + 4, y + 34);
  };

  // Draw 2x2 Grid of Stat Blocks
  const colW = (contentWidth - 8) / 2; // 76mm
  const rowH = 42;
  
  // Row 1 (y = 65)
  drawStatBlock(marginX, 65, colW, rowH, String(data.stats.totalMessages), "Total Volume", `${data.senderA}: ${data.stats.messagesPerSender[data.senderA]} | ${data.senderB}: ${data.stats.messagesPerSender[data.senderB] || 0}`);
  drawStatBlock(marginX + colW + 8, 65, colW, rowH, `${formatRespTime(data.stats.averageResponseTime[data.senderA])} / ${formatRespTime(data.stats.averageResponseTime[data.senderB])}`, "Avg Response Time", `${data.senderA} vs ${data.senderB}`);

  // Row 2 (y = 115)
  drawStatBlock(marginX, 115, colW, rowH, `${data.stats.initiationCounts[data.senderA]} / ${data.stats.initiationCounts[data.senderB]}`, "Initiation Rate", `${data.senderA} / ${data.senderB} starts`);
  drawStatBlock(marginX + colW + 8, 115, colW, rowH, `${data.stats.averageMessageLength[data.senderA]} / ${data.stats.averageMessageLength[data.senderB]}`, "Avg Message Length", `Characters per message`);

  // Temporal Rhythms below grid
  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.setTextColor(11, 11, 9);
  doc.text("Temporal Rhythms & Gaps", marginX, 172);
  drawDivider(175);

  // Peak hour
  const peakHourIndex = data.stats.peakHours.indexOf(Math.max(...data.stats.peakHours));
  const peakHourStr = `${peakHourIndex % 12 || 12}:00 ${peakHourIndex >= 12 ? "PM" : "AM"}`;
  
  // Peak day
  const sortedDays = [...data.stats.activeDayOfWeek].sort((a, b) => b.count - a.count);
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const peakDayStr = daysOfWeek[sortedDays[0].dayIndex];

  // Render text below grid in Courier + Helvetica style
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("PEAK ACTIVITY HOUR:", marginX, 185);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  doc.text(peakHourStr, marginX + 45, 185);

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("MOST ACTIVE DAY:", marginX, 193);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  doc.text(peakDayStr, marginX + 45, 193);

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("SILENCE GAPS (>24H):", marginX, 201);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  doc.text(`${data.stats.gapsLongerThan24h.length} instances`, marginX + 45, 201);

  // Relationship Evolution Timeline (y = 215)
  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.setTextColor(11, 11, 9);
  doc.text("Relationship Evolution Timeline", marginX, 217);
  drawDivider(220);

  const timeline = data.moments[0]?.relationshipTimeline || [];
  let timelineX = marginX;
  const colTimelineW = contentWidth / Math.max(timeline.length, 1);

  timeline.forEach((item, idx) => {
    const xPos = timelineX + idx * colTimelineW;
    
    // Draw thin box
    doc.setDrawColor(200, 149, 108, 30);
    doc.rect(xPos + 1, 226, colTimelineW - 2, 38);
    
    doc.setFont("courier", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(200, 149, 108);
    
    const formatTimelineYear = (y: number) => {
      const base = Math.floor(y);
      const dec = Math.round((y - base) * 10);
      if (dec === 1) return `Mid ${base}`;
      if (dec === 2) return `Late ${base}`;
      if (dec === 0) return String(base);
      return `Early ${base}`;
    };
    
    doc.text(formatTimelineYear(item.year), xPos + 4, 232);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    item.blended.forEach((b, bIdx) => {
      doc.text(`${b.type}: ${Math.round(b.confidence * 100)}%`, xPos + 4, 239 + bIdx * 5);
    });
  });

  addFooter(7);

  // ================= PAGE 8: FLAG AUDIT =================
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  drawHeader("Frictional Signals / Pattern Audit");

  doc.setFont("times", "normal");
  doc.setFontSize(24);
  doc.setTextColor(11, 11, 9);
  doc.text("Flags Analysis", marginX, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("RULE-BASED SCAN FOR BEHAVIORAL PATTERNS WITH ACTUAL QUOTES", marginX, 51);

  let curY = 65;

  // Green flags
  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.setTextColor(20, 80, 20); // Dark Green
  doc.text("Positive Signals (Green Flags)", marginX, curY);
  drawDivider(curY + 3);
  curY += 10;

  if (data.greenFlags.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("No matching positive patterns detected in the chat log.", marginX, curY);
    curY += 10;
  } else {
    data.greenFlags.slice(0, 2).forEach(flag => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(11, 11, 9);
      doc.text(flag.label, marginX, curY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text(flag.description, marginX, curY + 4);

      if (flag.evidence[0]) {
        doc.setFont("times", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(60, 60, 60);
        doc.text(`Quote: "${flag.evidence[0].content.slice(0, 80)}..."`, marginX + 4, curY + 10);
      }
      curY += 18;
    });
  }

  // Red flags
  curY += 5;
  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.setTextColor(120, 30, 30); // Dark Red
  doc.text("Friction Signals (Red Flags)", marginX, curY);
  drawDivider(curY + 3);
  curY += 10;

  if (data.redFlags.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("No matching friction patterns detected in the chat log.", marginX, curY);
    curY += 10;
  } else {
    data.redFlags.slice(0, 2).forEach(flag => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(11, 11, 9);
      doc.text(flag.label, marginX, curY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text(flag.description, marginX, curY + 4);

      if (flag.evidence[0]) {
        doc.setFont("times", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(60, 60, 60);
        doc.text(`Quote: "${flag.evidence[0].content.slice(0, 80)}..."`, marginX + 4, curY + 10);
      }
      curY += 18;
    });
  }

  // Safety notice
  if (data.compatibility.lowestAxis) {
    curY += 5;
    doc.setFillColor(245, 245, 240);
    doc.rect(marginX, curY, contentWidth, 25, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(11, 11, 9);
    doc.text("Analyst Note on Connection Rhythm:", marginX + 5, curY + 7);

    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const splitNote = doc.splitTextToSize(data.compatibility.analystNote, contentWidth - 10);
    doc.text(splitNote, marginX + 5, curY + 13);
  }

  addFooter(8);

  // ================= PAGE 9: TEXT DNA CARDS =================
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  drawHeader("Frictional Signals / Text DNA Profiles");

  doc.setFont("times", "normal");
  doc.setFontSize(24);
  doc.setTextColor(11, 11, 9);
  doc.text("Text DNA Profiles", marginX, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("BEHAVIORAL COMMUNICATOR ARCHETYPES", marginX, 51);

  // Profile A Card
  doc.setFillColor(248, 246, 240);
  doc.rect(marginX, 60, contentWidth, 80, "F");
  doc.setDrawColor(200, 149, 108, 40);
  doc.setLineWidth(0.3);
  doc.rect(marginX, 60, contentWidth, 80);

  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.setTextColor(11, 11, 9);
  doc.text(`${data.senderA} — ${data.dnaA.name}`, marginX + 8, 70);

  doc.setFont("times", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(200, 149, 108);
  doc.text(data.dnaA.tagline, marginX + 8, 76);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Average length: ${data.dnaA.avgMessageLength} characters`, marginX + 8, 83);

  // Traits list
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  data.dnaA.traits.forEach((trait, i) => {
    doc.text(`*  ${trait}`, marginX + 10, 93 + i * 8, { maxWidth: contentWidth - 20 });
  });

  // Behavioral Archetypes A
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("BEHAVIORAL ARCHETYPES:", marginX + 8, 120);

  const archsA = data.moments[0]?.archetypesA || [];
  const archTextA = archsA.map(a => `${a.archetype} (${a.score}%)`).join("  ·  ");
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.setTextColor(200, 149, 108);
  doc.text(archTextA, marginX + 8, 127);

  // Profile B Card
  doc.setFillColor(248, 246, 240);
  doc.rect(marginX, 155, contentWidth, 80, "F");
  doc.rect(marginX, 155, contentWidth, 80);

  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.setTextColor(11, 11, 9);
  doc.text(`${data.senderB} — ${data.dnaB.name}`, marginX + 8, 165);

  doc.setFont("times", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(200, 149, 108);
  doc.text(data.dnaB.tagline, marginX + 8, 171);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Average length: ${data.dnaB.avgMessageLength} characters`, marginX + 8, 178);

  // Traits list
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  data.dnaB.traits.forEach((trait, i) => {
    doc.text(`*  ${trait}`, marginX + 10, 188 + i * 8, { maxWidth: contentWidth - 20 });
  });

  // Behavioral Archetypes B
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("BEHAVIORAL ARCHETYPES:", marginX + 8, 215);

  const archsB = data.moments[0]?.archetypesB || [];
  const archTextB = archsB.map(b => `${b.archetype} (${b.score}%)`).join("  ·  ");
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.setTextColor(200, 149, 108);
  doc.text(archTextB, marginX + 8, 222);

  // Compatibility Meter visual
  curY = 245;
  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.setTextColor(11, 11, 9);
  doc.text(`Core Compatibility Score: ${data.compatibility.overallScore}%`, marginX, curY);
  
  // Progress bar
  doc.setFillColor(220, 220, 220);
  doc.rect(marginX, curY + 4, contentWidth, 3, "F");
  doc.setFillColor(200, 149, 108);
  doc.rect(marginX, curY + 4, (contentWidth * data.compatibility.overallScore) / 100, 3, "F");

  addFooter(9);

  // ================= PAGE 10: SOUNDTRACK =================
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  drawHeader("Frictional Signals / Relationship Playlist");

  doc.setFont("times", "normal");
  doc.setFontSize(24);
  doc.setTextColor(11, 11, 9);
  doc.text("Relationship Soundtrack", marginX, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("PLAYLIST CURATED DYNAMICALLY TO MATCH THE EMOTIONAL RHYTHMS OF THIS ARCHIVE", marginX, 51);

  curY = 65;
  data.soundtrack.forEach((song, i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(11, 11, 9);
    doc.text(`${i + 1}. ${song.title}`, marginX, curY);

    doc.setFont("times", "italic");
    doc.setFontSize(10.5);
    doc.setTextColor(200, 149, 108);
    doc.text(`by ${song.artist}`, marginX + 6, curY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const splitReason = doc.splitTextToSize(song.reason, contentWidth - 10);
    doc.text(splitReason, marginX + 6, curY + 10);

    curY += 22;
  });

  addFooter(10);

  // ================= PAGE 11: CLOSING PAGE =================
  doc.addPage();
  doc.setFillColor(11, 11, 9); // #0b0b09 background
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Border frame
  doc.setDrawColor(200, 149, 108, 40);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Center the Memra wordmark at 36pt
  doc.setFont("times", "normal");
  doc.setFontSize(36);
  doc.setTextColor(244, 244, 240); // Off white
  doc.text("MEMRA", pageWidth / 2, 80, { align: "center" });

  // Below it, the tagline in 11pt italic
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(200, 149, 108); // Accent color #c8956c
  doc.text("Memories deserve better than a text file.", pageWidth / 2, 90, { align: "center" });

  // Below that, a thin rule
  doc.setDrawColor(200, 149, 108, 40);
  doc.setLineWidth(0.2);
  doc.line(pageWidth / 2 - 35, 96, pageWidth / 2 + 35, 96);

  // Below that, in 8pt Courier uppercase with wide letter spacing
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(106, 100, 88); // #6a6458
  try {
    (doc as any).setCharSpace(1.2);
  } catch {}

  const formattedDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }).toUpperCase();
  const compiledText = `COMPILED ${formattedDate} · PRIVATE ARCHIVE · ZERO SERVER TRANSMISSION`;
  doc.text(compiledText, pageWidth / 2, 105, { align: "center" });

  try {
    (doc as any).setCharSpace(0);
  } catch {}

  // The QR code should be larger — minimum 35mm x 35mm — and positioned center page
  drawVectorQRCode((pageWidth - 35) / 2, 122, 35);

  doc.save("memra-memory-book.pdf");
}
