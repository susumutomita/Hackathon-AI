import "./globals.css";

import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Hackathon AI",
  description:
    "Hackathon AI is a platform for developers to find out the idea from previous hackathon",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">{children}</body>
      <Analytics />
    </html>
  );
}
