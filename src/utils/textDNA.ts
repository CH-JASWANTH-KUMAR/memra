import { ParsedMessage, ChatStats } from "./chatParser";

export interface DNAScores {
  initiation: number;      // 0 - 100
  emotionalVocab: number;   // 0 - 100
  consistency: number;      // 0 - 100
  questionAsking: number;   // 0 - 100
  affirmation: number;      // 0 - 100
}

export interface ArchetypeProfile {
  sender: string;
  name: string;
  tagline: string;
  traits: string[];
  avgMessageLength: number;
  scores: DNAScores;
}

const EMOTIONAL_KEYWORDS = [
  "feel", "felt", "love", "sad", "happy", "hurt", "worry", "scared", "miss", 
  "sorry", "appreciate", "thank", "kind", "good", "bad", "angry", "upset", 
  "lonely", "excited", "grateful", "anxious", "hope", "care"
];

const AFFIRMATION_KEYWORDS = [
  "exactly", "i know", "same", "agree", "true", "yes", "yeah", "absolutely", 
  "totally", "right", "indeed", "correct", "perfect", "uh huh"
];

function calculateSingleScores(
  sender: string,
  messages: ParsedMessage[],
  stats: ChatStats
): { scores: DNAScores; avgLen: number } {
  const senderMessages = messages.filter(m => m.sender === sender);
  const totalSenderCount = senderMessages.length || 1;

  // 1. INITIATION SCORE
  const senderInitiations = stats.initiationCounts[sender] || 0;
  const totalInitiations = Object.values(stats.initiationCounts).reduce((a, b) => a + b, 0) || 1;
  const initiationRatio = senderInitiations / totalInitiations;
  const initiationScore = Math.min(95, Math.max(20, Math.round(initiationRatio * 100)));

  // 2. EMOTIONAL VOCABULARY SCORE
  let emotionalMsgCount = 0;
  senderMessages.forEach(msg => {
    const textLower = msg.content.toLowerCase();
    const hasEmotional = EMOTIONAL_KEYWORDS.some(kw => textLower.includes(kw));
    if (hasEmotional) emotionalMsgCount++;
  });
  const rawEmotionalScore = (emotionalMsgCount / totalSenderCount) * 100;
  const emotionalVocabScore = Math.min(95, Math.max(20, Math.round(rawEmotionalScore * 4.5 + 15)));

  // 3. RESPONSE LENGTH CONSISTENCY
  const lengths = senderMessages.map(m => m.content.length);
  const avgLen = stats.averageMessageLength[sender] || 25;
  let varianceSum = 0;
  lengths.forEach(len => {
    varianceSum += Math.pow(len - avgLen, 2);
  });
  const stdDev = Math.sqrt(varianceSum / totalSenderCount);
  const coefVariation = avgLen > 0 ? stdDev / avgLen : 1;
  const consistencyScore = Math.min(95, Math.max(20, Math.round(100 - (coefVariation * 40))));

  // 4. QUESTION ASKING FREQUENCY
  let questionCount = 0;
  senderMessages.forEach(msg => {
    if (msg.content.includes("?")) questionCount++;
  });
  const rawQuestionScore = (questionCount / totalSenderCount) * 100;
  const questionAskingScore = Math.min(95, Math.max(20, Math.round(rawQuestionScore * 4 + 20)));

  // 5. AFFIRMATION FREQUENCY
  let affirmationCount = 0;
  senderMessages.forEach(msg => {
    const textLower = msg.content.toLowerCase();
    const hasAff = AFFIRMATION_KEYWORDS.some(kw => textLower.includes(kw));
    if (hasAff) affirmationCount++;
  });
  const rawAffScore = (affirmationCount / totalSenderCount) * 100;
  const affirmationScore = Math.min(95, Math.max(20, Math.round(rawAffScore * 4 + 25)));

  return {
    scores: {
      initiation: initiationScore,
      emotionalVocab: emotionalVocabScore,
      consistency: consistencyScore,
      questionAsking: questionAskingScore,
      affirmation: affirmationScore,
    },
    avgLen,
  };
}

export function calculateBothDNAs(
  messages: ParsedMessage[],
  stats: ChatStats
): { dnaA: ArchetypeProfile; dnaB: ArchetypeProfile; pairingInsight: string } {
  const senderA = stats.senders[0];
  const senderB = stats.senders[1] || "Other";

  const dataA = calculateSingleScores(senderA, messages, stats);
  const dataB = calculateSingleScores(senderB, messages, stats);

  // --- RELATIVE MAPPING ENGINE ---
  // Compare senders to ensure different profiles where differences exist
  let archAName = "The Steady";
  let archBName = "The Steady";

  const lenDiff = Math.abs(dataA.avgLen - dataB.avgLen);
  const initDiff = Math.abs(dataA.scores.initiation - dataB.scores.initiation);
  
  // Decide Archetype A
  if (dataA.scores.initiation > 52 && dataA.avgLen < 35) {
    archAName = "The Spark";
  } else if (dataA.scores.emotionalVocab > dataB.scores.emotionalVocab && dataA.avgLen > dataB.avgLen) {
    archAName = "The Anchor";
  } else if (dataA.scores.initiation < 48 && dataA.avgLen > dataB.avgLen && dataA.avgLen > 45) {
    archAName = "The Depths";
  } else if (dataA.scores.affirmation > 55 && dataA.avgLen > 20 && dataA.avgLen < 55) {
    archAName = "The Mirror";
  }

  // Decide Archetype B
  if (dataB.scores.initiation > 52 && dataB.avgLen < 35) {
    archBName = "The Spark";
  } else if (dataB.scores.emotionalVocab > dataA.scores.emotionalVocab && dataB.avgLen > dataA.avgLen) {
    archBName = "The Anchor";
  } else if (dataB.scores.initiation < 48 && dataB.avgLen > dataA.avgLen && dataB.avgLen > 45) {
    archBName = "The Depths";
  } else if (dataB.scores.affirmation > 55 && dataB.avgLen > 20 && dataB.avgLen < 55) {
    archBName = "The Mirror";
  }

  // Force differentiation if they are assigned the same type but differ in style
  if (archAName === archBName && archAName !== "The Steady") {
    // If both got assigned the same (e.g. Anchor), give the one with lower emotional vocab or length 'The Steady'
    if (archAName === "The Anchor") {
      if (dataA.scores.emotionalVocab > dataB.scores.emotionalVocab) {
        archBName = "The Steady";
      } else {
        archAName = "The Steady";
      }
    } else if (archAName === "The Spark") {
      if (dataA.scores.initiation > dataB.scores.initiation) {
        archBName = "The Steady";
      } else {
        archAName = "The Steady";
      }
    } else if (archAName === "The Depths") {
      if (dataA.avgLen > dataB.avgLen) {
        archBName = "The Steady";
      } else {
        archAName = "The Steady";
      }
    } else if (archAName === "The Mirror") {
      if (dataA.scores.affirmation > dataB.scores.affirmation) {
        archBName = "The Steady";
      } else {
        archAName = "The Steady";
      }
    }
  }

  // Define details for each
  const compileProfile = (senderName: string, archetype: string, metrics: { scores: DNAScores; avgLen: number }): ArchetypeProfile => {
    let tagline = "Reliable, balanced, and present.";
    let traits = [
      "Balances active listening with initiating thoughts.",
      "Maintains a reliable and predictable tempo of replies.",
      "Provides a stable foundation for the conversation."
    ];

    if (archetype === "The Spark") {
      tagline = "Energetic, punchy, and quick to reach out.";
      traits = [
        "Often initiates new conversation threads and topics.",
        "Keeps communication brief, fast-paced, and active.",
        "Maintains the momentum and keeps the connection alive."
      ];
    } else if (archetype === "The Anchor") {
      tagline = "Deeply supportive, thoughtful, and expressive.";
      traits = [
        "Weaves rich emotional vocabulary and check-ins into chat.",
        "Responds with substantial and highly reflective messages.",
        "Creates a safe space for vulnerable sharing."
      ];
    } else if (archetype === "The Depths") {
      tagline = "Introspective, highly detailed, and reflective.";
      traits = [
        "Prefers long, detailed messages over rapid-fire chats.",
        "Reaches out less often but speaks with high substance when replying.",
        "Invests energy in constructing complete and meaningful responses."
      ];
    } else if (archetype === "The Mirror") {
      tagline = "Highly validating, empathetic, and responsive.";
      traits = [
        "Uses frequent affirmations (like 'exactly' or 'I know') to validate.",
        "Matches emotional output and maintains supportive flow.",
        "Acts as a sounding board, reflecting thoughts with warmth."
      ];
    }

    return {
      sender: senderName,
      name: archetype,
      tagline,
      traits,
      avgMessageLength: metrics.avgLen,
      scores: metrics.scores,
    };
  };

  const dnaA = compileProfile(senderA, archAName, dataA);
  const dnaB = compileProfile(senderB, archBName, dataB);

  // --- GET PAIRING INSIGHT ---
  let pairingInsight = "A symmetrical connection where you both share identical conversational rhythms and styles.";
  const key = `${archAName} + ${archBName}`;
  const reverseKey = `${archBName} + ${archAName}`;

  const insightMap: Record<string, string> = {
    "The Spark + The Anchor": "A kinetic pairing where one initiates the energy and the other provides a grounding emotional anchor.",
    "The Spark + The Depths": "A mismatched rhythm of rapid impulses meeting careful reflection; requires patience to sync.",
    "The Spark + The Mirror": "An expressive, high-energy connection that feeds on rapid validation and shared sparks.",
    "The Spark + The Steady": "A balanced pairing where light-hearted momentum is supported by steady presence.",
    "The Anchor + The Depths": "A conversation of high gravity and depth, where both partners value emotional substance.",
    "The Anchor + The Mirror": "A highly validating, emotionally expressive pairing that feels warm and deeply safe.",
    "The Anchor + The Steady": "A comforting, stable union combining deep vulnerability with consistent availability.",
    "The Depths + The Mirror": "A reflective exchange where quiet depth is met with active empathy and validation.",
    "The Depths + The Steady": "A low-frequency connection of substantial, deliberate updates and quiet reliability.",
    "The Mirror + The Steady": "A validating and supportive exchange that matches tones with stable pacing.",
    "The Steady + The Steady": "A highly consistent, even-paced connection built on mutual availability and balance.",
  };

  pairingInsight = insightMap[key] || insightMap[reverseKey] || pairingInsight;

  return {
    dnaA,
    dnaB,
    pairingInsight,
  };
}

// Deprecated single calculator for safety compatibility
export function calculateTextDNA(
  sender: string,
  messages: ParsedMessage[],
  stats: ChatStats
): ArchetypeProfile {
  // Call concurrently and return matching profile
  const result = calculateBothDNAs(messages, stats);
  return result.dnaA.sender === sender ? result.dnaA : result.dnaB;
}
