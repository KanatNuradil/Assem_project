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

    const chatPrompt = `You are "Coach Vibe", an expert, friendly English speaking partner (Gemini) on LingoVibe.
Your goal is to conduct a natural, engaging conversation with the student.

Guidelines:
1. Talk like a real, supportive, and natural English partner.
2. Respond directly and fully to what the student said or asked. If they ask a question (e.g. about animals or "what is the baby of a cow"), make sure to answer it clearly and correctly!
3. Keep your response conversational, warm, and relatively brief (2-4 sentences max).
4. End your message with an open-ended question that prompts them to continue speaking.
5. Do NOT output any JSON, brackets, or code. Write ONLY the natural conversational reply.

Previous conversation history:
${history || "(This is the start of the conversation)"}

Student: "${userMessage}"`;

    const coachPrompt = `You are an expert English language speaking coach. Analyze the student's message in the context of the conversation.

Student message to analyze: "${userMessage}"

Analyze the student's grammar, vocabulary, spelling, and sentence structure.
Provide your pedagogical feedback in this EXACT JSON format (pure JSON, no markdown codeblocks):
{
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
    "fluency": "Short 3-5 word assessment of the student's message fluency/naturalness (e.g., 'Good flow, very natural' or 'A bit fragmented, try connectors')",
    "vocabulary": "Short 3-5 word assessment of vocabulary use (e.g., 'Clear vocabulary, try synonyms' or 'Excellent animal vocabulary!')",
    "grammar": "Short 3-5 word assessment of grammar accuracy (e.g., 'Minor punctuation missing' or 'Perfect tense usage!')"
  }
}`;

    // Run both calls in parallel to maximize speed and guarantee formatting
    const [chatResponse, coachResponse] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: chatPrompt,
        config: {
          temperature: 0.8,
        },
      }),
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: coachPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    ]);

    const reply = chatResponse.text.trim();
    let corrections = [];
    let upgrade = "";
    let vocabBoost = "";
    let scores = null;
    let greenline = "";

    try {
      const parsed = JSON.parse(coachResponse.text.trim());
      corrections = parsed.corrections || [];
      upgrade = parsed.upgrade || "";
      vocabBoost = parsed.vocabBoost || "";
      scores = parsed.scores || null;
      greenline = parsed.greenline || "";
    } catch (e) {
      console.error("[AI Chat] Coach parse error:", e, coachResponse.text);
    }

    return NextResponse.json({ reply, corrections, upgrade, vocabBoost, scores, greenline });
  } catch (err) {
    console.error("[AI Chat] Error:", err);
    return NextResponse.json(
      { error: "AI response failed", message: err.message },
      { status: 500 }
    );
  }
}
