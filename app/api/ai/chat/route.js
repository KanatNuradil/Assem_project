import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { messages, userMessage } = await request.json();

    if (!userMessage) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Build conversation history for context
    const history = (messages || [])
      .filter((m) => m.sender !== "system")
      .slice(-10) // last 10 messages for context
      .map((m) => `${m.sender === "ai" ? "Coach Vibe" : "Student"}: ${m.text}`)
      .join("\n");

    const prompt = `You are "Coach Vibe", a warm, encouraging, and professional English language speaking coach in an online platform called LingoVibe.

Your role:
- Have natural English conversations to help students practice speaking
- Gently correct grammar mistakes (mention the correction in parentheses, e.g., "(Correction: 'I went' not 'I goed')")
- Ask follow-up questions to keep the conversation flowing
- Keep responses SHORT (2-4 sentences max) — this is a real-time chat
- Be encouraging and positive
- Occasionally introduce new vocabulary related to the topic

Previous conversation:
${history || "(This is the start of the conversation)"}

Student just said: "${userMessage}"

Respond naturally as Coach Vibe. Include corrections only if needed. Keep it conversational and brief.

Also provide corrections in JSON format at the END of your reply like this (only if there are errors, otherwise omit):
[CORRECTIONS: {"errors": [{"wrong": "...", "correct": "...", "explanation": "..."}]}]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 300,
      },
    });

    const fullText = response.text;

    // Parse out corrections if present
    let replyText = fullText;
    let corrections = [];

    const correctionMatch = fullText.match(/\[CORRECTIONS:\s*(\{.*?\})\]/s);
    if (correctionMatch) {
      try {
        const parsed = JSON.parse(correctionMatch[1]);
        corrections = parsed.errors || [];
        replyText = fullText.replace(/\[CORRECTIONS:.*?\]/s, "").trim();
      } catch {
        // ignore parse errors
      }
    }

    return NextResponse.json({ reply: replyText, corrections });
  } catch (err) {
    console.error("[AI Chat] Error:", err);
    return NextResponse.json(
      { error: "AI response failed", message: err.message },
      { status: 500 }
    );
  }
}
