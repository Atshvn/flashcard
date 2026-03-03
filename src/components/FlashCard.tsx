"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { speak } from "@/lib/speech";

interface FlashCardProps {
  front: string;
  back: string;
  isFlipped?: boolean;
  onFlip?: () => void;
}

export function FlashCard({
  front,
  back,
  isFlipped = false,
  onFlip,
}: FlashCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const flipped = isFlipped !== undefined && onFlip ? isFlipped : internalFlipped;

  const handleFlip = () => {
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

  return (
    <div
      className="perspective-1000 w-full h-full cursor-pointer select-none group min-h-[300px]"
      onClick={handleFlip}
    >
      <div
        className={`relative w-full h-full preserve-3d transition-transform duration-500 ease-out ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-[2rem] border border-border/50 bg-card shadow-2xl flex flex-col items-center justify-center p-6 md:p-12 transition-all hover:scale-[1.01]">
          <div className="absolute top-6 left-6 text-xs text-muted-foreground font-semibold uppercase tracking-widest">
            Front
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors z-10"
            onClick={(e) => handleSpeak(e, front)}
          >
            <Volume2 className="h-5 w-5" />
          </Button>
          <div className="w-full h-full flex items-center justify-center overflow-auto px-2">
            <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-tight tracking-tight text-foreground">
              {front}
            </p>
          </div>
          <p className="absolute bottom-6 text-xs text-muted-foreground/60 font-medium tracking-wide">
            Tap anywhere to flip
          </p>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[2rem] border-2 border-primary/20 bg-linear-to-br from-primary/5 via-background to-primary/10 shadow-2xl flex flex-col items-center justify-center p-6 md:p-12">
          <div className="absolute top-6 left-6 text-xs text-primary font-bold uppercase tracking-widest">
            Back
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-10 w-10 rounded-full hover:bg-primary/20 text-primary transition-colors z-10"
            onClick={(e) => handleSpeak(e, back)}
          >
            <Volume2 className="h-5 w-5" />
          </Button>
          <div className="w-full h-full flex flex-col items-center justify-center overflow-auto px-2 space-y-4">
            <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-center leading-relaxed text-foreground whitespace-pre-wrap">
              {back}
            </p>
          </div>
          <p className="absolute bottom-6 text-xs text-muted-foreground/60 font-medium tracking-wide">
            Tap anywhere to flip back
          </p>
        </div>
      </div>
    </div>
  );
}
