"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDecks, getUserProgress, getStudyStreak, deleteDeck, getStudySessions } from "@/lib/firestore";
import type { Deck, CardProgress, StudySession } from "@/lib/types";
import { DeckCard } from "@/components/DeckCard";
import { AnalyticsCard } from "@/components/AnalyticsCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Layers,
  BookOpen,
  Target,
  Flame,
  Plus,
  Loader2,
  Upload,
  Star,
  AlertTriangle,
  CalendarClock,
  History,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [progress, setProgress] = useState<CardProgress[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userDecks, userProgress, userStreak, userSessions] = await Promise.all([
        getUserDecks(user.uid),
        getUserProgress(user.uid),
        getStudyStreak(user.uid),
        getStudySessions(user.uid),
      ]);
      setDecks(userDecks);
      setProgress(userProgress);
      setStreak(userStreak);
      setSessions(userSessions);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, router, loadData]);

  const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
  const totalStudied = progress.length;
  const correctCount = progress.reduce((sum, p) => sum + p.correctCount, 0);
  const wrongCount = progress.reduce((sum, p) => sum + p.wrongCount, 0);
  const totalAttempts = correctCount + wrongCount;
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
  const learnedWords = progress.filter((p) => p.masteryLevel >= 4).length;
  const weakWords = progress.filter((p) => p.masteryLevel <= 2 && (p.correctCount + p.wrongCount) > 0).length;
  const now = new Date();
  const upcomingReviews = progress.filter((p) => p.nextReview && new Date(p.nextReview) <= now).length;

  const handleDeleteConfirm = (deckId: string) => {
    setDeckToDelete(deckId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deckToDelete) return;
    setDeleting(true);
    try {
      await deleteDeck(deckToDelete);
      setDecks(decks.filter((d) => d.id !== deckToDelete));
    } catch (error) {
      console.error("Failed to delete deck:", error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeckToDelete(null);
    }
  };

  const handleExport = (deck: Deck) => {
    const exportData = {
      title: deck.title,
      description: deck.description,
      isPublic: deck.isPublic,
      cards: deck.cards.map((c) => ({ front: c.front, back: c.back })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-36 bg-muted rounded-lg" />
            <div className="h-4 w-52 bg-muted rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted rounded-lg" />
            <div className="h-10 w-28 bg-muted rounded-lg" />
          </div>
        </div>
        {/* Analytics row skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
        {/* Extended analytics skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
        {/* Deck grid skeleton */}
        <div className="h-6 w-28 bg-muted rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.displayName || "Learner"}! 👋
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2 h-10" asChild>
            <Link href="/deck/import">
              <Upload className="h-4 w-4" />
              Import
            </Link>
          </Button>
          <Button size="sm" className="w-full sm:w-auto gap-2 h-10" asChild>
            <Link href="/deck/create">
              <Plus className="h-4 w-4" />
              New Deck
            </Link>
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AnalyticsCard
          title="Total Decks"
          value={decks.length}
          icon={Layers}
          variant="default"
        />
        <AnalyticsCard
          title="Total Cards"
          value={totalCards}
          icon={BookOpen}
          variant="info"
        />
        <AnalyticsCard
          title="Accuracy"
          value={`${accuracy}%`}
          subtitle={`${totalStudied} cards studied`}
          icon={Target}
          progress={accuracy}
          variant="success"
        />
        <AnalyticsCard
          title="Study Streak"
          value={`${streak} day${streak !== 1 ? "s" : ""}`}
          subtitle="Keep it going!"
          icon={Flame}
          variant="warning"
        />
      </div>

      {/* Extended Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <AnalyticsCard
          title="Learned Words"
          value={learnedWords}
          subtitle="mastery ≥ 4"
          icon={Star}
          variant="success"
        />
        <AnalyticsCard
          title="Weak Words"
          value={weakWords}
          subtitle="mastery ≤ 2"
          icon={AlertTriangle}
          variant="warning"
        />
        <AnalyticsCard
          title="Due for Review"
          value={upcomingReviews}
          subtitle="spaced repetition"
          icon={CalendarClock}
          variant="info"
        />
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><History className="h-5 w-5" />Recent Sessions</h2>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s, i) => {
              const acc = s.totalQuestions > 0 ? Math.round((s.correctAnswers / s.totalQuestions) * 100) : 0;
              const modeLabel: Record<string, string> = { flashcard: "Flashcards", write: "Write", multiple_choice: "Multiple Choice", match: "Match" };
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                  <div>
                    <span className="font-medium text-sm">{modeLabel[s.mode] || s.mode}</span>
                    <span className="text-muted-foreground text-xs ml-2">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{s.correctAnswers}/{s.totalQuestions}</span>
                    <span className={`font-bold ${acc >= 80 ? "text-green-500" : acc >= 50 ? "text-yellow-500" : "text-red-500"}`}>{acc}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decks */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Decks</h2>

        {decks.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/50 rounded-xl">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No decks yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first flashcard deck to start learning
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2">
              <Button className="w-full sm:w-auto gap-2 h-11" asChild>
                <Link href="/deck/create">
                  <Plus className="h-4 w-4" />
                  Create Deck
                </Link>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto gap-2 h-11" asChild>
                <Link href="/deck/import">
                  <Upload className="h-4 w-4" />
                  Import JSON
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                isOwner
                onDelete={handleDeleteConfirm}
                onExport={handleExport}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deck</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this deck? This action cannot be
              undone. All progress data for this deck will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
