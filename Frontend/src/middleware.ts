import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Inject Cross-Origin-Opener-Policy header at the Edge (Cloudflare Worker level).
  // This fixes the Google OAuth popup communication issue by allowing the parent
  // window to interact with the Google sign-in popup window.
  const response = NextResponse.next();
  response.headers.set(
    "Cross-Origin-Opener-Policy",
    "same-origin-allow-popups"
  );
  return response;
}

// Apply to all page routes (skip static files and images)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};

