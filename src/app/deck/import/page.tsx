"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createDeck } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Upload, FileJson, Check } from "lucide-react";

interface ImportedDeck {
  title: string;
  description?: string;
  isPublic?: boolean;
  cards: { front: string; back: string }[];
}

export default function ImportDeckPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [parsedDeck, setParsedDeck] = useState<ImportedDeck | null>(null);
  const [parseError, setParseError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleParse = () => {
    setParseError("");
    setParsedDeck(null);

    try {
      const data = JSON.parse(jsonInput) as ImportedDeck;

      if (!data.title || typeof data.title !== "string") {
        throw new Error('JSON must include a "title" field (string)');
      }

      if (!Array.isArray(data.cards) || data.cards.length === 0) {
        throw new Error(
          'JSON must include a "cards" array with at least one card'
        );
      }

      for (let i = 0; i < data.cards.length; i++) {
        const card = data.cards[i];
        if (!card.front || !card.back) {
          throw new Error(
            `Card ${i + 1} is missing "front" or "back" field`
          );
        }
      }

      setParsedDeck(data);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setParseError("Invalid JSON format. Please check your input.");
      } else if (err instanceof Error) {
        setParseError(err.message);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonInput(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedDeck || !user) return;

    setSaving(true);
    setError("");

    try {
      const slug = await createDeck(user.uid, user.displayName || "Anonymous", {
        title: parsedDeck.title,
        description: parsedDeck.description || "",
        isPublic: parsedDeck.isPublic || false,
        cards: parsedDeck.cards,
      });
      router.push(`/deck/${slug}`);
    } catch (err) {
      console.error("Failed to import deck:", err);
      setError("Failed to import deck. Please try again.");
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
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Import Deck</h1>
        <p className="text-muted-foreground mt-1">
          Import a flashcard deck from a JSON file
        </p>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* JSON Format Example */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Expected Format</CardTitle>
            <CardDescription>
              Your JSON file should follow this structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto">
              {JSON.stringify(
                {
                  title: "My Deck",
                  description: "Optional description",
                  isPublic: false,
                  cards: [
                    { front: "Hello", back: "Xin chào" },
                    { front: "Goodbye", back: "Tạm biệt" },
                  ],
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload JSON File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/30 transition-colors">
                <FileJson className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">JSON files only</p>
              </div>
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Or Paste JSON</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your JSON here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            {parseError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {parseError}
              </div>
            )}
            <Button
              onClick={handleParse}
              disabled={!jsonInput.trim()}
              variant="outline"
              className="gap-2"
            >
              Validate JSON
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        {parsedDeck && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-500">
                <Check className="h-5 w-5" />
                Valid Deck Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">{parsedDeck.title}</p>
                {parsedDeck.description && (
                  <p className="text-sm text-muted-foreground">
                    {parsedDeck.description}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {parsedDeck.cards.length} cards •{" "}
                {parsedDeck.isPublic ? "Public" : "Private"}
              </p>

              <Button
                onClick={handleImport}
                disabled={saving}
                className="w-full gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Deck
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
