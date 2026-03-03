"use client";

import { useEffect, useState } from "react";
import { getPublicDecks } from "@/lib/firestore";
import type { Deck } from "@/lib/types";
import { DeckCard } from "@/components/DeckCard";
import { Input } from "@/components/ui/input";
import { Loader2, Search, BookOpen } from "lucide-react";

export default function ExplorePage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadDecks() {
      try {
        const publicDecks = await getPublicDecks();
        setDecks(publicDecks);
      } catch (error) {
        console.error("Failed to load public decks:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDecks();
  }, []);

  const filteredDecks = decks.filter(
    (deck) =>
      deck.title.toLowerCase().includes(search.toLowerCase()) ||
      deck.description?.toLowerCase().includes(search.toLowerCase()) ||
      deck.userDisplayName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          Explore Decks
        </h1>
        <p className="text-muted-foreground">
          Discover public flashcard decks created by the community
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search decks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredDecks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/50 rounded-xl">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {search ? "No matching decks" : "No public decks yet"}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {search
              ? "Try a different search term"
              : "Be the first to create a public deck!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}
    </div>
  );
}
