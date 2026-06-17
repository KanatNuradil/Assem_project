import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { messages, userMessage } = await request.json();

    if (!userMessage) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Build conversation history for context (exclude duplicates of the current userMessage)
    const historyMessages = (messages || []).filter((m) => m.sender !== "system");
    if (historyMessages.length > 0 && historyMessages[historyMessages.length - 1].text === userMessage) {
      historyMessages.pop();
    }

    const history = historyMessages
      .slice(-8) // last 8 messages for context
      .map((m) => `${m.sender === "ai" ? "Coach Vibe" : "Student"}: ${m.text}`)
      .join("\n");

    const prompt = `You are "Coach Vibe", an expert, friendly English speaking partner and language coach on LingoVibe.
Your goal is to conduct a natural, engaging conversation with the student, while analyzing their message to provide speaking coaching feedback.

Guidelines:
1. Speak like a real, supportive, and natural English partner.
2. In your "reply" field, respond directly and fully to what the student said or asked. If they ask a question, answer it clearly and correctly!
3. Keep your response conversational, warm, and relatively brief (2-4 sentences max).
4. End your message with an open-ended question that prompts them to continue speaking.

Previous conversation history:
${history || "(This is the start of the conversation)"}

Student's latest message to analyze: "${userMessage}"

Provide your response in this EXACT JSON format (pure JSON, no markdown codeblocks):
{
  "reply": "Your natural conversational response to the student.",
  "greenline": "A short, encouraging 1-sentence feedback about the student's message (max 15 words) highlighting their correctness or a key improvement.",
  "corrections": [
    {
      "wrong": "the exact phrase the student wrote with a mistake",
      "correct": "the corrected version",
      "explanation": "Brief explanation of the grammar rule or why it was wrong."
    }
  ],
  "upgrade": "A more advanced, natural, or native-sounding way to rephrase the student's message.",
  "vocabBoost": "1-2 useful advanced words or idioms related to the topic with brief definitions.",
  "scores": {
    "fluency": "Provide a rating score out of 5 followed by a short comment, formatted EXACTLY like: '4/5 - Good pace and flow' or '3/5 - Fragmented structure'",
    "vocabulary": "Provide a rating score out of 5 followed by a short comment, formatted EXACTLY like: '5/5 - Excellent word choice' or '3/5 - Try using synonyms'",
    "grammar": "Provide a rating score out of 5 followed by a short comment, formatted EXACTLY like: '5/5 - Perfect grammar' or '4/5 - Minor spelling issue'"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const parsed = JSON.parse(response.text.trim());
    const reply = parsed.reply || "Hello! Let's continue practicing English.";
    const corrections = parsed.corrections || [];
    const upgrade = parsed.upgrade || "";
    const vocabBoost = parsed.vocabBoost || parsed.vocab_boost || "";
    const scores = parsed.scores || null;
    const greenline = parsed.greenline || "";

    return NextResponse.json({ reply, corrections, upgrade, vocabBoost, scores, greenline });
  } catch (err) {
    console.error("[AI Chat] Error:", err);
    return NextResponse.json(
      { error: "AI response failed", message: err.message },
      { status: 500 }
    );
  }
}
