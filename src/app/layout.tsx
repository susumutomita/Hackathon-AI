import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata = {
  title: "Hackathon AI",
  description:
    "Hackathon AI is a platform for developers to find out the idea from previous hackathon",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#222222",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="flex min-h-screen w-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-br-md"
        >
          Skip to main content
        </a>
        <ErrorBoundary>{children}</ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
