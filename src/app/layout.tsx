import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ANN Flash",
    startupImage: [
      {
        url: "/apple-touch-icon.png",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "ANN Flash - Smart Flashcard Learning",
    description:
      "Master any subject with smart flashcards. Create, study, and track your progress.",
    type: "website",
  },
  icons: {
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
