"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const THRESHOLD = 72;
const MAX_PULL = 100;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const pullYRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    // Keep ref in sync so event handlers always see current value
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    // Non-passive touchmove — only added while a potential pull gesture is active
    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        // Swiping up — abandon pull tracking immediately
        startYRef.current = null;
        document.removeEventListener("touchmove", handleTouchMove);
        return;
      }
      isPullingRef.current = true;
      const pull = Math.min(dy * 0.45, MAX_PULL);
      pullYRef.current = pull;
      setPullY(pull);
      e.preventDefault();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (window.scrollY > 0) return; // only engage at top of page
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = false;
      pullYRef.current = 0;
      // Register non-passive listener ONLY when at top — zero overhead elsewhere
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      if (!isPullingRef.current) {
        startYRef.current = null;
        return;
      }
      const currentPull = pullYRef.current;
      startYRef.current = null;
      isPullingRef.current = false;

      if (currentPull >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullY(THRESHOLD);
        pullYRef.current = THRESHOLD;
        router.refresh();
        setTimeout(() => {
          setRefreshing(false);
          refreshingRef.current = false;
          setPullY(0);
          pullYRef.current = 0;
        }, 1000);
      } else {
        setPullY(0);
        pullYRef.current = 0;
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const showIndicator = pullY > 8 || refreshing;

  return (
    <div className="flex-1 flex flex-col">
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: refreshing ? THRESHOLD : pullY,
          opacity: showIndicator ? 1 : 0,
          transition:
            refreshing || pullY === 0
              ? "height 0.25s ease, opacity 0.2s"
              : "none",
        }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full bg-background border border-border shadow-md"
          style={{
            transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 180}deg)`,
            transition: refreshing ? "transform 0.2s" : "none",
          }}
        >
          <Loader2
            className="h-4 w-4 text-primary"
            style={{
              animation: refreshing ? "spin 0.8s linear infinite" : "none",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${refreshing ? THRESHOLD : pullY}px)`,
          transition:
            refreshing || pullY === 0 ? "transform 0.25s ease" : "none",
          flex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
