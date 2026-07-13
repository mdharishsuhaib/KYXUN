"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X } from "lucide-react";
import { updateProfile, getProfile } from "@/lib/auth";
import AvatarImage from "@/components/AvatarImage";

interface Props {
  open: boolean;
  email: string;
  fullName: string;
  onClose: () => void;
  onSaved: (newName: string) => void;
}

export default function ProfileModal({ open, email, fullName, onClose, onSaved }: Props) {
  const [name, setName] = useState(fullName);
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(fullName);
    setError("");
    setSuccess(false);
    const loadProfile = async () => {
      try {
        const p = await getProfile(email);
        if (p?.photo) setPhoto(p.photo);
      } catch (err) {
        console.error("Failed to load profile photo:", err);
      }
    };
    loadProfile();
  }, [open, fullName, email]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setError("Please enter a valid full name.");
      return;
    }
    setSaving(true);
    setError("");
    await new Promise((r) => setTimeout(r, 600));
    updateProfile(email, { fullName: name.trim(), ...(photo ? { photo } : {}) });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => { onSaved(name.trim()); onClose(); }, 900);
  };

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
            className="relative w-full max-w-md rounded-3xl overflow-hidden z-10"
            style={{ background: "var(--kyxun-surface)", border: "1px solid var(--kyxun-border)" }}
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 24 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
          >
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }} />
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 id="profile-modal-title" className="font-outfit text-2xl font-bold kyxun-text">
                  Edit Profile
                </h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full kyxun-text-muted cursor-pointer"
                  style={{ border: "1px solid var(--kyxun-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--kyxun-hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  aria-label="Close profile"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center kyxun-text text-2xl font-bold overflow-hidden"
                    style={{ background: photo ? "transparent" : "var(--kyxun-avatar-gradient)" }}
                  >
                    {photo ? (
                      <AvatarImage
                        src={photo}
                        alt={name}
                        className="w-full h-full object-cover"
                        fallback={<span className="text-2xl font-bold">{initials}</span>}
                        fallbackClassName="w-full h-full flex items-center justify-center"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center kyxun-text cursor-pointer shadow-lg"
                    style={{ background: "var(--kyxun-accent)" }}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </div>
                <p className="text-xs kyxun-text-subtle mt-3">Click the camera icon to change your photo</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium kyxun-text-muted">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium kyxun-text-muted">Email</label>
                  <input type="email" value={email} disabled className="input-field opacity-50 cursor-not-allowed" />
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

              <button onClick={handleSave} disabled={saving || success} className="w-full mt-6 py-3 rounded-xl font-bold text-white bg-[#65A30D] transition-all cursor-pointer disabled:opacity-70 hover:opacity-90" style={success ? { background: "var(--kyxun-success)" } : {}} >
                {saving ? "Saving…" : success ? "✓ Saved!" : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
