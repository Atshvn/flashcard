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
import { Loader2, ArrowLeft, CheckCircle2, XCircle, RotateCcw, Lightbulb } from "lucide-react";

function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1;
  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastVal = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) { costs[j] = j; }
      else if (j > 0) {
        let newVal = costs[j - 1];
        if (longer[i - 1] !== shorter[j - 1]) newVal = Math.min(Math.min(newVal, lastVal), costs[j]) + 1;
        costs[j - 1] = lastVal;
        lastVal = newVal;
      }
    }
    if (i > 0) costs[shorter.length] = lastVal;
  }
  return (longer.length - costs[shorter.length]) / longer.length;
}

type AnswerState = "unanswered" | "correct" | "incorrect";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WriteModePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const sessionStartRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { sessionStartRef.current = Date.now(); }, []);

  useEffect(() => {
    getDeckBySlug(slug).then((d) => {
      if (d) {
        setDeck(d);
        setCards(shuffleArray(d.cards));
      }
      setLoading(false);
    });
  }, [slug]);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? Math.round((currentIndex / cards.length) * 100) : 0;

  const handleSubmit = useCallback(() => {
    if (!currentCard || answerState !== "unanswered") return;
    const sim = similarity(answer, currentCard.back);
    const isCorrect = sim >= 0.75;
    setAnswerState(isCorrect ? "correct" : "incorrect");
    if (isCorrect) setCorrectCount((c) => c + 1);
    else setWrongCount((c) => c + 1);
    if (user && deck) {
      const sm2 = processAnswerSimple(isCorrect);
      saveCardProgress(user.uid, deck.id, currentCard.id, isCorrect, sm2.interval, sm2.easeFactor, sm2.masteryLevel, sm2.nextReviewDate).catch(console.error);
    }
  }, [answer, currentCard, answerState, user, deck]);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setAnswer("");
      setAnswerState("unanswered");
      setRevealedIndices(new Set());
    } else {
      if (user && deck) {
        const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
        saveStudySession(user.uid, deck.id, "write", cards.length, correctCount, duration).catch(console.error);
      }
      setFinished(true);
    }
  }, [currentIndex, cards.length, user, deck, correctCount]);

  // Build masked hint string: reveal only indices in the Set, spaces always visible
  const getHint = (text: string, revealed: Set<number>) => {
    return text
      .split("")
      .map((ch, i) => (ch === " " || revealed.has(i) ? ch : "_"))
      .join("");
  };

  // Reveal one random unrevealed non-space character
  const handleHint = useCallback(() => {
    if (!currentCard) return;
    const back = currentCard.back;
    const hidden = back
      .split("")
      .map((ch, i) => ({ ch, i }))
      .filter(({ ch, i }) => ch !== " " && !revealedIndices.has(i));
    if (hidden.length === 0) return;
    const pick = hidden[Math.floor(Math.random() * hidden.length)];
    setRevealedIndices((prev) => new Set([...prev, pick.i]));
  }, [currentCard, revealedIndices]);

  // Global Enter key handler: when answer is shown, Enter → Next (no mouse needed)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && answerState !== "unanswered") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerState, handleNext]);

  // Re-focus textarea after moving to next card (setTimeout ensures DOM is ready)
  useEffect(() => {
    if (answerState === "unanswered") {
      const id = setTimeout(() => textareaRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [answerState, currentIndex]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!deck) return <div className="min-h-[60vh] flex items-center justify-center"><p>Deck not found</p></div>;

  if (finished) {
    const accuracy = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Write Mode Complete!</h1>
        <p className="text-muted-foreground mb-8">{deck.title}</p>
        <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-sm">
          <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-green-500">{correctCount}</div><div className="text-xs text-muted-foreground mt-1">Correct</div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-red-500">{wrongCount}</div><div className="text-xs text-muted-foreground mt-1">Wrong</div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-primary">{accuracy}%</div><div className="text-xs text-muted-foreground mt-1">Score</div></CardContent></Card>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button className="h-12 gap-2 touch-manipulation" onClick={() => {
            setCards((prev) => shuffleArray(prev));
            setCurrentIndex(0); setAnswer(""); setAnswerState("unanswered");
            setCorrectCount(0); setWrongCount(0); setRevealedIndices(new Set()); setFinished(false);
          }}>
            <RotateCcw className="h-4 w-4" />Try Again
          </Button>
          <Button variant="outline" className="h-12 touch-manipulation" asChild><Link href={`/deck/${slug}`}>Back to Deck</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto px-3 py-3 md:px-4 md:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 touch-manipulation"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate max-w-[180px] md:max-w-none">{deck.title}</h1>
            <p className="text-xs text-muted-foreground">Write</p>
          </div>
        </div>
        <div className="flex gap-3 text-sm font-semibold">
          <span className="text-green-500">✓ {correctCount}</span>
          <span className="text-red-500">✗ {wrongCount}</span>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="mb-4 h-1.5" />

      {currentCard && (
        <div className="flex flex-col flex-1 gap-3 overflow-y-auto">
          {/* Front card */}
          <Card className="border-border/50 shadow-lg shrink-0">
            <CardContent className="p-5 md:p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">What is the meaning of:</p>
              <p className="text-2xl md:text-3xl font-bold whitespace-pre-wrap leading-tight">{currentCard.front}</p>
            </CardContent>
          </Card>

          {/* Input */}
          <div className="shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Your answer:</label>
              {answerState === "unanswered" && currentCard && (
                <button
                  type="button"
                  onClick={handleHint}
                  disabled={revealedIndices.size >= currentCard.back.replace(/ /g, "").length}
                  className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 disabled:opacity-40 transition-colors px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 touch-manipulation"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Hint {revealedIndices.size > 0 ? `(${revealedIndices.size}/${currentCard.back.replace(/ /g, "").length})` : ""}
                </button>
              )}
            </div>
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (answerState === "unanswered") handleSubmit(); else handleNext();
                }
              }}
              placeholder="Type your answer..."
              disabled={answerState !== "unanswered"}
              rows={2}
              className={`w-full rounded-xl border px-4 py-3 text-base resize-none bg-background outline-none transition-colors
                ${answerState === "correct" ? "border-green-500 focus:ring-green-500" : answerState === "incorrect" ? "border-red-500 focus:ring-red-500" : "border-border focus:border-primary"}
                disabled:opacity-60`}
              autoFocus
              style={{ fontSize: "16px" }} /* Prevent iOS zoom */
            />
            {revealedIndices.size > 0 && answerState === "unanswered" && currentCard && (
              <p className="text-xs font-mono tracking-widest text-amber-500 px-1 select-none">
                {getHint(currentCard.back, revealedIndices)}
              </p>
            )}
          </div>

          {answerState !== "unanswered" && (
            <Card className={`shrink-0 border-2 ${answerState === "correct" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {answerState === "correct" ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                  <span className={`font-bold text-sm ${answerState === "correct" ? "text-green-600" : "text-red-600"}`}>
                    {answerState === "correct" ? "Correct! 🎉" : "Incorrect"}
                  </span>
                </div>
                {/* Show answer for both correct and incorrect */}
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    {answerState === "correct" ? "Answer:" : "Correct answer:"}
                  </p>
                  <p className="font-semibold text-sm">{currentCard.back}</p>
                </div>
                {currentCard.description && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed border-t pt-2 mt-1">
                    {currentCard.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit / Next button */}
          <div className="mt-auto pb-safe shrink-0">
            {answerState === "unanswered" ? (
              <button
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40 transition-opacity touch-manipulation active:opacity-80"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-opacity touch-manipulation active:opacity-80"
              >
                {currentIndex < cards.length - 1 ? "Next →" : "Finish 🎉"}
              </button>
            )}
            <p className="text-center text-xs text-muted-foreground mt-2">{currentIndex + 1} / {cards.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
