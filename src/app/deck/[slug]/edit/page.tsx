"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDeckBySlug, updateDeck } from "@/lib/firestore";
import type { Deck, FlashCard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function EditDeckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    async function loadDeck() {
      try {
        const deckData = await getDeckBySlug(slug);
        if (!deckData || (user && deckData.userId !== user.uid)) {
          router.push("/dashboard");
          return;
        }
        setDeck(deckData);
        setTitle(deckData.title);
        setDescription(deckData.description || "");
        setIsPublic(deckData.isPublic);
        setCards(deckData.cards);
      } catch (error) {
        console.error("Failed to load deck:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) loadDeck();
  }, [slug, user, authLoading, router]);

  const addCard = () => {
    setCards([...cards, { id: uuidv4(), front: "", back: "" }]);
  };

  const removeCard = (index: number) => {
    if (cards.length <= 1) return;
    setCards(cards.filter((_, i) => i !== index));
  };

  const updateCardField = (
    index: number,
    field: "front" | "back",
    value: string
  ) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], [field]: value };
    setCards(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a deck title.");
      return;
    }

    const validCards = cards.filter((c) => c.front.trim() && c.back.trim());
    if (validCards.length < 1) {
      setError("Please add at least one card with both front and back text.");
      return;
    }

    if (!deck) return;

    setSaving(true);
    try {
      await updateDeck(deck.id, {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        cards: validCards,
      });
      router.push(`/deck/${slug}`);
    } catch (err) {
      console.error("Failed to update deck:", err);
      setError("Failed to update deck. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Deck</h1>
        <p className="text-muted-foreground mt-1">
          Modify your flashcard deck
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Deck Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="public">Public Deck</Label>
                <p className="text-xs text-muted-foreground">
                  Anyone can view and study this deck
                </p>
              </div>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cards ({cards.length})</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCard}
              className="gap-2"
              disabled={saving}
            >
              <Plus className="h-4 w-4" />
              Add Card
            </Button>
          </div>

          {cards.map((card, index) => (
            <Card key={card.id || index} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1 pt-2 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-sm font-medium min-w-[1.5rem]">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Front
                      </Label>
                      <Input
                        value={card.front}
                        onChange={(e) =>
                          updateCardField(index, "front", e.target.value)
                        }
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Back
                      </Label>
                      <Input
                        value={card.back}
                        onChange={(e) =>
                          updateCardField(index, "back", e.target.value)
                        }
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mt-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCard(index)}
                    disabled={cards.length <= 1 || saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addCard}
            className="w-full gap-2 border-dashed"
            disabled={saving}
          >
            <Plus className="h-4 w-4" />
            Add Another Card
          </Button>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
