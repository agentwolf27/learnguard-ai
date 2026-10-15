import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "LearnGuard AI",
  description: "AI governance infrastructure for classrooms using Canvas LTI 1.3."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = <body className={`${inter.className} min-h-screen antialiased`}>{children}</body>;
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <html lang="en">
      {clerkConfigured ? <ClerkProvider>{body}</ClerkProvider> : body}
    </html>
  );
}
