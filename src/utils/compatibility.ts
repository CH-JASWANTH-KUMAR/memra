import { ParsedMessage, ChatStats } from "./chatParser";
import { ArchetypeProfile } from "./textDNA";

export interface CompatibilityAxes {
  communicationBalance: number;  // 30 - 95
  initiationEquity: number;      // 30 - 95
  emotionalAvailability: number; // 30 - 95
  responseConsistency: number;   // 30 - 95
  depthProgression: number;      // 30 - 95
}

export interface CompatibilityReport {
  overallScore: number;          // 30 - 95
  axes: CompatibilityAxes;
  analystNote: string;
  lowestAxis: keyof CompatibilityAxes;
}

export function calculateCompatibility(
  messages: ParsedMessage[],
  stats: ChatStats,
  profileA: ArchetypeProfile,
  profileB: ArchetypeProfile
): CompatibilityReport {
  const senderA = stats.senders[0];
  const senderB = stats.senders[1] || "Other";

  // --- 1. Communication Balance ---
  // Ratio of messages sent vs received
  const countA = stats.messagesPerSender[senderA] || 0;
  const countB = stats.messagesPerSender[senderB] || 0;
  const minCount = Math.min(countA, countB);
  const maxCount = Math.max(countA, countB) || 1;
  const balanceRatio = minCount / maxCount;
  // Map to 30 - 95
  const communicationBalance = Math.min(95, Math.max(30, Math.round(30 + (balanceRatio * 65))));

  // --- 2. Initiation Equity ---
  // Ratio of who initiates conversations
  const initA = stats.initiationCounts[senderA] || 0;
  const initB = stats.initiationCounts[senderB] || 0;
  const minInit = Math.min(initA, initB);
  const maxInit = Math.max(initA, initB) || 1;
  const initRatio = minInit / maxInit;
  // Map to 30 - 95
  const initiationEquity = Math.min(95, Math.max(30, Math.round(30 + (initRatio * 65))));

  // --- 3. Emotional Availability ---
  // Average of both emotional vocabulary scores
  const emotionalAvailability = Math.min(
    95,
    Math.max(30, Math.round((profileA.scores.emotionalVocab + profileB.scores.emotionalVocab) / 2))
  );

  // --- 4. Response Consistency ---
  // Average of both consistency scores
  const responseConsistency = Math.min(
    95,
    Math.max(30, Math.round((profileA.scores.consistency + profileB.scores.consistency) / 2))
  );

  // --- 5. Depth Progression ---
  // Calculate if conversations get deeper (longer messages) over time
  // Divide messages chronologically into three segments
  let depthProgression = 75; // Default stable score if insufficient messages
  const totalCount = messages.length;
  
  if (totalCount >= 15) {
    const size = Math.floor(totalCount / 3);
    const seg1 = messages.slice(0, size);
    const seg3 = messages.slice(size * 2);

    const avgLenSeg1 = seg1.reduce((sum, m) => sum + m.content.length, 0) / (seg1.length || 1);
    const avgLenSeg3 = seg3.reduce((sum, m) => sum + m.content.length, 0) / (seg3.length || 1);

    if (avgLenSeg1 > 0) {
      const ratio = avgLenSeg3 / avgLenSeg1;
      if (ratio >= 1.0) {
        // Growth
        depthProgression = Math.round(70 + Math.min(25, (ratio - 1.0) * 40));
      } else {
        // Decline
        depthProgression = Math.round(70 - Math.min(40, (1.0 - ratio) * 40));
      }
    }
  }
  depthProgression = Math.min(95, Math.max(30, depthProgression));

  const axes: CompatibilityAxes = {
    communicationBalance,
    initiationEquity,
    emotionalAvailability,
    responseConsistency,
    depthProgression,
  };

  // --- Overall Weighted Score ---
  // Weighting: balance (20%), equity (20%), emotional (25%), consistency (15%), progression (20%)
  const rawOverall = (
    communicationBalance * 0.20 +
    initiationEquity * 0.20 +
    emotionalAvailability * 0.25 +
    responseConsistency * 0.15 +
    depthProgression * 0.20
  );
  const overallScore = Math.min(95, Math.max(30, Math.round(rawOverall)));

  // --- Determine Lowest Axis & Analyst Note ---
  const axesList: Array<{ key: keyof CompatibilityAxes; val: number }> = [
    { key: "communicationBalance", val: communicationBalance },
    { key: "initiationEquity", val: initiationEquity },
    { key: "emotionalAvailability", val: emotionalAvailability },
    { key: "responseConsistency", val: responseConsistency },
    { key: "depthProgression", val: depthProgression },
  ];

  // Sort ascending to find lowest
  axesList.sort((a, b) => a.val - b.val);
  const lowestAxis = axesList[0].key;

  let analystNote = "Your communication shows a stable and resilient baseline across all core dimensions.";
  switch (lowestAxis) {
    case "communicationBalance":
      analystNote = "One of you is doing significantly more of the texting, which can create a conversational drift over time.";
      break;
    case "initiationEquity":
      analystNote = "The task of breaking the silence falls mostly on one person; sharing the initiation role brings more balanced energy.";
      break;
    case "emotionalAvailability":
      analystNote = "There is a gap in how emotional experiences are shared. Creating space for vulnerable disclosures could deepen the connection.";
      break;
    case "responseConsistency":
      analystNote = "Replies are highly variable in timing and speed, indicating mismatched rhythms in availability.";
      break;
    case "depthProgression":
      analystNote = "The depth of exchanges has leveled off over time; injecting fresh topics or sharing stories could reignite the narrative arc.";
      break;
  }

  return {
    overallScore,
    axes,
    analystNote,
    lowestAxis,
  };
}
