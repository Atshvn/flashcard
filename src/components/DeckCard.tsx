"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Copy,
  ExternalLink,
  Layers,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import type { Deck } from "@/lib/types";
import { useState } from "react";

interface DeckCardProps {
  deck: Deck;
  isOwner?: boolean;
  onDelete?: (deckId: string) => void;
  onExport?: (deck: Deck) => void;
}

export function DeckCard({
  deck,
  isOwner = false,
  onDelete,
  onExport,
}: DeckCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/deck/${deck.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col">
      {/* Gradient accent top */}
      <div className="h-1 w-full gradient-primary opacity-60 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {deck.title}
            </CardTitle>
            {deck.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {deck.description}
              </p>
            )}
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/deck/${deck.slug}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {onExport && (
                  <DropdownMenuItem onClick={() => onExport(deck)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Export JSON
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {copied ? "Copied!" : "Copy Link"}
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(deck.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <span>{deck.cards.length} cards</span>
          </div>
          <Badge
            variant={deck.isPublic ? "default" : "secondary"}
            className="text-xs"
          >
            {deck.isPublic ? "Public" : "Private"}
          </Badge>
        </div>
        {!isOwner && deck.userDisplayName && (
          <p className="text-xs text-muted-foreground mt-2">
            by {deck.userDisplayName}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/50 gap-2">
        <Button size="sm" className="flex-1 gap-1.5" asChild>
          <Link href={`/study/${deck.slug}`}>
            <BookOpen className="h-3.5 w-3.5" />
            Study
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" asChild>
          <Link href={`/deck/${deck.slug}`}>
            View
          </Link>
        </Button>
        {deck.isPublic && (
          <Button
            size="sm"
            variant="ghost"
            className="px-2"
            onClick={handleCopyLink}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
