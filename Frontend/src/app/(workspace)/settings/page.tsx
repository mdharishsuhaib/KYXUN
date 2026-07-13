"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, BrainCircuit, User, Lock, LogOut, Mail } from "lucide-react";
import { getProfile, updateProfile, updatePassword, deleteAccount, clearSession, requestReauthentication, updateEmailAddress } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { validateEmail, validatePassword } from "@/lib/validation";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [reauthCode, setReauthCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    let alive = true;
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        router.replace("/login");
        return;
      }
      if (alive) {
        setEmail(user.email);
        const profile = await getProfile(user.email);
        if (profile) setName(profile.fullName || "");
        setLoading(false);
      }
    };
    fetchUser();
    return () => { alive = false; };
  }, [router]);

  const handleUpdateProfile = async () => {
    setMessage({ text: "Updating profile...", type: "info" });
    const success = await updateProfile(email, { fullName: name });
    if (success) {
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } else {
      setMessage({ text: "Failed to update profile.", type: "error" });
    }
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleUpdatePassword = async () => {
    const pwErr = validatePassword(newPass);
    if (pwErr) {
      setMessage({ text: pwErr, type: "error" });
      return;
    }
    if (!currentPass) {
      setMessage({ text: "Enter your current password first.", type: "error" });
      return;
    }
    setMessage({ text: "Updating password...", type: "info" });
    const { ok, error } = await updatePassword(email, currentPass, newPass, reauthCode.trim() || undefined);
    if (ok) {
      setMessage({ text: "Password updated successfully!", type: "success" });
      setCurrentPass("");
      setNewPass("");
      setReauthCode("");
    } else {
      setMessage({ text: error || "Failed to update password.", type: "error" });
    }
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleSendReauth = async () => {
    setMessage({ text: "Sending verification code...", type: "info" });
    const { ok, error } = await requestReauthentication();
    setMessage({
      text: ok ? "Verification code sent to your account email." : error || "Failed to send verification code.",
      type: ok ? "success" : "error",
    });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleUpdateEmail = async () => {
    const emailErr = validateEmail(newEmail);
    if (emailErr) {
      setMessage({ text: emailErr, type: "error" });
      return;
    }
    if (newEmail.toLowerCase() === email.toLowerCase()) {
      setMessage({ text: "Enter a different email address.", type: "error" });
      return;
    }
    setMessage({ text: "Starting secure email change...", type: "info" });
    const { ok, error } = await updateEmailAddress(newEmail);
    setMessage({
      text: ok ? "Confirmation links sent. Check both your current and new email addresses." : error || "Failed to start email change.",
      type: ok ? "success" : "error",
    });
    if (ok) setNewEmail("");
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and all your study data will be permanently lost.")) {
      const success = await deleteAccount(email);
      if (success) {
        router.replace("/");
      } else {
        setMessage({ text: "Failed to delete account. Please try again.", type: "error" });
      }
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen kyxun-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl kyxun-badge-indigo flex items-center justify-center animate-pulse">
            <BrainCircuit className="w-4 h-4  " />
          </div>
          <p className="text-xs kyxun-text-muted font-medium">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen kyxun-page">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 kyxun-text-muted" />
          <span className="text-[10px] font-black uppercase tracking-widest kyxun-text-muted">Settings</span>
        </div>
        <h1 className="font-outfit text-2xl font-black kyxun-text mb-8">Account Settings</h1>

        {message.text && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-bold ${
            message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
            message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="p-5 border kyxun-border bg-white/[0.02] rounded-2xl">
            <h2 className="text-sm font-black kyxun-text mb-4 flex items-center gap-2">
              <User className="w-4 h-4  " /> Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold kyxun-text-muted mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  disabled 
                  className="w-full bg-[var(--kyxun-hover-bg)] border kyxun-border rounded-xl px-4 py-2.5 text-sm kyxun-text-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold kyxun-text-muted mb-1">New Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-transparent border kyxun-border rounded-xl px-4 py-2.5 text-sm kyxun-text focus:outline-none focus:border-indigo-500/50"
                  placeholder="new-email@example.com"
                />
              </div>
              <button
                onClick={handleUpdateEmail}
                disabled={!newEmail}
                className="px-4 py-2 bg-cyan-500/10   border border-cyan-500/20 rounded-xl text-xs font-bold hover:bg-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" /> Change Email
              </button>
              <div>
                <label className="block text-xs font-bold kyxun-text-muted mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border kyxun-border rounded-xl px-4 py-2.5 text-sm kyxun-text focus:outline-none focus:border-indigo-500/50"
                  placeholder="Your full name"
                />
              </div>
              <button 
                onClick={handleUpdateProfile}
                disabled={!name}
                className="px-4 py-2 bg-[#26619C] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Profile
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div className="p-5 border kyxun-border bg-white/[0.02] rounded-2xl">
            <h2 className="text-sm font-black kyxun-text mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" /> Security
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold kyxun-text-muted mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full bg-transparent border kyxun-border rounded-xl px-4 py-2.5 text-sm kyxun-text focus:outline-none focus:border-emerald-500/50"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold kyxun-text-muted mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPass} 
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-transparent border kyxun-border rounded-xl px-4 py-2.5 text-sm kyxun-text focus:outline-none focus:border-emerald-500/50"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold kyxun-text-muted mb-1">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={reauthCode}
                  onChange={(e) => setReauthCode(e.target.value)}
                  className="w-full bg-transparent border kyxun-border rounded-xl px-4 py-2.5 text-sm kyxun-text focus:outline-none focus:border-emerald-500/50"
                  placeholder="Verification code from email"
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSendReauth}
                  className="px-4 py-2 bg-[var(--kyxun-hover-bg)] border kyxun-border rounded-xl text-xs font-bold hover:bg-[var(--kyxun-hover-bg)] kyxun-text transition-all cursor-pointer"
                >
                  Send Verification Code
                </button>
                <button 
                  onClick={handleUpdatePassword}
                  disabled={!currentPass || !newPass || !reauthCode}
                  className="px-4 py-2 bg-lime-500 text-slate-900 border border-lime-600 rounded-xl text-xs font-bold hover:bg-lime-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>



          {/* Danger Zone */}
          <div className="p-5 border border-red-500/50 bg-red-500/10 rounded-2xl">
            <p className="text-sm font-black text-red-400 mb-1">Danger Zone</p>
            <p className="text-xs kyxun-text-muted mb-4">Permanently delete your account and all study materials. This action cannot be undone.</p>
            <button 
              onClick={handleDeleteAccount}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
