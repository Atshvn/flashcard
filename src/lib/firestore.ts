"use server";

import { db } from "./db";
import { decks, cards, progress, studyActivities } from "./db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { Deck, FlashCard, DeckFormData, CardProgress } from "./types";
import { revalidatePath } from "next/cache";

// ============================================================
// Slug Utilities
// ============================================================

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() +
    "-" +
    uuidv4().slice(0, 6)
  );
}

// ============================================================
// Deck Operations
// ============================================================

export async function createDeck(
  userId: string,
  userDisplayName: string,
  data: DeckFormData
): Promise<string> {
  const slug = generateSlug(data.title);

  const [insertedDeck] = await db
    .insert(decks)
    .values({
      title: data.title,
      description: data.description || "",
      isPublic: data.isPublic,
      slug,
      userId,
      userDisplayName,
    })
    .returning({ id: decks.id });

  const deckId = insertedDeck.id;

  if (data.cards.length > 0) {
    await db.insert(cards).values(
      data.cards.map((c, i) => ({
        deckId,
        front: c.front,
        back: c.back,
        order: i,
      }))
    );
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/explore");
  return slug;
}

export async function updateDeck(
  deckId: string,
  data: {
    title?: string;
    description?: string;
    isPublic?: boolean;
    cards?: FlashCard[];
  }
): Promise<void> {
  if (data.title || data.description || data.isPublic !== undefined) {
    await db
      .update(decks)
      .set({
        title: data.title,
        description: data.description,
        isPublic: data.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(decks.id, deckId));
  }

  if (data.cards) {
    await db.delete(cards).where(eq(cards.deckId, deckId));
    if (data.cards.length > 0) {
      await db.insert(cards).values(
        data.cards.map((c, i) => ({
          id: c.id || uuidv4(),
          deckId,
          front: c.front,
          back: c.back,
          order: i,
        }))
      );
    }
  }

  revalidatePath(`/deck/${deckId}`);
  revalidatePath("/dashboard");
}

export async function deleteDeck(deckId: string): Promise<void> {
  await db.delete(decks).where(eq(decks.id, deckId));
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/explore");
}

export async function getDeckBySlug(slug: string): Promise<Deck | null> {
  const deckRecs = await db.select().from(decks).where(eq(decks.slug, slug)).limit(1);
  if (deckRecs.length === 0) return null;

  const deck = deckRecs[0];
  const cardRecs = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deck.id))
    .orderBy(cards.order);

  return {
    id: deck.id,
    title: deck.title,
    slug: deck.slug,
    description: deck.description || "",
    userId: deck.userId,
    userDisplayName: deck.userDisplayName,
    isPublic: deck.isPublic,
    cards: cardRecs.map((c) => ({ id: c.id, front: c.front, back: c.back })),
    createdAt: deck.createdAt.toISOString() as any,
    updatedAt: deck.updatedAt.toISOString() as any,
  };
}

export async function getDeckById(deckId: string): Promise<Deck | null> {
  const deckRecs = await db.select().from(decks).where(eq(decks.id, deckId)).limit(1);
  if (deckRecs.length === 0) return null;
  
  const deck = deckRecs[0];
  const cardRecs = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deck.id))
    .orderBy(cards.order);

  return {
    ...deck,
    description: deck.description || "",
    cards: cardRecs.map((c) => ({ id: c.id, front: c.front, back: c.back })),
    createdAt: deck.createdAt.toISOString() as any,
    updatedAt: deck.updatedAt.toISOString() as any,
  };
}

export async function getUserDecks(userId: string): Promise<Deck[]> {
  const deckRecs = await db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(desc(decks.createdAt));

  const allCards = await db.select({ deckId: cards.deckId, id: cards.id }).from(cards);

  return deckRecs.map((d) => {
    const dCards = allCards.filter((c) => c.deckId === d.id);
    return {
      ...d,
      description: d.description || "",
      cards: dCards as any,
      createdAt: d.createdAt.toISOString() as any,
      updatedAt: d.updatedAt.toISOString() as any,
    };
  });
}

export async function getPublicDecks(): Promise<Deck[]> {
  const deckRecs = await db
    .select()
    .from(decks)
    .where(eq(decks.isPublic, true))
    .orderBy(desc(decks.createdAt));
    
  const allCards = await db.select({ deckId: cards.deckId, id: cards.id }).from(cards);

  return deckRecs.map((d) => {
    const dCards = allCards.filter((c) => c.deckId === d.id);
    return {
      ...d,
      description: d.description || "",
      cards: dCards as any,
      createdAt: d.createdAt.toISOString() as any,
      updatedAt: d.updatedAt.toISOString() as any,
    };
  });
}

// ============================================================
// Progress Operations
// ============================================================

export async function saveCardProgress(
  userId: string,
  deckId: string,
  cardId: string,
  isCorrect: boolean
): Promise<void> {
  const existing = await db
    .select()
    .from(progress)
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.deckId, deckId),
        eq(progress.cardId, cardId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(progress)
      .set({
        correctCount: sql`${progress.correctCount} + ${isCorrect ? 1 : 0}`,
        wrongCount: sql`${progress.wrongCount} + ${isCorrect ? 0 : 1}`,
        lastReviewedAt: new Date(),
      })
      .where(eq(progress.id, existing[0].id));
  } else {
    await db.insert(progress).values({
      userId,
      deckId,
      cardId,
      correctCount: isCorrect ? 1 : 0,
      wrongCount: isCorrect ? 0 : 1,
    });
  }
}

export async function getDeckProgress(
  userId: string,
  deckId: string
): Promise<CardProgress[]> {
  const p = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.deckId, deckId)));
    
  return p.map((item) => ({
    ...item,
    lastReviewedAt: item.lastReviewedAt.toISOString() as any,
  }));
}

export async function getUserProgress(userId: string): Promise<CardProgress[]> {
  const p = await db.select().from(progress).where(eq(progress.userId, userId));
    
  return p.map((item) => ({
    ...item,
    lastReviewedAt: item.lastReviewedAt.toISOString() as any,
  }));
}

// ============================================================
// Study Activity Operations (for streak tracking)
// ============================================================

export async function recordStudyActivity(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const activityId = `${userId}_${today}`;
  
  const existing = await db
    .select()
    .from(studyActivities)
    .where(eq(studyActivities.id, activityId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(studyActivities)
      .set({
        cardsStudied: sql`${studyActivities.cardsStudied} + 1`,
        timestamp: new Date(),
      })
      .where(eq(studyActivities.id, activityId));
  } else {
    await db.insert(studyActivities).values({
      id: activityId,
      userId,
      date: today,
      cardsStudied: 1,
    });
  }
}

export async function getStudyStreak(userId: string): Promise<number> {
  const activities = await db
    .select()
    .from(studyActivities)
    .where(eq(studyActivities.userId, userId))
    .orderBy(desc(studyActivities.date))
    .limit(90);

  if (activities.length === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < activities.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedDateStr = expectedDate.toISOString().split("T")[0];

    if (activities[i].date === expectedDateStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
