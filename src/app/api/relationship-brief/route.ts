import { NextResponse } from "next/server";
import Groq from "groq-sdk";

interface MessageInput {
  sender: string;
  content: string;
  date?: string | Date;
}

function sampleRepresentativeMessages(messages: MessageInput[], targetCount = 80): string {
  if (!messages || messages.length === 0) return "";
  
  // Filter out empty messages
  const validMessages = messages.filter(m => m && m.sender && m.content && m.content.trim().length > 0);
  
  if (validMessages.length <= targetCount) {
    return validMessages.map(m => `${m.sender}: ${m.content.trim()}`).join("\n");
  }

  const sampled: string[] = [];
  const step = validMessages.length / targetCount;

  for (let i = 0; i < targetCount; i++) {
    const idx = Math.min(Math.floor(i * step), validMessages.length - 1);
    const msg = validMessages[idx];
    sampled.push(`${msg.sender}: ${msg.content.trim()}`);
  }

  return sampled.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: MessageInput[]; conversationSample?: string };
    
    let conversationSample = body.conversationSample || "";
    if (!conversationSample && body.messages && Array.isArray(body.messages)) {
      conversationSample = sampleRepresentativeMessages(body.messages, 80);
    }

    if (!conversationSample || conversationSample.trim().length === 0) {
      return NextResponse.json(
        { relationshipBrief: "A dynamic interpersonal connection built on regular conversation, shared moments, and evolving mutual support." },
        { status: 200 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        relationshipBrief: "A close interpersonal relationship characterized by consistent communication, mutual check-ins, and shared personal context.",
        fallback: true
      });
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: "You are a relationship analyst. Read conversations and write precise, specific relationship profiles. Never use generic phrases. Be specific to what you actually read."
        },
        {
          role: "user",
          content: `Read this conversation and write a 150-word relationship profile covering: what kind of relationship this is, the emotional tone, who carries more emotional weight, how the dynamic evolved, and one specific detail that defines this connection.

${conversationSample}

Write in plain prose. No bullet points. No headers. Just a paragraph that would help a writer understand exactly who these two people are to each other.`
        }
      ]
    });

    const brief = completion.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({
      relationshipBrief: brief || "A nuanced relationship shaped by consistent interaction, mutual care, and distinct communication patterns.",
      fallback: false
    });
  } catch (error: any) {
    console.error("Relationship Brief API error:", error);
    return NextResponse.json({
      relationshipBrief: "An authentic interpersonal connection marked by shared conversations and evolving emotional dynamics.",
      fallback: true,
      error: error.message
    });
  }
}
