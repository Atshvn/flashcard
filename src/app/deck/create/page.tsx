"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createDeck } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  FileJson,
  Upload,
  Check,
  Copy,
  AlertCircle,
} from "lucide-react";

interface CardItem {
  front: string;
  back: string;
}

const EXAMPLE_JSON = `[
  {"front":"deploy (/dɪˈplɔɪ/)","back":"Triển khai\\nExample: We will deploy the application to production tomorrow."},
  {"front":"refactor (/riːˈfæktər/)","back":"Tái cấu trúc\\nExample: I need to refactor this messy code."},
  {"front":"bug (/bʌɡ/)","back":"Lỗi\\nExample: There is a bug in the login feature."},
  {"front":"commit (/kəˈmɪt/)","back":"Commit\\nExample: Don't forget to commit your changes."},
  {"front":"merge (/mɜːrdʒ/)","back":"Gộp code\\nExample: Please merge the feature branch into main."},
  {"front":"deprecate (/ˈdeprəkeɪt/)","back":"Ngừng hỗ trợ\\nExample: This API version is deprecated."},
  {"front":"legacy (/ˈleɡəsi/)","back":"Code cũ\\nExample: We still maintain some legacy systems."},
  {"front":"scalable (/ˈskeɪləbl/)","back":"Mở rộng được\\nExample: The system must be scalable."},
  {"front":"bottleneck (/ˈbɑːtlnek/)","back":"Điểm nghẽn\\nExample: The database is the bottleneck."},
  {"front":"rollback (/ˈroʊlbæk/)","back":"Hoàn tác\\nExample: We need to rollback the deployment."}
]`;

export default function CreateDeckPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [cards, setCards] = useState<CardItem[]>([
    { front: "", back: "" },
    { front: "", back: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // JSON import state
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [jsonPreview, setJsonPreview] = useState<CardItem[] | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // ── Manual card helpers ──────────────────────────────────

  const addCard = () => {
    setCards([...cards, { front: "", back: "" }]);
  };

  const removeCard = (index: number) => {
    if (cards.length <= 1) return;
    setCards(cards.filter((_, i) => i !== index));
  };

  const updateCard = (
    index: number,
    field: "front" | "back",
    value: string
  ) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], [field]: value };
    setCards(updated);
  };

  // ── JSON import helpers ──────────────────────────────────

  const parseJson = (input: string): CardItem[] | null => {
    setJsonError("");
    try {
      const data = JSON.parse(input);

      // Accept array of {front, back}
      if (Array.isArray(data)) {
        if (data.length === 0) {
          setJsonError("JSON array is empty. Add at least one card.");
          return null;
        }
        for (let i = 0; i < data.length; i++) {
          if (
            typeof data[i].front !== "string" ||
            typeof data[i].back !== "string"
          ) {
            setJsonError(
              `Card ${i + 1} is missing "front" or "back" string field.`
            );
            return null;
          }
        }
        return data.map((c: { front: string; back: string }) => ({
          front: c.front,
          back: c.back,
        }));
      }

      // Accept { cards: [...] } format
      if (data.cards && Array.isArray(data.cards)) {
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        for (let i = 0; i < data.cards.length; i++) {
          if (
            typeof data.cards[i].front !== "string" ||
            typeof data.cards[i].back !== "string"
          ) {
            setJsonError(
              `Card ${i + 1} is missing "front" or "back" string field.`
            );
            return null;
          }
        }
        return data.cards.map((c: { front: string; back: string }) => ({
          front: c.front,
          back: c.back,
        }));
      }

      setJsonError(
        'Invalid format. Provide a JSON array of {front, back} objects, or an object with a "cards" array.'
      );
      return null;
    } catch {
      setJsonError("Invalid JSON syntax. Please check your input.");
      return null;
    }
  };

  const handleJsonPreview = () => {
    const parsed = parseJson(jsonInput);
    if (parsed) {
      setJsonPreview(parsed);
    }
  };

  const handleJsonImport = () => {
    if (!jsonPreview) return;
    setCards(jsonPreview);
    setJsonPreview(null);
    setJsonInput("");
    setShowImportDialog(false);
  };

  const handleJsonAppend = () => {
    if (!jsonPreview) return;
    const nonEmptyCards = cards.filter((c) => c.front.trim() || c.back.trim());
    setCards([...nonEmptyCards, ...jsonPreview]);
    setJsonPreview(null);
    setJsonInput("");
    setShowImportDialog(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonInput(text);
      setJsonError("");
      setJsonPreview(null);
    };
    reader.readAsText(file);
    // Reset file input so the same file can be re-selected
    e.target.value = "";
  };

  const handleLoadExample = () => {
    setJsonInput(EXAMPLE_JSON);
    setJsonError("");
    setJsonPreview(null);
  };

  const handleCopyExample = async () => {
    await navigator.clipboard.writeText(EXAMPLE_JSON);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
  };

  // ── Form submit ──────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a deck title.");
      return;
    }

    const validCards = cards.filter(
      (c) => c.front.trim() && c.back.trim()
    );
    if (validCards.length < 1) {
      setError(
        "Please add at least one card with both front and back text."
      );
      return;
    }

    if (!user) return;

    setSaving(true);
    try {
      const slug = await createDeck(
        user.uid,
        user.displayName || "Anonymous",
        {
          title: title.trim(),
          description: description.trim(),
          isPublic,
          cards: validCards,
        }
      );
      router.push(`/deck/${slug}`);
    } catch (err) {
      console.error("Failed to create deck:", err);
      setError("Failed to create deck. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-4 md:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Deck</h1>
        <p className="text-muted-foreground mt-1">
          Build a new flashcard deck to start learning
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Deck Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Deck Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. IT English Vocabulary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this deck about?"
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

        {/* Cards — Tabs: Manual / Import JSON */}
        <Tabs defaultValue="manual" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Cards ({cards.length})</h2>
            <TabsList>
              <TabsTrigger value="manual" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-1.5 text-xs">
                <FileJson className="h-3.5 w-3.5" />
                Import JSON
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Manual Tab ──────────────────────────────── */}
          <TabsContent value="manual" className="space-y-4 mt-0">
            {cards.map((card, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1 pt-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-sm font-medium min-w-6">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Front
                        </Label>
                        <Input
                          placeholder="Term or question"
                          value={card.front}
                          onChange={(e) =>
                            updateCard(index, "front", e.target.value)
                          }
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Back
                        </Label>
                        <Input
                          placeholder="Definition or answer"
                          value={card.back}
                          onChange={(e) =>
                            updateCard(index, "back", e.target.value)
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
          </TabsContent>

          {/* ── Import JSON Tab ──────────────────────────── */}
          <TabsContent value="import" className="space-y-4 mt-0">
            {/* Example format */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-primary" />
                  JSON Format
                </CardTitle>
                <CardDescription>
                  Paste a JSON array of objects with{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    front
                  </code>{" "}
                  and{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    back
                  </code>{" "}
                  fields.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <pre className="text-xs bg-muted/50 border border-border/50 rounded-lg p-4 overflow-x-auto max-h-48 overflow-y-auto">
                    {`[
  {"front": "hello", "back": "xin chào"},
  {"front": "goodbye", "back": "tạm biệt"}
]`}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleLoadExample}
                  >
                    <FileJson className="h-3.5 w-3.5" />
                    Load Example (10 IT words)
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleCopyExample}
                  >
                    {copiedExample ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedExample ? "Copied!" : "Copy Example"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* JSON Input Area */}
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                {/* File upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload .json file
                  </Button>
                </div>

                {/* Text area */}
                <div className="space-y-2">
                  <Label className="text-sm">Paste JSON</Label>
                  <Textarea
                    placeholder={`[\n  {"front": "word", "back": "meaning"},\n  ...\n]`}
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      setJsonError("");
                      setJsonPreview(null);
                    }}
                    rows={10}
                    className="font-mono text-sm"
                    disabled={saving}
                  />
                </div>

                {/* Error */}
                {jsonError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{jsonError}</span>
                  </div>
                )}

                {/* Parse button */}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={handleJsonPreview}
                  disabled={!jsonInput.trim() || saving}
                >
                  <Check className="h-4 w-4" />
                  Validate & Preview
                </Button>

                {/* Preview */}
                {jsonPreview && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">
                        {jsonPreview.length} cards found — ready to import
                      </span>
                    </div>

                    {/* Preview cards */}
                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-border/50 p-3">
                      {jsonPreview.map((card, i) => (
                        <div
                          key={i}
                          className="flex gap-3 text-sm p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-muted-foreground font-mono min-w-6 text-right">
                            {i + 1}.
                          </span>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Front
                              </span>
                              <p className="font-medium truncate">
                                {card.front}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Back
                              </span>
                              <p className="text-muted-foreground truncate whitespace-pre-line">
                                {card.back}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Import actions */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => setShowImportDialog(true)}
                        className="gap-2 flex-1"
                      >
                        <FileJson className="h-4 w-4" />
                        Import {jsonPreview.length} Cards
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Show current cards from manual tab if any exist */}
            {cards.some((c) => c.front.trim() || c.back.trim()) && (
              <div className="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                ℹ️ You already have {cards.filter((c) => c.front.trim() || c.back.trim()).length}{" "}
                card(s) entered manually. When importing, you can choose to
                replace or append.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Submit */}
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
                Creating...
              </>
            ) : (
              `Create Deck (${cards.filter((c) => c.front.trim() && c.back.trim()).length} cards)`
            )}
          </Button>
        </div>
      </form>

      {/* Import Confirmation Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Cards</DialogTitle>
            <DialogDescription>
              You have {jsonPreview?.length} cards ready to import.
              {cards.some((c) => c.front.trim() || c.back.trim()) && (
                <>
                  {" "}
                  You also have{" "}
                  {
                    cards.filter((c) => c.front.trim() || c.back.trim())
                      .length
                  }{" "}
                  existing card(s).
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {cards.some((c) => c.front.trim() || c.back.trim()) && (
              <Button
                variant="outline"
                onClick={handleJsonAppend}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Append to existing
              </Button>
            )}
            <Button onClick={handleJsonImport} className="gap-2">
              <FileJson className="h-4 w-4" />
              Replace all cards
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
