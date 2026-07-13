import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Kyxun",
  description:
    "Transform student panic into a structured, AI-generated survival plan. Upload your syllabus and get a personalised study plan in under 2 minutes.",
  keywords: ["study planner", "AI exam help", "student survival", "kyxun"],
  icons: {
    icon: "/logo_white_icon.png",
  },
  openGraph: {
    title: "Kyxun",
    description: "Get your personalised AI study plan instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('kyxun_theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
