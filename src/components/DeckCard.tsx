"use client";

import Link from "next/link";
import {
  Card,
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

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Layers className="h-5 w-5 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="font-semibold text-base leading-snug truncate">{deck.title}</p>
              {deck.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{deck.description}</p>
              )}
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1 -mt-0.5">
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

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">{deck.cards.length} thẻ</span>
            <Badge variant={deck.isPublic ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
              {deck.isPublic ? "Public" : "Private"}
            </Badge>
            {!isOwner && deck.userDisplayName && (
              <span className="text-xs text-muted-foreground">· {deck.userDisplayName}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-0">
        <Button size="sm" className="flex-1 h-9 gap-1.5 rounded-xl" asChild>
          <Link href={`/study/${deck.slug}`}>
            <BookOpen className="h-3.5 w-3.5" />
            Học ngay
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="h-9 px-4 rounded-xl" asChild>
          <Link href={`/deck/${deck.slug}`}>Xem</Link>
        </Button>
        {deck.isPublic && (
          <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl shrink-0" onClick={handleCopyLink}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}
