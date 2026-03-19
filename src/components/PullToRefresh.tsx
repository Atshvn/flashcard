"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const THRESHOLD = 72; // px to pull before triggering
const MAX_PULL = 100; // max visual pull distance

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const canPull = useCallback(() => {
    // Only allow pull when scrolled to top
    return (containerRef.current?.scrollTop ?? window.scrollY) === 0;
  }, []);

  const onTouchStart = useCallback((e: Event) => {
    const touch = e as TouchEvent;
    if (!canPull()) return;
    startYRef.current = touch.touches[0].clientY;
    isPullingRef.current = false;
  }, [canPull]);

  const onTouchMove = useCallback((e: Event) => {
    const touch = e as TouchEvent;
    if (startYRef.current === null || refreshing) return;
    const dy = touch.touches[0].clientY - startYRef.current;
    if (dy <= 0) {
      startYRef.current = null;
      return;
    }
    if (!canPull()) return;
    isPullingRef.current = true;
    // Rubber-band resistance
    const pull = Math.min(dy * 0.45, MAX_PULL);
    setPullY(pull);
    if (dy > 10) e.preventDefault();
  }, [refreshing, canPull]);

  const onTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      router.refresh();
      // Give Next.js router.refresh() time to re-fetch, then reset
      await new Promise((r) => setTimeout(r, 1000));
      setRefreshing(false);
    }
    setPullY(0);
    startYRef.current = null;
    isPullingRef.current = false;
  }, [pullY, router]);

  useEffect(() => {
    const el = document as unknown as EventTarget;
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd as EventListener, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd as EventListener);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const isTriggered = pullY >= THRESHOLD;
  const showIndicator = pullY > 8 || refreshing;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col">
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-none"
        style={{
          height: refreshing ? THRESHOLD : pullY,
          opacity: showIndicator ? 1 : 0,
          transition: refreshing || pullY === 0 ? "height 0.25s ease, opacity 0.2s" : "none",
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
          transition: refreshing || pullY === 0 ? "transform 0.25s ease" : "none",
          flex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
