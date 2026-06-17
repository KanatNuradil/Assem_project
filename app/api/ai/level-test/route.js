import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  let score = 0;
  let answers = [];
  
  try {
    const body = await request.json();
    answers = body.answers || [];

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

    score = answers.filter((a) => a.student === a.correct).length;

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
    console.warn("[AI Level Test] Gemini failed or quota exceeded. Generating mock result:", err.message);
    
    // Determine CEFR level based on score
    let cefrLevel = "A1";
    let levelLabel = "Beginner";
    let levelDescription = "You can understand and use familiar everyday expressions and very basic phrases.";
    
    if (score >= 18) {
      cefrLevel = "C2";
      levelLabel = "Proficiency (Advanced)";
      levelDescription = "You can understand with ease virtually everything heard or read.";
    } else if (score >= 15) {
      cefrLevel = "C1";
      levelLabel = "Advanced";
      levelDescription = "You can express ideas fluently and spontaneously without much obvious searching for expressions.";
    } else if (score >= 11) {
      cefrLevel = "B2";
      levelLabel = "Upper Intermediate";
      levelDescription = "You can understand the main ideas of complex text on both concrete and abstract topics.";
    } else if (score >= 7) {
      cefrLevel = "B1";
      levelLabel = "Intermediate";
      levelDescription = "You can understand the main points of clear standard input on familiar matters.";
    } else if (score >= 4) {
      cefrLevel = "A2";
      levelLabel = "Elementary";
      levelDescription = "You can understand sentences and frequently used expressions related to areas of most immediate relevance.";
    }

    const percentage = Math.round((score / 20) * 100);
    
    // Group correct/total
    const grammarBreakdown = {
      "Present Simple": { "correct": 0, "total": 0 },
      "Past Tense": { "correct": 0, "total": 0 },
      "Present Perfect": { "correct": 0, "total": 0 },
      "Conditionals": { "correct": 0, "total": 0 },
      "Modal Verbs": { "correct": 0, "total": 0 },
      "Advanced Structures": { "correct": 0, "total": 0 }
    };
    
    (answers || []).forEach(a => {
      const topic = a.topic || "Present Simple";
      const isCorrect = a.student === a.correct;
      if (!grammarBreakdown[topic]) {
        grammarBreakdown[topic] = { "correct": 0, "total": 0 };
      }
      grammarBreakdown[topic].total += 1;
      if (isCorrect) {
        grammarBreakdown[topic].correct += 1;
      }
    });

    const strengths = [
      "Good comprehension of basic structures and sentence elements.",
      "Clear attempt at using contexts to determine correct options.",
      "Developing a solid vocabulary foundation."
    ];

    const improvements = [
      "Review verb tenses and conjugation rules.",
      "Pay attention to conditional structures and irregular verbs.",
      "Practice reading complex articles to naturally absorb advanced syntax."
    ];

    const studyPlan = [
      { "week": "Week 1-2", "focus": "Verb Conjugation & Tenses", "activity": "Practice exercises focusing on Present Perfect and Past Simple distinction." },
      { "week": "Week 3-4", "focus": "Conditional Clauses", "activity": "Complete matching and writing activities using First and Second Conditionals." },
      { "week": "Week 5-6", "focus": "Modal Verbs", "activity": "Practice nuances of ability, permission, and obligation verbs." },
      { "week": "Week 7-8", "focus": "Complex Sentence Building", "activity": "Write short paragraphs daily, integrating relative clauses and subordinating conjunctions." }
    ];

    const encouragement = `Great work on completing the level test! You achieved a score of ${score}/20. Language learning is a journey, and every correct answer is a step forward. Continue practicing daily on LingoVibe!`;

    return NextResponse.json({
      cefrLevel,
      levelLabel,
      levelDescription,
      score,
      percentage,
      grammarBreakdown,
      strengths,
      improvements,
      studyPlan,
      encouragement
    });
  }
}
