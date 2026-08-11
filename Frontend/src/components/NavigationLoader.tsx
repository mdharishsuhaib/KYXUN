"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit } from "lucide-react";

export default function NavigationLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // We start loading on mount (for the initial entry)
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(pathname);

  // Trigger loading state on route change
  useEffect(() => {
    if (pathname !== currentPath) {
      setCurrentPath(pathname);
      setLoading(true);
      const t = setTimeout(() => {
        setLoading(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [pathname, currentPath]);

  // Initial load delay
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* The actual content (hidden while loading) */}
      <div style={{ display: loading ? "none" : "block", height: "100%" }}>
        {children}
      </div>

      {/* The 3 second animated loading screen */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center kyxun-page"
          >
             <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-indigo-500/40 border-r-2 border-transparent" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-b-2 border-purple-500/40 border-l-2 border-transparent" />
                <BrainCircuit className="w-8 h-8 kyxun-text animate-pulse" />
              </div>
              <p className="font-outfit text-sm font-black tracking-widest kyxun-text uppercase animate-pulse">
                Loading Workspace...
              </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
