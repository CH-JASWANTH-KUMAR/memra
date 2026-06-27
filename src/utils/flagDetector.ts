import { ParsedMessage } from "./chatParser";
import flagsRules from "../config/flags.json";

export interface FlagEvidence {
  sender: string;
  content: string;
  date: Date;
  context?: string; // Optional preceding message context
}

export interface DetectedFlag {
  id: string;
  label: string;
  description: string;
  evidence: FlagEvidence[];
}

export interface FlagReport {
  greenFlags: DetectedFlag[];
  redFlags: DetectedFlag[];
  showSafetyNotice: boolean;
}

// Emotional / Vulnerable words helper
const EMOTIONAL_WORDS = [
  "feel", "felt", "hurt", "sad", "upset", "sorry", "cry", "crying", "vulnerable",
  "scared", "afraid", "lonely", "confused", "anxious", "struggling", "depressed",
  "worried", "pain", "love", "miss you", "missed you"
];

export function detectFlags(messages: ParsedMessage[]): FlagReport {
  const greenFlags: DetectedFlag[] = [];
  const redFlags: DetectedFlag[] = [];

  // Map rules for easy lookup
  const greenRules = flagsRules.green;
  const redRules = flagsRules.red;

  // Initialize detected structures
  const greenMap: Record<string, FlagEvidence[]> = {};
  const redMap: Record<string, FlagEvidence[]> = {};

  greenRules.forEach(r => { greenMap[r.id] = []; });
  redRules.forEach(r => { redMap[r.id] = []; });

  // Custom flag states for complex pattern detection
  let cancellationCount = 0;
  const cancellationEvidences: FlagEvidence[] = [];

  for (let i = 0; i < messages.length; i++) {
    const current = messages[i];
    if (current.isSystem || current.isMedia || current.isDeleted) continue;

    const textLower = current.content.toLowerCase();
    const prev = i > 0 ? messages[i - 1] : null;

    // --- 1. KEYWORD MATCHING (Green Flags) ---
    greenRules.forEach(rule => {
      const matchesKeyword = rule.keywords.some(kw => textLower.includes(kw));
      if (matchesKeyword) {
        // Cap evidence to max 3 items to keep display neat
        if (greenMap[rule.id].length < 3) {
          greenMap[rule.id].push({
            sender: current.sender,
            content: current.content,
            date: current.date,
          });
        }
      }
    });

    // --- 2. KEYWORD MATCHING (Red Flags - Deflection, Cancellations, Topic Change) ---
    // Deflection
    const deflectionRule = redRules.find(r => r.id === "deflection");
    if (deflectionRule) {
      const matchesDeflect = deflectionRule.keywords.some(kw => textLower.includes(kw));
      if (matchesDeflect && redMap["deflection"].length < 3) {
        redMap["deflection"].push({
          sender: current.sender,
          content: current.content,
          date: current.date,
        });
      }
    }

    // Cancellation pattern tracking
    const cancelRule = redRules.find(r => r.id === "cancellation");
    if (cancelRule) {
      const matchesCancel = cancelRule.keywords.some(kw => textLower.includes(kw));
      if (matchesCancel) {
        cancellationCount++;
        if (cancellationEvidences.length < 3) {
          cancellationEvidences.push({
            sender: current.sender,
            content: current.content,
            date: current.date,
          });
        }
      }
    }

    // --- 3. CONTEXTUAL & INTERACTIVE PATTERNS (One-Word Answers, Long Gaps after vulnerability, Topic Changes) ---
    if (prev && !prev.isSystem && !prev.isMedia && !prev.isDeleted) {
      const prevTextLower = prev.content.toLowerCase();
      const prevIsEmotional = EMOTIONAL_WORDS.some(word => prevTextLower.includes(word));
      const timeGapMs = current.date.getTime() - prev.date.getTime();

      // A. One-word response during emotional conversations
      if (prevIsEmotional && current.sender !== prev.sender) {
        // A response of 1-2 words or very short characters
        const words = current.content.trim().split(/\s+/);
        const isOneWord = words.length <= 2 && current.content.length <= 10;
        
        const oneWordRule = redRules.find(r => r.id === "one_word_emotional");
        if (isOneWord && oneWordRule) {
          // Verify if it contains low-empathy words (like ok, k, fine)
          const matchesOneWordKeyword = oneWordRule.keywords.some(kw => textLower.includes(kw)) || current.content.length <= 3;
          if (matchesOneWordKeyword && redMap["one_word_emotional"].length < 3) {
            redMap["one_word_emotional"].push({
              sender: current.sender,
              content: current.content,
              date: current.date,
              context: `Following vulnerable message from ${prev.sender}: "${prev.content}"`,
            });
          }
        }
      }

      // B. Long gaps specifically after vulnerable messages (> 12 hours)
      if (prevIsEmotional && current.sender !== prev.sender && timeGapMs > 12 * 60 * 60 * 1000) {
        const gapHours = Math.round(timeGapMs / (1000 * 60 * 60));
        
        // We will classify this as a custom red flag
        const vulnerableGapId = "vulnerable_gap";
        if (!redMap[vulnerableGapId]) {
          redMap[vulnerableGapId] = [];
        }
        if (redMap[vulnerableGapId].length < 3) {
          redMap[vulnerableGapId].push({
            sender: current.sender,
            content: current.content,
            date: current.date,
            context: `${gapHours}h delay replying to ${prev.sender}'s vulnerable message: "${prev.content}"`,
          });
        }
      }

      // C. Topic changes when emotions are raised
      const topicRule = redRules.find(r => r.id === "topic_change");
      if (prevIsEmotional && current.sender !== prev.sender && topicRule) {
        const matchesTopicChange = topicRule.keywords.some(kw => textLower.startsWith(kw) || textLower.includes(kw));
        if (matchesTopicChange && redMap["topic_change"].length < 3) {
          redMap["topic_change"].push({
            sender: current.sender,
            content: current.content,
            date: current.date,
            context: `Changing topic after ${prev.sender} shared emotionally: "${prev.content}"`,
          });
        }
      }
    }
  }

  // Handle Cancellations (> 3 times is red flag)
  if (cancellationCount >= 3) {
    redMap["cancellation"] = cancellationEvidences;
  }

  // Compile results
  greenRules.forEach(rule => {
    if (greenMap[rule.id] && greenMap[rule.id].length > 0) {
      greenFlags.push({
        id: rule.id,
        label: rule.label,
        description: rule.description,
        evidence: greenMap[rule.id],
      });
    }
  });

  // Regular JSON red rules compilation
  redRules.forEach(rule => {
    if (rule.id !== "cancellation" && redMap[rule.id] && redMap[rule.id].length > 0) {
      redFlags.push({
        id: rule.id,
        label: rule.label,
        description: rule.description,
        evidence: redMap[rule.id],
      });
    }
  });

  // Add cancellation if it triggered
  if (cancellationCount >= 3 && cancellationEvidences.length > 0) {
    const cancelRule = redRules.find(r => r.id === "cancellation");
    if (cancelRule) {
      redFlags.push({
        id: "cancellation",
        label: cancelRule.label,
        description: `${cancelRule.description} (Happened ${cancellationCount} times in this chat)`,
        evidence: cancellationEvidences,
      });
    }
  }

  // Add custom vulnerable gaps red flag
  if (redMap["vulnerable_gap"] && redMap["vulnerable_gap"].length > 0) {
    redFlags.push({
      id: "vulnerable_gap",
      label: "Vulnerability Silence",
      description: "Taking long breaks (>12 hours) to reply specifically when the other person opens up emotionally.",
      evidence: redMap["vulnerable_gap"],
    });
  }

  // --- 4. SAFETY NOTICE LOGIC ---
  // Trigger notice if we have multiple red flags, or a high ratio of red to green flags,
  // or specific patterns like multiple vulnerability silences / one-word deflations.
  const totalRedCount = redFlags.reduce((acc, f) => acc + f.evidence.length, 0);
  const totalGreenCount = greenFlags.reduce((acc, f) => acc + f.evidence.length, 0);
  
  // Notice if red flags are prominent, or if there are specific signs of manipulation
  const hasVulnerableGaps = redMap["vulnerable_gap"] && redMap["vulnerable_gap"].length >= 2;
  const hasDeflectionsAndOneWords = redMap["deflection"] && redMap["deflection"].length >= 2 && redMap["one_word_emotional"] && redMap["one_word_emotional"].length >= 2;

  const showSafetyNotice = totalRedCount > 4 && (totalRedCount > totalGreenCount || hasVulnerableGaps || hasDeflectionsAndOneWords);

  return {
    greenFlags,
    redFlags,
    showSafetyNotice,
  };
}
