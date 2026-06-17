import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { targetWord, spokenWord, wasCorrect } = await request.json();

    const prompt = `You are a world-class English pronunciation and phonetics coach. A student is practicing their pronunciation.
Target word to pronounce: "${targetWord}"
The student actually said: "${spokenWord || "(no speech detected)"}"
The system marked this attempt as: ${wasCorrect ? "Correct matching spelling" : "Incorrect matching spelling"}

Analyze the student's attempt carefully. Compare the target word phonetics with the student's spoken input.
Provide a highly detailed, professional, and encouraging phonetic review in this EXACT JSON format (no markdown, pure JSON):
{
  "phonetic": "IPA phonetic transcription of the target word, e.g. /ˈbjuːtɪfəl/",
  "syllables": "syllable breakdown with primary stress marked, e.g. beau-ti-ful (stress on beau)",
  "tip": "Provide a VERY detailed, highly specific, multi-sentence coaching tip (at least 3-4 full sentences). Do NOT say 'perfect pronunciation' or 'incorrect pronunciation' or 'good job' or 'bad job' simply. Instead, analyze the specific sounds (vowels, consonants, stress) of target vs spoken. If the student made a mistake, explain exactly where they deviated (e.g., 'the student substituted a short /ɪ/ sound for the long /iː/ sound in the second syllable') and how to physically adjust. If they were correct, explain why this word is tricky (e.g. silent letters, non-intuitive vowels, or consonant clusters) and highlight their clear articulation of the tricky sounds.",
  "mouthPosition": "Detailed physical instructions (2-3 sentences) on tongue, teeth, and lip position for the key sounds in this word, helping the student produce the correct sound.",
  "practicePhrase": "A short, natural practice sentence containing the word."
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
