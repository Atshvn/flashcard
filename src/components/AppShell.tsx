"use client";

import { useIsStudyMode } from "@/hooks/useIsStudyMode";
import { PullToRefresh } from "@/components/PullToRefresh";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isStudy = useIsStudyMode();

  if (isStudy) {
    // Full-screen focus mode: no padding, no footer
    return (
      <main
        className="flex-1"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {children}
      </main>
    );
  }

  return (
    <PullToRefresh>
      <main className="flex-1 pb-28 md:pb-0">{children}</main>
      <footer className="border-t border-border/40 py-6 hidden md:block">
        <div className="container mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ANN Flash. Built for smarter learning.
        </div>
      </footer>
    </PullToRefresh>
  );
}
