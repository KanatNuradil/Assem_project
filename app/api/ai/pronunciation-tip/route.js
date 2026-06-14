import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { targetWord, spokenWord, wasCorrect } = await request.json();

    const prompt = `You are an English pronunciation expert. A student was trying to pronounce the word "${targetWord}".

They said: "${spokenWord || "(no speech detected)"}"
Result: ${wasCorrect ? "CORRECT ✅" : "INCORRECT ❌"}

Give a helpful pronunciation tip in this EXACT JSON format (no markdown, pure JSON):
{
  "phonetic": "IPA phonetic transcription, e.g. /ˈbjuːtɪfəl/",
  "syllables": "syllable breakdown, e.g. beau-ti-ful",
  "tip": "${wasCorrect ? "A positive reinforcement tip and what makes this word tricky for non-native speakers" : "A specific tip on how to pronounce it correctly, what common mistake was made"}",
  "mouthPosition": "Brief physical tip (e.g., 'Round your lips for the 'oo' sound')",
  "practicePhrase": "A short example sentence using the word"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const result = JSON.parse(response.text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[AI Pronunciation] Error:", err);
    return NextResponse.json(
      { error: "Pronunciation tip failed", message: err.message },
      { status: 500 }
    );
  }
}
