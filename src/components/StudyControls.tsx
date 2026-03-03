"use client";

import { Button } from "@/components/ui/button";
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
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="text-center">
        <span className="text-sm font-medium text-muted-foreground">
          Card{" "}
          <span className="text-foreground font-semibold">
            {currentIndex + 1}
          </span>{" "}
          of <span className="text-foreground font-semibold">{totalCards}</span>
        </span>
        <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / totalCards) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Answer buttons - only show when flipped */}
      {isFlipped && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
          <Button
            variant="outline"
            className="h-14 sm:h-12 flex-col sm:flex-row gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500"
            onClick={() => onAnswer("again")}
          >
            <X className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">Again</span>
          </Button>
          <Button
            variant="outline"
            className="h-14 sm:h-12 flex-col sm:flex-row gap-1 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
            onClick={() => onAnswer("hard")}
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">Hard</span>
          </Button>
          <Button
            variant="outline"
            className="h-14 sm:h-12 flex-col sm:flex-row gap-1 border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-500"
            onClick={() => onAnswer("known")}
          >
            <Check className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">Known</span>
          </Button>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between sm:justify-center sm:gap-4 pt-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="h-12 w-12 sm:h-10 sm:w-10 rounded-full sm:rounded-md"
        >
          <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onShuffle}
            className="h-12 w-12 sm:h-10 sm:w-10"
            title="Shuffle cards"
          >
            <Shuffle className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onReset}
            className="h-12 w-12 sm:h-10 sm:w-10"
            title="Reset progress"
          >
            <RotateCcw className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={currentIndex >= totalCards - 1}
          className="h-12 w-12 sm:h-10 sm:w-10 rounded-full sm:rounded-md"
        >
          <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}
