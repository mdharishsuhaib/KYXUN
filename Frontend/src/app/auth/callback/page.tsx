"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        if (error) {
          throw new Error(errorDescription || error || "Authentication failed");
        }

        const { supabase } = await import("@/lib/supabase");
        const { saveSession } = await import("@/lib/auth");

        const code = searchParams.get("code");
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;

          if (data.session?.user) {
            const user = data.session.user;
            const sessionObj = {
              email: user.email!,
              fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email || "",
              photo: typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url.trim()
                ? user.user_metadata.avatar_url.trim()
                : typeof user.user_metadata?.picture === "string" && user.user_metadata.picture.trim()
                  ? user.user_metadata.picture.trim()
                  : "",
              id: user.id
            };
            saveSession(sessionObj);
            router.replace("/dashboard");
            return;
          }
        }

        // Fallback: Check standard getSession
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          const user = session.user;
          const sessionObj = {
            email: user.email!,
            fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email || "",
            photo: typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url.trim()
              ? user.user_metadata.avatar_url.trim()
              : typeof user.user_metadata?.picture === "string" && user.user_metadata.picture.trim()
                ? user.user_metadata.picture.trim()
                : "",
            id: user.id
          };
          saveSession(sessionObj);
          router.replace("/dashboard");
        } else {
          // Listen to auth state transitions in case exchange is happening asynchronously
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (currentSession?.user) {
              const user = currentSession.user;
              const sessionObj = {
                email: user.email!,
                fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email || "",
                photo: typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url.trim()
                  ? user.user_metadata.avatar_url.trim()
                  : typeof user.user_metadata?.picture === "string" && user.user_metadata.picture.trim()
                    ? user.user_metadata.picture.trim()
                    : "",
                id: user.id
              };
              saveSession(sessionObj);
              subscription.unsubscribe();
              router.replace("/dashboard");
            }
          });

          // Redirect to login on timeout
          setTimeout(() => {
            subscription.unsubscribe();
            router.replace("/login?error=timeout&description=Authentication+resolution+timed+out.");
          }, 6000);
        }
      } catch (err: any) {
        console.error("OAuth callback exchange failed:", err);
        setErrorMsg(err.message || "An unexpected error occurred.");
        setTimeout(() => {
          router.replace(`/login?error=oauth_error&description=${encodeURIComponent(err.message || "Unable to exchange external code")}`);
        }, 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0D17] kyxun-text p-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-4">
        {errorMsg ? (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-2xl font-bold">!</div>
            <h1 className="font-outfit text-xl font-bold kyxun-text">OAuth Verification Failed</h1>
            <p className="text-sm kyxun-text-muted leading-relaxed">{errorMsg}</p>
            <p className="text-xs kyxun-text-muted">Returning to login screen...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10   animate-spin" />
            <h1 className="font-outfit text-xl font-bold kyxun-text">Syncing Authenticated Profile</h1>
            <p className="text-xs kyxun-text-muted">Exchanging authorization credentials with Supabase...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0D17] kyxun-text p-4">
        <Loader2 className="w-10 h-10   animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
