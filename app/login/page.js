"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State variables
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("student"); // "student" or "teacher"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Sync tab query parameter if present
  useEffect(() => {
    const tab = searchParams.get("tab");
    setTimeout(() => {
      if (tab === "register") {
        setIsLogin(false);
      } else {
        setIsLogin(true);
      }
    }, 0);
  }, [searchParams]);

  // Handle Supabase auth form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password || (!isLogin && !name)) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // 1. Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // Fetch public profile role and name
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Profile Fetch Error:", profileError);
          }

          // Fallback to metadata if profile database trigger didn't replicate yet
          const userRole = profile?.role || data.user.user_metadata?.role || "student";
          const userName = profile?.full_name || data.user.user_metadata?.full_name || "Alex Johnson";
          const userLevel = profile?.current_level || "Not Tested";

          // Store credentials in localStorage for local state accessibility
          localStorage.setItem("userId", data.user.id);
          localStorage.setItem("userRole", userRole);
          localStorage.setItem("userEmail", data.user.email || "");
          localStorage.setItem("userName", userName);
          localStorage.setItem("userLevel", userLevel);

          // Route depending on role
          if (userRole === "teacher") {
            router.push("/teacher");
          } else {
            router.push("/student");
          }
        }
      } else {
        // 2. Registration (Sign Up)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
            data: {
              role: role,
              full_name: name,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          // If the user needs to confirm their email
          if (data.session === null) {
            setSuccessMessage("Registration successful! Please check your email to verify your account.");
            // Reset inputs
            setEmail("");
            setPassword("");
            setName("");
            setIsLogin(true);
          } else {
            // Auto logged in (e.g. email verification disabled in Supabase config)
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("userRole", role);
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userName", name);
            localStorage.setItem("userLevel", "Not Tested");

            if (role === "teacher") {
              router.push("/teacher");
            } else {
              router.push("/student");
            }
          }
        }
      }
    } catch (err) {
      console.error("Auth Exception:", err);
      setErrorMessage(err.message || "An unexpected authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-brand-bg via-brand-soft to-white px-6 py-12 relative overflow-hidden">
      {/* Decorative Spheres */}
      <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-brand-light/25 blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full bg-brand-primary/10 blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s' }} />

      <div className="w-full max-w-md">
        {/* Logo Link */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-light flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-dark to-brand-primary bg-clip-text text-transparent">
              LingoVibe
            </span>
          </Link>
          <p className="text-sm text-brand-dark/60 mt-2 font-medium">Elevating language education, together.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-purple-100 rounded-3xl shadow-xl p-8 relative">
          {/* Form Header Tabs */}
          <div className="flex bg-brand-bg/75 p-1 rounded-2xl mb-8 border border-purple-100">
            <button
              onClick={() => { setIsLogin(true); setErrorMessage(""); setSuccessMessage(""); }}
              className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all ${isLogin ? "bg-white text-brand-dark shadow-sm" : "text-brand-dark/65 hover:text-brand-dark"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setErrorMessage(""); setSuccessMessage(""); }}
              className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all ${!isLogin ? "bg-white text-brand-dark shadow-sm" : "text-brand-dark/65 hover:text-brand-dark"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
                ⚠️ {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                ✅ {successMessage}
              </div>
            )}

            {/* Role Selection */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2.5">
                  I am registering as a:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`py-3.5 px-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
                      role === "student"
                        ? "border-brand-primary bg-brand-bg text-brand-primary shadow-sm ring-2 ring-brand-primary/20"
                        : "border-purple-100 bg-brand-soft/50 text-brand-dark hover:border-brand-primary/30"
                    }`}
                  >
                    <span className="text-base">🎓</span>
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("teacher")}
                    className={`py-3.5 px-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
                      role === "teacher"
                        ? "border-brand-primary bg-brand-bg text-brand-primary shadow-sm ring-2 ring-brand-primary/20"
                        : "border-purple-100 bg-brand-soft/50 text-brand-dark hover:border-brand-primary/30"
                    }`}
                  >
                    <span className="text-base">💼</span>
                    Teacher
                  </button>
                </div>
              </div>
            )}

            {/* Name (Registration Only) */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full px-4 py-3.5 rounded-2xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-brand-dark text-sm placeholder-brand-dark/30 font-medium"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full px-4 py-3.5 rounded-2xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-brand-dark text-sm placeholder-brand-dark/30 font-medium"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-2xl border border-purple-100 bg-brand-soft/50 focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-brand-dark text-sm placeholder-brand-dark/30 font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl bg-brand-primary hover:bg-brand-light text-white text-base font-bold shadow-lg shadow-brand-primary/25 transition-all flex items-center justify-center gap-3 ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Register Now"
              )}
            </button>
          </form>

          {/* Quick Mock Credentials TIP */}
          <div className="mt-6 border-t border-purple-50 pt-5 text-center">
            <span className="text-xs text-brand-dark/50 font-medium bg-brand-bg px-3 py-1.5 rounded-full inline-block">
              💡 Tip: Login using your Supabase Auth account.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
