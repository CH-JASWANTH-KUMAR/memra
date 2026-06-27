import { ParsedMessage, ChatStats } from "./chatParser";

export interface CinematicMoment {
  chapter: string; // "I", "II", "III", "IV", "V"
  type: string;
  date: any;
  sender: string;
  quote: string;
  title: string;
  index?: number;
  context?: string;
  relationshipType?: string;
  storytellingStyle?: string;
  blendedRelationships?: Array<{ type: string; confidence: number }>;
  relationshipTimeline?: Array<{ year: number; blended: Array<{ type: string; confidence: number }> }>;
  archetypesA?: Array<{ archetype: string; score: number }>;
  archetypesB?: Array<{ archetype: string; score: number }>;
  confidenceScore?: number;
  evidenceList?: string[];
  supportingSignals?: string[];
  relationshipDimensions?: string[];
}

export type MessageCategory =
  | "conversation"
  | "emotional"
  | "logistical"
  | "assignment"
  | "code"
  | "ai_generated"
  | "forwarded"
  | "resource"
  | "media"
  | "system"
  | "meme_or_humor";

export type RelationshipType =
  | "Romantic"
  | "Friendship"
  | "Family"
  | "Classmate"
  | "Professional"
  | "Mentor"
  | "Cofounder";

export interface RelationshipTimelineYear {
  year: number;
  blended: Array<{ type: string; confidence: number }>;
}

// AI Generated Patterns
const AI_PATTERNS = [
  /^Certainly!/i,
  /^Here are/i,
  /^Below are/i,
  /^Sure!/i,
  /^Of course!/i,
  /^Characters:/i,
  /^Question:/i,
  /^Answer:/i,
  /^Expanded conversation/i,
  /as an ai/i,
  /ai assistant/i,
  /llama/i,
  /chatgpt/i
];

// Educational Patterns
const EDUCATIONAL_PATTERNS = [
  "assignment",
  "lab",
  "experiment",
  "mcq",
  "question",
  "answer",
  "roleplay",
  "syllabus",
  "module",
  "topic",
  "practical",
  "viva",
  "notes",
  "pdf",
  "exam",
  "test",
  "study",
  "submission",
  "deadline",
  "quiz"
];

// Code Syntax Keywords
const CODE_PATTERNS = [
  "import ",
  "def ",
  "class ",
  "function ",
  "return ",
  "print(",
  "console.log",
  "if(",
  "for(",
  "while(",
  "const ",
  "let ",
  "var "
];

const EMOTIONAL_WORDS = [
  "love", "appreciate", "grateful", "miss", "meant", "honest",
  "care", "proud", "always", "never", "remember", "thank", "feel",
  "heart", "glad", "happy", "incredible", "amazing", "wonderful",
  "means a lot", "genuinely", "truly", "honestly", "really"
];

export function detectSemanticIntents(text: string): string[] {
  const intents: string[] = [];
  const lower = text.toLowerCase();

  // 1. CARE_AND_PROTECTION: wellbeing concern, safe travel, sleep, food, water, medicine, warnings
  const careRegex = [
    // Safe travel & arrival checking
    /\b(reach|get|arrive)d?\s+(safe|home|there)\b/i,
    /\b(text|msg|message|call|ping)\s+(me\s+)?(when|after|once)\s+you\s+(reach|get|arrive|home)\b/i,
    /\b(safe\s+ah\s+po|safe\s+reach|safe\s+ga\s+vellu|safe\s+ga\s+cheru)\b/i,
    /\b(ghar\s+(pahunch|pahanch|pounch|pauch|pouch)(|e|o|kar|kr|k))\b/i,
    /\b(call|msg|message|text)\s+(karna|krna|karo|kr|chey|sei)\b/i,
    /\b(vellaka\s+(msg|text|call|ping))\b/i,
    // Food & nourishment
    /\b(did\s+you|have\s+you)\s+(eat|had\s+food|ate|breakfast|lunch|dinner)\b/i,
    /\b(khana\s+(khaya|kha|liya|lya))\b/i,
    /\b(saptiya|saptela|sapteeya|saptiyaa|tinnav|tinnava|tinna)\b/i,
    /\b(annam\s+(tinn|thin))\b/i,
    /\b(nalla\s+sapdu|sapdu\s+da)\b/i,
    /\b(don't\s+skip|dont\s+skip)\s+(meals|food|eat)\b/i,
    // Sleep & rest
    /\b(did\s+you|go\s+to)\s+(sleep|bed|rest)\b/i,
    /\b(take\s+rest|rest\s+well|sleep\s+early|sleep\s+well)\b/i,
    /\b(so\s+ja|so\s+jao|paduko|padukora|thongu|thoongu)\b/i,
    // Medicine & health & weather protection
    /\b(medicine|dawa|dava|mandulu|tablets)\b/i,
    /\b(umbrella|rain|balm|iodex|vicks|fever|cough|sick|cold|headache)\b/i,
    /\b(apna\s+khyal|khyal\s+rakhna|dhyaan\s+rakhna|pathuko|jagratta|jagrata)\b/i,
    /\b(take\s+care|takecare)\b/i
  ];

  // 2. SUPPORT_AND_REASSURANCE: encouragement, reducing stress, support promises, confidence
  const supportRegex = [
    /\b(don't|dont|never)\s+worry\b/i,
    /\b(everything|all|things)\s+will\b.*\b(fine|ok|okay|good|settle)\b/i,
    /\b(with\s+you|for\s+you|got\s+your\s+back|behind\s+you|stand\s+by\s+you)\b/i,
    /\b(believe\s+in\s+you|you\s+got\s+this|you\s+can\s+do\s+it|do\s+your\s+best)\b/i,
    /\b(stay\s+strong|keep\s+faith|keep\s+going|dont\s+give\s+up|don't\s+give\s+up)\b/i,
    /\b(chinta\s+(mat|mt|karo|cheyaku))\b/i,
    /\b(tension\s+(mat|mt|lo|karo|cheyaku))\b/i,
    /\b(mai\s+hu\s+na|main\s+hoon\s+na|nenu\s+unna|nenu\s+unnanu|naan\s+irukken|nan\s+irukan)\b/i,
    /\b(sab\s+(theek|thik|thek))\b/i,
    /\b(vishwas\s+rakh|nammakam|bhayapadaku|bhayapada|kavalai\s+padatha|kavalai\s+padathe|nambikai\s+vai)\b/i,
    /\b(relax|take\s+a\s+breath|dont\s+stress|don't\s+stress|no\s+stress)\b/i
  ];

  // 3. SHARED_RESPONSIBILITY: helping with work, solving problems, deadlines, collab
  const responsibilityRegex = [
    /\b(assignment|deadline|notes|lab|experiment|mcq|viva|syllabus|practical|pdf|project|problem|solve|compile|run|debug)\b/i,
    /\b(homework|exam|test|quiz|ppt|slides|submission|schedule|work|build|code|github|repo|push|merge|commit|hackathon|deploy|server|class|professor|college|office|task|job|client|invoice)\b/i,
    /\b(milkar|milkar\s+karenge|solve\s+cheddam|together|help\s+you\s+with|finish\s+this)\b/i
  ];

  // 4. CELEBRATION_AND_PRIDE: achievements, congratulations, pride, encouragement after success
  const celebrationRegex = [
    /\b(congrats|congratulations|proud\s+of\s+you|proud|amazing|wonderful|incredible|great\s+job|killed\s+it|won|winner|victory)\b/i,
    /\b(bohot\s+badhiya|badhai|mubarak|kya\s+baat|shabash|mubarak\s+ho)\b/i,
    /\b(chala\s+bagundi|bhale\s+chesav|bhale|santhosham|arputham|semma|vaazhthukkal|vaalthukkal)\b/i,
    /\b(so\s+happy\s+for\s+you|you\s+deserved\s+it|brilliant|awesome|superb|champion)\b/i
  ];

  // 5. PLAYFULNESS_AND_HUMOR: teasing, memes, inside jokes, humor
  const humorRegex = [
    /\b(lol|haha|hehe|lmao|rofl|teasing|sarcasm|joke|funny|meme|xd|crazy|lmfao|haaha|ahahaha)\b/i,
    /\b(pagal|comedian|masti|comedy|joke\s+check|tease|idiot|mazak|mazaak|kamina)\b/i,
    /\b(allari|pichi|pichoda|lusu|galatta|fun\s+panra)\b/i,
    /[\u{1F600}-\u{1F64F}\u{1F910}-\u{1F96B}\u{1F980}-\u{1F9E0}]/u // Emojis of laughter/smiling/fun
  ];

  if (careRegex.some(r => r.test(text))) intents.push("CARE_AND_PROTECTION");
  if (supportRegex.some(r => r.test(text))) intents.push("SUPPORT_AND_REASSURANCE");
  if (responsibilityRegex.some(r => r.test(text))) intents.push("SHARED_RESPONSIBILITY");
  if (celebrationRegex.some(r => r.test(text))) intents.push("CELEBRATION_AND_PRIDE");
  if (humorRegex.some(r => r.test(text))) intents.push("PLAYFULNESS_AND_HUMOR");

  return intents;
}

export function hasEmotionalVocab(text: string): boolean {
  const lower = text.toLowerCase();
  return EMOTIONAL_WORDS.some((word) => lower.includes(word));
}

export function hasCareSignal(text: string): boolean {
  return detectSemanticIntents(text).includes("CARE_AND_PROTECTION");
}

export function classifyMessage(content: string, isSystem?: boolean, isMedia?: boolean, isDeleted?: boolean): MessageCategory {
  if (isSystem || isDeleted) return "system";
  if (isMedia) return "media";

  const lower = content.toLowerCase();
  const intents = detectSemanticIntents(content);

  // Code Detection
  if (CODE_PATTERNS.some(p => lower.includes(p)) || (content.includes("{") && content.includes("}"))) {
    return "code";
  }

  // AI Generated Detection
  if (AI_PATTERNS.some(p => p.test(content))) {
    return "ai_generated";
  }

  // Link Detection
  if (/https?:\/\/[^\s]+|www\.[^\s]+/.test(lower)) {
    return "resource";
  }

  // Educational Material / Assignments
  if (intents.includes("SHARED_RESPONSIBILITY") || EDUCATIONAL_PATTERNS.some(p => lower.includes(p))) {
    return "assignment";
  }

  // Forwarded Content
  if (lower.includes("forwarded") || lower.startsWith("fwd:") || content.split("\n").length > 15) {
    return "forwarded";
  }

  // Humor / Meme detection
  if (intents.includes("PLAYFULNESS_AND_HUMOR") && content.length < 50) {
    return "meme_or_humor";
  }

  // Emotional content check
  if (intents.includes("SUPPORT_AND_REASSURANCE") || intents.includes("CARE_AND_PROTECTION") || hasEmotionalVocab(content)) {
    return "emotional";
  }

  // Logistical / Coordinator check
  const logisticalKeywords = [
    "meet", "reach", "location", "cab", "uber", "metro", "bus", "time", "date",
    "on my way", "be there", "coming", "almost there", "just left"
  ];
  if (logisticalKeywords.some(w => lower.includes(w)) && content.length < 30) {
    return "logistical";
  }

  return "conversation";
}

export function isQualifyingQuote(m: ParsedMessage, category: MessageCategory, idx: number, activeMsgs: ParsedMessage[]): boolean {
  const text = m.content;
  if (!text) return false;

  const isCode = category === "code" || CODE_PATTERNS.some(p => text.toLowerCase().includes(p));
  const isAssignment = category === "assignment";
  const isAIGenerated = category === "ai_generated" || AI_PATTERNS.some(p => p.test(text));
  const isForwarded = category === "forwarded";
  const containsLink = category === "resource" || /https?:\/\/[^\s]+|www\.[^\s]+/.test(text.toLowerCase());

  if (isCode || isAssignment || isAIGenerated || isForwarded || containsLink) {
    return false;
  }

  const intents = detectSemanticIntents(text);
  const hasCare = intents.includes("CARE_AND_PROTECTION");
  
  if (text.length <= 15) return false;
  
  if (text.length < 35 && !hasCare) {
    const hasEmotion = category === "emotional" || hasEmotionalVocab(text) || intents.includes("SUPPORT_AND_REASSURANCE");
    const hasHumor = category === "meme_or_humor" || intents.includes("PLAYFULNESS_AND_HUMOR");
    
    let hasFollowup = false;
    if (idx > 0) {
      const prev = activeMsgs[idx - 1];
      if (prev.sender !== m.sender) {
        const timeDiff = Math.abs(m.date.getTime() - prev.date.getTime());
        if (timeDiff <= 10 * 60 * 1000) {
          const prevIntents = detectSemanticIntents(prev.content);
          if (prev.content.includes("?") || prevIntents.includes("CARE_AND_PROTECTION") || prevIntents.includes("SUPPORT_AND_REASSURANCE")) {
            hasFollowup = true;
          }
        }
      }
    }

    if (!hasEmotion && !hasHumor && !hasFollowup) {
      return false;
    }
  }

  return true;
}

export function detectBlendedRelationships(messages: ParsedMessage[]): Array<{ type: string; confidence: number }> {
  let classmateScore = 0;
  let romanticScore = 0;
  let familyScore = 0;
  let professionalScore = 0;
  let mentorScore = 0;
  let cofounderScore = 0;
  let friendshipScore = 0;

  if (messages.length === 0) {
    return [{ type: "Friendship", confidence: 1.0 }];
  }

  messages.forEach(m => {
    const lower = m.content.toLowerCase();
    const intents = detectSemanticIntents(m.content);

    // Classmate check: academic stress + syllabus + lab notes
    const isAcademic = /\b(lab|viva|syllabus|practical|notes|pdf|exam|test|professor|lecture|study|classroom|homework|assignment|mcq|quiz|submission|college|campus|semester|grade|gpa)\b/.test(lower);
    if (intents.includes("SHARED_RESPONSIBILITY") && isAcademic) {
      classmateScore += 1.5;
    } else if (isAcademic) {
      classmateScore += 1.0;
    }

    // Romantic check: intimate words, care, affection, reassurance
    const isRomanticWord = /\b(love|miss you|baby|babe|sweetheart|darling|kiss|hugs?|hearts?|love you|dear|sweetie|bae|loveya|luv|muah)\b/.test(lower);
    if (isRomanticWord) {
      romanticScore += 1.5;
    }

    // Family check: mom, dad, sibling, domestic life, home, dinner
    if (/\b(mom|dad|mother|father|brother|sister|family|grandma|grandpa|dinner|home|parents|cousin|uncle|aunt|ghar|mummy|papa|annayya|tammudu|akka|chelli)\b/.test(lower)) {
      familyScore += 1.0;
    }

    // Professional check: meetings, clients, work, schedule, office, manager
    const isProfessional = /\b(meeting|project|client|invoice|task|work|schedule|office|zoom|agenda|manager|scrum|sprint|standup|deliverable|milestone|deadline|corporat|report|resume)\b/.test(lower);
    if (isProfessional) {
      professionalScore += 1.0;
    }

    // Mentor check: advice, guidance, recommend, guide, career help
    if (/\b(advice|guide|guidance|mentor|feedback|advise|career|recommendation|suggestions|help\s+me\s+choose|reference|referral)\b/.test(lower)) {
      mentorScore += 1.2;
    }

    // Cofounder check: startup, building together, late night code
    const isLateNight = m.date.getHours() >= 23 || m.date.getHours() <= 4;
    const cofounderKeywords = ["build", "startup", "launch", "founder", "pitch", "funding", "investor", "product", "demo", "code", "run", "compile", "deployment", "github", "prototype", "saas", "mvp", "repo", "hackathon"];
    const cofounderMatch = cofounderKeywords.some(kw => lower.includes(kw));
    if (cofounderMatch) {
      if (isLateNight) cofounderScore += 2.0;
      else cofounderScore += 1.0;
    }

    // Friendship check: general humor, hangout plans, playfulness
    if (intents.includes("PLAYFULNESS_AND_HUMOR") || /\b(hangout|chill|plans|fun|friend|bro|dude|yaad|macha|machan|yaar|dost|bhai|buddy|party|movie|plans|trip)\b/.test(lower)) {
      friendshipScore += 0.8;
    }
  });

  const total = messages.length;
  const results = [
    { type: "Friendship", confidence: Math.min(0.95, (friendshipScore / total) * 6 + 0.35) },
    { type: "Classmate", confidence: Math.min(0.95, (classmateScore / total) * 8) },
    { type: "Romantic", confidence: Math.min(0.95, (romanticScore / total) * 10) },
    { type: "Family", confidence: Math.min(0.95, (familyScore / total) * 8) },
    { type: "Professional", confidence: Math.min(0.95, (professionalScore / total) * 8) },
    { type: "Mentor", confidence: Math.min(0.95, (mentorScore / total) * 10) },
    { type: "Cofounder", confidence: Math.min(0.95, (cofounderScore / total) * 10) }
  ];

  const blended = results
    .filter(r => r.confidence > 0.15)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  if (blended.length === 0) {
    return [{ type: "Friendship", confidence: 0.85 }];
  }
  return blended;
}

export function detectRelationshipTimeline(messages: ParsedMessage[]): RelationshipTimelineYear[] {
  const messagesByYear: Record<number, ParsedMessage[]> = {};
  messages.forEach(m => {
    const year = m.date.getFullYear();
    if (!messagesByYear[year]) {
      messagesByYear[year] = [];
    }
    messagesByYear[year].push(m);
  });

  const years = Object.keys(messagesByYear).map(Number).sort((a, b) => a - b);
  
  if (years.length === 1) {
    const targetYear = years[0];
    const msgs = messagesByYear[targetYear].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // We split into 3 segments chronologically: Early, Mid, Late
    const segmentSize = Math.ceil(msgs.length / 3);
    const timeline: RelationshipTimelineYear[] = [];
    
    for (let i = 0; i < 3; i++) {
      const startIdx = i * segmentSize;
      const endIdx = Math.min((i + 1) * segmentSize, msgs.length);
      const segmentMsgs = msgs.slice(startIdx, endIdx);
      if (segmentMsgs.length > 0) {
        const encodedYear = targetYear + i * 0.1;
        timeline.push({
          year: parseFloat(encodedYear.toFixed(1)),
          blended: detectBlendedRelationships(segmentMsgs)
        });
      }
    }
    return timeline;
  }

  return years.map(year => {
    const msgs = messagesByYear[year];
    const blended = detectBlendedRelationships(msgs);
    return {
      year,
      blended
    };
  });
}

export function calculateArchetypes(messages: ParsedMessage[], sender: string): Array<{ archetype: string; score: number }> {
  let caregiverCount = 0;
  let reassurerCount = 0;
  let problemSolverCount = 0;
  let motivatorCount = 0;
  let comedianCount = 0;
  let organizerCount = 0;
  let plannerCount = 0;
  let listenerCount = 0;
  let initiatorCount = 0;

  const senderMsgs = messages.filter(m => m.sender === sender);
  const total = senderMsgs.length || 1;

  senderMsgs.forEach((m, idx) => {
    const lower = m.content.toLowerCase();
    const intents = detectSemanticIntents(m.content);

    if (intents.includes("CARE_AND_PROTECTION")) caregiverCount++;
    if (intents.includes("SUPPORT_AND_REASSURANCE")) reassurerCount++;
    if (intents.includes("SHARED_RESPONSIBILITY")) problemSolverCount++;
    if (intents.includes("CELEBRATION_AND_PRIDE")) motivatorCount++;
    if (intents.includes("PLAYFULNESS_AND_HUMOR")) comedianCount++;

    // Organizer check: travel coordination, location, Uber, cabs, meet details
    if (/\b(meet|time|schedule|location|cab|uber|call|reach|venue|bus|train|metro|ticket)\b/.test(lower)) {
      organizerCount++;
    }

    // Planner check: future orientation, suggestions of events, trips, plans
    if (/\b(let's|lets|we\s+should|plan|trip|tomorrow|tonight|weekend|next\s+week|schedule|calendar|decide|organize|vacation|dinner)\b/.test(lower)) {
      plannerCount++;
    }

    // Listener check: active listening, validation, acknowledgment
    if (/\b(yes|yeah|true|agree|okay|i\s+see|right|hmmm|nod|correct|makes\s+sense|exactly|totally|wow|oh|i\s+know|gottit|got\s+it)\b/.test(lower)) {
      listenerCount++;
    }

    // Initiator check: checking if they start conversation after silence
    let isInitiator = false;
    if (idx > 0) {
      const prev = senderMsgs[idx - 1];
      const diff = m.date.getTime() - prev.date.getTime();
      if (diff > 4 * 60 * 60 * 1000) {
        isInitiator = true;
      }
    } else {
      isInitiator = true;
    }
    if (isInitiator) {
      initiatorCount++;
    }
  });

  // Calculate scores between 10 and 95
  const scores = [
    { archetype: "Caregiver", score: Math.min(95, Math.round((caregiverCount / total) * 300 + 15)) },
    { archetype: "Reassurer", score: Math.min(95, Math.round((reassurerCount / total) * 300 + 20)) },
    { archetype: "Problem Solver", score: Math.min(95, Math.round((problemSolverCount / total) * 350 + 10)) },
    { archetype: "Motivator", score: Math.min(95, Math.round((motivatorCount / total) * 350 + 15)) },
    { archetype: "Comedian", score: Math.min(95, Math.round((comedianCount / total) * 250 + 20)) },
    { archetype: "Organizer", score: Math.min(95, Math.round((organizerCount / total) * 300 + 25)) },
    { archetype: "Planner", score: Math.min(95, Math.round((plannerCount / total) * 300 + 20)) },
    { archetype: "Listener", score: Math.min(95, Math.round((listenerCount / total) * 200 + 35)) },
    { archetype: "Initiator", score: Math.min(95, Math.round((initiatorCount / total) * 450 + 30)) }
  ];

  return scores.sort((a, b) => b.score - a.score).slice(0, 5); // Return top 5 archetypes for diversity
}

export function scoreMessage(m: ParsedMessage, idx: number, activeMsgs: ParsedMessage[], momentType: string, category: MessageCategory): number {
  let score = 0;
  const lower = m.content.toLowerCase();
  const intents = detectSemanticIntents(m.content);

  // 1. Reciprocity
  if (idx > 0) {
    const prev = activeMsgs[idx - 1];
    if (prev.sender !== m.sender) {
      const timeDiff = Math.abs(m.date.getTime() - prev.date.getTime());
      if (timeDiff <= 5 * 60 * 1000) {
        score += 15;
      }
    }
  }

  // 2. Follow-up behavior
  if (idx > 0) {
    const prev = activeMsgs[idx - 1];
    if (prev.sender !== m.sender) {
      const prevIntents = detectSemanticIntents(prev.content);
      if (prev.content.includes("?") || prevIntents.includes("CARE_AND_PROTECTION") || prevIntents.includes("SUPPORT_AND_REASSURANCE")) {
        score += 10;
      }
    }
  }

  // 3. Care signals
  if (intents.includes("CARE_AND_PROTECTION")) {
    score += 40;
  }

  // 4. Repeated support
  if (intents.includes("SUPPORT_AND_REASSURANCE")) {
    score += 20;
  }

  // 5. Playfulness and Humor
  if (intents.includes("PLAYFULNESS_AND_HUMOR")) {
    score += 15;
  }

  // 6. Contextual density
  if (category === "emotional" || hasEmotionalVocab(m.content)) {
    score += 10;
  }

  // ENFORCE NO LENGTH BIAS: Score does not scale with message length.

  // Switch based moment weights
  switch (momentType) {
    case "surprise":
      const surpriseKeywords = ["surprise", "unexpected", "visited", "travel", "flight", "came to", "arrived", "showed up", "knocked", "door", "airport"];
      if (surpriseKeywords.some(kw => lower.includes(kw))) {
        score += 50;
      }
      break;

    case "appreciation":
      const appreciationKeywords = ["love you", "glad i met you", "grateful for", "thank you for", "mean a lot", "so special", "appreciate you", "thank god for", "amazing friend", "best person"];
      if (appreciationKeywords.some(kw => lower.includes(kw)) || intents.includes("CELEBRATION_AND_PRIDE")) {
        score += 50;
      }
      break;

    case "struggle":
      const struggleKeywords = ["are you ok", "are you okay", "you seemed", "you seem quiet", "everything alright", "everything ok", "sad", "unwell", "down", "wrong", "crying", "struggling", "anxious", "pain", "stress", "stressed"];
      if (struggleKeywords.some(kw => lower.includes(kw))) {
        score += 50;
      }
      break;

    case "resumption":
      if (idx > 0) {
        const diffMs = m.date.getTime() - activeMsgs[idx - 1].date.getTime();
        if (diffMs > 24 * 60 * 60 * 1000) {
          score += 50;
          const warmResumptions = ["missed you", "how are you", "how have you been", "hope you're doing", "thinking of you", "so good to hear", "hello!", "sorry for the delay"];
          if (warmResumptions.some(w => lower.includes(w))) {
            score += 30;
          }
        }
      }
      break;

    case "sentiment":
      break;
  }

  return score;
}

export function detectCinematicMoments(messages: ParsedMessage[]): CinematicMoment[] {
  const activeMsgs = messages.filter(m => !m.isSystem && !m.isMedia && !m.isDeleted);
  
  const blendedList = detectBlendedRelationships(activeMsgs);
  const relType = blendedList[0]?.type || "Friendship";
  const timelineList = detectRelationshipTimeline(activeMsgs);
  const archetypesA = calculateArchetypes(activeMsgs, activeMsgs[0]?.sender || "Alpha");
  const archetypesB = calculateArchetypes(activeMsgs, activeMsgs[1]?.sender || "Beta");

  if (activeMsgs.length === 0) {
    return createDummyMoments(relType);
  }

  const classifiedMsgs = activeMsgs.map((m, idx) => {
    const category = classifyMessage(m.content, m.isSystem, m.isMedia, m.isDeleted);
    return {
      msg: m,
      category,
      index: idx,
      isQualifying: isQualifyingQuote(m, category, idx, activeMsgs)
    };
  });

  const usedIndices = new Set<number>();

  const selectBestMoment = (momentType: string): { msg: ParsedMessage; index: number; score: number } | null => {
    let bestMsg: ParsedMessage | null = null;
    let bestIdx = -1;
    let maxScore = -1;

    for (let i = 0; i < classifiedMsgs.length; i++) {
      const item = classifiedMsgs[i];
      if (!item.isQualifying) continue;
      if (usedIndices.has(item.index)) continue;

      if (item.category !== "emotional" && item.category !== "conversation" && item.category !== "meme_or_humor") {
        continue;
      }

      const score = scoreMessage(item.msg, item.index, activeMsgs, momentType, item.category);
      if (score > maxScore) {
        maxScore = score;
        bestMsg = item.msg;
        bestIdx = item.index;
      }
    }

    if (bestMsg && bestIdx !== -1) {
      return { msg: bestMsg, index: bestIdx, score: maxScore };
    }
    return null;
  };

  let m1 = selectBestMoment("surprise");
  if (m1) usedIndices.add(m1.index);
  
  let m2 = selectBestMoment("appreciation");
  if (m2) usedIndices.add(m2.index);

  let m3 = selectBestMoment("struggle");
  if (m3) usedIndices.add(m3.index);

  let m4 = selectBestMoment("resumption");
  if (m4) usedIndices.add(m4.index);

  let m5 = selectBestMoment("sentiment");
  if (m5) usedIndices.add(m5.index);

  const fallbackSelect = (momentType: string): { msg: ParsedMessage; index: number; score: number } => {
    for (let i = 0; i < classifiedMsgs.length; i++) {
      const item = classifiedMsgs[i];
      if (usedIndices.has(item.index)) continue;
      if (item.category !== "code" && item.category !== "ai_generated" && item.category !== "system") {
        return { msg: item.msg, index: item.index, score: 35 };
      }
    }
    return {
      msg: activeMsgs[0] || {
        sender: "You",
        content: "Hey! Let's stay in touch.",
        date: new Date(),
        isSystem: false,
        isMedia: false,
        isDeleted: false
      },
      index: 0,
      score: 20
    };
  };

  if (!m1) { m1 = fallbackSelect("surprise"); usedIndices.add(m1.index); }
  if (!m2) { m2 = fallbackSelect("appreciation"); usedIndices.add(m2.index); }
  if (!m3) { m3 = fallbackSelect("struggle"); usedIndices.add(m3.index); }
  if (!m4) { m4 = fallbackSelect("resumption"); usedIndices.add(m4.index); }
  if (!m5) { m5 = fallbackSelect("sentiment"); usedIndices.add(m5.index); }

  const result = [
    { chapter: "I", type: "surprise", date: m1.msg.date, sender: m1.msg.sender, quote: m1.msg.content, title: "The Spark of Connection", index: m1.index, score: m1.score },
    { chapter: "II", type: "appreciation", date: m2.msg.date, sender: m2.msg.sender, quote: m2.msg.content, title: "An Echo of Gratitude", index: m2.index, score: m2.score },
    { chapter: "III", type: "struggle", date: m3.msg.date, sender: m3.msg.sender, quote: m3.msg.content, title: "Noticing the Silence", index: m3.index, score: m3.score },
    { chapter: "IV", type: "resumption", date: m4.msg.date, sender: m4.msg.sender, quote: m4.msg.content, title: "Resuming the Thread", index: m4.index, score: m4.score },
    { chapter: "V", type: "sentiment", date: m5.msg.date, sender: m5.msg.sender, quote: m5.msg.content, title: "The Heart of the Archive", index: m5.index, score: m5.score }
  ];

  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const romanNumerals = ["I", "II", "III", "IV", "V"];

  // Unique 5 narrative styles selected from 8 supported styles to prevent template collapse
  const ALL_STYLES = ["documentary", "observational", "poetic", "minimalist", "nostalgic", "conversational", "cinematic", "reflective"];
  const seed = activeMsgs.length;
  const STORYTELLING_STYLES: string[] = [];
  for (let i = 0; i < 5; i++) {
    STORYTELLING_STYLES.push(ALL_STYLES[(seed + i) % ALL_STYLES.length]);
  }

  const getContextForIndex = (idx: number): string => {
    return activeMsgs
      .slice(Math.max(0, idx - 2), idx + 3)
      .map(m => `${m.sender}: ${m.content}`)
      .join(' | ');
  };

  const formattedResult = result.map((moment, idx) => {
    const formattedDate = new Date(moment.date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const mIntents = detectSemanticIntents(moment.quote);
    const mCategory = classifyMessage(moment.quote);
    
    // Confidence calculation (Base 50%)
    let baseConfidence = 50;
    const evidence: string[] = [];

    if (mIntents.includes("CARE_AND_PROTECTION")) {
      baseConfidence += 15;
      evidence.push("Care Signal");
    }
    if (mIntents.includes("SUPPORT_AND_REASSURANCE")) {
      baseConfidence += 10;
      evidence.push("Reassurance");
    }
    if (mCategory === "emotional" || hasEmotionalVocab(moment.quote)) {
      baseConfidence += 10;
      evidence.push("Emotional Vocab");
    }
    // Check reciprocity context
    if (moment.index !== undefined && moment.index > 0) {
      const prev = activeMsgs[moment.index - 1];
      if (prev && prev.sender !== moment.sender) {
        const diff = Math.abs(moment.date.getTime() - prev.date.getTime());
        if (diff <= 5 * 60 * 1000) {
          baseConfidence += 13;
          evidence.push("Reciprocal Response");
        }
      }
    }
    if (evidence.length === 0) {
      evidence.push("Contextual Alignment");
    }

    const confScore = Math.min(98, baseConfidence + Math.min(15, (moment.score || 0) / 4));

    return {
      chapter: romanNumerals[idx],
      type: moment.type,
      date: formattedDate,
      sender: moment.sender,
      quote: moment.quote,
      title: moment.title,
      context: moment.index !== undefined ? getContextForIndex(moment.index) : "",
      relationshipType: relType,
      storytellingStyle: STORYTELLING_STYLES[idx],
      blendedRelationships: blendedList,
      relationshipTimeline: timelineList,
      archetypesA,
      archetypesB,
      confidenceScore: Math.round(confScore),
      evidenceList: evidence,
      supportingSignals: mIntents,
      relationshipDimensions: blendedList.map(r => r.type)
    };
  });

  return formattedResult;
}

function createDummyMoments(relationshipType: string = "Friendship"): CinematicMoment[] {
  const now = new Date();
  const rawDummy = [
    {
      chapter: "I",
      type: "surprise",
      date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      sender: "You",
      quote: "Hey! Just wanted to see how you were doing.",
      title: "The First Contact",
    },
    {
      chapter: "II",
      type: "appreciation",
      date: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      sender: "Them",
      quote: "Honestly, you're one of the best people I've met.",
      title: "An Echo of Gratitude",
    },
    {
      chapter: "III",
      type: "struggle",
      date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      sender: "You",
      quote: "You seemed a bit quiet today. Is everything ok?",
      title: "Noticing the Silence",
    },
    {
      chapter: "IV",
      type: "resumption",
      date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      sender: "Them",
      quote: "Sorry for the radio silence! Just got back, let's catch up.",
      title: "Resuming the Thread",
    },
    {
      chapter: "V",
      type: "sentiment",
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      sender: "You",
      quote: "I'm so incredibly happy we did this. It was perfect.",
      title: "The Heart of the Archive",
    },
  ];

  const STORYTELLING_STYLES = ["documentary", "observational", "poetic", "minimalist", "nostalgic"];
  const blendedList = [{ type: relationshipType, confidence: 0.85 }];
  const timelineList = [{ year: now.getFullYear(), blended: blendedList }];
  const archetypesA = [{ archetype: "Listener", score: 85 }, { archetype: "Caregiver", score: 70 }];
  const archetypesB = [{ archetype: "Organizer", score: 80 }, { archetype: "Reassurer", score: 75 }];

  return rawDummy.map((moment, idx) => ({
    ...moment,
    date: new Date(moment.date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    context: "",
    relationshipType,
    storytellingStyle: STORYTELLING_STYLES[idx],
    blendedRelationships: blendedList,
    relationshipTimeline: timelineList,
    archetypesA,
    archetypesB,
    confidenceScore: 88,
    evidenceList: ["Contextual Alignment", "Reciprocal Response"],
    supportingSignals: ["CARE_AND_PROTECTION"],
    relationshipDimensions: [relationshipType]
  }));
}

export function generateRelationshipAwareSoundtrack(
  blendedRelationships: Array<{ type: string; confidence: number }>,
  stats: ChatStats,
  moments: CinematicMoment[]
): Array<{ title: string; artist: string; reason: string; spotifySearchUrl: string }> {
  const primaryRel = blendedRelationships[0]?.type || "Friendship";

  let playlist: Array<{ title: string; artist: string; reason: string; spotifySearchUrl: string }> = [];

  const esc = (s: string) => encodeURIComponent(s);

  if (primaryRel === "Romantic") {
    playlist = [
      {
        title: "Mystery of Love",
        artist: "Sufjan Stevens",
        reason: `Matches the intimacy and slow-burning romance of your relationship. A gentle backdrop to your early connection.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Mystery of Love Sufjan Stevens")}`
      },
      {
        title: "Skinny Love",
        artist: "Bon Iver",
        reason: `Reflects the vulnerability and emotional closeness shown in your texts, especially around ${moments[2]?.date || 'moments of struggle'}.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Skinny Love Bon Iver")}`
      },
      {
        title: "First Day of My Life",
        artist: "Bright Eyes",
        reason: `An acoustic track mirroring the moments where one of you reached out with sincere affection, saying "${moments[1]?.quote?.slice(0, 30) || ''}..."`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("First Day of My Life Bright Eyes")}`
      },
      {
        title: "Turning Page",
        artist: "Sleeping At Last",
        reason: `Captures the growth of your bond and the commitment shared in private late-night messages.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Turning Page Sleeping At Last")}`
      },
      {
        title: "Conversations in the Dark",
        artist: "John Legend",
        reason: `Reflects the protective care and reassurance that defined your most supportive exchanges.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Conversations in the Dark John Legend")}`
      }
    ];
  } else if (primaryRel === "Classmate") {
    playlist = [
      {
        title: "Campus",
        artist: "Vampire Weekend",
        reason: `Reflects campus nostalgia, walking between lecture halls, and your shared student life.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Campus Vampire Weekend")}`
      },
      {
        title: "Time to Pretend",
        artist: "MGMT",
        reason: `Matches the youthful energy and academic pressure of shared deadlines and lab sessions.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Time to Pretend MGMT")}`
      },
      {
        title: "Good Riddance (Time of Your Life)",
        artist: "Green Day",
        reason: `Captures the graduation vibe and the nostalgia of classmate support during exam season.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Good Riddance Green Day")}`
      },
      {
        title: "We Are Young",
        artist: "fun.",
        reason: `An anthem for late-night study sessions and mutual assistance, especially when sharing notes.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("We Are Young fun.")}`
      },
      {
        title: "Graduate",
        artist: "Third Eye Blind",
        reason: `Evokes the drive to finish the semester together, marking the end of your academic chapter.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Graduate Third Eye Blind")}`
      }
    ];
  } else if (primaryRel === "Cofounder") {
    playlist = [
      {
        title: "Harder, Better, Faster, Stronger",
        artist: "Daft Punk",
        reason: `Matches the relentless building, coding sprints, and late-night hustle of cofounders.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Harder Better Faster Stronger Daft Punk")}`
      },
      {
        title: "Under Pressure",
        artist: "Queen & David Bowie",
        reason: `Emphasizes the intense pressure and uncertainty of building a startup and shipping updates together.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Under Pressure Queen David Bowie")}`
      },
      {
        title: "Start Me Up",
        artist: "The Rolling Stones",
        reason: `High-energy drive for product launches, demos, and pitch preparations.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Start Me Up The Rolling Stones")}`
      },
      {
        title: "Midnight City",
        artist: "M83",
        reason: `Synonymous with late-night coding sessions and building future technology side-by-side.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Midnight City M83")}`
      },
      {
        title: "Viva La Vida",
        artist: "Coldplay",
        reason: `Reflects the grand ambition and vision shared between startup founders.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Viva La Vida Coldplay")}`
      }
    ];
  } else if (primaryRel === "Family") {
    playlist = [
      {
        title: "Home",
        artist: "Edward Sharpe & The Magnetic Zeros",
        reason: `Reflects the warm, traditional comfort of family check-ins and shared memories.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Home Edward Sharpe")}`
      },
      {
        title: "Landslide",
        artist: "Fleetwood Mac",
        reason: `Emphasizes generational ties, the passage of time, and the enduring care of family relationships.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Landslide Fleetwood Mac")}`
      },
      {
        title: "Father and Son",
        artist: "Cat Stevens",
        reason: `Mirroring the advisory wisdom, protective concern, and deep-seated family bonds.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Father and Son Cat Stevens")}`
      },
      {
        title: "Lean on Me",
        artist: "Bill Withers",
        reason: `A classic tribute to unconditional support, presence, and availability when a family member calls.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Lean on Me Bill Withers")}`
      },
      {
        title: "Sweet Home Alabama",
        artist: "Lynyrd Skynyrd",
        reason: `Warm comfort and familiar nostalgia of home, family roots, and traditions.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Sweet Home Alabama")}`
      }
    ];
  } else {
    playlist = [
      {
        title: "My Friends",
        artist: "Red Hot Chili Peppers",
        reason: `A relaxed tribute to standing by each other through different life stages and checking in.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("My Friends Red Hot Chili Peppers")}`
      },
      {
        title: "Tongue Tied",
        artist: "Grouplove",
        reason: `Matches the playfulness, inside jokes, and high-energy hangout plans in your chat.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Tongue Tied Grouplove")}`
      },
      {
        title: "Count on Me",
        artist: "Bruno Mars",
        reason: `A comforting reminder of reliability and support whenever one of you reached out.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Count on Me Bruno Mars")}`
      },
      {
        title: "Sleepyhead",
        artist: "Passion Pit",
        reason: `Fits the whimsical, comedic exchanges, memes, and late-night humor that you shared.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("Sleepyhead Passion Pit")}`
      },
      {
        title: "A Million Ways",
        artist: "OK Go",
        reason: `Reflects the lighthearted teasing, sarcasms, and creative playfulness of your bond.`,
        spotifySearchUrl: `https://open.spotify.com/search/${esc("A Million Ways OK Go")}`
      }
    ];
  }

  return playlist;
}
