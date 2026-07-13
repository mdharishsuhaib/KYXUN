"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Shield, CreditCard, Palette, Key, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { validateEmail } from "@/lib/validation";

interface Props {
  open: boolean;
  email: string;
  onClose: () => void;
}

type Tab = "billing" | "notifications" | "security" | "privacy";

export default function SettingsModal({ open, email, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("billing");
  const [dataAI, setDataAI] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [reauthCode, setReauthCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeError, setEmailChangeError] = useState("");
  const [emailChangeSuccess, setEmailChangeSuccess] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const handlePasswordUpdate = async () => {
    if (!oldPass) {
      setPassError("Current password is required.");
      setPassSuccess("");
      return;
    }
    if (newPass.length < 8) {
      setPassError("New password must be at least 8 characters.");
      setPassSuccess("");
      return;
    }
    if (!reauthCode.trim()) {
      setPassError("Verification code is required.");
      setPassSuccess("");
      return;
    }
    const { updatePassword } = await import("@/lib/auth");
    const res = await updatePassword(email, oldPass, newPass, reauthCode.trim() || undefined);
    if (!res.ok) {
      setPassError(res.error || "Failed to update password.");
      setPassSuccess("");
    } else {
      setPassError("");
      setPassSuccess("Password updated successfully.");
      setOldPass("");
      setNewPass("");
      setReauthCode("");
    }
  };

  const handleSendReauth = async () => {
    setPassError("");
    setPassSuccess("");
    const { requestReauthentication } = await import("@/lib/auth");
    const res = await requestReauthentication();
    if (!res.ok) {
      setPassError(res.error || "Failed to send verification code.");
      return;
    }
    setPassSuccess("Verification code sent to your account email.");
  };

  const handleEmailChange = async () => {
    setEmailChangeError("");
    setEmailChangeSuccess("");
    const emailErr = validateEmail(newEmail);
    if (emailErr) {
      setEmailChangeError(emailErr);
      return;
    }
    if (newEmail.toLowerCase() === email.toLowerCase()) {
      setEmailChangeError("Enter a different email address.");
      return;
    }
    const { updateEmailAddress } = await import("@/lib/auth");
    const res = await updateEmailAddress(newEmail);
    if (!res.ok) {
      setEmailChangeError(res.error || "Failed to start email change.");
      return;
    }
    setEmailChangeSuccess("Confirmation links sent to both email addresses.");
    setNewEmail("");
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const tabs: { id: Tab; icon: typeof Bell; label: string }[] = [
    { id: "billing",       icon: CreditCard, label: "Billing" },
    { id: "notifications", icon: Bell,       label: "Notifications" },
    { id: "security",      icon: Key,        label: "Security" },
    { id: "privacy",       icon: Shield,     label: "Privacy" },
  ];

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="w-11 h-6 rounded-full relative transition-all cursor-pointer shrink-0"
      style={{ background: checked ? "var(--kyxun-accent)" : "var(--kyxun-input-border)" }}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? "calc(100% - 1.25rem)" : "0.25rem" }}
      />
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }} />
          <motion.div
            className="relative w-full max-w-lg rounded-3xl overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--kyxun-surface)", border: "1px solid var(--kyxun-border)" }}
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 24 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
          >
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }} />
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 id="settings-modal-title" className="font-outfit text-2xl font-bold kyxun-text">Settings</h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full kyxun-text-muted cursor-pointer"
                  style={{ border: "1px solid var(--kyxun-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--kyxun-hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex justify-between w-full p-1 rounded-xl mb-6" style={{ background: "var(--kyxun-input-bg)" }}>
                {tabs.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    style={
                      tab === id
                        ? { background: "var(--kyxun-surface)", color: "var(--kyxun-text)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }
                        : { color: "var(--kyxun-text-muted)" }
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Billing */}
              {tab === "billing" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl" style={{ background: "var(--kyxun-input-bg)", border: "1px solid var(--kyxun-border-soft)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold kyxun-text text-sm">Free Plan</p>
                        <p className="text-xs kyxun-text-subtle mt-0.5">Limited AI access</p>
                      </div>
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#26619C] text-white">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl" style={{ background: "var(--kyxun-input-bg)", border: "1px solid var(--kyxun-border-soft)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold kyxun-text text-sm">Pro Plan</p>
                        <p className="text-xs kyxun-text-subtle mt-0.5">Unlimited AI access</p>
                      </div>
                      <button className="px-4 py-1.5 text-xs font-bold rounded-full text-white bg-[#65A30D] transition-opacity hover:opacity-90 cursor-pointer">
                        Upgrade
                      </button>
                    </div>
                  </div>
                  <p className="text-xs kyxun-text-subtle">Account: {email}</p>
                </div>
              )}

              {/* Notifications */}
              {tab === "notifications" && (
                <div className="space-y-4">
                  {[
                    { label: "Email Updates", desc: "Receive occasional product updates", checked: emailUpdates, toggle: () => setEmailUpdates((v) => !v) },
                    { label: "Usage Analytics", desc: "Help improve Kyxun with anonymous usage data", checked: analytics, toggle: () => setAnalytics((v) => !v) },
                  ].map(({ label, desc, checked, toggle }) => (
                    <div key={label} className="flex items-center justify-between gap-4 p-4 rounded-xl" style={{ background: "var(--kyxun-input-bg)" }}>
                      <div>
                        <p className="text-sm font-medium kyxun-text">{label}</p>
                        <p className="text-xs kyxun-text-subtle mt-0.5">{desc}</p>
                      </div>
                      <Toggle checked={checked} onChange={toggle} />
                    </div>
                  ))}
                </div>
              )}

              {/* Security */}
              {tab === "security" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl" style={{ background: "var(--kyxun-input-bg)", border: "1px solid var(--kyxun-border-soft)" }}>
                    <p className="text-sm font-medium kyxun-text mb-4">Change Email</p>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="New email address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="input-field w-full"
                      />
                      {emailChangeError && <p className="text-xs text-red-500">{emailChangeError}</p>}
                      {emailChangeSuccess && <p className="text-xs text-green-500">{emailChangeSuccess}</p>}
                      <button onClick={handleEmailChange} disabled={!newEmail} className="px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#65A30D] hover:bg-[#52820A] transition-colors cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed" >
                        Send Confirmation Link
                      </button>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl" style={{ background: "var(--kyxun-input-bg)", border: "1px solid var(--kyxun-border-soft)" }}>
                    <p className="text-sm font-medium kyxun-text mb-4">Change Password</p>
                    <div className="space-y-3">
                      <div className="relative">
                        <input id="old-pass" type={showOldPass ? "text" : "password"} placeholder="Current Password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} className="input-field w-full pr-10" />
                        <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-1/2 -translate-y-1/2 kyxun-text-muted transition-colors hover:kyxun-text cursor-pointer" aria-label="Toggle password visibility">
                          {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <input id="new-pass" type={showNewPass ? "text" : "password"} placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="input-field w-full pr-10" />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 kyxun-text-muted transition-colors hover:kyxun-text cursor-pointer" aria-label="Toggle password visibility">
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Verification code from email *"
                        value={reauthCode}
                        onChange={(e) => setReauthCode(e.target.value)}
                        className="input-field w-full"
                      />
                      {passError && <p className="text-xs text-red-500">{passError}</p>}
                      {passSuccess && <p className="text-xs text-green-500">{passSuccess}</p>}
                      <button onClick={handleSendReauth} className="px-4 py-3 rounded-xl text-sm font-bold kyxun-text transition-colors cursor-pointer w-full" style={{ border: "1px solid var(--kyxun-border)", background: "var(--kyxun-surface)" }}>
                        Send Verification Code
                      </button>
                      <button onClick={handlePasswordUpdate} className="px-4 py-3 mt-2 rounded-xl text-sm font-bold text-white bg-[#65A30D] hover:bg-[#52820A] transition-colors cursor-pointer w-full">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy */}
              {tab === "privacy" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl" style={{ background: "var(--kyxun-input-bg)" }}>
                    <div>
                      <p className="text-sm font-medium kyxun-text">Share Data with AI</p>
                      <p className="text-xs kyxun-text-subtle mt-0.5">Allow AI to use your uploads for better responses</p>
                    </div>
                    <Toggle checked={dataAI} onChange={() => setDataAI((v) => !v)} />
                  </div>
                  <p className="text-xs kyxun-text-subtle leading-relaxed mb-6">
                    All uploaded content is processed server-side and never stored permanently. Your data stays private.
                  </p>

                  <div className="pt-4 border-t" style={{ borderColor: "var(--kyxun-border-soft)" }}>
                    <p className="text-sm font-bold text-red-500 mb-2">Danger Zone</p>
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-500/50 bg-red-500/10">
                      <div>
                        <p className="text-sm font-medium kyxun-text">Delete Account</p>
                        <p className="text-xs kyxun-text-subtle mt-0.5">Permanently remove your account.</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                            import("@/lib/auth").then(async ({ deleteAccount }) => {
                              if (await deleteAccount(email)) {
                                if ('caches' in window) {
                                  caches.keys().then((names) => {
                                    names.forEach(name => caches.delete(name));
                                  });
                                }
                                window.location.replace("/?reset=" + Date.now());
                              }
                            });
                          }
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
