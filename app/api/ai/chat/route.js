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
    console.warn("[AI Chat] Gemini API failed or quota exceeded. Using mock coach fallback:", err.message);
    
    // Generate a smart mock coach response based on userMessage
    const msgLower = (userMessage || "").toLowerCase().trim();
    
    let reply = "That is a very interesting topic! Speaking practice is a great way to learn. What else can you tell me about that?";
    if (msgLower.includes("hello") || msgLower.includes("hi")) {
      reply = "Hello there! I'm Coach Vibe. How is your day going, and what would you like to practice speaking about today?";
    } else if (msgLower.includes("weather")) {
      reply = "The weather has a big impact on our daily activities! Do you prefer sunny warm days, or do you enjoy cold rainy ones?";
    } else if (msgLower.includes("hobby") || msgLower.includes("free time") || msgLower.includes("hobbies")) {
      reply = "Hobbies keep us active and creative! How did you get started with your favorite hobby, and how often do you practice it?";
    } else if (msgLower.includes("job") || msgLower.includes("work") || msgLower.includes("study") || msgLower.includes("major")) {
      reply = "Balancing work and study requires a lot of discipline! What is the most challenging part of your studies or career right now?";
    }
    
    const greenline = "Good job on keeping the conversation going! Try adding more descriptive vocabulary.";
    const corrections = [];
    
    // Basic rule-based grammar checks
    if (msgLower.includes("i is")) {
      corrections.push({
        wrong: "i is",
        correct: "I am",
        explanation: "For the first-person singular 'I', the present tense form of the verb 'to be' is always 'am'."
      });
    }
    if (msgLower.includes("he am") || msgLower.includes("she am")) {
      const wrongWord = msgLower.includes("he am") ? "he am" : "she am";
      const correctWord = msgLower.includes("he am") ? "he is" : "she is";
      corrections.push({
        wrong: wrongWord,
        correct: correctWord,
        explanation: "For third-person singular pronouns (he/she/it), the correct conjugation is 'is'."
      });
    }
    if (msgLower.includes("dont has") || msgLower.includes("does not has")) {
      corrections.push({
        wrong: msgLower.includes("dont has") ? "dont has" : "does not has",
        correct: msgLower.includes("dont has") ? "don't have" : "doesn't have",
        explanation: "In English negatives, use the auxiliary verb + the base form 'have'."
      });
    }
    
    const upgrade = `I'd love to share my thoughts on that topic. Could you tell me more?`;
    const vocabBoost = "insightful (adjective): showing a very clear understanding of something.";
    const scores = {
      fluency: "4/5 - Decent pace, try to speak in full sentences.",
      vocabulary: "4/5 - Good word choices, keep expanding your range.",
      grammar: corrections.length > 0 ? "3/5 - Watch verb agreement" : "5/5 - Perfect grammar in this message"
    };

    return NextResponse.json({ reply, corrections, upgrade, vocabBoost, scores, greenline });
  }
}
