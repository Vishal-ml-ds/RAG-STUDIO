import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RAG Studio",
    template: "%s — RAG Studio",
  },
  description:
    "Design, ship, and operate production-grade RAG pipelines. Visual designer + autopilot, with built-in guardrails and evaluation.",
  applicationName: "RAG Studio",
  authors: [{ name: "RAG Studio" }],
  metadataBase: undefined,
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-bg-base font-sans text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
