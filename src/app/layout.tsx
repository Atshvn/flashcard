import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ANN Flash - Smart Flashcard Learning",
    template: "%s | ANN Flash",
  },
  description:
    "Master any subject with smart flashcards. Create decks, study with spaced repetition, track your progress, and learn faster.",
  keywords: [
    "flashcards",
    "learning",
    "study",
    "education",
    "spaced repetition",
  ],
  authors: [{ name: "ANN Flash" }],
  openGraph: {
    title: "ANN Flash - Smart Flashcard Learning",
    description:
      "Master any subject with smart flashcards. Create, study, and track your progress.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TooltipProvider>
              <div className="relative min-h-screen flex flex-col">
                <Navbar />
                <AppShell>{children}</AppShell>
              </div>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
