"use client";

import { useEffect, useState, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getDeckBySlug, saveCardProgress, saveStudySession } from "@/lib/firestore";
import { processAnswerSimple } from "@/lib/spacedRepetition";
import type { Deck, FlashCard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, RotateCcw, Timer } from "lucide-react";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MCQCard {
  card: FlashCard;
  options: string[];
  correctIndex: number;
}

function buildMCQ(cards: FlashCard[]): MCQCard[] {
  return shuffleArray(cards).map((card) => {
    const wrongPool = cards.filter((c) => c.id !== card.id);
    const wrongs = shuffleArray(wrongPool).slice(0, 3).map((c) => c.back);
    const options = shuffleArray([card.back, ...wrongs]);
    return { card, options, correctIndex: options.indexOf(card.back) };
  });
}

const TIMER_SECONDS = 15;

export default function MultipleChoicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [mcqCards, setMcqCards] = useState<MCQCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const sessionStartRef = useRef<number>(0);
  useEffect(() => { sessionStartRef.current = Date.now(); }, []);

  useEffect(() => {
    getDeckBySlug(slug).then((d) => {
      if (d) {
        setDeck(d);
        if (d.cards.length >= 2) { setMcqCards(buildMCQ(d.cards)); setTimerActive(true); }
      }
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!timerActive || selected !== null) return;
    if (timer <= 0) { handleSelect(-1); return; }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, timerActive, selected]);

  const current = mcqCards[currentIndex];
  const totalCards = mcqCards.length;
  const progress = totalCards > 0 ? Math.round((currentIndex / totalCards) * 100) : 0;

  const handleSelect = useCallback((idx: number) => {
    if (selected !== null || !current) return;
    setSelected(idx);
    setTimerActive(false);
    const isCorrect = idx === current.correctIndex;
    if (isCorrect) setCorrectCount((c) => c + 1);
    else setWrongCount((c) => c + 1);
    if (user && deck) {
      const sm2 = processAnswerSimple(isCorrect);
      saveCardProgress(user.uid, deck.id, current.card.id, isCorrect, sm2.interval, sm2.easeFactor, sm2.masteryLevel, sm2.nextReviewDate).catch(console.error);
    }
  }, [selected, current, user, deck]);

  const handleNext = useCallback(() => {
    if (currentIndex < mcqCards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setTimer(TIMER_SECONDS);
      setTimerActive(true);
    } else {
      if (user && deck) {
        const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
        saveStudySession(user.uid, deck.id, "multiple_choice", totalCards, correctCount, duration).catch(console.error);
      }
      setFinished(true);
    }
  }, [currentIndex, mcqCards.length, user, deck, correctCount, totalCards]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!deck || mcqCards.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-muted-foreground">Need at least 2 cards for Multiple Choice mode.</p>
      <Button asChild variant="outline" className="h-12 touch-manipulation"><Link href={`/deck/${slug}`}>Back</Link></Button>
    </div>
  );

  if (finished) {
    const accuracy = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0;
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Multiple Choice Done!</h1>
        <p className="text-muted-foreground mb-8">{deck.title}</p>
        <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-sm">
          <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-green-500">{correctCount}</div><div className="text-xs text-muted-foreground mt-1">Correct</div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-red-500">{wrongCount}</div><div className="text-xs text-muted-foreground mt-1">Wrong</div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-primary">{accuracy}%</div><div className="text-xs text-muted-foreground mt-1">Score</div></CardContent></Card>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button className="h-12 gap-2 touch-manipulation" onClick={() => { setCurrentIndex(0); setMcqCards(buildMCQ(deck.cards)); setSelected(null); setCorrectCount(0); setWrongCount(0); setFinished(false); setTimer(TIMER_SECONDS); setTimerActive(true); }}>
            <RotateCcw className="h-4 w-4" />Try Again
          </Button>
          <Button variant="outline" className="h-12 touch-manipulation" asChild><Link href={`/deck/${slug}`}>Back to Deck</Link></Button>
        </div>
      </div>
    );
  }

  const timerColor = timer <= 5 ? "text-red-500" : timer <= 10 ? "text-yellow-500" : "text-green-500";
  const timerPct = (timer / TIMER_SECONDS) * 100;

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto px-3 py-3 md:px-4 md:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 touch-manipulation"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate max-w-[150px] md:max-w-none">{deck.title}</h1>
            <p className="text-xs text-muted-foreground">Multiple Choice</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 font-bold text-sm ${timerColor}`}>
            <Timer className="h-4 w-4" />{timer}s
          </div>
          <span className="text-green-500 font-semibold text-sm">✓ {correctCount}</span>
          <span className="text-red-500 font-semibold text-sm">✗ {wrongCount}</span>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="mb-1 h-1.5" />
      <div className="w-full bg-muted rounded-full h-1 mb-4 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timer <= 5 ? "bg-red-500" : timer <= 10 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${timerPct}%` }} />
      </div>

      {current && (
        <div className="flex flex-col flex-1 gap-3 min-h-0">
          {/* Question */}
          <Card className="border-border/50 shadow-lg shrink-0">
            <CardContent className="p-5 md:p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Choose the correct answer:</p>
              <p className="text-xl md:text-3xl font-bold whitespace-pre-wrap leading-tight">{current.card.front}</p>
            </CardContent>
          </Card>

          {/* Options */}
          <div className="flex flex-col gap-2 flex-1 overflow-auto pb-safe">
            {current.options.map((opt, idx) => {
              let extra = "";
              if (selected !== null) {
                if (idx === current.correctIndex) extra = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300";
                else if (idx === selected) extra = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300";
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={selected !== null}
                  className={`w-full min-h-[56px] px-4 py-3 rounded-xl border-2 text-left font-medium text-sm whitespace-pre-wrap transition-all touch-manipulation active:scale-[0.99]
                    ${selected === null ? "border-border hover:border-primary/50 hover:bg-muted/50" : "cursor-default"}
                    ${extra || "border-border"}`}
                >
                  <span className="text-muted-foreground mr-2 font-bold">{["A", "B", "C", "D"][idx]}.</span>{opt}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="shrink-0 pb-safe">
              <button
                onClick={handleNext}
                className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-opacity touch-manipulation active:opacity-80"
              >
                {currentIndex < mcqCards.length - 1 ? "Next →" : "Finish 🎉"}
              </button>
              <p className="text-center text-xs text-muted-foreground mt-2">{currentIndex + 1} / {totalCards}</p>
            </div>
          )}
          {selected === null && (
            <p className="text-center text-xs text-muted-foreground shrink-0 pb-2">{currentIndex + 1} / {totalCards}</p>
          )}
        </div>
      )}
    </div>
  );
}
