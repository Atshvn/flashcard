"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getDeckBySlugWithProgress } from "@/lib/firestore";
import type { Deck, CardProgress } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Copy,
  Layers,
  Loader2,
  Pencil,
  Share2,
  Volume2,
  PenLine,
  LayoutGrid,
  Shuffle,
  Play,
} from "lucide-react";
import { speak } from "@/lib/speech";

type StudyMode = "flashcard" | "write" | "multiple-choice" | "match";

const MODES: { id: StudyMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "flashcard",       label: "Flashcards",       icon: <BookOpen className="h-5 w-5" />,    description: "Flip cards, self-grade" },
  { id: "write",           label: "Write",            icon: <PenLine className="h-5 w-5" />,     description: "Type the answer" },
  { id: "multiple-choice", label: "Multiple Choice",  icon: <LayoutGrid className="h-5 w-5" />,  description: "Pick the right option" },
  { id: "match",           label: "Match",            icon: <Shuffle className="h-5 w-5" />,     description: "Match pairs" },
];

export default function DeckViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [progress, setProgress] = useState<CardProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedMode, setSelectedMode] = useState<StudyMode>("flashcard");

  useEffect(() => {
    // Wait for Firebase auth to resolve so we make exactly ONE combined call
    if (authLoading) return;
    setLoading(true);
    getDeckBySlugWithProgress(slug, user?.uid ?? null)
      .then(({ deck: deckData, progress: progressData }) => {
        setDeck(deckData);
        setProgress(progressData);
      })
      .catch((error) => console.error("Failed to load deck:", error))
      .finally(() => setLoading(false));
  }, [slug, authLoading, user?.uid]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStudyUrl = (mode: StudyMode): string => {
    if (mode === "flashcard") return `/study/${slug}`;
    return `/deck/${slug}/${mode}`;
  };

  const handleStartStudy = () => {
    router.push(getStudyUrl(selectedMode));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-2">Deck Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This deck doesn&apos;t exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.uid === deck.userId;
  const totalCorrect = progress.reduce((s, p) => s + p.correctCount, 0);
  const totalWrong = progress.reduce((s, p) => s + p.wrongCount, 0);
  const totalAttempts = totalCorrect + totalWrong;
  const accuracy =
    totalAttempts > 0
      ? Math.round((totalCorrect / totalAttempts) * 100)
      : 0;
  const studiedCards = progress.length;
  const deckProgress =
    deck.cards.length > 0
      ? Math.round((studiedCards / deck.cards.length) * 100)
      : 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 md:mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{deck.title}</h1>
            <Badge variant={deck.isPublic ? "default" : "secondary"} className="shrink-0">
              {deck.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
          {deck.description && (
            <p className="text-muted-foreground text-sm">{deck.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            by {deck.userDisplayName} • {deck.cards.length} cards
          </p>
        </div>
        <div className="flex w-full sm:w-auto gap-2 shrink-0">
          {isOwner && (
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2 h-10" asChild>
              <Link href={`/deck/${slug}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none gap-2 h-10"
            onClick={handleCopyLink}
          >
            {copied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied!" : "Share"}
          </Button>
        </div>
      </div>

      {/* Study Mode Selector */}
      <div className="mb-8 p-4 md:p-5 rounded-2xl border border-border/60 bg-card/50">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Study Mode
        </h2>

        {/* Mode radio buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`
                  flex flex-col items-center justify-center gap-1.5 h-20 md:h-[72px] rounded-xl border-2 text-sm font-medium transition-all duration-150 touch-manipulation active:scale-[0.97]
                  ${isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected mode description + CTA */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {MODES.find((m) => m.id === selectedMode)?.description}
          </p>
          <Button
            onClick={handleStartStudy}
            className="gap-2 h-11 px-6 shrink-0 touch-manipulation"
            size="default"
          >
            <Play className="h-4 w-4 fill-current" />
            Study
          </Button>
        </div>
      </div>

      {/* Progress (if logged in) */}
      {user && totalAttempts > 0 && (
        <Card className="border-border/50 mb-8">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Your Progress</span>
              <span className="text-sm text-muted-foreground">
                {studiedCards}/{deck.cards.length} studied • {accuracy}% accuracy
              </span>
            </div>
            <Progress value={deckProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Cards List */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Cards ({deck.cards.length})
        </h2>

        {deck.cards.map((card, index) => {
          const cardProgress = progress.find((p) => p.cardId === card.id);
          return (
            <Card key={card.id || index} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <span className="text-sm font-medium text-muted-foreground min-w-[2rem] pt-0.5">
                    {index + 1}.
                  </span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Front
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => speak(card.front)}
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-medium whitespace-pre-wrap">{card.front}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Back
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => speak(card.back)}
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-medium whitespace-pre-wrap">{card.back}</p>
                    </div>
                  </div>
                  {cardProgress && (
                    <div className="text-xs text-muted-foreground text-right shrink-0">
                      <div className="text-green-500">✓ {cardProgress.correctCount}</div>
                      <div className="text-red-500">✗ {cardProgress.wrongCount}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

