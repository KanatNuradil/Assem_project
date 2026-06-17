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

    const prompt = `You are "Coach Vibe", an expert English speaking coach on the LingoVibe platform.
Your mission is to help the student improve their speaking skills, expand their vocabulary, build grammatical accuracy, and gain confidence.

Your role & style:
1. Warm, encouraging, and highly pedagogical. Speak like a real, supportive teacher.
2. In your main response (3-4 sentences max):
   - Acknowledge and comment on what the student said.
   - Give a brief, supportive comment about their language use (e.g., "I love how you used..." or "Good try on...").
   - Ask an engaging, open-ended question that prompts them to speak and elaborate.
   - Challenge them with a mini-task for their next message (e.g., "For your next reply, try to use the word '...' or try to use a conditional sentence!").
3. Do NOT make the main response too long; keep it clean and conversational.

Pedagogical analysis (Coaching Data):
- Identify any grammar mistakes, spelling errors, or awkward phrasings. Provide corrections with brief, clear explanations.
- Provide a "Better/Natural Way to Say It" (upgrade/recast) that elevates their message to native-like quality.
- Provide a "Vocabulary Boost" with 1-2 advanced words or idioms related to the topic, complete with definition and a quick example.

Previous conversation history:
${history || "(This is the start of the conversation)"}

Student just said: "${userMessage}"

Respond naturally as Coach Vibe. Include corrections only if needed. Keep it conversational and brief.

Provide your pedagogical feedback in JSON format at the very end of your response, enclosed in [COACHING: ...] tags, like this:
[COACHING: {
  "corrections": [
    {
      "wrong": "the exact phrase the student wrote with a mistake",
      "correct": "the corrected version",
      "explanation": "Brief explanation of the grammar rule or why it was wrong."
    }
  ],
  "upgrade": "A more advanced, natural, or native-sounding way to rephrase their message.",
  "vocabBoost": "1-2 useful advanced words or idioms related to the topic with brief definitions.",
  "scores": {
    "fluency": "Short 3-5 word assessment of student message fluency/naturalness",
    "vocabulary": "Short 3-5 word assessment of student vocabulary use",
    "grammar": "Short 3-5 word assessment of student grammar accuracy"
  }
}]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.85,
        maxOutputTokens: 500,
      },
    });

    const fullText = response.text;

    // Robustly parse out the COACHING JSON block
    let replyText = fullText;
    let corrections = [];
    let upgrade = "";
    let vocabBoost = "";
    let scores = null;

    let jsonStartIndex = fullText.toLowerCase().lastIndexOf("coaching");
    if (jsonStartIndex === -1) {
      jsonStartIndex = fullText.indexOf("{");
    } else {
      jsonStartIndex = fullText.indexOf("{", jsonStartIndex);
    }

    if (jsonStartIndex !== -1) {
      const jsonEndIndex = fullText.lastIndexOf("}");
      if (jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        let jsonStr = fullText.slice(jsonStartIndex, jsonEndIndex + 1).trim();
        
        // Strip markdown code block wraps if present
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.slice(7).trim();
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.slice(3).trim();
        }
        if (jsonStr.endsWith("```")) {
          jsonStr = jsonStr.slice(0, -3).trim();
        }

        try {
          const parsed = JSON.parse(jsonStr);
          corrections = parsed.corrections || [];
          upgrade = parsed.upgrade || "";
          vocabBoost = parsed.vocabBoost || "";
          scores = parsed.scores || null;

          // Strip the coaching block from the main reply
          let truncateIndex = fullText.toLowerCase().lastIndexOf("[coaching");
          if (truncateIndex === -1) {
            truncateIndex = fullText.toLowerCase().lastIndexOf("coaching");
          }
          if (truncateIndex === -1) {
            truncateIndex = jsonStartIndex;
          }
          replyText = fullText.slice(0, truncateIndex).trim();
        } catch (e) {
          console.error("JSON parse failed for string:", jsonStr, e);
          // Regex fallback
          const coachingMatch = fullText.match(/\[COACHING:\s*(\{.*\})\]/is);
          if (coachingMatch) {
            try {
              const parsed = JSON.parse(coachingMatch[1]);
              corrections = parsed.corrections || [];
              upgrade = parsed.upgrade || "";
              vocabBoost = parsed.vocabBoost || "";
              scores = parsed.scores || null;
              replyText = fullText.replace(/\[COACHING:.*?\]/is, "").trim();
            } catch (err) {
              console.error("Regex fallback parsing failed:", err);
            }
          }
        }
      }
    }

    return NextResponse.json({ reply: replyText, corrections, upgrade, vocabBoost, scores });
  } catch (err) {
    console.error("[AI Chat] Error:", err);
    return NextResponse.json(
      { error: "AI response failed", message: err.message },
      { status: 500 }
    );
  }
}
