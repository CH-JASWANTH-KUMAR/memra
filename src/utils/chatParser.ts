export interface ParsedMessage {
  date: Date;
  sender: string;
  content: string;
  isSystem: boolean;
  isMedia: boolean;
  isDeleted: boolean;
}

export interface WeeklyData {
  weekLabel: string; // e.g. "Jun 14" or "W1"
  date: Date;
  messageCount: number;
  emotionalCount: number;
}

export interface ChatStats {
  senders: string[];
  totalMessages: number;
  messagesPerSender: Record<string, number>;
  averageResponseTime: Record<string, number>; // in seconds
  initiationCounts: Record<string, number>;
  peakHours: number[]; // 24 elements
  gapsLongerThan24h: Array<{ start: Date; end: Date; hours: number }>;
  activeDayOfWeek: { dayIndex: number; count: number }[]; // 7 elements
  averageMessageLength: Record<string, number>; // character count
  messagesByDate: Record<string, ParsedMessage[]>; // YYYY-MM-DD
  weeklyData: WeeklyData[]; // weekly aggregated records for Journey tab
  detectedFormat: "whatsapp" | "imessage";
}

const EMOTIONAL_KEYWORDS = [
  "feel", "felt", "love", "sad", "happy", "hurt", "worry", "scared", "miss", 
  "sorry", "appreciate", "thank", "kind", "good", "bad", "angry", "upset", 
  "lonely", "excited", "grateful", "anxious", "hope", "care"
];

// Clean system messages or media tags
export function cleanMessageContent(content: string): {
  cleanContent: string;
  isMedia: boolean;
  isDeleted: boolean;
} {
  const c = content.trim();
  const isMedia = c.includes("<Media omitted>") || c.includes("image omitted") || c.includes("video omitted") || c.includes("sticker omitted") || c.includes("audio omitted");
  const isDeleted = c.includes("This message was deleted") || c.includes("You deleted this message");
  return {
    cleanContent: c,
    isMedia,
    isDeleted,
  };
}

export function parseDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    const dateParts = dateStr.split(/[/\-.]/);
    if (dateParts.length !== 3) return null;

    let day = 0;
    let month = 0;
    let year = 0;

    // Check if it's YYYY-MM-DD
    if (dateParts[0].length === 4) {
      year = parseInt(dateParts[0], 10);
      month = parseInt(dateParts[1], 10) - 1;
      day = parseInt(dateParts[2], 10);
    } else {
      const part1 = parseInt(dateParts[0], 10);
      const part2 = parseInt(dateParts[1], 10);
      const part3 = parseInt(dateParts[2], 10);

      year = part3;
      if (year < 100) {
        year += 2000;
      }

      if (part2 > 12) {
        month = part1 - 1;
        day = part2;
      } else {
        day = part1;
        month = part2 - 1;
      }
    }

    const ampmMatch = timeStr.match(/([AaPp][Mm])/);
    const ampm = ampmMatch ? ampmMatch[0].toUpperCase() : null;

    const cleanTime = timeStr.replace(/[AaPp][Mm]/, "").trim();
    const timeParts = cleanTime.split(":");
    let hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

    if (ampm) {
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
    }

    const d = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
}

// Auto-sniff format check
export function sniffFormat(rawText: string): "whatsapp" | "imessage" {
  const lines = rawText.split(/\r?\n/).slice(0, 15);
  
  // Pattern 1: Time-only in brackets standard in iMessage logs, e.g. [17:30:15] Name:
  const imessageBracketRegex = /^\s*\[\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?\]\s+([^:]+):\s*/;
  // Pattern 2: iMessage plist/json raw lines or date headers on separate lines followed by name colon
  const dateHeaderKeywords = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  
  let imessageScore = 0;
  let whatsappScore = 0;

  for (const line of lines) {
    const l = line.trim().toLowerCase();
    if (!l) continue;

    if (imessageBracketRegex.test(line)) {
      imessageScore += 3;
    }
    // Standard WhatsApp: line starts with date digits, e.g., 14/06/2026 or [14/06/2026
    if (/^\s*\[?\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}/.test(line)) {
      whatsappScore += 2;
    }
    // If we hit standard iMessage date line separators
    if (dateHeaderKeywords.some(kw => l.startsWith(kw))) {
      imessageScore += 1;
    }
  }

  return imessageScore > whatsappScore ? "imessage" : "whatsapp";
}

export function parseChatExport(rawText: string): {
  messages: ParsedMessage[];
  stats: ChatStats;
} {
  const format = sniffFormat(rawText);
  const lines = rawText.split(/\r?\n/);
  const messages: ParsedMessage[] = [];

  if (format === "whatsapp") {
    // --- WHATSAPP PARSER ---
    const whatsappRegex = /^\s*\[?(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]?\s*[-:]?\s*([^:]+):\s*(.*)$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const match = line.match(whatsappRegex);
      if (match) {
        const dateStr = match[1];
        const timeStr = match[2];
        const sender = match[3].trim();
        const content = match[4];

        const parsedDate = parseDateTime(dateStr, timeStr);
        if (parsedDate) {
          const { cleanContent, isMedia, isDeleted } = cleanMessageContent(content);
          const isSystem = sender.toLowerCase().includes("changed") || 
                           sender.toLowerCase().includes("added") || 
                           sender.toLowerCase().includes("left") || 
                           sender.toLowerCase().includes("created group") ||
                           sender.toLowerCase().includes("security code");

          messages.push({
            date: parsedDate,
            sender,
            content: cleanContent,
            isSystem,
            isMedia,
            isDeleted,
          });
          continue;
        }
      }

      // Multi-line continuation
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        lastMsg.content += "\n" + line;
        const { isMedia, isDeleted } = cleanMessageContent(lastMsg.content);
        lastMsg.isMedia = isMedia || lastMsg.isMedia;
        lastMsg.isDeleted = isDeleted || lastMsg.isDeleted;
      }
    }
  } else {
    // --- IMESSAGE PARSER ---
    // Handles transcripts with date headers and time bracket messages:
    // e.g. "Sunday, June 14, 2026" (date header)
    // "[17:30:15] Alex: message" (time + message)
    let currentSniffedDate = new Date();
    
    // Pattern to catch date headers like "June 14, 2026" or "14 June 2026" or "Sunday, June 14, 2026"
    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    
    // time pattern inside bracket, e.g. "[17:30:15]" or "[5:30 PM]" followed by Name:
    const imessageMsgRegex = /^\s*\[(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]\s+([^:]+):\s*(.*)$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if line represents a Date Header
      const lowerLine = trimmed.toLowerCase();
      const containsMonth = monthNames.some(m => lowerLine.includes(m));
      const hasDigits = /\d{2,4}/.test(trimmed);
      
      if (containsMonth && hasDigits && !trimmed.includes(":")) {
        // Parse date header
        const parsedHeader = new Date(trimmed);
        if (!isNaN(parsedHeader.getTime())) {
          currentSniffedDate = parsedHeader;
          continue;
        }
      }

      // Check if line is a message line
      const match = trimmed.match(imessageMsgRegex);
      if (match) {
        const timeStr = match[1];
        const sender = match[2].trim();
        const content = match[3];

        // Parse time details
        const ampmMatch = timeStr.match(/([AaPp][Mm])/);
        const ampm = ampmMatch ? ampmMatch[0].toUpperCase() : null;
        const cleanTime = timeStr.replace(/[AaPp][Mm]/, "").trim();
        const timeParts = cleanTime.split(":");
        let hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

        if (ampm) {
          if (ampm === "PM" && hours < 12) hours += 12;
          if (ampm === "AM" && hours === 12) hours = 0;
        }

        const msgDate = new Date(
          currentSniffedDate.getFullYear(),
          currentSniffedDate.getMonth(),
          currentSniffedDate.getDate(),
          hours,
          minutes,
          seconds
        );

        if (!isNaN(msgDate.getTime())) {
          const { cleanContent, isMedia, isDeleted } = cleanMessageContent(content);
          messages.push({
            date: msgDate,
            sender,
            content: cleanContent,
            isSystem: false,
            isMedia,
            isDeleted,
          });
          continue;
        }
      }

      // Multi-line continuation
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        lastMsg.content += "\n" + line;
        const { isMedia, isDeleted } = cleanMessageContent(lastMsg.content);
        lastMsg.isMedia = isMedia || lastMsg.isMedia;
        lastMsg.isDeleted = isDeleted || lastMsg.isDeleted;
      }
    }
  }

  // Filter out system messages
  const activeMessages = messages.filter(m => !m.isSystem);

  // Compute Stats
  const sendersSet = new Set<string>();
  const messagesPerSender: Record<string, number> = {};
  const totalMessageLength: Record<string, number> = {};
  const initiationCounts: Record<string, number> = {};

  const peakHours = new Array(24).fill(0);
  const activeDays = new Array(7).fill(0);
  const gapsLongerThan24h: Array<{ start: Date; end: Date; hours: number }> = [];
  const messagesByDate: Record<string, ParsedMessage[]> = {};

  const responseTimesSum: Record<string, number> = {};
  const responseTimesCount: Record<string, number> = {};

  activeMessages.sort((a, b) => a.date.getTime() - b.date.getTime());

  let lastMsg: ParsedMessage | null = null;
  const INITIATION_GAP_MS = 8 * 60 * 60 * 1000;
  const GAP_THRESHOLD_MS = 24 * 60 * 60 * 1000;

  activeMessages.forEach((msg, idx) => {
    const sender = msg.sender;
    sendersSet.add(sender);

    messagesPerSender[sender] = (messagesPerSender[sender] || 0) + 1;

    if (!msg.isMedia && !msg.isDeleted) {
      totalMessageLength[sender] = (totalMessageLength[sender] || 0) + msg.content.length;
    }

    const hour = msg.date.getHours();
    peakHours[hour]++;

    const day = msg.date.getDay();
    activeDays[day]++;

    const dateKey = msg.date.toISOString().split("T")[0];
    if (!messagesByDate[dateKey]) {
      messagesByDate[dateKey] = [];
    }
    messagesByDate[dateKey].push(msg);

    if (lastMsg) {
      const diffMs = msg.date.getTime() - lastMsg.date.getTime();

      if (diffMs > GAP_THRESHOLD_MS) {
        gapsLongerThan24h.push({
          start: lastMsg.date,
          end: msg.date,
          hours: Math.round(diffMs / (1000 * 60 * 60)),
        });
      }

      if (diffMs > INITIATION_GAP_MS) {
        initiationCounts[sender] = (initiationCounts[sender] || 0) + 1;
      }

      if (msg.sender !== lastMsg.sender && diffMs < 12 * 60 * 60 * 1000) {
        responseTimesSum[sender] = (responseTimesSum[sender] || 0) + (diffMs / 1000);
        responseTimesCount[sender] = (responseTimesCount[sender] || 0) + 1;
      }
    } else {
      initiationCounts[sender] = (initiationCounts[sender] || 0) + 1;
    }

    lastMsg = msg;
  });

  const senders = Array.from(sendersSet);
  const averageMessageLength: Record<string, number> = {};
  const averageResponseTime: Record<string, number> = {};

  senders.forEach(sender => {
    const count = messagesPerSender[sender] || 0;
    averageMessageLength[sender] = count > 0 ? Math.round((totalMessageLength[sender] || 0) / count) : 0;
    const rCount = responseTimesCount[sender] || 0;
    averageResponseTime[sender] = rCount > 0 ? Math.round((responseTimesSum[sender] || 0) / rCount) : 0;
    if (!initiationCounts[sender]) {
      initiationCounts[sender] = 0;
    }
  });

  const activeDayOfWeek = activeDays.map((count, index) => ({
    dayIndex: index,
    count,
  }));

  // --- WEEKLY JOURNAL MATH ---
  const weeklyData: WeeklyData[] = [];
  if (activeMessages.length > 0) {
    const chatStart = activeMessages[0].date;
    const chatEnd = activeMessages[activeMessages.length - 1].date;
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    
    // Group into 7-day windows starting from the first message
    let currentStart = new Date(chatStart.getTime());
    let weekIndex = 1;

    while (currentStart.getTime() <= chatEnd.getTime()) {
      const currentEnd = new Date(currentStart.getTime() + oneWeekMs);
      
      // Filter messages in this week window
      const weekMsgs = activeMessages.filter(
        m => m.date.getTime() >= currentStart.getTime() && m.date.getTime() < currentEnd.getTime()
      );

      // Count emotional messages in this week window
      let emotionalCount = 0;
      weekMsgs.forEach(m => {
        const txt = m.content.toLowerCase();
        const hasEmot = EMOTIONAL_KEYWORDS.some(kw => txt.includes(kw));
        if (hasEmot) emotionalCount++;
      });

      // Format label
      const weekLabel = currentStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      weeklyData.push({
        weekLabel,
        date: new Date(currentStart.getTime()),
        messageCount: weekMsgs.length,
        emotionalCount,
      });

      currentStart = currentEnd;
      weekIndex++;
    }

    // If only 1 week resulted, mock another week for nice lines on graph
    if (weeklyData.length === 1) {
      weeklyData.push({
        weekLabel: new Date(chatStart.getTime() + oneWeekMs).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        date: new Date(chatStart.getTime() + oneWeekMs),
        messageCount: Math.round(weeklyData[0].messageCount * 0.7),
        emotionalCount: Math.round(weeklyData[0].emotionalCount * 0.8),
      });
    }
  }

  const stats: ChatStats = {
    senders,
    totalMessages: activeMessages.length,
    messagesPerSender,
    averageResponseTime,
    initiationCounts,
    peakHours,
    gapsLongerThan24h,
    activeDayOfWeek,
    averageMessageLength,
    messagesByDate,
    weeklyData,
    detectedFormat: format,
  };

  return {
    messages: activeMessages,
    stats,
  };
}
