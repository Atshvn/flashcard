"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getDeckBySlug, saveStudySession } from "@/lib/firestore";
import type { Deck } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, RotateCcw, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MatchItem {
  id: string;
  text: string;
  type: "front" | "back";
  cardId: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchModePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [items, setItems] = useState<MatchItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [incorrect, setIncorrect] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const startTimeRef = useRef<number>(0);
  useEffect(() => { startTimeRef.current = Date.now(); }, []);

  // Live timer display
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setElapsedSecs(Math.round((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const buildItems = (d: Deck) => {
    const subset = shuffleArray(d.cards).slice(0, 6);
    const fronts: MatchItem[] = subset.map((c) => ({ id: `f-${c.id}`, text: c.front, type: "front", cardId: c.id }));
    const backs: MatchItem[] = subset.map((c) => ({ id: `b-${c.id}`, text: c.back, type: "back", cardId: c.id }));
    return shuffleArray([...fronts, ...backs]);
  };

  useEffect(() => {
    getDeckBySlug(slug).then((d) => {
      if (d) { setDeck(d); setItems(buildItems(d)); }
      setLoading(false);
    });
  }, [slug]);

  const handleSelect = (itemId: string) => {
    if (matched.has(itemId) || incorrect.has(itemId)) return;
    if (!selected) { setSelected(itemId); return; }
    if (selected === itemId) { setSelected(null); return; }

    const first = items.find((i) => i.id === selected)!;
    const second = items.find((i) => i.id === itemId)!;
    const isMatch = first.cardId === second.cardId && first.type !== second.type;

    if (isMatch) {
      const newMatched = new Set(matched);
      newMatched.add(first.id);
      newMatched.add(second.id);
      setMatched(newMatched);
      setSelected(null);

      if (newMatched.size === items.length) {
        const now = Date.now();
        setEndTime(now);
        setFinished(true);
        if (user && deck) {
          const duration = Math.round((now - startTimeRef.current) / 1000);
          const correctPairs = items.length / 2;
          saveStudySession(user.uid, deck.id, "match", correctPairs, correctPairs - mistakes, duration).catch(console.error);
        }
      }
    } else {
      setMistakes((m) => m + 1);
      setIncorrect(new Set([first.id, second.id]));
      setSelected(null);
      setTimeout(() => setIncorrect(new Set()), 700);
    }
  };

  const handleRestart = () => {
    if (!deck) return;
    setItems(buildItems(deck));
    setMatched(new Set()); setIncorrect(new Set()); setSelected(null);
    setFinished(false); setMistakes(0); setEndTime(null);
    setElapsedSecs(0);
    startTimeRef.current = Date.now();
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!deck) return <div className="min-h-[60vh] flex items-center justify-center"><p>Deck not found</p></div>;

  if (finished && endTime) {
    const duration = endTime ? Math.round((endTime - startTimeRef.current) / 1000) : 0;
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">All Matched!</h1>
        <p className="text-muted-foreground mb-8">{deck.title}</p>
        <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-xs">
          <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-primary">{duration}s</div><div className="text-xs text-muted-foreground mt-1">Time</div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center"><div className="text-2xl font-bold text-red-500">{mistakes}</div><div className="text-xs text-muted-foreground mt-1">Mistakes</div></CardContent></Card>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={handleRestart} className="h-12 gap-2 touch-manipulation"><RotateCcw className="h-4 w-4" />Play Again</Button>
          <Button variant="outline" className="h-12 touch-manipulation" asChild><Link href={`/deck/${slug}`}>Back to Deck</Link></Button>
        </div>
      </div>
    );
  }

  const totalPairs = items.length / 2;
  const matchedPairs = matched.size / 2;

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto px-3 py-3 md:px-4 md:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 touch-manipulation"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-base font-bold truncate max-w-[150px] md:max-w-none">{deck.title}</h1>
            <p className="text-xs text-muted-foreground">Match</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{matchedPairs}/{totalPairs}</span>
          <span className="font-medium">{elapsedSecs}s</span>
          {mistakes > 0 && <span className="text-red-500 font-medium">{mistakes} ✗</span>}
        </div>
      </div>

      {/* Grid — 2 columns, scrollable */}
      <div className="grid grid-cols-2 gap-2 flex-1 overflow-auto content-start pb-safe">
        {items.map((item) => {
          const isMatched = matched.has(item.id);
          const isSelected = selected === item.id;
          const isIncorrect = incorrect.has(item.id);

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              disabled={isMatched}
              className={`
                min-h-[80px] p-3 rounded-xl border-2 text-left text-sm font-medium transition-all duration-200 whitespace-pre-wrap touch-manipulation active:scale-[0.97]
                ${isMatched ? "border-green-500 bg-green-50/80 dark:bg-green-950/20 text-green-700 dark:text-green-300 cursor-default" : ""}
                ${isSelected ? "border-primary bg-primary/10 shadow-md scale-[1.02]" : ""}
                ${isIncorrect ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}
                ${!isMatched && !isSelected && !isIncorrect ? "border-border bg-card hover:border-primary/40 cursor-pointer" : ""}
              `}
            >
              {isMatched && <CheckCircle2 className="h-4 w-4 text-green-500 mb-1" />}
              <span className="line-clamp-3">{item.text}</span>
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-2 shrink-0">Tap two cards to match them</p>
    </div>
  );
}
