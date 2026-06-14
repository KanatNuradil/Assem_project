import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { answers } = await request.json();

    if (!answers || answers.length === 0) {
      return NextResponse.json({ error: "No answers provided" }, { status: 400 });
    }

    // Build a detailed prompt
    const answersText = answers
      .map(
        (a, i) =>
          `Q${i + 1} [${a.topic}]: "${a.question}" | Correct: "${a.correct}" | Student answered: "${a.student}" | ${a.student === a.correct ? "✅ CORRECT" : "❌ WRONG"}`
      )
      .join("\n");

    const score = answers.filter((a) => a.student === a.correct).length;

    const prompt = `You are an expert English language assessment specialist. Analyze the following student's answers to a 20-question English proficiency test and provide a detailed, personalized evaluation.

STUDENT'S TEST RESULTS (${score}/20 correct):
${answersText}

Provide your assessment in the following EXACT JSON format (no markdown, pure JSON):
{
  "cefrLevel": "A1|A2|B1|B2|C1|C2",
  "levelLabel": "e.g. Intermediate",
  "levelDescription": "One sentence describing what this level means",
  "score": ${score},
  "percentage": ${Math.round((score / 20) * 100)},
  "grammarBreakdown": {
    "Present Simple": { "correct": 0, "total": 0 },
    "Past Tense": { "correct": 0, "total": 0 },
    "Present Perfect": { "correct": 0, "total": 0 },
    "Conditionals": { "correct": 0, "total": 0 },
    "Modal Verbs": { "correct": 0, "total": 0 },
    "Advanced Structures": { "correct": 0, "total": 0 }
  },
  "strengths": [
    "Specific strength 1 based on their answers",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "improvements": [
    "Specific area to improve 1 with actionable advice",
    "Specific area to improve 2 with actionable advice",
    "Specific area to improve 3 with actionable advice"
  ],
  "studyPlan": [
    { "week": "Week 1-2", "focus": "Grammar topic", "activity": "Specific activity to practice" },
    { "week": "Week 3-4", "focus": "Grammar topic", "activity": "Specific activity to practice" },
    { "week": "Week 5-6", "focus": "Grammar topic", "activity": "Specific activity to practice" },
    { "week": "Week 7-8", "focus": "Grammar topic", "activity": "Specific activity to practice" }
  ],
  "encouragement": "A warm, personalized motivational message for the student (2-3 sentences)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const text = response.text;
    const result = JSON.parse(text);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[AI Level Test] Error:", err);
    // Return a safe fallback so the UI still works
    return NextResponse.json(
      {
        error: "AI analysis failed",
        message: err.message,
        fallback: true,
      },
      { status: 500 }
    );
  }
}
