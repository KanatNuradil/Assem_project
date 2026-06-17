"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

// Mock Fallback Students Data
const initialStudents = [
  { id: "1", name: "Emma Watson", email: "emma.watson@gmail.com", level: "B2", progress: 85, lastActive: "2 hours ago" },
  { id: "2", name: "Liam Neeson", email: "liam.neeson@outlook.com", level: "C1", progress: 92, lastActive: "1 day ago" },
  { id: "3", name: "Sophia Loren", email: "sophia.loren@yahoo.com", level: "A2", progress: 40, lastActive: "Just now" },
  { id: "4", name: "Daniel Craig", email: "daniel.craig@gmail.com", level: "B1", progress: 70, lastActive: "3 days ago" },
  { id: "5", name: "Olivia Colman", email: "olivia.colman@gmail.com", level: "C2", progress: 98, lastActive: "4 hours ago" },
  { id: "6", name: "George Clooney", email: "george@clooney.com", level: "B1", progress: 55, lastActive: "5 days ago" }
];

export default function TeacherDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("students"); // "students" or "create"
  const [teacherName, setTeacherName] = useState("Prof. Sarah Sterling");
  const [teacherId, setTeacherId] = useState("");
  const [students, setStudents] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDbFallback, setIsDbFallback] = useState(false);

  // Form states for creating assignments
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentType, setAssignmentType] = useState("matching"); // "matching", "sentence", "translation", "speech_practice"
  const [questionDetails, setQuestionDetails] = useState("");
  const [sentenceWords, setSentenceWords] = useState("");
  const [targetWord, setTargetWord] = useState("");
  const [translationAnswer, setTranslationAnswer] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assignmentComment, setAssignmentComment] = useState("");
  const [speechWords, setSpeechWords] = useState("");
  
  // Notification states
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // AI Speaking Club history modal states
  const [viewingChatStudent, setViewingChatStudent] = useState(null);
  const [studentChatHistory, setStudentChatHistory] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const handleViewSpeakingHistory = async (student) => {
    setViewingChatStudent(student);
    setIsLoadingChat(true);
    setStudentChatHistory([]);
    try {
      const { data, error } = await supabase
        .from("speaking_messages")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      
      if (data && data.length > 0) {
        const formatted = data.map(m => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          feedback: m.feedback,
          corrections: m.corrections || [],
          upgrade: m.upgrade,
          vocabBoost: m.vocab_boost,
          scores: m.scores,
          created_at: m.created_at
        }));
        setStudentChatHistory(formatted);
      } else {
        setStudentChatHistory([]);
      }
    } catch (err) {
      console.error("Error fetching student speaking history:", err);
    } finally {
      setIsLoadingChat(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("userName");
      const storedRole = localStorage.getItem("userRole");
      const storedId = localStorage.getItem("userId");
      
      if (storedName) setTeacherName(storedName);
      if (storedId) setTeacherId(storedId);
      
      // Safety check: redirect if not logged in or wrong role (mock validation)
      if (storedRole && storedRole !== "teacher") {
        router.push("/student");
        return;
      }
      
      // Fetch students and progress from Supabase
      fetchStudentsAndProgress();
    }
  }, [router]);

  // Fetch students list and calculate their progress dynamically
  const fetchStudentsAndProgress = async () => {
    try {
      // 1. Fetch profiles table with student role
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          current_level,
          created_at
        `)
        .eq("role", "student");

      if (profileError) throw profileError;

      // 2. Fetch total published assignments count to calculate progress percentages
      const { count: totalAssignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("id", { count: "exact", head: true });

      if (assignmentsError) throw assignmentsError;

      // 3. Fetch all progress records
      const { data: progressData, error: progressError } = await supabase
        .from("student_progress")
        .select("student_id, type");

      if (progressError) throw progressError;

      // Map progress data to students
      const mappedStudents = profiles.map((student) => {
        const studentTasks = progressData.filter(p => p.student_id === student.id && p.type === "assignment");
        const totalCompletedTasks = studentTasks.length;
        
        // Calculate progress percentage
        let progressPercent = 0;
        if (totalAssignments > 0) {
          progressPercent = Math.min(100, Math.round((totalCompletedTasks / totalAssignments) * 100));
        }

        // Calculate a last active placeholder
        return {
          id: student.id,
          name: student.full_name,
          email: student.email,
          level: student.current_level || "Not Tested",
          progress: progressPercent,
          lastActive: "Active recently"
        };
      });

      setStudents(mappedStudents);
      setIsDbFallback(false);
    } catch (err) {
      console.warn("Supabase fetch failed (Possibly SQL tables not created yet). Using mock data fallback.", err);
      // Fallback to initial mock data for presentation safety
      setStudents(initialStudents);
      setIsDbFallback(true);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Signout Error:", err);
    }
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    router.push("/login");
  };

  // Trigger Toast Notification
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4500);
  };

  // Handle Assignment Submission (writing to Supabase)
  const handlePublishAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentTitle.trim()) {
      alert("Please enter an assignment title.");
      return;
    }

    if (selectedStudentIds.length === 0) {
      alert("Please select at least one student for this assignment.");
      return;
    }

    // Prepare JSON content structure
    let contentPayload = {};
    if (assignmentType === "matching") {
      contentPayload = {
        instructions: questionDetails || "Synonym word match exercise.",
        pairs: [
          { english: "Acknowledge", translation: "Accept/Recognize" },
          { english: "Redundant", translation: "No longer needed" },
          { english: "Superficial", translation: "Only on the surface" },
          { english: "Mitigate", translation: "Make less severe" }
        ]
      };
    } else if (assignmentType === "sentence") {
      contentPayload = {
        instructions: "Arrange the shuffled word badges to construct a grammatically correct sentence.",
        sentence: questionDetails || "She speaks English fluently every day.",
        badges: sentenceWords ? sentenceWords.split(",").map(w => w.trim()) : ["fluently", "every", "speaks", "She", "day.", "English"]
      };
    } else if (assignmentType === "translation") {
      contentPayload = {
        instructions: "Write down the correct vocabulary translation.",
        word: targetWord || "Phenomenon",
        translation: translationAnswer || "құбылыс"
      };
    } else if (assignmentType === "speech_practice") {
      contentPayload = {
        instructions: "Listen and pronounce each word carefully.",
        words: speechWords ? speechWords.split(",").map(w => w.trim()).filter(Boolean).slice(0, 10) : []
      };
    }

    try {
      // If we are in DB fallback mode, just skip insert and show toast
      if (isDbFallback) {
        triggerToast(`Mock Published! Title: "${assignmentTitle}" (SQL Tables missing)`);
      } else {
        const { error } = await supabase
          .from("assignments")
          .insert({
            teacher_id: teacherId,
            title: assignmentTitle,
            type: assignmentType,
            content: contentPayload,
            assigned_student_ids: selectedStudentIds,
            comment: assignmentComment ? assignmentComment : null
          });

        if (error) throw error;

        triggerToast(`Assignment "${assignmentTitle}" successfully published to database!`);
        
        // Refresh list in background
        fetchStudentsAndProgress();
      }

      // Reset Form
      setAssignmentTitle("");
      setQuestionDetails("");
      setSentenceWords("");
      setTargetWord("");
      setTranslationAnswer("");
      setSpeechWords("");
      setAssignmentComment("");
      setSelectedStudentIds([]);
    } catch (err) {
      console.error("Assignment Publish Error:", err);
      alert(`Failed to publish assignment: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-soft flex flex-col md:flex-row relative">
      
      {/* Toast Notification (Success state: Mint Green) */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[100] max-w-sm w-full bg-brand-success text-white px-5 py-4 rounded-2xl shadow-xl shadow-brand-success/25 border border-emerald-400 flex items-start gap-3 animate-bounce">
          <span className="text-xl">✅</span>
          <div>
            <h4 className="font-bold text-sm">Publish Success!</h4>
            <p className="text-xs text-white/90 mt-1">{toastMessage}</p>
          </div>
          <button onClick={() => setShowToast(false)} className="ml-auto text-white hover:text-white/80 font-bold text-sm">
            ×
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-purple-100 flex flex-col justify-between shrink-0 z-40 transition-all ${isMobileMenuOpen ? "fixed inset-0" : "relative"}`}>
        <div>
          {/* Sidebar Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-purple-50">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-light flex items-center justify-center shadow-md shadow-brand-primary/10">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-brand-dark to-brand-primary bg-clip-text text-transparent">
                LingoVibe
              </span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1 rounded-lg hover:bg-brand-bg text-brand-dark"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Teacher Profile Info */}
          <div className="p-6 border-b border-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/15 border border-brand-primary/25 flex items-center justify-center text-brand-primary font-bold text-lg">
                🏫
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-brand-dark text-sm truncate">{teacherName}</h3>
                <p className="text-xs text-brand-primary font-bold uppercase tracking-wider mt-0.5">Teacher Dashboard</p>
              </div>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => { setActiveTab("students"); setIsMobileMenuOpen(false); }}
              className={`w-full px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all ${
                activeTab === "students"
                  ? "bg-brand-bg text-brand-primary shadow-sm"
                  : "text-brand-dark/70 hover:text-brand-primary hover:bg-brand-soft"
              }`}
            >
              <span className="text-base">🎓</span>
              My Students
            </button>
            <button
              onClick={() => { setActiveTab("create"); setIsMobileMenuOpen(false); }}
              className={`w-full px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all ${
                activeTab === "create"
                  ? "bg-brand-bg text-brand-primary shadow-sm"
                  : "text-brand-dark/70 hover:text-brand-primary hover:bg-brand-soft"
              }`}
            >
              <span className="text-base">📝</span>
              Create Assignment
            </button>
          </nav>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-purple-50">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all flex items-center gap-3"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Panel */}
        <header className="h-20 bg-white border-b border-purple-55 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-purple-100 hover:bg-brand-bg text-brand-dark"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-2xl font-black text-brand-dark">
              {activeTab === "students" ? "My Students" : "Create New Assignment"}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold text-brand-dark/60">
            {/* Database status pill removed */}
          </div>
        </header>

        {/* Dynamic Inner Tab Content */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full">
          
          {/* Tab 1: My Students */}
          {activeTab === "students" && (
            <div className="space-y-6">
              {/* Quick Analytics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-purple-100/60 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-brand-dark/50 font-bold uppercase tracking-wider">Total Enrolled</p>
                    <h4 className="text-3xl font-black text-brand-dark mt-1">{students.length}</h4>
                  </div>
                  <span className="text-3xl p-3 bg-brand-bg rounded-2xl">👥</span>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-purple-100/60 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-brand-dark/50 font-bold uppercase tracking-wider">Average Progress</p>
                    <h4 className="text-3xl font-black text-brand-dark mt-1">
                      {students.length > 0
                        ? `${Math.round(students.reduce((acc, curr) => acc + curr.progress, 0) / students.length)}%`
                        : "0%"}
                    </h4>
                  </div>
                  <span className="text-3xl p-3 bg-green-50 rounded-2xl">📈</span>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-purple-100/60 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-brand-dark/50 font-bold uppercase tracking-wider">Dashboard State</p>
                    <h4 className="text-base font-black text-brand-dark mt-3 uppercase tracking-wider">
                      {isDbFallback ? "Simulation" : "Production"}
                    </h4>
                  </div>
                  <span className="text-3xl p-3 bg-purple-50 rounded-2xl">👑</span>
                </div>
              </div>

              {/* Students Table/Card Container */}
              <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
                {/* Desktop Table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-bg/50 border-b border-purple-100 text-brand-dark/70 font-bold text-xs uppercase tracking-wider">
                        <th className="py-4.5 px-6">Name</th>
                        <th className="py-4.5 px-6">Email</th>
                        <th className="py-4.5 px-6 text-center">English Level</th>
                        <th className="py-4.5 px-6">Task Progress</th>
                        <th className="py-4.5 px-6">Last Active</th>
                        <th className="py-4.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50/50">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-brand-bg/25 transition-colors group">
                          <td className="py-4.5 px-6 font-bold text-brand-dark flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs">
                              {student.name ? student.name.split(" ").map(n=>n[0]).join("") : "S"}
                            </div>
                            {student.name || "Anonymous Student"}
                          </td>
                          <td className="py-4.5 px-6 text-sm text-brand-dark/65 font-medium">{student.email}</td>
                          <td className="py-4.5 px-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              student.level.includes("C1") || student.level.includes("C2") ? "bg-purple-100 text-brand-dark" :
                              student.level.includes("B1") || student.level.includes("B2") ? "bg-indigo-50 text-brand-primary" :
                              "bg-emerald-50 text-brand-success"
                            }`}>
                              {student.level}
                            </span>
                          </td>
                          <td className="py-4.5 px-6 w-1/4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-brand-bg h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-brand-primary h-full rounded-full transition-all duration-500"
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-brand-dark">{student.progress}%</span>
                            </div>
                          </td>
                          <td className="py-4.5 px-6 text-xs text-brand-dark/50 font-semibold">{student.lastActive}</td>
                          <td className="py-4.5 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleViewSpeakingHistory(student)}
                              className="px-3.5 py-1.5 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:text-violet-750 rounded-xl text-xs font-bold transition-all border border-violet-100/50 cursor-pointer"
                            >
                              💬 View Chat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Grid view */}
                <div className="md:hidden divide-y divide-purple-50">
                  {students.map((student) => (
                    <div key={student.id} className="p-6 space-y-4 hover:bg-brand-bg/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs">
                            {student.name ? student.name.split(" ").map(n=>n[0]).join("") : "S"}
                          </div>
                          <div>
                            <h4 className="font-bold text-brand-dark text-sm">{student.name || "Anonymous"}</h4>
                            <p className="text-xs text-brand-dark/55">{student.email}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          student.level.includes("C1") || student.level.includes("C2") ? "bg-purple-100 text-brand-dark" :
                          student.level.includes("B1") || student.level.includes("B2") ? "bg-indigo-50 text-brand-primary" :
                          "bg-emerald-50 text-brand-success"
                        }`}>
                          {student.level}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-brand-dark/60 font-semibold">Course Progress</span>
                          <span className="font-bold text-brand-dark">{student.progress}%</span>
                        </div>
                        <div className="w-full bg-brand-bg h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-primary h-full rounded-full"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-[11px] text-brand-dark/45 font-bold flex justify-between">
                        <span>Last login activity</span>
                        <span>{student.lastActive}</span>
                      </div>

                      <div className="pt-2 flex justify-end border-t border-purple-50/50 mt-3 pt-3">
                        <button
                          type="button"
                          onClick={() => handleViewSpeakingHistory(student)}
                          className="w-full py-2 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:text-violet-750 rounded-xl text-xs font-bold transition-all border border-violet-100/50 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          💬 View AI Speaking Club Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Create Assignment */}
          {activeTab === "create" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6 md:p-8">
                <h3 className="text-lg font-bold text-brand-dark mb-6 pb-4 border-b border-purple-50">
                  New Exercise Parameters
                </h3>
                
                <form onSubmit={handlePublishAssignment} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">
                      Assignment Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      placeholder="e.g. Intermediate Reading Check 1"
                      className="w-full px-4 py-3.5 rounded-2xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-brand-dark text-sm placeholder-brand-dark/30 font-medium"
                      required
                    />
                  </div>

                  {/* Select Target Students */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">
                      Assign to Students
                    </label>
                    <div className="p-4 rounded-2xl border border-purple-100 bg-brand-soft/50 max-h-40 overflow-y-auto space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-brand-dark cursor-pointer pb-2 border-b border-purple-100/50">
                        <input
                          type="checkbox"
                          checked={students.length > 0 && selectedStudentIds.length === students.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds(students.map(s => s.id));
                            } else {
                              setSelectedStudentIds([]);
                            }
                          }}
                          className="rounded text-brand-primary focus:ring-brand-primary"
                        />
                        <span>Select All Students ({students.length})</span>
                      </label>
                      
                      {students.map((student) => {
                        const isChecked = selectedStudentIds.includes(student.id);
                        return (
                          <label key={student.id} className="flex items-center gap-2 text-xs text-brand-dark cursor-pointer font-medium hover:text-brand-primary transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                } else {
                                  setSelectedStudentIds([...selectedStudentIds, student.id]);
                                }
                              }}
                              className="rounded text-brand-primary focus:ring-brand-primary"
                            />
                            <span>{student.name} ({student.email})</span>
                          </label>
                        );
                      })}
                      
                      {students.length === 0 && (
                        <p className="text-xs text-brand-dark/40 italic">No students registered yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Type Select */}
                  <div>
                    <label htmlFor="type" className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">
                      Assignment Type
                    </label>
                    <select
                      id="type"
                      value={assignmentType}
                      onChange={(e) => setAssignmentType(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-brand-dark text-sm font-semibold cursor-pointer"
                    >
                      <option value="matching">🎴 Word Matching Game</option>
                      <option value="sentence">🧩 Sentence Builder</option>
                      <option value="translation">🌐 Word Translation</option>
                      <option value="speech_practice">🗣️ Speech Practice (10 Words)</option>
                    </select>
                  </div>

                  {/* Conditional Assignment Inputs */}
                  {assignmentType === "matching" && (
                    <div className="p-5 rounded-2xl bg-brand-bg/40 border border-brand-primary/10 space-y-4">
                      <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Word Matching Pairs</h4>
                      <p className="text-xs text-brand-dark/60 leading-normal">
                        Students match key terms with translations. Configure sample pairs below.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="block text-[10px] font-bold text-brand-dark/50 uppercase mb-1.5">English Word</span>
                            <input
                              type="text"
                              value="Simultaneous"
                              disabled
                              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-100 bg-white/70 text-xs text-brand-dark/60 font-semibold"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-brand-dark/50 uppercase mb-1.5">Target Translation</span>
                            <input
                              type="text"
                              value="Simultaneo"
                              disabled
                              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-100 bg-white/70 text-xs text-brand-dark/60 font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-brand-dark/60 uppercase mb-1.5">Additional Prompt Context</label>
                          <textarea
                            rows={3}
                            value={questionDetails}
                            onChange={(e) => setQuestionDetails(e.target.value)}
                            placeholder="Connect synonyms. Match left items with right items correctly."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-xs text-brand-dark placeholder-brand-dark/30 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {assignmentType === "sentence" && (
                    <div className="p-5 rounded-2xl bg-brand-bg/40 border border-brand-primary/10 space-y-4">
                      <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Sentence Building Prompt</h4>
                      <p className="text-xs text-brand-dark/60 leading-normal">
                        Create an exercise where students order isolated word badges to construct a grammatically correct sentence.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="sentence-input" className="block text-[10px] font-bold text-brand-dark/60 uppercase mb-1.5">Full Correct Sentence</label>
                          <input
                            type="text"
                            id="sentence-input"
                            value={questionDetails}
                            onChange={(e) => setQuestionDetails(e.target.value)}
                            placeholder="e.g. She speaks English fluently every day."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-xs text-brand-dark placeholder-brand-dark/30 font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="badge-words" className="block text-[10px] font-bold text-brand-dark/60 uppercase mb-1.5">Shuffled Word Badges (comma separated)</label>
                          <input
                            type="text"
                            id="badge-words"
                            value={sentenceWords}
                            onChange={(e) => setSentenceWords(e.target.value)}
                            placeholder="e.g. fluently, day, She, English, speaks, every"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-xs text-brand-dark placeholder-brand-dark/30 font-medium"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {assignmentType === "translation" && (
                    <div className="p-5 rounded-2xl bg-brand-bg/40 border border-brand-primary/10 space-y-4">
                      <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Word Translation Parameters</h4>
                      <p className="text-xs text-brand-dark/60 leading-normal">
                        Prompt students to write down the exact vocabulary translation.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="target-word" className="block text-[10px] font-bold text-brand-dark/60 uppercase mb-1.5">Target English Word</label>
                          <input
                            type="text"
                            id="target-word"
                            value={targetWord}
                            onChange={(e) => setTargetWord(e.target.value)}
                            placeholder="e.g. Phenomenon"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-xs text-brand-dark placeholder-brand-dark/30 font-medium"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="translation-ans" className="block text-[10px] font-bold text-brand-dark/60 uppercase mb-1.5">Accepted Translation</label>
                          <input
                            type="text"
                            id="translation-ans"
                            value={translationAnswer}
                            onChange={(e) => setTranslationAnswer(e.target.value)}
                            placeholder="e.g. құбылыс"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-xs text-brand-dark placeholder-brand-dark/30 font-medium"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {assignmentType === "speech_practice" && (
                    <div className="p-5 rounded-2xl bg-brand-bg/40 border border-brand-primary/10 space-y-4">
                      <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Speech Practice Parameters</h4>
                      <p className="text-xs text-brand-dark/60 leading-normal">
                        Enter up to 10 vocabulary words or short phrases for the student to practice pronouncing.
                      </p>
                      
                      <div>
                        <label htmlFor="speech-words" className="block text-[10px] font-bold text-brand-dark/60 uppercase mb-1.5">Words for Pronunciation (comma separated, max 10)</label>
                        <input
                          type="text"
                          id="speech-words"
                          value={speechWords}
                          onChange={(e) => setSpeechWords(e.target.value)}
                          placeholder="e.g. Beautiful, Literature, Enthusiastic, Phenomenon"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-xs text-brand-dark placeholder-brand-dark/30 font-medium"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Teacher's Comment */}
                  <div>
                    <label htmlFor="comment" className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">
                      Comment / Note for Students
                    </label>
                    <textarea
                      id="comment"
                      rows={2}
                      value={assignmentComment}
                      onChange={(e) => setAssignmentComment(e.target.value)}
                      placeholder="e.g. Please finish this before our next speaking session on Friday."
                      className="w-full px-4 py-3.5 rounded-2xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-brand-dark text-sm placeholder-brand-dark/30 font-medium"
                    />
                  </div>

                  {/* Publish button */}
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-brand-primary hover:bg-brand-light text-white text-base font-bold shadow-lg shadow-brand-primary/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>📢</span>
                    Publish Assignment
                  </button>

                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Speaking History Modal */}
      {viewingChatStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4 md:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl h-[85vh] rounded-3xl border border-purple-100 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-brand-bg border-b border-purple-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-brand-dark text-base">
                  AI Speaking Club History
                </h3>
                <p className="text-xs text-brand-dark/60 font-semibold mt-0.5">
                  Student: <span className="text-brand-primary font-bold">{viewingChatStudent.name}</span> ({viewingChatStudent.email})
                </p>
              </div>
              <button
                onClick={() => setViewingChatStudent(null)}
                className="w-8 h-8 rounded-full bg-purple-50 text-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm border-0"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-soft/20">
              {isLoadingChat ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-brand-primary">
                  <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-bold">Loading conversation history…</span>
                </div>
              ) : studentChatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-brand-dark/50 p-6">
                  <span className="text-3xl mb-2">💬</span>
                  <p className="text-sm font-bold">No conversation history yet.</p>
                  <p className="text-xs mt-1">This student has not started any conversations in the AI Speaking Club.</p>
                </div>
              ) : (
                studentChatHistory.map((msg) => (
                  <div key={msg.id} className="space-y-1.5">
                    <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm leading-relaxed ${msg.sender === "user" ? "bg-brand-primary text-white rounded-tr-none" : "bg-white text-brand-dark border border-purple-50 rounded-tl-none"}`}>
                        <p>{msg.text}</p>
                      </div>
                    </div>

                    {/* Inline Feedback Card for Teacher */}
                    {msg.sender === "user" && (msg.feedback || msg.scores || msg.corrections?.length > 0 || msg.upgrade || msg.vocabBoost) && (
                      <div className="flex justify-end pr-2">
                        <div className="max-w-[85%] w-full border border-violet-100 bg-violet-50/90 rounded-2xl p-4 text-[12px] text-brand-dark font-medium shadow-sm space-y-3">
                          <div className="flex items-center gap-1.5 border-b border-violet-100 pb-1.5 font-bold text-violet-700">
                            <span>💡</span> AI Coach Review
                          </div>

                          {/* Greenline brief feedback */}
                          {msg.feedback && (
                            <div className="text-emerald-800 font-bold bg-emerald-50/60 border-l-2 border-emerald-500 px-2.5 py-1 rounded-r-lg leading-relaxed">
                              {msg.feedback}
                            </div>
                          )}

                          {/* Ratings */}
                          {msg.scores && (
                            <div className="grid grid-cols-3 gap-2 text-[10px]">
                              <div className="bg-blue-50/80 p-2 rounded-xl border border-blue-100/40">
                                <span className="block font-black text-blue-600 uppercase text-[8px] mb-0.5">🗣️ Fluency</span>
                                <span className="font-bold text-blue-900 leading-tight block">{msg.scores.fluency}</span>
                              </div>
                              <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-100/40">
                                <span className="block font-black text-emerald-600 uppercase text-[8px] mb-0.5">📚 Vocab</span>
                                <span className="font-bold text-emerald-900 leading-tight block">{msg.scores.vocabulary}</span>
                              </div>
                              <div className="bg-purple-50/80 p-2 rounded-xl border border-purple-100/40">
                                <span className="block font-black text-purple-600 uppercase text-[8px] mb-0.5">✍️ Grammar</span>
                                <span className="font-bold text-purple-900 leading-tight block">{msg.scores.grammar}</span>
                              </div>
                            </div>
                          )}

                          {/* Corrections */}
                          {msg.corrections && msg.corrections.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-amber-600 uppercase block tracking-wider">Corrections</span>
                              <div className="space-y-1.5">
                                {msg.corrections.map((c, idx) => (
                                  <div key={idx} className="bg-amber-50/60 rounded-lg p-2 border border-amber-100 text-[11px] leading-tight">
                                    <span className="text-red-500 line-through font-medium">{c.wrong}</span>
                                    <span className="mx-1.5 text-amber-500 font-bold">→</span>
                                    <span className="text-emerald-600 font-bold">{c.correct}</span>
                                    {c.explanation && <p className="text-amber-800/80 mt-0.5 text-[10px] font-semibold">{c.explanation}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Rephrasing */}
                          {msg.upgrade && (
                            <div className="bg-violet-100/50 p-2.5 rounded-xl border border-violet-200/40">
                              <span className="text-[9px] font-black text-violet-600 uppercase block mb-0.5">Native Rephrasing</span>
                              <p className="text-[11px] text-violet-900 font-semibold leading-relaxed">{msg.upgrade}</p>
                            </div>
                          )}

                          {/* Vocab Boost */}
                          {msg.vocabBoost && (
                            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/40">
                              <span className="text-[9px] font-black text-emerald-600 uppercase block mb-0.5">Vocabulary Boost</span>
                              <p className="text-[11px] text-emerald-900 font-semibold leading-relaxed">{msg.vocabBoost}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-brand-bg border-t border-purple-100 flex justify-end shrink-0">
              <button
                onClick={() => setViewingChatStudent(null)}
                className="px-6 py-2 bg-brand-primary hover:bg-brand-light text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
