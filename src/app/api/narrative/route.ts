import { NextResponse } from "next/server";
import Groq from "groq-sdk";

interface MomentInput {
  chapter: string;
  type: string;
  date: string;
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
}

// Deterministic local fallback generator with dynamic templates to prevent style collapse
function generateFallbackNarrative(moments: MomentInput[]): string[] {
  return moments.map((moment, idx) => {
    const rels = moment.blendedRelationships || [{ type: moment.relationshipType || "Friendship", confidence: 0.85 }];
    const primaryRel = rels[0]?.type || "Friendship";
    const style = moment.storytellingStyle || "documentary";

    const dateObj = new Date(moment.date);
    const dateFormatted = isNaN(dateObj.getTime())
      ? moment.date
      : dateObj.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

    // Helper to select template deterministically based on index to prevent collapse
    const selectTemplate = (templates: string[]) => {
      const index = (moment.index !== undefined ? moment.index + idx : idx);
      return templates[index % templates.length];
    };

    if (primaryRel === "Classmate") {
      switch (style) {
        case "minimalist":
        case "minimal":
          return selectTemplate([
            `Exam prep on ${dateFormatted}. ${moment.sender} asked for notes. They shared syllabus details. A quiet alliance formed under pressure.`,
            `Deadlines approaching on ${dateFormatted}. ${moment.sender} checked in about the lab. They compiled notes together. Simple, reliable support.`
          ]);
        case "poetic":
          return selectTemplate([
            `Library lights hummed on ${dateFormatted} as a quiet text arrived from ${moment.sender}. Amidst the weight of shared deadlines, their messages formed a quiet lifeline. They carried each other through the academic grind. Sometimes, silent support is the most beautiful connection.`,
            `A screen glowing in the midnight shadows of the campus on ${dateFormatted}. ${moment.sender} sent a text, a gentle breeze of encouragement before the exams. They walked the stressful path side-by-side, sharing notes. In that quiet space, a lasting friendship took root.`
          ]);
        case "nostalgic":
          return selectTemplate([
            `Looking back, ${dateFormatted} stands out as a classic memory of the campus. ${moment.sender} reached out to share lecture materials during exam prep. The stress of that semester has faded now. What remains is the memory of how they stood by each other.`,
            `That night on ${dateFormatted} was filled with coffee and coding deadlines. ${moment.sender} texted to check if they had eaten. We remember the panic of the finals, but we also remember the laughter and notes sharing.`
          ]);
        case "observational":
          return selectTemplate([
            `At 11:30 PM on ${dateFormatted}, a text arrived from ${moment.sender} asking for notes. The message was quick, typed in a hurry between study sessions. They spent the next hours comparing experiments and lab files. A subtle sense of teamwork emerged in the silence.`,
            `A PDF link was shared on ${dateFormatted} as ${moment.sender} checked in. The simple exchange was accompanied by a quick explanation. They spent the evening debugging code and writing practical results. A quiet understanding of shared duty took shape.`
          ]);
        case "conversational":
          return selectTemplate([
            `Remember that chat on ${dateFormatted} when ${moment.sender} asked if you needed help with the practical viva? It was right in the middle of a crazy exam week. That quick check-in turned a stressful night into a shared win.`,
            `On ${dateFormatted}, ${moment.sender} sent a message about the assignment deadline. It was totally unexpected but came at the perfect time. They ended up staying up late to finish the notes together.`
          ]);
        case "cinematic":
          return selectTemplate([
            `Under the dim fluorescent lights of the study hall on ${dateFormatted}, ${moment.sender}'s message flashed on the screen. The text was a simple inquiry about notes, but the stakes felt high with finals tomorrow. They worked in tandem, side-by-side, building their academic lifeline. By dawn, their partnership had transformed from classmates to comrades.`,
            `The campus clock tower chimed midnight on ${dateFormatted} as ${moment.sender} hit send. A simple question about the lab syllabus hung in the digital air. The tension of the upcoming viva dissolved as they solved the final problem together. It was a classic scene of triumph over academic stress.`
          ]);
        case "reflective":
          return selectTemplate([
            `Analyzing the exchange on ${dateFormatted}, the note shared by ${moment.sender} carries a deeper significance. While ostensibly about practical syllabus details, it reveals a protective care for the other's peace of mind. They found a reliable rhythm of mutual support during high-pressure finals. The moment marks a shift from coordination to deep trust.`,
            `The chat record of ${dateFormatted} highlights a subtle dynamic of initiative. ${moment.sender} took the first step, offering notes before being asked. It demonstrates that academic collaboration is often the canvas for genuine care. Their connection deepened through shared responsibility.`
          ]);
        case "documentary":
        default:
          return selectTemplate([
            `On ${dateFormatted}, ${moment.sender} shared a request regarding the syllabus. The notes and deadline discussions that followed trace an academic partnership. Their shared goal of navigating the exam season defined their interaction. This exchange marked a quiet pact of mutual support.`,
            `The records from ${dateFormatted} highlight a key discussion about lab prep. ${moment.sender} reached out with practical queries during a high-pressure week. They focused on solving assignments together to ease the workload. The dialogue solidified a collaborative routine.`
          ]);
      }
    } else if (primaryRel === "Romantic") {
      switch (style) {
        case "minimalist":
        case "minimal":
          return selectTemplate([
            `On ${dateFormatted}, a quiet text arrived. ${moment.sender} shared a moment of soft affection. The air changed between them. A connection solidified.`,
            `A warm message from ${moment.sender} on ${dateFormatted}. The words were simple. A shared vulnerability took root.`
          ]);
        case "poetic":
          return selectTemplate([
            `Soft light falling on ${dateFormatted} as a message arrived from ${moment.sender}. The words carried the gentle weight of longing. It was a quiet disclosure of feelings. Their hearts grew closer in the silence.`,
            `Under the quiet evening skies of ${dateFormatted}, ${moment.sender} reached out. A text glowing with gentle care. It was like an unexpected gift of presence, warming their shared space.`
          ]);
        case "nostalgic":
          return selectTemplate([
            `That evening on ${dateFormatted} remains a warm memory. ${moment.sender} reached out with genuine affection. It was a beautiful step in their journey together, looking back.`,
            `Looking back, the text from ${moment.sender} on ${dateFormatted} was a turning point. We see the beginnings of a deep understanding. It was a moment of absolute sincerity.`
          ]);
        case "observational":
          return selectTemplate([
            `A message sent on ${dateFormatted} from ${moment.sender}. The simple quote speaks of feelings they were starting to name. A quick reply, followed by a long, warm conversation.`,
            `On ${dateFormatted}, a text notification lit up the dark room. ${moment.sender} typed out a soft reminder to take care. The typing indicator danced briefly, carrying the weight of unsaid feelings.`
          ]);
        case "conversational":
          return selectTemplate([
            `Remember when ${moment.sender} sent that lovely text on ${dateFormatted}? It was such a sweet surprise. It really set the tone for what they would mean to each other.`,
            `On ${dateFormatted}, ${moment.sender} checked in with that warm message out of nowhere. It wasn't about any plans or logistics. Just a simple check-in that made a normal day feel special.`
          ]);
        case "cinematic":
          return selectTemplate([
            `Rain drummed against the windowpane on ${dateFormatted} when the screen glowed with ${moment.sender}'s message. A declaration of quiet affection hung in the silent night. Every word carried a cinematic weight, shifting the space between them. It was a scene of mutual vulnerability that neither would forget.`,
            `The world outside slowed to a halt on ${dateFormatted} as ${moment.sender} hit send. The text was a soft, honest disclosure of feelings. The screen remained active for hours as they shared stories. A new chapter in their romance had begun.`
          ]);
        case "reflective":
          return selectTemplate([
            `The message from ${moment.sender} on ${dateFormatted} invites a deeper analysis of emotional reciprocity. By expressing genuine vulnerability, the sender invited a level of trust that had been building. It reveals a capacity for deep companionship. After this moment, their communication rhythm shifted to a more intimate tempo.`,
            `On ${dateFormatted}, ${moment.sender} initiated a warm check-in that highlights their mutual care. The timing shows an awareness of the other's emotional state. They navigated the unspoken feelings with gentleness. The exchange solidified their romantic foundation.`
          ]);
        case "documentary":
        default:
          return selectTemplate([
            `On ${dateFormatted}, ${moment.sender} reached out with a message of genuine emotional closeness. The quote reveals a deep vulnerability that had been building. It marked a turning point in their romantic relationship.`,
            `The archive records a significant exchange on ${dateFormatted}. ${moment.sender} shared a text expressing protective care. In the timeline of their connection, it represents a step toward intimacy.`
          ]);
      }
    } else {
      // Friendship / Family / Cofounder / Other
      switch (style) {
        case "minimalist":
        case "minimal":
          return selectTemplate([
            `On ${dateFormatted}, ${moment.sender} sent a brief message. A care check-in. It was simple. The bond between them held its shape.`,
            `A quick text on ${dateFormatted} from ${moment.sender}. Checking in to see how things were. A reliable friendship, quiet and strong.`
          ]);
        case "poetic":
          return selectTemplate([
            `A quiet afternoon on ${dateFormatted} was brightened by ${moment.sender}. The text arrived like an unexpected gift of presence. Saying the words took quiet courage. A warm comfort settled between friends.`,
            `As twilight gathered on ${dateFormatted}, ${moment.sender} reached out. A thread of conversation woven with simple warmth. It was a reminder that distance means little when care is constant.`
          ]);
        case "nostalgic":
          return selectTemplate([
            `Looking back at ${dateFormatted}, that chat captures their friendship. ${moment.sender} checked in with simple warmth. It is a memory of a time when they stood by each other.`,
            `We look back at ${dateFormatted} with a smile. ${moment.sender} sent a funny check-in right when it was needed. It reminds us of the laughter and shared moments that built their trust.`
          ]);
        case "observational":
          return selectTemplate([
            `On ${dateFormatted}, ${moment.sender} reached out before being asked. A quick question about whether they ate or reached home safely. A care signal sent in the quiet hours.`,
            `A text message received on ${dateFormatted} from ${moment.sender}. The phrasing was casual, but the follow-up was immediate. They exchanged inside jokes and shared stories for the next hour.`
          ]);
        case "conversational":
          return selectTemplate([
            `It was on ${dateFormatted} when ${moment.sender} sent that message. Just checking in to see how you were doing. It's those small, simple check-ins that make a friendship last.`,
            `Remember that text on ${dateFormatted} where ${moment.sender} shared a hilarious meme? It broke a long day of work. That quick laugh was exactly what was needed.`
          ]);
        case "cinematic":
          return selectTemplate([
            `Shadows lengthened across the room on ${dateFormatted} when ${moment.sender} checked in. The text was a simple care check, but it carried the dramatic weight of unwavering support. They exchanged thoughts, mapping out their plans. In that frame, their friendship stood as an anchor.`,
            `A notification chime broke the silence of ${dateFormatted} as ${moment.sender} reached out. The conversation sparked instantly, filling the digital ledger with jokes and warmth. It was a classic scene of two lives intersecting in perfect sync.`
          ]);
        case "reflective":
          return selectTemplate([
            `The dialogue on ${dateFormatted} underscores ${moment.sender}'s role as a supportive presence. By checking on the other's wellbeing without prompt, the sender demonstrated proactive care. Their friendship operates on a high level of empathy. The moment reinforced their reliable connection.`,
            `Reflecting on ${dateFormatted}, the message from ${moment.sender} points to a healthy balance of initiative. They shared a moment of humor that eased ongoing stress. It illustrates the role of playfulness in maintaining a strong friendship.`
          ]);
        case "documentary":
        default:
          return selectTemplate([
            `On ${dateFormatted}, ${moment.sender} sent a message of genuine warmth. In the context of their conversation, it was a quiet sign of support. It stands as a clear expression of what they mean to each other.`,
            `The archive documents a warm check-in on ${dateFormatted} by ${moment.sender}. The text highlights an ongoing habit of mutual safety reminders. Their conversation represents a steady, healthy bond.`
          ]);
      }
    }
  });
}

export async function POST(req: Request) {
  try {
    const { moments } = (await req.json()) as { moments: MomentInput[] };

    if (!moments || !Array.isArray(moments) || moments.length !== 5) {
      return NextResponse.json(
        { error: "Invalid moments format. Expected exactly 5 moments." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      const narratives = generateFallbackNarrative(moments);
      return NextResponse.json({ narratives, fallback: true });
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a writer for a premium memory archive. You write cinematic third-person narratives about real conversations between two people. Your tone is warm, restrained, and specific. You write like a thoughtful friend narrating a documentary about people they admire. Never use first person. Never address the reader. Never use the words: tapestry, profound, resonates, boundless, transcend, indelible, testament, reverberate, poignant, palpable, undeniable, luminous, high-water mark. Never write sentence fragments. Every sentence must be grammatically complete and specific to the names and quote provided.
          
          Vary your sentence structures, opening patterns, and emotional framing across chapters to prevent template collapse and style repetition. Make the paragraphs feel alive, unique, and deeply authentic to the relationship profile and archetypes provided.`
        },
        {
          role: "user",
          content: `Write one narrative paragraph for each of the 5 moments below. Each paragraph is exactly 4 complete sentences. Use the actual names and quote naturally in the writing. Write in third person only.

Format rules — every paragraph must follow this exact structure:
Sentence 1: Describe what was happening between these two people at this moment in time, heavily incorporating the blended relationship types, archetypes, and context. For example, if the relationship profile indicates a blend of classmate and cofounder, emphasize college nostalgia, late-night coding, syllabus deadlines, startup ambition, or exam pressure.
Sentence 2: Explain what this specific quote reveals about the sender's archetype (e.g. Caregiver checking safety, Motivator celebrating, Comedian teasing, Listener validating).
Sentence 3: Describe the emotional weight of this exchange on their relationship, adapting it to the specified storytelling style (documentary, observational, poetic, minimalist, nostalgic, conversational, cinematic, or reflective).
Sentence 4: End with what changed or solidified between them after this moment.

STORYTELLING STYLES GUIDE:
- documentary: objective, restrained, tracing the arc of connection.
- observational: focused on small micro-actions, details, and subtle shifts.
- poetic: lyrical, elegant, and atmospheric, while keeping restraint.
- minimalist: sparse, brief, and punchy sentences.
- nostalgic: reflective, looking back with warmth and fondness.
- conversational: casual, warm, close, like a friend retelling a memory.
- cinematic: visual, dramatic framing, scene-setting, widescreen perspective.
- reflective: thoughtful, looking at the deeper significance and meaning.

Do NOT be generic. Be specific to the names, the quote, the relationship profiles, the archetypes, and the storytelling style.

${moments.map((m, i) => {
  const blendedStr = m.blendedRelationships
    ? m.blendedRelationships.map(r => `${r.type} (${Math.round(r.confidence * 100)}% confidence)`).join(", ")
    : m.relationshipType || 'Friendship';
  
  const archetypesStr = `Person A: ${m.archetypesA?.map(a => `${a.archetype} ${a.score}%`).join(", ") || 'N/A'} | Person B: ${m.archetypesB?.map(b => `${b.archetype} ${b.score}%`).join(", ") || 'N/A'}`;

  return `--- Chapter ${i + 1}: ${m.title} (${m.date}) ---
Relationship Profile (Blended): ${blendedStr}
Conversational Archetypes: ${archetypesStr}
Storytelling Style: ${m.storytellingStyle || 'documentary'}
Confidence Score: ${m.confidenceScore || 85}% (Evidence: ${m.evidenceList?.join(', ') || 'Contextual'})
${m.sender} said: "${m.quote}"
Context of the conversation: ${m.context || 'Not available'}`;
}).join('\n\n')}

RESPONSE FORMAT — Return ONLY this, nothing else:
["paragraph one as a single line with no line breaks", "paragraph two as a single line with no line breaks", "paragraph three as a single line with no line breaks", "paragraph four as a single line with no line breaks", "paragraph five as a single line with no line breaks"]

Every string must be on one line. No \\n inside strings. Start with [ and end with ]. No markdown.`
        }
      ],
      temperature: 0.72,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');

    const startIndex = cleaned.indexOf('[');
    const endIndex = cleaned.lastIndexOf(']');

    if (startIndex === -1 || endIndex === -1) {
      throw new Error('No JSON array found in Groq response');
    }

    cleaned = cleaned.slice(startIndex, endIndex + 1);

    cleaned = cleaned.replace(/[\u0000-\u001F\u007F]/g, (char) => {
      switch (char) {
        case '\n': return '\\n';
        case '\r': return '\\r';  
        case '\t': return '\\t';
        default: return '';
      }
    });

    let narratives: string[];
    try {
      narratives = JSON.parse(cleaned) as string[];
      if (!Array.isArray(narratives) || narratives.length !== 5) {
        throw new Error('Invalid array');
      }
    } catch (parseError) {
      console.error('JSON parse failed, using fallback narratives:', parseError);
      narratives = generateFallbackNarrative(moments);
    }

    return NextResponse.json({ narratives, fallback: false });
  } catch (error: any) {
    console.error("Groq Narrative API error:", error);
    
    try {
      const body = await req.clone().json();
      const narratives = generateFallbackNarrative(body.moments);
      return NextResponse.json({ narratives, fallback: true, error: error.message });
    } catch {
      return NextResponse.json(
        { error: "Internal Server Error in narrative generation." },
        { status: 500 }
      );
    }
  }
}
