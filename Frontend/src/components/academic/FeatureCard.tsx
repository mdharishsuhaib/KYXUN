"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
}

export default function FeatureCard({ title, eyebrow, icon: Icon, children, action }: FeatureCardProps) {
  return (
    <section className="glass-panel rounded-3xl overflow-hidden">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }} />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--kyxun-input-bg)", border: "1px solid var(--kyxun-border-soft)" }}>
              <Icon className="w-5 h-5" style={{ color: "var(--kyxun-accent)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest kyxun-text-subtle">{eyebrow}</p>
              <h2 className="font-outfit text-lg sm:text-xl font-bold kyxun-text leading-tight">{title}</h2>
            </div>
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}
