"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { Eye, EyeOff, BrainCircuit, Sun, Moon, ArrowLeft } from "lucide-react";
import { registerUser, saveSession } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { validateEmail, validatePassword, validateFullName } from "@/lib/validation";
import { GoogleLogin } from "@react-oauth/google";

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

  // handleGoogleSignUp removed since we use GoogleLogin component inline

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

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    setError("");
                    setGoogleLoading(true);
                    const { signInWithGoogle } = await import("@/lib/auth");
                    const result = await signInWithGoogle(credentialResponse.credential);
                    setGoogleLoading(false);
                    if (!result.ok) {
                      setError(result.error || "Google Sign-Up failed.");
                    } else {
                      router.push("/dashboard");
                    }
                  }
                }}
                onError={() => {
                  setError("Google Sign-Up failed.");
                }}
                type="standard"
                logo_alignment="left"
                text="signup_with"
                width="340"
              />
            </div>

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
