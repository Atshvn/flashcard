"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDeckBySlug,
  saveCardProgress,
  recordStudyActivity,
} from "@/lib/firestore";
import type { Deck, FlashCard, StudyResult } from "@/lib/types";
import { FlashCard as FlashCardComponent } from "@/components/FlashCard";
import { StudyControls } from "@/components/StudyControls";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, ArrowLeft, RotateCcw } from "lucide-react";

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface StudyState {
  correct: number;
  wrong: number;
  hardCards: FlashCard[];
  answeredCards: Set<string>;
}

export default function StudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [studyState, setStudyState] = useState<StudyState>({
    correct: 0,
    wrong: 0,
    hardCards: [],
    answeredCards: new Set(),
  });

  useEffect(() => {
    async function loadDeck() {
      try {
        const deckData = await getDeckBySlug(slug);
        if (!deckData || deckData.cards.length === 0) {
          setLoading(false);
          return;
        }
        setDeck(deckData);
        setCards(shuffleArray(deckData.cards));
      } catch (error) {
        console.error("Failed to load deck:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDeck();
  }, [slug]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleAnswer = useCallback(
    (result: StudyResult) => {
      const currentCard = cards[currentIndex];
      if (!currentCard) return;

      const isCorrect = result === "known";
      const isHard = result === "hard" || result === "again";

      // Update study state (instant — local state only)
      setStudyState((prev) => {
        const newState = { ...prev };
        if (!prev.answeredCards.has(currentCard.id)) {
          newState.answeredCards = new Set(prev.answeredCards);
          newState.answeredCards.add(currentCard.id);

          if (isCorrect) {
            newState.correct = prev.correct + 1;
          } else {
            newState.wrong = prev.wrong + 1;
          }

          if (isHard) {
            newState.hardCards = [...prev.hardCards, currentCard];
          }
        }
        return newState;
      });

      // Save progress to Firestore — fire-and-forget (don't block UI)
      if (user && deck) {
        Promise.all([
          saveCardProgress(user.uid, deck.id, currentCard.id, isCorrect),
          recordStudyActivity(user.uid),
        ]).catch((error) => {
          console.error("Failed to save progress:", error);
        });
      }

      // Move to next card or show summary — happens IMMEDIATELY
      if (currentIndex < cards.length - 1) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 200);
      } else {
        setShowSummary(true);
      }
    },
    [cards, currentIndex, deck, user]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, cards.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleShuffle = useCallback(() => {
    setCards(shuffleArray(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  const handleReset = useCallback(() => {
    if (!deck) return;
    setCards(shuffleArray(deck.cards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyState({
      correct: 0,
      wrong: 0,
      hardCards: [],
      answeredCards: new Set(),
    });
    setShowSummary(false);
  }, [deck]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          handleFlip();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "1":
          if (isFlipped) handleAnswer("again");
          break;
        case "2":
          if (isFlipped) handleAnswer("hard");
          break;
        case "3":
          if (isFlipped) handleAnswer("known");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handlePrevious, handleNext, handleAnswer, isFlipped]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!deck || cards.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-2">No Cards to Study</h1>
        <p className="text-muted-foreground mb-6">
          This deck doesn&apos;t have any cards yet.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const totalAnswered = studyState.correct + studyState.wrong;
  const accuracy =
    totalAnswered > 0
      ? Math.round((studyState.correct / totalAnswered) * 100)
      : 0;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-4 md:py-8 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{deck.title}</h1>
            <p className="text-sm text-muted-foreground">Study Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-500 font-medium">
            ✓ {studyState.correct}
          </span>
          <span className="text-red-500 font-medium">
            ✗ {studyState.wrong}
          </span>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 w-full flex flex-col justify-center mb-6 relative min-h-[300px]">
        <FlashCardComponent
          front={currentCard.front}
          back={currentCard.back}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </div>

      {/* Controls */}
      <StudyControls
        currentIndex={currentIndex}
        totalCards={cards.length}
        isFlipped={isFlipped}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onShuffle={handleShuffle}
        onReset={handleReset}
        onAnswer={handleAnswer}
      />

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 pb-4 text-center text-xs text-muted-foreground hidden md:block">
        <span>
          Space: Flip • ← →: Navigate • 1: Again • 2: Hard • 3: Known
        </span>
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Study Complete!
            </DialogTitle>
            <DialogDescription>
              You&apos;ve finished studying all {cards.length} cards
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Accuracy */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">{accuracy}%</div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-green-500/10 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {studyState.correct}
                </div>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {studyState.wrong}
                </div>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </div>
            </div>

            <Progress value={accuracy} className="h-2" />

            {/* Hard Words */}
            {studyState.hardCards.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Hard Words ({studyState.hardCards.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {studyState.hardCards.map((card) => (
                    <Badge key={card.id} variant="secondary" className="text-xs">
                      {card.front}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              Study Again
            </Button>
            <Button asChild>
              <Link href={`/deck/${slug}`}>View Deck</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
