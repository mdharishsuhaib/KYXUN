"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BrainCircuit, Eye, EyeOff, Loader2 } from "lucide-react";
import { resetPassword, clearSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { validatePassword } from "@/lib/validation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let alive = true;

    const prepareRecoverySession = async () => {
      setChecking(true);
      setError("");

      const urlError = searchParams.get("error");
      const description = searchParams.get("error_description") || searchParams.get("description");
      if (urlError) {
        setError(description || urlError);
        setChecking(false);
        return;
      }

      try {
        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (alive) {
          setReady(Boolean(data.session));
          if (!data.session) {
            setError("Open the latest password reset link from your email to continue.");
          }
        }
      } catch (err: unknown) {
        if (alive) {
          setError((err as Error).message || "Unable to open the reset session.");
        }
      } finally {
        if (alive) setChecking(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setError("");
        setChecking(false);
      }
    });

    prepareRecoverySession();

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }

    setLoading(true);
    const result = await resetPassword(password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error || "Failed to update password.");
      return;
    }

    setSuccess("Password updated. Supabase will send the password changed alert.");
    setPassword("");
    setTimeout(() => {
      clearSession();
      router.replace("/login");
    }, 1800);
  };

  return (
    <main className="kyxun-page min-h-screen flex flex-col items-center justify-center relative p-4">
      <div className="absolute top-4 left-4 z-50">
        <Link href="/login" className="flex items-center gap-2 px-3 py-2 rounded-lg kyxun-hover kyxun-text-muted transition-all cursor-pointer text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </div>

      <div className="w-full max-w-md">
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
          <span className="font-outfit text-3xl font-bold leading-none kyxun-text">Kyxun</span>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }} />
          <div className="p-8">
            <h1 className="font-outfit text-2xl font-bold kyxun-text mb-1">Set a new password</h1>
            <p className="kyxun-text-muted text-sm mb-8">Use the password reset link from your email to continue.</p>

            {checking && (
              <div className="mb-5 p-3 rounded-xl text-sm kyxun-text-muted flex items-center gap-2" style={{ background: "var(--kyxun-input-bg)", border: "1px solid var(--kyxun-border)" }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Checking reset link...
              </div>
            )}
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
                <label className="text-sm font-medium kyxun-text-muted">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Min. 8 characters"
                    disabled={!ready || loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 kyxun-text-subtle hover:kyxun-text-muted transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={!ready || loading} className="w-full py-3.5 rounded-xl font-bold text-white bg-[var(--kyxun-accent)] transition-all mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="kyxun-page min-h-screen flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10   animate-spin" />
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
