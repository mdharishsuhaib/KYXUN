"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { Eye, EyeOff, BrainCircuit, Sun, Moon, ArrowLeft } from "lucide-react";
import { registerUser, saveSession } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { validateEmail, validatePassword, validateFullName } from "@/lib/validation";

export default function SignupPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const nameErr = validateFullName(fullName);
    if (nameErr) { setError(nameErr); return; }
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const result = await registerUser(email, fullName, password);
    setLoading(false);

    if (!result.ok) { setError(result.error ?? "Registration failed."); return; }
    if (result.needsEmailConfirmation) {
      setSuccess("Check your email to confirm your account before signing in.");
      setPassword("");
      return;
    }
    if (result.session) {
      saveSession(result.session);
      router.push("/dashboard");
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);
    const { signInWithGoogle } = await import("@/lib/auth");
    const result = await signInWithGoogle();
    if (!result.ok) {
      setGoogleLoading(false);
      setError(result.error || "Google Sign-Up failed.");
    }
  };

  return (
    <main id="main-content" className="kyxun-page min-h-screen flex flex-col items-center justify-center relative p-4">
      <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[140px] pointer-events-none" style={{ background: "rgba(99,102,241,0.07)" }} />
      <div className="fixed bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[140px] pointer-events-none" style={{ background: "rgba(255,51,102,0.07)" }} />

      <div className="absolute top-4 left-4 z-50">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg kyxun-hover kyxun-text-muted transition-all cursor-pointer text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="absolute top-4 right-4 z-50">
        <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full kyxun-hover kyxun-text-muted transition-all cursor-pointer" aria-label="Toggle theme">
          {isDark ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2.5 mb-10 group cursor-default">
          <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform drop-shadow-md dark:drop-shadow-[0_0_20px_rgba(163,230,53,0.7)]">
            <img 
              src="/logo_white_icon.png" 
              alt="Kyxun Logo" 
              className="w-full h-full object-contain dark:hidden" 
            />
            <img 
              src="/logo_white_icon.png" 
              alt="Kyxun Logo" 
              className="w-full h-full object-contain hidden dark:block" 
            />
          </div>
          <span className="font-outfit text-3xl font-bold leading-none kyxun-text">
            Kyxun
          </span>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }} />
          <div className="p-8">
            <h1 className="font-outfit text-2xl font-bold kyxun-text mb-1">Create your account</h1>
            <p className="kyxun-text-muted text-sm mb-8">Free forever. No credit card required.</p>

            {error && (
              <div className="mb-5 p-3 rounded-xl text-sm text-red-400" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 p-3 rounded-xl text-sm text-green-400" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium kyxun-text-muted">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium kyxun-text-muted">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium kyxun-text-muted">Password</label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Min. 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 kyxun-text-subtle hover:kyxun-text-muted transition-colors cursor-pointer"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-[#65A30D] transition-all mt-2 cursor-pointer disabled:opacity-70 hover:opacity-90"
              >
                {loading ? "Creating account…" : "Get Started"}
              </button>
            </form>

            <div className="relative my-6 flex items-center">
              <div className="flex-grow border-t border-[var(--kyxun-border)]"></div>
              <span className="flex-shrink mx-4 text-xs kyxun-text-subtle uppercase font-mono">Or</span>
              <div className="flex-grow border-t border-[var(--kyxun-border)]"></div>
            </div>

            <button
              onClick={handleGoogleSignUp}
              type="button"
              disabled={googleLoading}
              className="w-full py-3 rounded-xl border border-[var(--kyxun-border)] bg-[var(--kyxun-surface)] hover:bg-[var(--kyxun-hover-bg)] transition-all kyxun-text text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Opening Google..." : "Sign up with Google"}
            </button>

            <p className="text-center text-sm kyxun-text-muted mt-6">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold" style={{ color: "var(--kyxun-accent)" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
