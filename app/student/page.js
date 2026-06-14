"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

// ─── 20-Question Level Test ───────────────────────────────────────────────────
const quizQuestions = [
  { id: 1,  text: "He ___ a very hardworking student.", options: ["am","is","are","be"], answer: "is", topic: "Present Simple" },
  { id: 2,  text: "I usually ___ soccer with my friends on Saturday.", options: ["play","plays","playing","played"], answer: "play", topic: "Present Simple" },
  { id: 3,  text: "Where ___ your English teacher live?", options: ["do","does","are","is"], answer: "does", topic: "Present Simple" },
  { id: 4,  text: "Look at ___ beautiful birds up in the sky!", options: ["this","that","these","those"], answer: "those", topic: "Determiners" },
  { id: 5,  text: "She doesn't ___ coffee in the evening.", options: ["like","likes","liking","liked"], answer: "like", topic: "Present Simple" },
  { id: 6,  text: "Yesterday, we ___ to the cinema to watch the new movie.", options: ["go","went","goes","going"], answer: "went", topic: "Past Tense" },
  { id: 7,  text: "Have you ever ___ to London or New York?", options: ["be","been","go","gone"], answer: "been", topic: "Present Perfect" },
  { id: 8,  text: "This textbook is ___ than the old one.", options: ["interesting","more interesting","most interesting","interestinger"], answer: "more interesting", topic: "Comparatives" },
  { id: 9,  text: "If it rains tomorrow, we ___ at home.", options: ["stay","will stay","stayed","would stay"], answer: "will stay", topic: "Conditionals" },
  { id: 10, text: "I was cooking dinner when the doorbell ___.", options: ["rang","rings","was ringing","rung"], answer: "rang", topic: "Past Tense" },
  { id: 11, text: "He is looking forward to ___ his new classmates next week.", options: ["meet","meeting","meets","met"], answer: "meeting", topic: "Gerunds" },
  { id: 12, text: "You ___ smoke inside the building; it is strictly prohibited.", options: ["mustn't","needn't","don't have to","might not"], answer: "mustn't", topic: "Modal Verbs" },
  { id: 13, text: "Although it was freezing, they went swimming. (Role of 'Although'?)", options: ["Addition","Concession","Reason","Result"], answer: "Concession", topic: "Connectives" },
  { id: 14, text: "The thief admitted ___ the jewelry from the shop.", options: ["steal","to steal","stealing","stolen"], answer: "stealing", topic: "Gerunds" },
  { id: 15, text: "I wish I ___ more time to travel the world.", options: ["have","had","would have","will have"], answer: "had", topic: "Conditionals" },
  { id: 16, text: "By the time you arrive, I ___ my graduation exams.", options: ["will finish","will have finished","finish","would finish"], answer: "will have finished", topic: "Future Perfect" },
  { id: 17, text: "The document is believed ___ by the head director himself.", options: ["to write","to be writing","to have been written","having written"], answer: "to have been written", topic: "Passive Voice" },
  { id: 18, text: "Hardly ___ entered the classroom when the exam bells rang.", options: ["he had","had he","did he","has he"], answer: "had he", topic: "Inversion" },
  { id: 19, text: "I'd rather you ___ speak native slang during the formal debate.", options: ["don't","didn't","not","won't"], answer: "didn't", topic: "Subjunctive" },
  { id: 20, text: "The suspect denied ___ anything to do with the hacking incident.", options: ["to have","having","had","have"], answer: "having", topic: "Gerunds" },
];

// ─── Default exercise data ────────────────────────────────────────────────────
const defaultMatchingLeft  = [{ id:"l1",word:"Acknowledge"},{ id:"l2",word:"Redundant"},{ id:"l3",word:"Superficial"},{ id:"l4",word:"Mitigate"}];
const defaultMatchingRight = [{ id:"r1",word:"Only on the surface"},{ id:"r2",word:"Make less severe"},{ id:"r3",word:"Accept/Recognize"},{ id:"r4",word:"No longer needed"}];
const defaultCorrectMatches = { l1:"r3", l2:"r4", l3:"r1", l4:"r2" };
const defaultInitialBadges  = ["fluently","every","speaks","She","day.","English"];
const defaultCorrectSentence = ["She","speaks","English","fluently","every","day."];

// ─── Date helpers for Streak ──────────────────────────────────────────────────
function getLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPrevDateStr(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return getLocalDateStr(date);
}

// ─── CEFR colour map ──────────────────────────────────────────────────────────
const cefrColors = { A1:"bg-gray-100 text-gray-600", A2:"bg-blue-50 text-blue-600", B1:"bg-emerald-50 text-emerald-700", B2:"bg-brand-bg text-brand-primary", C1:"bg-amber-50 text-amber-700", C2:"bg-rose-50 text-rose-700" };

export default function StudentDashboard() {
  const router = useRouter();

  // ─── Profile state ────────────────────────────────────────────────────────
  const [studentName, setStudentName]   = useState("Alex Johnson");
  const [studentLevel, setStudentLevel] = useState("Not Tested");
  const [studentId, setStudentId]       = useState("");
  const [activeBlock, setActiveBlock]   = useState(null);
  const [dbConnected, setDbConnected]   = useState(true);
  const [courseMastery, setCourseMastery] = useState(0);
  const [streakDays, setStreakDays]       = useState(0);

  const fetchStudentStats = async (uid) => {
    if (!uid) return;
    try {
      const { count: totalCount, error: countErr } = await supabase
        .from("assignments")
        .select("id", { count: "exact", head: true });
      if (countErr) throw countErr;

      const { data: progress, error: progressErr } = await supabase
        .from("student_progress")
        .select("assignment_id, completed_at, type")
        .eq("student_id", uid);
      if (progressErr) throw progressErr;

      if (progress) {
        const completedIds = new Set(
          progress
            .filter(p => p.assignment_id && p.type === "assignment")
            .map(p => p.assignment_id)
        );
        const total = totalCount || 0;
        const completedCount = completedIds.size;
        const mastery = total > 0 ? Math.min(100, Math.round((completedCount / total) * 100)) : 0;
        setCourseMastery(mastery);

        const dates = progress.map(p => {
          const d = new Date(p.completed_at);
          return getLocalDateStr(d);
        });
        
        const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
        
        let streak = 0;
        if (uniqueDates.length > 0) {
          const todayStr = getLocalDateStr(new Date());
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getLocalDateStr(yesterday);

          if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
            streak = 1;
            let currentStr = uniqueDates[0];
            for (let i = 1; i < uniqueDates.length; i++) {
              const prevExpected = getPrevDateStr(currentStr);
              if (uniqueDates[i] === prevExpected) {
                streak++;
                currentStr = uniqueDates[i];
              } else {
                break;
              }
            }
          }
        }
        setStreakDays(streak);
      }
    } catch (err) {
      console.warn("Failed to fetch student stats:", err.message);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedRole  = localStorage.getItem("userRole");
    const storedId    = localStorage.getItem("userId");
    const storedName  = localStorage.getItem("userName");
    const storedLevel = localStorage.getItem("userLevel");
    if (storedRole && storedRole !== "student") { router.push("/teacher"); return; }
    setTimeout(() => {
      if (storedName)  setStudentName(storedName);
      if (storedLevel) setStudentLevel(storedLevel);
      if (storedId)    setStudentId(storedId);
    }, 0);
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id || storedId;
        if (!uid) return;
        setStudentId(uid);
        localStorage.setItem("userId", uid);
        const { data: profile, error } = await supabase.from("profiles").select("full_name, current_level").eq("id", uid).single();
        if (error) throw error;
        const freshName  = profile.full_name    || storedName  || "Alex Johnson";
        const freshLevel = profile.current_level || storedLevel || "Not Tested";
        setStudentName(freshName); setStudentLevel(freshLevel);
        localStorage.setItem("userName", freshName); localStorage.setItem("userLevel", freshLevel);
        setDbConnected(true);
        fetchStudentStats(uid);
      } catch (err) { console.warn("Profile fetch failed:", err.message); setDbConnected(false); }
    };
    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    if (typeof window !== "undefined") localStorage.clear();
    router.push("/login");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 1 – ENGLISH LEVEL TEST  (AI-powered)
  // ═══════════════════════════════════════════════════════════════════════════
  const [quizIndex, setQuizIndex]             = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizFinished, setQuizFinished]       = useState(false);
  const [quizScore, setQuizScore]             = useState(0);
  const [aiAnalyzing, setAiAnalyzing]         = useState(false);
  const [aiResult, setAiResult]               = useState(null);   // full Gemini JSON
  const [quizSaveMsg, setQuizSaveMsg]         = useState("");

  const handleSelectAnswer = (opt) => setSelectedAnswers({ ...selectedAnswers, [quizIndex]: opt });

  const handleNextQuestion = async () => {
    if (quizIndex < quizQuestions.length - 1) { setQuizIndex(quizIndex + 1); return; }

    // Calculate score
    let score = 0;
    quizQuestions.forEach((q, idx) => { if (selectedAnswers[idx] === q.answer) score++; });
    setQuizScore(score);
    setQuizFinished(true);
    setAiAnalyzing(true);

    // Build answers payload for AI
    const answers = quizQuestions.map((q, idx) => ({
      question: q.text,
      topic:    q.topic,
      correct:  q.answer,
      student:  selectedAnswers[idx] || "(no answer)",
    }));

    try {
      // ── Call AI ──
      const aiRes = await fetch("/api/ai/level-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await aiRes.json();
      if (!data.error) {
        setAiResult(data);
        const level = `${data.levelLabel} (${data.cefrLevel})`;
        setStudentLevel(level);
        localStorage.setItem("userLevel", level);

        // ── Save to Supabase ──
        if (dbConnected && studentId) {
          try {
            await supabase.from("student_progress").insert({
              student_id: studentId, assignment_id: null, type: "level_test",
              score, max_score: quizQuestions.length,
              feedback: `AI Assessment: ${level}`,
            });
            await supabase.from("profiles").update({ current_level: level }).eq("id", studentId);
            setQuizSaveMsg("✅ Result saved to your profile!");
            fetchStudentStats(studentId);
          } catch (e) { setQuizSaveMsg("⚠️ Saved locally only."); console.error(e); }
        }
      }
    } catch (err) { console.error("AI level test error:", err); }
    finally { setAiAnalyzing(false); }
  };

  const resetQuiz = () => {
    setQuizIndex(0); setSelectedAnswers({}); setQuizFinished(false);
    setQuizScore(0); setAiResult(null); setQuizSaveMsg("");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 2 – ASSIGNMENTS HUB
  // ═══════════════════════════════════════════════════════════════════════════
  const [assignments, setAssignments]           = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [aiFeedback, setAiFeedback]             = useState(null);
  const [fetchingFeedback, setFetchingFeedback] = useState(false);

  // Matching
  const [matchingLeft, setMatchingLeft]       = useState(defaultMatchingLeft);
  const [matchingRight, setMatchingRight]     = useState(defaultMatchingRight);
  const [correctMatches, setCorrectMatches]   = useState(defaultCorrectMatches);
  const [selectedLeft, setSelectedLeft]       = useState(null);
  const [matchedPairs, setMatchedPairs]       = useState([]);
  const [matchingError, setMatchingError]     = useState(false);
  const [matchingSuccess, setMatchingSuccess] = useState(false);

  // Sentence
  const [badges, setBadges]                         = useState(defaultInitialBadges);
  const [correctSentence, setCorrectSentence]       = useState(defaultCorrectSentence);
  const [constructedSentence, setConstructedSentence] = useState([]);
  const [sentenceIsCorrect, setSentenceIsCorrect]   = useState(null);

  // Translation
  const [translationInput, setTranslationInput]       = useState("");
  const [translationAnswer, setTranslationAnswer]     = useState("құбылыс");
  const [translationIsCorrect, setTranslationIsCorrect] = useState(null);

  useEffect(() => {
    if (activeBlock !== "assignments") return;
    const fetchAssignments = async () => {
      try {
        const { data, error } = await supabase.from("assignments").select("id,title,type,content,created_at").order("created_at", { ascending: false }).limit(10);
        if (error) throw error;
        if (data && data.length > 0) { setAssignments(data); loadAssignmentData(data[0]); }
      } catch (err) { console.warn("Assignments fetch failed – demo data.", err.message); setAssignments([]); }
    };
    fetchAssignments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlock]);

  const loadAssignmentData = (a) => {
    setActiveAssignment(a); resetMatchingWidget(); resetSentenceBuilder(); resetTranslation(); setAiFeedback(null);
    const c = a.content;
    if (a.type === "matching" && c?.pairs) {
      const lefts   = c.pairs.map((p, i) => ({ id: `l${i}`, word: p.english }));
      const rights  = c.pairs.map((p, i) => ({ id: `r${i}`, word: p.translation }));
      const shuffled = [...rights].sort(() => Math.random() - 0.5);
      const mapping  = {}; c.pairs.forEach((_, i) => { mapping[`l${i}`] = `r${i}`; });
      setMatchingLeft(lefts); setMatchingRight(shuffled); setCorrectMatches(mapping);
    } else if (a.type === "sentence" && c?.badges) {
      const sent = c.sentence ? c.sentence.split(" ") : defaultCorrectSentence;
      setCorrectSentence(sent); setBadges([...( c.badges.length ? c.badges : defaultInitialBadges)].sort(() => Math.random() - 0.5));
    } else if (a.type === "translation" && c?.word) {
      setTranslationAnswer((c.translation || "құбылыс").toLowerCase());
    }
  };

  const saveAssignmentProgress = async (assignmentId, score, maxScore) => {
    if (!dbConnected || !studentId) return;
    try {
      await supabase.from("student_progress").insert({ student_id: studentId, assignment_id: assignmentId, type: "assignment", score, max_score: maxScore, feedback: null });
      fetchStudentStats(studentId);
    } catch (err) { console.error("Save progress error:", err); }
  };

  const fetchAiFeedback = async (type, score, maxScore) => {
    setFetchingFeedback(true); setAiFeedback(null);
    try {
      const res = await fetch("/api/ai/assignment-feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, exerciseTitle: activeAssignment?.title || type, score, maxScore }),
      });
      const data = await res.json();
      if (!data.error) setAiFeedback(data);
    } catch (err) { console.error("AI feedback error:", err); }
    finally { setFetchingFeedback(false); }
  };

  const handleMatchingClick = (side, id) => {
    if (side === "left") { if (matchedPairs.some(p => p.leftId === id)) return; setSelectedLeft(id); }
    else {
      if (!selectedLeft) return;
      if (matchedPairs.some(p => p.rightId === id)) return;
      if (correctMatches[selectedLeft] === id) {
        const newPairs = [...matchedPairs, { leftId: selectedLeft, rightId: id }];
        setMatchedPairs(newPairs); setSelectedLeft(null);
        if (newPairs.length === matchingLeft.length) {
          setMatchingSuccess(true);
          if (activeAssignment) saveAssignmentProgress(activeAssignment.id, newPairs.length, matchingLeft.length);
          fetchAiFeedback("matching", newPairs.length, matchingLeft.length);
        }
      } else {
        setMatchingError(true); setTimeout(() => setMatchingError(false), 800); setSelectedLeft(null);
      }
    }
  };
  const resetMatchingWidget = () => { setMatchedPairs([]); setSelectedLeft(null); setMatchingSuccess(false); setMatchingLeft(defaultMatchingLeft); setMatchingRight(defaultMatchingRight); setCorrectMatches(defaultCorrectMatches); };

  const handleBadgeClick = (word, idx) => { setConstructedSentence([...constructedSentence, word]); const t=[...badges]; t.splice(idx,1); setBadges(t); };
  const handleRemoveBadge = (word, idx) => { setBadges([...badges, word]); const t=[...constructedSentence]; t.splice(idx,1); setConstructedSentence(t); setSentenceIsCorrect(null); };
  const checkSentenceBuilder = () => {
    const ok = JSON.stringify(constructedSentence) === JSON.stringify(correctSentence);
    setSentenceIsCorrect(ok);
    if (ok) { if (activeAssignment) saveAssignmentProgress(activeAssignment.id, 1, 1); fetchAiFeedback("sentence", 1, 1); }
  };
  const resetSentenceBuilder = () => { setBadges(defaultInitialBadges); setConstructedSentence([]); setSentenceIsCorrect(null); };

  const checkTranslation = (e) => {
    e.preventDefault();
    const clean = translationInput.trim().toLowerCase();
    const ok = clean === translationAnswer || clean === "құбылыс";
    setTranslationIsCorrect(ok);
    if (ok) { if (activeAssignment) saveAssignmentProgress(activeAssignment.id, 1, 1); fetchAiFeedback("translation", 1, 1); }
  };
  const resetTranslation = () => { setTranslationInput(""); setTranslationIsCorrect(null); };

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 3 – PRONUNCIATION CHECKER  (AI tips)
  // ═══════════════════════════════════════════════════════════════════════════
  const pronunciationWords = ["Beautiful","Literature","Enthusiastic","Simultaneous","Sophisticated","Pronunciation","Entrepreneurial","Phenomenon","Particularly","Conscientious"];
  const [pronunWordIndex, setPronunWordIndex]       = useState(0);
  const [spokenText, setSpokenText]                 = useState("");
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [isListeningPronun, setIsListeningPronun]   = useState(false);
  const [pronunAiTip, setPronunAiTip]               = useState(null);
  const [fetchingPronunTip, setFetchingPronunTip]   = useState(false);
  const targetWord = pronunciationWords[pronunWordIndex];

  const playTargetWord = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(targetWord);
      utt.lang = "en-US"; utt.rate = 0.85;
      window.speechSynthesis.speak(utt);
    }
  };

  const fetchPronunTip = async (spoken, wasCorrect) => {
    setFetchingPronunTip(true); setPronunAiTip(null);
    try {
      const res = await fetch("/api/ai/pronunciation-tip", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetWord, spokenWord: spoken, wasCorrect }),
      });
      const data = await res.json();
      if (!data.error) setPronunAiTip(data);
    } catch (err) { console.error("Pronunciation tip error:", err); }
    finally { setFetchingPronunTip(false); }
  };

  const startPronunListening = () => {
    setSpokenText(""); setPronunciationResult(null); setPronunAiTip(null);
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Web Speech Recognition not supported – use Chrome or Edge."); return; }
    const recognition = new SR();
    recognition.lang = "en-US"; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onstart  = () => setIsListeningPronun(true);
    recognition.onend    = () => setIsListeningPronun(false);
    recognition.onerror  = (e) => { console.error(e); setIsListeningPronun(false); };
    recognition.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      setSpokenText(resultText);
      const cleanTarget = targetWord.toLowerCase().replace(/[^\w\s]/g, "").trim();
      const cleanSpoken = resultText.toLowerCase().replace(/[^\w\s]/g, "").trim();
      const correct = cleanTarget === cleanSpoken;
      setPronunciationResult(correct ? "correct" : "incorrect");
      fetchPronunTip(resultText, correct);
    };
    recognition.start();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 4 – AI SPEAKING CLUB  (real Gemini responses)
  // ═══════════════════════════════════════════════════════════════════════════
  const chatBottomRef = useRef(null);
  const [chatInput, setChatInput]         = useState("");
  const [isListeningChat, setIsListeningChat] = useState(false);
  const [isAiTyping, setIsAiTyping]       = useState(false);
  const [corrections, setCorrections]     = useState([]);
  const [messages, setMessages]           = useState([
    { id: 1, sender: "ai", text: "Hello! Welcome to the AI Speaking Club. I am Coach Vibe, your personal English language coach. What topic would you like to speak about today?" }
  ]);

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  const startChatDictation = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Web Speech Recognition not supported – use Chrome or Edge."); return; }
    const recognition = new SR();
    recognition.lang = "en-US"; recognition.interimResults = false;
    recognition.onstart  = () => setIsListeningChat(true);
    recognition.onend    = () => setIsListeningChat(false);
    recognition.onerror  = (e) => { console.error(e); setIsListeningChat(false); };
    recognition.onresult = (event) => { const t = event.results[0][0].transcript; setChatInput(prev => prev ? `${prev} ${t}` : t); };
    recognition.start();
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { id: Date.now(), sender: "user", text: chatInput };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    const query = chatInput;
    setChatInput("");
    setIsAiTyping(true);
    setCorrections([]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages, userMessage: query }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: "ai", text: data.reply }]);
        if (data.corrections?.length > 0) setCorrections(data.corrections);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: "ai", text: "I'm sorry, I had trouble responding. Please try again!" }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "ai", text: "Connection issue — please check your internet and try again." }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-brand-soft pb-12">
      {/* Header */}
      <header className="h-20 bg-white border-b border-purple-100 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-light flex items-center justify-center shadow-md shadow-brand-primary/10">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-brand-dark to-brand-primary bg-clip-text text-transparent">LingoVibe</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-200">✨ Gemini AI</span>
            {dbConnected
              ? <span className="hidden sm:inline-flex text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">🟢 Supabase Live</span>
              : <span className="hidden sm:inline-flex text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">⚡ Offline Mode</span>}
            <span className="text-xs text-brand-dark/50 font-bold bg-brand-bg px-3 py-1.5 rounded-full hidden sm:inline-block">🎓 Student</span>
            <button onClick={handleLogout} className="text-xs text-red-500 font-bold hover:bg-red-50 border border-red-100 px-3.5 py-2 rounded-xl transition-all">Sign Out</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* Profile Banner */}
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-purple-100 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full bg-brand-bg/50 blur-3xl" />
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-light flex items-center justify-center text-white text-3xl shadow-lg shadow-brand-primary/20">🦊</div>
            <div>
              <h2 className="text-2xl font-black text-brand-dark">{studentName}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-bold text-brand-primary uppercase bg-brand-bg px-2.5 py-0.5 rounded-full">Level: {studentLevel}</span>
                <span className="text-xs font-bold text-brand-success bg-emerald-50 px-2.5 py-0.5 rounded-full">🔥 {streakDays} Days Streak</span>
                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">✨ AI-Powered</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-brand-dark/60 font-semibold">Overall Course Mastery</span>
              <span className="font-bold text-brand-primary">{courseMastery}% Completed</span>
            </div>
            <div className="w-full bg-brand-bg h-3 rounded-full overflow-hidden border border-purple-50">
              <div className="bg-gradient-to-r from-brand-primary to-brand-light h-full rounded-full transition-all duration-700" style={{ width: `${courseMastery}%` }} />
            </div>
          </div>
        </section>

        {/* ── Block drill-down or grid ── */}
        {activeBlock ? (
          <div>
            <button onClick={() => { setActiveBlock(null); resetQuiz(); }} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:text-brand-dark transition-all">
              ← Back to Dashboard
            </button>

            {/* ═══ BLOCK 1: LEVEL TEST ═══ */}
            {activeBlock === "test" && (
              <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-purple-100 shadow-md p-6 md:p-8">
                <div className="flex items-center justify-between border-b border-purple-50 pb-5 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-brand-dark flex items-center gap-2">English Level Diagnostics <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">✨ AI Assessed</span></h3>
                    <p className="text-xs text-brand-dark/50 mt-1">20 progressive questions → Gemini AI analyses your grammar profile</p>
                  </div>
                  {!quizFinished && <span className="text-sm font-bold text-brand-primary bg-brand-bg px-3.5 py-1 rounded-full">{quizIndex + 1} / {quizQuestions.length}</span>}
                </div>

                {/* ── AI Analyzing state ── */}
                {aiAnalyzing && (
                  <div className="flex flex-col items-center justify-center py-16 space-y-6">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping" />
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-brand-light flex items-center justify-center text-3xl shadow-xl">✨</div>
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-bold text-brand-dark">Gemini AI is analysing your answers…</h4>
                      <p className="text-sm text-brand-dark/50 mt-1">Building your personalised English profile</p>
                    </div>
                    <div className="flex gap-2">
                      {["Scoring grammar topics", "Identifying patterns", "Generating study plan"].map((s, i) => (
                        <span key={i} className="text-[10px] font-bold text-brand-primary bg-brand-bg px-3 py-1.5 rounded-full border border-brand-primary/10 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Quiz in progress ── */}
                {!quizFinished && !aiAnalyzing && (
                  <div className="space-y-6">
                    <div className="w-full bg-brand-bg h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-primary h-full transition-all duration-300" style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }} />
                    </div>
                    <div className="p-6 rounded-2xl bg-brand-bg/40 border border-brand-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-brand-primary uppercase tracking-widest bg-white shadow-sm border border-purple-50 px-2.5 py-1 rounded-md">{quizQuestions[quizIndex].topic}</span>
                        <span className="text-xs text-brand-dark/40 font-medium">Q{quizIndex + 1}</span>
                      </div>
                      <h4 className="text-lg font-bold text-brand-dark leading-relaxed">{quizQuestions[quizIndex].text}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {quizQuestions[quizIndex].options.map((option, idx) => (
                        <button key={idx} type="button" onClick={() => handleSelectAnswer(option)}
                          className={`p-4 rounded-2xl border text-left text-sm font-bold transition-all flex items-center justify-between ${selectedAnswers[quizIndex] === option ? "border-brand-primary bg-brand-bg text-brand-primary shadow-sm ring-2 ring-brand-primary/15" : "border-purple-100 bg-white hover:border-brand-primary/30 text-brand-dark hover:bg-brand-bg/20"}`}>
                          <span>{option}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${selectedAnswers[quizIndex] === option ? "border-brand-primary bg-brand-primary text-white" : "border-purple-200 text-transparent"}`}>✓</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={handleNextQuestion} disabled={!selectedAnswers[quizIndex]}
                      className={`w-full py-4 rounded-2xl text-white text-base font-bold shadow-md transition-all ${selectedAnswers[quizIndex] ? "bg-brand-primary hover:bg-brand-light shadow-brand-primary/20 hover:shadow-lg" : "bg-purple-200 cursor-not-allowed"}`}>
                      {quizIndex === quizQuestions.length - 1 ? "Submit & Get AI Analysis →" : "Next Question →"}
                    </button>
                  </div>
                )}

                {/* ── AI Result card ── */}
                {quizFinished && !aiAnalyzing && aiResult && (
                  <div className="space-y-6">
                    {/* CEFR Badge */}
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-brand-dark to-brand-primary text-white text-center relative overflow-hidden shadow-2xl">
                      <div className="absolute top-[-30%] left-[-20%] w-64 h-64 bg-white/10 rounded-full blur-2xl" />
                      <span className="text-5xl mb-3 block">🎓</span>
                      <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-black mb-3 ${cefrColors[aiResult.cefrLevel] || "bg-brand-bg text-brand-primary"}`}>{aiResult.cefrLevel}</div>
                      <h3 className="text-2xl font-black">{aiResult.levelLabel}</h3>
                      <p className="text-white/75 text-sm mt-2 max-w-sm mx-auto">{aiResult.levelDescription}</p>
                      <div className="flex items-center justify-center gap-6 mt-6 bg-white/10 rounded-2xl p-4">
                        <div className="text-center"><div className="text-3xl font-black">{aiResult.score}/20</div><div className="text-xs text-white/60 font-bold">Score</div></div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="text-center"><div className="text-3xl font-black">{aiResult.percentage}%</div><div className="text-xs text-white/60 font-bold">Accuracy</div></div>
                      </div>
                      {quizSaveMsg && <p className="text-xs text-white/80 mt-3 font-semibold">{quizSaveMsg}</p>}
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <h5 className="font-bold text-emerald-700 text-sm mb-3 flex items-center gap-2">✅ Your Strengths</h5>
                        <ul className="space-y-2">
                          {(aiResult.strengths || []).map((s, i) => <li key={i} className="text-xs text-emerald-700/80 font-medium flex gap-2"><span>•</span><span>{s}</span></li>)}
                        </ul>
                      </div>
                      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                        <h5 className="font-bold text-amber-700 text-sm mb-3 flex items-center gap-2">📈 Areas to Improve</h5>
                        <ul className="space-y-2">
                          {(aiResult.improvements || []).map((s, i) => <li key={i} className="text-xs text-amber-700/80 font-medium flex gap-2"><span>•</span><span>{s}</span></li>)}
                        </ul>
                      </div>
                    </div>

                    {/* 30-day Study Plan */}
                    {aiResult.studyPlan && (
                      <div className="p-6 rounded-2xl bg-brand-bg border border-brand-primary/10">
                        <h5 className="font-bold text-brand-dark text-sm mb-4 flex items-center gap-2">📅 Your AI Study Plan</h5>
                        <div className="space-y-3">
                          {aiResult.studyPlan.map((item, i) => (
                            <div key={i} className="flex items-start gap-4 bg-white p-4 rounded-xl border border-purple-50 shadow-sm">
                              <span className="text-xs font-black text-brand-primary bg-brand-bg px-2.5 py-1 rounded-lg shrink-0 border border-brand-primary/10">{item.week}</span>
                              <div>
                                <div className="text-xs font-bold text-brand-dark">{item.focus}</div>
                                <div className="text-xs text-brand-dark/55 mt-0.5">{item.activity}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Encouragement */}
                    {aiResult.encouragement && (
                      <div className="p-5 rounded-2xl bg-violet-50 border border-violet-100 text-center">
                        <p className="text-sm font-semibold text-violet-700 italic">{`"${aiResult.encouragement}"`}</p>
                        <p className="text-xs text-violet-400 font-bold mt-2">— Coach Vibe (Gemini AI)</p>
                      </div>
                    )}

                    <button onClick={resetQuiz} className="w-full py-3.5 rounded-2xl bg-white border border-purple-100 text-brand-primary font-bold text-sm hover:bg-brand-bg transition-all">
                      Retake Level Test
                    </button>
                  </div>
                )}

                {/* Fallback if AI failed */}
                {quizFinished && !aiAnalyzing && !aiResult && (
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-brand-dark to-brand-primary text-white text-center">
                    <span className="text-5xl block mb-4">🏆</span>
                    <h3 className="text-2xl font-black">Test Completed!</h3>
                    <p className="text-white/80 mt-2">Score: {quizScore}/20</p>
                    <p className="text-xs text-white/60 mt-3">AI analysis unavailable — check your GEMINI_API_KEY in .env.local</p>
                    <button onClick={resetQuiz} className="mt-5 px-6 py-2.5 rounded-full bg-white text-brand-dark font-bold text-xs hover:bg-brand-bg transition-all">Retake</button>
                  </div>
                )}
              </div>
            )}

            {/* ═══ BLOCK 2: ASSIGNMENTS HUB ═══ */}
            {activeBlock === "assignments" && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="text-center max-w-xl mx-auto">
                  <h3 className="text-2xl font-black text-brand-dark">Homework Portal</h3>
                  <p className="text-sm text-brand-dark/65 mt-1.5">{assignments.length > 0 ? `${assignments.length} assignment(s) from your teacher.` : "Review interactive exercise templates."}</p>
                </div>
                {assignments.length > 1 && (
                  <div className="flex flex-wrap gap-3 justify-center">
                    {assignments.map(a => (
                      <button key={a.id} onClick={() => loadAssignmentData(a)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeAssignment?.id === a.id ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-brand-dark border-purple-100 hover:border-brand-primary/40"}`}>{a.title}</button>
                    ))}
                  </div>
                )}

                {/* AI Feedback Panel */}
                {(fetchingFeedback || aiFeedback) && (
                  <div className={`p-5 rounded-2xl border transition-all ${fetchingFeedback ? "bg-violet-50 border-violet-100" : "bg-violet-50 border-violet-100"}`}>
                    {fetchingFeedback ? (
                      <div className="flex items-center gap-3 text-violet-600">
                        <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold">Coach Vibe is reviewing your work…</span>
                      </div>
                    ) : aiFeedback && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{aiFeedback.emoji}</span>
                          <span className="font-bold text-violet-800 text-sm">{aiFeedback.headline}</span>
                        </div>
                        <p className="text-xs text-violet-700/80 leading-relaxed">{aiFeedback.feedback}</p>
                        {aiFeedback.tips?.map((tip, i) => <p key={i} className="text-xs text-violet-600 font-medium">💡 {tip}</p>)}
                        {aiFeedback.nextStep && <p className="text-xs text-violet-500 italic mt-1">Next: {aiFeedback.nextStep}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Exercise A: Word Matching */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-purple-100 shadow-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-purple-50 mb-6">
                    <div>
                      <h4 className="font-bold text-brand-dark text-base">{activeAssignment?.type === "matching" ? activeAssignment.title : "Exercise A: Word Matching"}</h4>
                      <p className="text-xs text-brand-dark/55 mt-0.5">Match each vocabulary word with its definition. AI feedback on completion.</p>
                    </div>
                    {matchingSuccess && <span className="text-xs font-bold text-brand-success bg-brand-success/15 px-3 py-1 rounded-full">Completed ✓</span>}
                  </div>
                  {matchingSuccess ? (
                    <div className="p-6 rounded-2xl bg-brand-success/10 border border-brand-success/20 text-center space-y-3">
                      <span className="text-3xl block">🎉</span>
                      <h5 className="font-bold text-brand-success text-base">All pairs matched!</h5>
                      <button onClick={resetMatchingWidget} className="px-4 py-2 rounded-xl bg-white border border-brand-success/35 text-xs text-brand-success font-bold transition-all">Reset</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {matchingError && <div className="p-3 bg-red-50 text-red-500 text-xs font-bold border border-red-100 rounded-xl text-center">❌ Incorrect pair. Try again!</div>}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <span className="block text-[10px] font-bold text-brand-dark/50 uppercase tracking-wider">Vocabulary</span>
                          {matchingLeft.map((item) => {
                            const isMatched = matchedPairs.some(p => p.leftId === item.id);
                            const isSel = selectedLeft === item.id;
                            return (
                              <button key={item.id} disabled={isMatched} onClick={() => handleMatchingClick("left", item.id)}
                                className={`w-full p-4 rounded-xl border text-left text-sm font-bold transition-all ${isMatched ? "bg-brand-success/15 text-brand-success border-brand-success/20 cursor-not-allowed opacity-80" : isSel ? "bg-brand-primary text-white border-brand-primary shadow-md" : "bg-brand-soft/60 hover:bg-brand-bg text-brand-dark border-purple-100/60"}`}>
                                {item.word}
                              </button>
                            );
                          })}
                        </div>
                        <div className="space-y-3">
                          <span className="block text-[10px] font-bold text-brand-dark/50 uppercase tracking-wider">Definition</span>
                          {matchingRight.map((item) => {
                            const isMatched = matchedPairs.some(p => p.rightId === item.id);
                            return (
                              <button key={item.id} disabled={isMatched || !selectedLeft} onClick={() => handleMatchingClick("right", item.id)}
                                className={`w-full p-4 rounded-xl border text-left text-xs font-semibold transition-all ${isMatched ? "bg-brand-success/15 text-brand-success border-brand-success/20 cursor-not-allowed opacity-80" : !selectedLeft ? "bg-brand-soft/20 text-brand-dark/40 border-purple-100/30 cursor-not-allowed" : "bg-brand-soft/60 hover:bg-brand-bg text-brand-dark border-purple-100/60 hover:border-brand-primary/45"}`}>
                                {item.word}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exercise B: Sentence Builder */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-purple-100 shadow-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-purple-50 mb-6">
                    <div><h4 className="font-bold text-brand-dark text-base">Exercise B: Sentence Builder</h4><p className="text-xs text-brand-dark/55 mt-0.5">Click word badges to build the correct sentence.</p></div>
                    {sentenceIsCorrect === true && <span className="text-xs font-bold text-brand-success bg-brand-success/15 px-3 py-1 rounded-full">Completed ✓</span>}
                  </div>
                  <div className="space-y-6">
                    <div className={`p-5 min-h-20 rounded-2xl border flex flex-wrap gap-2 items-center transition-all ${sentenceIsCorrect === true ? "bg-brand-success/10 border-brand-success/30" : sentenceIsCorrect === false ? "bg-red-50 border-red-200" : "bg-brand-soft/40 border-purple-100/80"}`}>
                      {constructedSentence.length === 0 ? <span className="text-xs text-brand-dark/35 italic">Constructed sentence appears here…</span>
                        : constructedSentence.map((word, idx) => (
                          <button key={idx} onClick={() => handleRemoveBadge(word, idx)} className="px-3.5 py-2 rounded-xl bg-white border border-brand-light/30 shadow-sm text-xs font-bold text-brand-dark hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-1.5">{word}<span className="text-[9px] text-brand-dark/30">×</span></button>
                        ))}
                    </div>
                    {badges.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-[10px] font-bold text-brand-dark/50 uppercase tracking-wider">Word Bank</span>
                        <div className="flex flex-wrap gap-2.5">
                          {badges.map((word, idx) => <button key={idx} onClick={() => handleBadgeClick(word, idx)} className="px-4 py-2.5 rounded-xl bg-brand-bg text-brand-primary border border-brand-light/25 hover:border-brand-primary hover:bg-white text-xs font-bold transition-all hover:shadow-sm">{word}</button>)}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 flex-wrap">
                      <button onClick={checkSentenceBuilder} disabled={constructedSentence.length === 0} className={`px-6 py-3 rounded-xl text-xs font-bold text-white shadow-md transition-all ${constructedSentence.length > 0 ? "bg-brand-primary hover:bg-brand-light" : "bg-purple-200 cursor-not-allowed"}`}>Check Ordering</button>
                      <button onClick={resetSentenceBuilder} className="px-6 py-3 rounded-xl text-xs font-semibold text-brand-dark/70 border border-purple-100 hover:bg-brand-bg transition-all">Clear</button>
                      {sentenceIsCorrect === true  && <span className="text-xs font-bold text-brand-success">✨ Perfect!</span>}
                      {sentenceIsCorrect === false && <span className="text-xs font-bold text-red-500">❌ Not quite — rearrange and try again.</span>}
                    </div>
                  </div>
                </div>

                {/* Exercise C: Translation */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-purple-100 shadow-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-purple-50 mb-6">
                    <div><h4 className="font-bold text-brand-dark text-base">Exercise C: Vocabulary Translation</h4><p className="text-xs text-brand-dark/55 mt-0.5">Translate <strong>{'"Phenomenon"'}</strong> into your language.</p></div>
                    {translationIsCorrect === true && <span className="text-xs font-bold text-brand-success bg-brand-success/15 px-3 py-1 rounded-full">Completed ✓</span>}
                  </div>
                  <form onSubmit={checkTranslation} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input type="text" value={translationInput} onChange={(e) => setTranslationInput(e.target.value)} placeholder="Type your translation…"
                        className={`flex-1 px-4 py-3.5 rounded-2xl border text-sm font-medium focus:outline-none transition-all text-brand-dark ${translationIsCorrect === true ? "border-brand-success bg-brand-success/5" : translationIsCorrect === false ? "border-red-300 bg-red-50/20" : "border-purple-100 bg-brand-soft/50 focus:border-brand-primary focus:bg-white"}`} />
                      <button type="submit" className="px-6 py-3.5 rounded-2xl bg-brand-primary hover:bg-brand-light text-white font-bold text-xs shadow-md transition-all shrink-0">Submit</button>
                    </div>
                    {translationIsCorrect === true  && <p className="text-xs font-bold text-brand-success">✅ Perfect translation!</p>}
                    {translationIsCorrect === false && <div className="flex items-center justify-between"><p className="text-xs font-bold text-red-500">❌ Incorrect. Think of the natural spelling.</p><button type="button" onClick={resetTranslation} className="text-xs font-bold text-brand-primary hover:underline">Clear</button></div>}
                  </form>
                </div>
              </div>
            )}

            {/* ═══ BLOCK 3: PRONUNCIATION ═══ */}
            {activeBlock === "pronunciation" && (
              <div className="max-w-xl mx-auto space-y-5">
                <div className="bg-white rounded-3xl border border-purple-100 shadow-md p-6 md:p-8">
                  <div className="text-center pb-5 border-b border-purple-50 mb-6">
                    <h3 className="text-xl font-black text-brand-dark flex items-center justify-center gap-2">Pronunciation Coach <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">✨ AI Tips</span></h3>
                    <p className="text-xs text-brand-dark/50 mt-1">Speak the word — Gemini AI gives phonetic coaching.</p>
                  </div>
                  <div className="space-y-8 text-center">
                    <div className={`p-8 rounded-3xl border transition-all ${pronunciationResult === "correct" ? "bg-brand-success/10 border-brand-success/30" : pronunciationResult === "incorrect" ? "bg-red-50 border-red-200" : "bg-brand-bg/50 border-purple-100/50"}`}>
                      <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1.5">Word {pronunWordIndex + 1} of {pronunciationWords.length}</p>
                      <h4 className="text-4xl font-black text-brand-dark tracking-tight">{targetWord}</h4>
                      {spokenText && (
                        <div className="mt-5 border-t border-purple-50/50 pt-4">
                          <p className="text-[10px] font-bold text-brand-dark/40 uppercase">You Said:</p>
                          <p className={`text-base font-bold mt-1 ${pronunciationResult === "correct" ? "text-brand-success" : "text-red-500"}`}>{`"${spokenText}"`}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center items-center gap-6">
                      <button onClick={playTargetWord} title="Hear it" className="w-16 h-16 rounded-full bg-brand-bg text-brand-primary border border-brand-light/35 flex items-center justify-center text-xl shadow-md hover:scale-105 transition-transform">🔊</button>
                      <button onClick={startPronunListening} disabled={isListeningPronun}
                        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all relative ${isListeningPronun ? "bg-red-500 text-white animate-pulse shadow-red-500/20" : "bg-brand-primary hover:bg-brand-light text-white shadow-brand-primary/25 hover:scale-105"}`}>
                        {isListeningPronun ? <span className="flex items-center justify-center"><span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />🎙️</span> : "🎙️"}
                      </button>
                      <button onClick={() => { setPronunWordIndex((pronunWordIndex + 1) % pronunciationWords.length); setSpokenText(""); setPronunciationResult(null); setPronunAiTip(null); }} title="Next word" className="w-16 h-16 rounded-full bg-brand-bg text-brand-primary border border-brand-light/35 flex items-center justify-center text-lg shadow-md hover:scale-105 transition-transform">➡️</button>
                    </div>
                    <div className="h-6">
                      {isListeningPronun && <p className="text-xs font-bold text-red-500 animate-pulse">🎤 Listening… Speak now!</p>}
                      {pronunciationResult === "correct"   && <p className="text-xs font-bold text-brand-success">✨ Perfect pronunciation!</p>}
                      {pronunciationResult === "incorrect" && <p className="text-xs font-bold text-red-500">❌ Not quite — see AI tip below.</p>}
                    </div>
                  </div>
                </div>

                {/* AI Pronunciation Tip Card */}
                {(fetchingPronunTip || pronunAiTip) && (
                  <div className="bg-white rounded-3xl border border-violet-100 shadow-md p-6">
                    {fetchingPronunTip ? (
                      <div className="flex items-center gap-3 text-violet-600">
                        <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold">Gemini is building your phonetic tip…</span>
                      </div>
                    ) : pronunAiTip && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-violet-50 pb-3">
                          <span className="text-xl">🎯</span>
                          <h5 className="font-bold text-brand-dark text-sm">AI Pronunciation Guide</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-brand-bg p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-brand-dark/50 uppercase mb-1">IPA Phonetic</p>
                            <p className="font-black text-brand-primary text-base">{pronunAiTip.phonetic}</p>
                          </div>
                          <div className="bg-brand-bg p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-brand-dark/50 uppercase mb-1">Syllables</p>
                            <p className="font-black text-brand-dark text-sm">{pronunAiTip.syllables}</p>
                          </div>
                        </div>
                        <div className="bg-violet-50 p-4 rounded-xl border border-violet-100">
                          <p className="text-[10px] font-bold text-violet-500 uppercase mb-1">Coach Vibe Says</p>
                          <p className="text-xs text-violet-800 font-medium leading-relaxed">{pronunAiTip.tip}</p>
                        </div>
                        {pronunAiTip.mouthPosition && (
                          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Mouth Position</p>
                            <p className="text-xs text-amber-800 font-medium">{pronunAiTip.mouthPosition}</p>
                          </div>
                        )}
                        {pronunAiTip.practicePhrase && (
                          <div className="bg-brand-soft p-3 rounded-xl border border-purple-50">
                            <p className="text-[10px] font-bold text-brand-dark/50 uppercase mb-1">Practice Sentence</p>
                            <p className="text-xs text-brand-dark font-medium italic">{`"${pronunAiTip.practicePhrase}"`}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══ BLOCK 4: AI SPEAKING CLUB ═══ */}
            {activeBlock === "chat" && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-white rounded-3xl border border-purple-100 shadow-md flex flex-col h-[580px] overflow-hidden">
                  <div className="px-6 py-4 bg-brand-bg border-b border-purple-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-light text-white flex items-center justify-center text-lg font-bold shadow-md">✨</div>
                      <div>
                        <h3 className="font-bold text-brand-dark text-sm">Coach Vibe</h3>
                        <p className="text-[10px] text-brand-success font-bold flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-success" /> Gemini AI · Real Conversation</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-brand-dark/40 font-bold uppercase tracking-wider bg-white px-2.5 py-1 rounded-full border border-purple-50">🎙️ Speech + AI</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-soft/20">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm leading-relaxed ${msg.sender === "user" ? "bg-brand-primary text-white rounded-tr-none" : "bg-white text-brand-dark border border-purple-50 rounded-tl-none"}`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {isAiTyping && (
                      <div className="flex justify-start animate-pulse">
                        <div className="bg-white border border-purple-50 text-brand-dark/60 rounded-2xl rounded-tl-none px-4 py-3 text-xs italic flex items-center gap-2 font-semibold shadow-sm">
                          <span>Coach Vibe is typing</span>
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-100 flex items-center gap-3 bg-white shrink-0">
                    <button type="button" onClick={startChatDictation} className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all shrink-0 border ${isListeningChat ? "bg-red-500 text-white animate-pulse border-red-500" : "bg-brand-bg text-brand-primary border-purple-100 hover:border-brand-primary/40"}`} title="Speak">🎙️</button>
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={isListeningChat ? "Listening…" : "Type or speak your message…"} disabled={isListeningChat}
                      className="flex-1 px-4 py-3 rounded-xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-brand-dark text-sm placeholder-brand-dark/30 font-medium" />
                    <button type="submit" disabled={!chatInput.trim() || isListeningChat}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all shrink-0 shadow-md ${chatInput.trim() && !isListeningChat ? "bg-brand-primary hover:bg-brand-light shadow-brand-primary/15" : "bg-purple-200 cursor-not-allowed"}`}>
                      <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
                    </button>
                  </form>
                </div>

                {/* Grammar Corrections panel */}
                {corrections.length > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-700 flex items-center gap-2">📝 Grammar Corrections from Coach Vibe</p>
                    {corrections.map((c, i) => (
                      <div key={i} className="bg-white rounded-xl p-3 border border-amber-100 text-xs">
                        <span className="text-red-500 line-through font-medium">{c.wrong}</span>
                        <span className="mx-2 text-amber-400">→</span>
                        <span className="text-emerald-600 font-bold">{c.correct}</span>
                        {c.explanation && <p className="text-amber-700/70 mt-1">{c.explanation}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── 4-Block Grid ── */
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { key:"test",         emoji:"🧠", label:"English Level Test",    badge:"AI Assessed",   color:"bg-purple-50 text-brand-primary",  cta:"Start AI Diagnostics",   desc:"Answer 20 progressive grammar questions. Gemini AI analyses your answers and gives CEFR level, grammar breakdown, and a personalised 30-day study plan." },
              { key:"assignments",  emoji:"🧩", label:"Assignments Hub",       badge:"AI Feedback",   color:"bg-indigo-50 text-indigo-500",     cta:"Launch Assignments",     desc:"Complete matching, sentence ordering, and translation exercises. Gemini AI gives instant feedback and learning tips after each activity." },
              { key:"pronunciation",emoji:"🎙️", label:"Pronunciation Coach",  badge:"AI Phonetics",  color:"bg-emerald-50 text-brand-success", cta:"Open Audio Coach",       desc:"Speak target vocabulary and get AI phonetic guidance: IPA transcription, syllable breakdown, and mouth-position coaching from Coach Vibe." },
              { key:"chat",         emoji:"💬", label:"AI Speaking Club",      badge:"Real Gemini AI",color:"bg-violet-50 text-violet-500",     cta:"Talk to Coach Vibe",     desc:"Have real conversations with Gemini AI acting as your personal English coach. Speak or type — get responses, corrections, and encouragement." },
            ].map(block => (
              <div key={block.key} onClick={() => setActiveBlock(block.key)}
                className="p-8 rounded-3xl bg-white border border-purple-100 hover:border-brand-primary/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${block.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner`}>{block.emoji}</div>
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">✨ {block.badge}</span>
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-2.5">{block.label}</h3>
                <p className="text-brand-dark/65 text-sm leading-relaxed mb-6 font-medium">{block.desc}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-brand-primary group-hover:gap-3.5 transition-all"><span>{block.cta}</span><span>→</span></div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
