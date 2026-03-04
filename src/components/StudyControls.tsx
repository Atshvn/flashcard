"use client";

import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import type { StudyResult } from "@/lib/types";

interface StudyControlsProps {
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onReset: () => void;
  onAnswer: (result: StudyResult) => void;
}

export function StudyControls({
  currentIndex,
  totalCards,
  isFlipped,
  onPrevious,
  onNext,
  onShuffle,
  onReset,
  onAnswer,
}: StudyControlsProps) {
  return (
    <div className="space-y-3 pb-safe">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">
          {currentIndex + 1} / {totalCards}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          />
        </div>
      </div>

      {/* Answer buttons — show when flipped */}
      {isFlipped && (
        <div className="grid grid-cols-3 gap-2 w-full">
          <button
            onClick={() => onAnswer("again")}
            className="h-16 md:h-14 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-red-500/30 text-red-500 bg-red-500/5 active:bg-red-500/20 transition-colors touch-manipulation font-medium"
          >
            <X className="h-5 w-5" />
            <span className="text-xs md:text-sm">Again</span>
          </button>
          <button
            onClick={() => onAnswer("hard")}
            className="h-16 md:h-14 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-amber-500/30 text-amber-500 bg-amber-500/5 active:bg-amber-500/20 transition-colors touch-manipulation font-medium"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs md:text-sm">Hard</span>
          </button>
          <button
            onClick={() => onAnswer("known")}
            className="h-16 md:h-14 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-green-500/30 text-green-500 bg-green-500/5 active:bg-green-500/20 transition-colors touch-manipulation font-medium"
          >
            <Check className="h-5 w-5" />
            <span className="text-xs md:text-sm">Known</span>
          </button>
        </div>
      )}

      {/* Navigation row */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="h-12 w-12 flex items-center justify-center rounded-full border border-border bg-card disabled:opacity-30 active:bg-muted transition-colors touch-manipulation"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex gap-2">
          <button
            onClick={onShuffle}
            title="Shuffle"
            className="h-12 w-12 flex items-center justify-center rounded-xl border border-border bg-card active:bg-muted transition-colors touch-manipulation"
          >
            <Shuffle className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={onReset}
            title="Reset"
            className="h-12 w-12 flex items-center justify-center rounded-xl border border-border bg-card active:bg-muted transition-colors touch-manipulation"
          >
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex >= totalCards - 1}
          className="h-12 w-12 flex items-center justify-center rounded-full border border-border bg-card disabled:opacity-30 active:bg-muted transition-colors touch-manipulation"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
