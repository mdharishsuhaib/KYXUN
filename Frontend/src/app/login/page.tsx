"use client";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, BrainCircuit, Sun, Moon, ArrowLeft, Mail } from "lucide-react";
import { loginUser, saveSession, requestPasswordReset } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { validateEmail, validatePassword } from "@/lib/validation";
import { GoogleLogin } from "@react-oauth/google";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Using GoogleLogin component below instead of useGoogleLogin hook

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const descParam = searchParams.get("error_description") || searchParams.get("description");
    if (errorParam) {
      setError(descParam || errorParam || "Authentication failed.");
    }
  }, [searchParams]);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");


  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    const emailErr = validateEmail(forgotEmail);
    if (emailErr) { setForgotError(emailErr); return; }
    setForgotLoading(true);
    const result = await requestPasswordReset(forgotEmail);
    setForgotLoading(false);
    if (!result.ok) {
      setForgotError(result.error ?? "Failed to send reset email.");
    } else {
      setForgotSuccess("Reset email sent. Open the link to choose a new password.");
      setTimeout(() => {
        setForgotOpen(false);
        setForgotSuccess("");
        setForgotEmail("");
      }, 2000);
    }
  };



  // Using GoogleLogin component inline

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const result = await loginUser(email, password);
    setLoading(false);

    if (!result.ok) { setError(result.error ?? "Login failed."); return; }
    saveSession(result.session!);
    router.push("/dashboard");
  };

  return (
    <main id="main-content" className="kyxun-page min-h-screen flex flex-col items-center justify-center relative p-4">
      {/* Background orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[140px] pointer-events-none" style={{ background: "rgba(99,102,241,0.07)" }} />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[140px] pointer-events-none" style={{ background: "rgba(255,51,102,0.07)" }} />

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
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10 group cursor-default">
          <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform drop-shadow-md dark:drop-shadow-[0_0_20px_rgba(163,230,53,0.7)]">
            <img 
              src="/logo_white_icon.webp" 
              alt="Kyxun Logo" 
              className="w-full h-full object-contain dark:hidden" 
            />
            <img 
              src="/logo_white_icon.webp" 
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
            <h1 className="font-outfit text-2xl font-bold kyxun-text mb-1">Welcome back</h1>
            <p className="kyxun-text-muted text-sm mb-8">Sign in to access your survival plans.</p>

            {error && (
              <div className="mb-5 p-3 rounded-xl text-sm text-red-400" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium kyxun-text-muted">Email</label>
                <input
                  id="login-email"
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium kyxun-text-muted">Password</label>
                  <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-semibold kyxun-text-subtle hover:text-[var(--kyxun-accent)] transition-colors cursor-pointer">Forgot Password?</button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
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
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-[#65A30D] transition-all mt-2 cursor-pointer disabled:opacity-70 hover:opacity-90"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className="relative my-6 flex items-center">
              <div className="flex-grow border-t border-[var(--kyxun-border)]"></div>
              <span className="flex-shrink mx-4 text-xs kyxun-text-subtle uppercase font-mono">Or</span>
              <div className="flex-grow border-t border-[var(--kyxun-border)]"></div>
            </div>

            <div className="flex justify-center mt-4">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setError("");
                  setLoading(true);
                  const { signInWithGoogle } = await import("@/lib/auth");
                  const result = await signInWithGoogle(credentialResponse.credential as string);
                  setLoading(false);
                  if (!result.ok) {
                    setError(result.error || "Google Sign-In failed.");
                  } else {
                    router.push("/dashboard");
                  }
                }}
                onError={() => setError("Google Sign-In failed.")}
                useOneTap
                theme={isDark ? "filled_black" : "outline"}
                shape="rectangular"
              />
            </div>


            <p className="text-center text-sm kyxun-text-muted mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold" style={{ color: "var(--kyxun-accent)" }}>
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {forgotOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }} onClick={() => setForgotOpen(false)} />
            <motion.div
              className="relative w-full max-w-md rounded-3xl overflow-hidden z-10 p-8"
              style={{ background: "var(--kyxun-surface)", border: "1px solid var(--kyxun-border)" }}
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24 }}
            >
              <h2 className="font-outfit text-2xl font-bold kyxun-text mb-2">Reset Password</h2>
              <p className="kyxun-text-muted text-sm mb-6">Enter your email and we will send a password reset link.</p>
              
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="input-field w-full"
                  placeholder="Your Email Address"
                  required
                />
                {forgotError && <p className="text-xs text-red-500 mt-1">{forgotError}</p>}
                {forgotSuccess && <p className="text-xs text-green-500 mt-1">{forgotSuccess}</p>}
                
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setForgotOpen(false)} className="flex-1 py-3 rounded-xl font-semibold text-sm kyxun-text transition-all cursor-pointer" style={{ background: "var(--kyxun-input-bg)", border: "1px solid var(--kyxun-border)" }}>Cancel</button>
                  <button type="submit" disabled={forgotLoading} className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-[var(--kyxun-accent)] transition-all cursor-pointer disabled:opacity-70">{forgotLoading ? "Sending..." : "Send Reset Link"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="kyxun-page min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
