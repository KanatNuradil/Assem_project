import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { type, exerciseTitle, studentAnswers, correctAnswers, score, maxScore } =
      await request.json();

    const prompt = `You are an encouraging English teacher giving feedback on a completed exercise.

Exercise type: ${type} (${exerciseTitle || "Vocabulary exercise"})
Student score: ${score}/${maxScore}
${
  studentAnswers && correctAnswers
    ? `Details:\n${JSON.stringify({ studentAnswers, correctAnswers }, null, 2)}`
    : ""
}

Give brief, encouraging feedback in this EXACT JSON format (pure JSON, no markdown):
{
  "emoji": "A single relevant emoji",
  "headline": "Short celebratory or encouraging headline (max 8 words)",
  "feedback": "2-3 sentences of personalized feedback mentioning what they did well",
  "tips": [
    "One specific learning tip related to this exercise type",
    "One vocabulary or grammar insight from this exercise"
  ],
  "nextStep": "One sentence suggesting what to practice next"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const result = JSON.parse(response.text);
    return NextResponse.json(result);
  } catch (err) {
    console.warn("[AI Assignment Feedback] Gemini failed or quota exceeded. Generating mock feedback:", err.message);
    
    const scoreNum = Number(score || 0);
    const maxScoreNum = Number(maxScore || 4);
    
    const emoji = scoreNum === maxScoreNum ? "🏆" : scoreNum >= maxScoreNum / 2 ? "🌟" : "💪";
    const headline = scoreNum === maxScoreNum ? "Perfect Score! Spectacular Job!" : scoreNum >= maxScoreNum / 2 ? "Great Effort! Keep it Up!" : "Good Try! Let's Keep Practicing!";
    
    const feedback = `You completed the ${type || "vocabulary"} exercise with a score of ${scoreNum}/${maxScoreNum}. You showed good focus on the questions. Reviewing the incorrect answers will help reinforce your understanding.`;
    
    const tips = [
      "Always take a moment to re-read the sentence before choosing your final answer.",
      "Practice using these words in your own sentences to build active memory."
    ];
    const nextStep = "Try doing this exercise again, or launch a speech practice session to improve your pronunciation!";

    return NextResponse.json({
      emoji,
      headline,
      feedback,
      tips,
      nextStep
    });
  }
}
