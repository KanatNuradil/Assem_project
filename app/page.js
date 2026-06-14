import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-brand-bg via-brand-soft to-white overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-brand-light/20 blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-primary/10 blur-3xl -z-10 animate-pulse" style={{ animationDuration: '8s' }} />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass border-b border-purple-100 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-light flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-dark to-brand-primary bg-clip-text text-transparent">
              LingoVibe
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 font-medium text-brand-dark/80">
            <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
            <a href="#about" className="hover:text-brand-primary transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-brand-primary transition-colors">Community</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="px-5 py-2.5 rounded-full text-brand-dark font-medium hover:text-brand-primary hover:bg-brand-bg transition-all">
              Sign In
            </Link>
            <Link href="/login?tab=register" className="px-6 py-2.5 rounded-full bg-brand-primary hover:bg-brand-light text-white font-medium shadow-md shadow-brand-primary/25 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left">
          <div className="inline-flex items-center gap-2 self-center lg:self-start px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-semibold text-sm mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
            Empowering 50,000+ Active Learners Worldwide
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-brand-dark leading-tight tracking-tight mb-6">
            Master English with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-primary to-purple-600 bg-clip-text text-transparent">
              Interactive Vibrancy
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-brand-dark/70 font-normal leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
            Experience LingoVibe. Evaluate your English level, tackle customized homework exercises, polish pronunciation with instant Web Speech diagnostics, and join the AI Speaking Club for conversational fluency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-primary hover:bg-brand-light text-white text-lg font-bold shadow-xl shadow-brand-primary/20 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              Start Learning Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-brand-bg text-brand-dark border border-purple-100 hover:border-brand-primary/30 text-lg font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center">
              Explore Features
            </a>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="lg:col-span-5 relative flex items-center justify-center">
          <div className="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-brand-light to-brand-primary shadow-2xl shadow-brand-primary/30 overflow-hidden animate-float">
            {/* Inner Dashboard Preview Grid */}
            <div className="absolute inset-4 rounded-2xl bg-white/95 backdrop-blur shadow-inner p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-purple-50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-brand-primary font-bold">JD</div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-dark">John Doe</h4>
                    <p className="text-xs text-brand-primary font-medium">Student • Level B2</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-brand-success/15 border border-brand-success/20 text-brand-success font-bold text-xs">
                  84% Progress
                </div>
              </div>

              {/* Mock Speaking Card */}
              <div className="my-auto py-4 flex flex-col gap-3">
                <div className="p-3.5 rounded-2xl bg-brand-bg border border-brand-light/35 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-white shadow-sm text-brand-primary font-bold">🎙️</span>
                    <div>
                      <p className="text-xs text-brand-dark/60 font-semibold uppercase tracking-wider">Pronunciation Word</p>
                      <h5 className="font-black text-brand-dark text-base">Beautiful</h5>
                    </div>
                  </div>
                  <span className="w-3 h-3 rounded-full bg-brand-success" />
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-primary/10 border border-brand-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-white shadow-sm text-brand-primary font-bold">🤖</span>
                    <div>
                      <p className="text-xs text-brand-primary font-bold">AI Speaking Club</p>
                      <p className="text-xs text-brand-dark/80 italic">AI is typing...</p>
                    </div>
                  </div>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>

              {/* Visual Stats */}
              <div className="flex justify-between items-center gap-4 bg-brand-bg/50 p-3 rounded-xl border border-purple-50">
                <span className="text-xs font-semibold text-brand-dark/70">Daily English Streak</span>
                <span className="text-sm font-bold text-brand-primary">🔥 12 Days</span>
              </div>
            </div>
          </div>
          {/* Back Drop Decorative Elements */}
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-3xl bg-brand-success/20 blur-xl animate-float-delayed" />
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-brand-primary/30 blur-lg animate-float" />
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="relative py-24 bg-white/70 backdrop-blur-md border-t border-purple-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-brand-dark tracking-tight mb-4">
              Comprehensive 4-Core Learning Blocks
            </h2>
            <p className="text-lg text-brand-dark/60">
              LingoVibe wraps complex language learning paradigms into clean, modular, and extremely engaging workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-brand-bg/40 border border-purple-100 hover:border-brand-primary/30 hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-brand-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-3">Level Test</h3>
              <p className="text-brand-dark/70 leading-relaxed text-sm">
                Take an interactive 20-question diagnostic exam from Elementary to Upper-Intermediate. Get certified dynamically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-brand-bg/40 border border-purple-100 hover:border-brand-primary/30 hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-brand-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-3">Assignments Hub</h3>
              <p className="text-brand-dark/70 leading-relaxed text-sm">
                Tackle custom word matching games, drag-and-click sentence construction, and writing translations in high-fidelity layouts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-brand-bg/40 border border-purple-100 hover:border-brand-primary/30 hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-brand-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-3">Speech Practice</h3>
              <p className="text-brand-dark/70 leading-relaxed text-sm">
                Hear correct accents using Web Speech Synthesis and speak into your mic to obtain instant, color-coded precision grades.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-brand-bg/40 border border-purple-100 hover:border-brand-primary/30 hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-brand-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-3">AI Speaking Club</h3>
              <p className="text-brand-dark/70 leading-relaxed text-sm">
                Chat textually or dictate with voice commands. Experience responsive teaching partners with realistic typing feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark py-12 text-white/60 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white tracking-wider uppercase">LingoVibe</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
