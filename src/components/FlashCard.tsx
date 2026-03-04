"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { speak } from "@/lib/speech";

interface FlashCardProps {
  front: string;
  back: string;
  description?: string | null;
  isFlipped?: boolean;
  onFlip?: () => void;
  onSwipeLeft?: () => void;  // next card
  onSwipeRight?: () => void; // previous card
}

export function FlashCard({
  front,
  back,
  description,
  isFlipped = false,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
}: FlashCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const flipped = isFlipped !== undefined && onFlip ? isFlipped : internalFlipped;

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const handleFlip = () => {
    if (isDragging.current) return;
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped(!internalFlipped);
    }
  };

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speak(text);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // Only horizontal swipes (dx > dy means mostly horizontal)
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      isDragging.current = true;
      if (dx < 0 && onSwipeLeft) onSwipeLeft();
      else if (dx > 0 && onSwipeRight) onSwipeRight();
    }

    touchStartX.current = null;
    touchStartY.current = null;
    // reset after short delay
    setTimeout(() => { isDragging.current = false; }, 50);
  };

  return (
    <div
      className="perspective-1000 w-full h-full cursor-pointer select-none"
      onClick={handleFlip}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div
        className={`relative w-full h-full preserve-3d transition-transform duration-500 ease-out ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-2xl md:rounded-[2rem] border border-border/50 bg-card shadow-2xl flex flex-col items-center justify-center p-5 md:p-12 transition-all">
          <div className="absolute top-4 left-4 text-xs text-muted-foreground font-semibold uppercase tracking-widest">
            Front
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors z-10 touch-manipulation"
            onClick={(e) => handleSpeak(e, front)}
          >
            <Volume2 className="h-5 w-5" />
          </Button>
          <div className="w-full h-full flex items-center justify-center overflow-auto px-2">
            <p className="text-2xl md:text-4xl lg:text-5xl font-bold text-center leading-tight tracking-tight text-foreground whitespace-pre-wrap">
              {front}
            </p>
          </div>
          <p className="absolute bottom-4 text-xs text-muted-foreground/60 font-medium tracking-wide">
            Tap to flip • Swipe to navigate
          </p>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl md:rounded-[2rem] border-2 border-primary/20 bg-linear-to-br from-primary/5 via-background to-primary/10 shadow-2xl flex flex-col items-center justify-center p-5 md:p-12">
          <div className="absolute top-4 left-4 text-xs text-primary font-bold uppercase tracking-widest">
            Back
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-10 w-10 rounded-full hover:bg-primary/20 text-primary transition-colors z-10 touch-manipulation"
            onClick={(e) => handleSpeak(e, back)}
          >
            <Volume2 className="h-5 w-5" />
          </Button>
          <div className="w-full h-full flex flex-col items-center justify-center overflow-auto px-2 gap-3">
            <p className="text-xl md:text-3xl lg:text-4xl font-bold text-center leading-relaxed text-foreground">
              {back}
            </p>
            {description && (
              <p className="text-sm md:text-base text-muted-foreground text-center leading-relaxed whitespace-pre-wrap max-w-sm">
                {description}
              </p>
            )}
          </div>
          <p className="absolute bottom-4 text-xs text-muted-foreground/60 font-medium tracking-wide">
            Tap to flip back
          </p>
        </div>
      </div>
    </div>
  );
}
