"use server";

import { db } from "./db";
import { users, decks, cards, userCardProgress, studySessions } from "./db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { Deck, FlashCard, DeckFormData, CardProgress, StudySession } from "./types";
import { revalidatePath } from "next/cache";

// ============================================================
// In-memory cache: firebaseUid → internalUserId
// Lives for the lifetime of the server process (cleared on restart)
// ============================================================
const uidCache = new Map<string, string>();

export async function getInternalUserId(firebaseUid: string, displayName: string = "Unknown", email: string = `${firebaseUid}@example.com`): Promise<string> {
  // Fast path: return cached id without hitting DB
  if (uidCache.has(firebaseUid)) return uidCache.get(firebaseUid)!;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
  if (existing.length > 0) {
    uidCache.set(firebaseUid, existing[0].id);
    return existing[0].id;
  }
  
  const [created] = await db.insert(users).values({
    firebaseUid,
    name: displayName,
    email: email,
  }).returning({ id: users.id });
  uidCache.set(firebaseUid, created.id);
  return created.id;
}

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
  firebaseUid: string,
  userDisplayName: string,
  data: DeckFormData
): Promise<string> {
  const internalUserId = await getInternalUserId(firebaseUid, userDisplayName);
  const slug = generateSlug(data.title);

  const [insertedDeck] = await db
    .insert(decks)
    .values({
      title: data.title,
      description: data.description || "",
      isPublic: data.isPublic,
      slug,
      userId: internalUserId,
    })
    .returning({ id: decks.id });

  const deckId = insertedDeck.id;

  if (data.cards.length > 0) {
    await db.insert(cards).values(
      data.cards.map((c, i) => ({
        deckId,
        front: c.front,
        back: c.back,
        description: c.description ?? null,
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
  if (data.title || data.description !== undefined || data.isPublic !== undefined) {
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
          id: c.id && c.id.includes("-") ? c.id : uuidv4(),
          deckId,
          front: c.front,
          back: c.back,
          description: c.description ?? null,
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

// ... internal deck helper for joining
async function mapDeckWithCardsAndUser(deckRecs: any, returnArray = false): Promise<any> {
  if (!deckRecs || deckRecs.length === 0) return returnArray ? [] : null;
  
  const deckIds = deckRecs.map((d: any) => d.id);
  const userIds = Array.from(new Set(deckRecs.map((d: any) => d.userId))) as string[];

  // Run cards and users queries in parallel — saves one sequential round-trip
  const [allCards, allUsers] = await Promise.all([
    db.select().from(cards).where(inArray(cards.deckId, deckIds)).orderBy(cards.order),
    db.select().from(users).where(inArray(users.id, userIds)),
  ]);

  const result = deckRecs.map((d: any) => {
    const owner = allUsers.find(u => u.id === d.userId);
    return {
      id: d.id,
      title: d.title,
      slug: d.slug,
      description: d.description || "",
      userId: owner?.firebaseUid || d.userId, // Return firebaseUid to UI for logic compatibility
      userDisplayName: owner?.name || "Unknown",
      isPublic: d.isPublic,
      cards: allCards.filter(c => c.deckId === d.id).map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        description: c.description ?? undefined,
      })),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  });
  return returnArray ? result : result[0];
}

export async function getDeckBySlug(slug: string): Promise<Deck | null> {
  const deckRecs = await db.select().from(decks).where(eq(decks.slug, slug)).limit(1);
  return mapDeckWithCardsAndUser(deckRecs);
}

export async function getDeckById(deckId: string): Promise<Deck | null> {
  const deckRecs = await db.select().from(decks).where(eq(decks.id, deckId)).limit(1);
  return mapDeckWithCardsAndUser(deckRecs);
}

export async function getUserDecks(firebaseUid: string): Promise<Deck[]> {
  const internalUserId = await getInternalUserId(firebaseUid);
  const deckRecs = await db
    .select()
    .from(decks)
    .where(eq(decks.userId, internalUserId))
    .orderBy(desc(decks.createdAt));
  return mapDeckWithCardsAndUser(deckRecs, true);
}

export async function getPublicDecks(): Promise<Deck[]> {
  const deckRecs = await db
    .select()
    .from(decks)
    .where(eq(decks.isPublic, true))
    .orderBy(desc(decks.createdAt));
  return mapDeckWithCardsAndUser(deckRecs, true);
}

// ============================================================
// Enhanced Progress Operations (SM-2)
// ============================================================

export async function saveCardProgress(
  firebaseUid: string,
  deckId: string, // unused but kept for compatibility
  cardId: string,
  isCorrect: boolean,
  interval: number = 1,
  easeFactor: number = 2.5,
  masteryLevel: number = 0,
  nextReviewDate?: Date
): Promise<void> {
  const internalUserId = await getInternalUserId(firebaseUid);
  
  const existing = await db
    .select()
    .from(userCardProgress)
    .where(
      and(
        eq(userCardProgress.userId, internalUserId),
        eq(userCardProgress.cardId, cardId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userCardProgress)
      .set({
        correctCount: sql`${userCardProgress.correctCount} + ${isCorrect ? 1 : 0}`,
        wrongCount: sql`${userCardProgress.wrongCount} + ${isCorrect ? 0 : 1}`,
        masteryLevel,
        easeFactor,
        interval,
        nextReview: nextReviewDate || new Date(),
        lastReviewed: new Date(),
      })
      .where(eq(userCardProgress.id, existing[0].id));
  } else {
    await db.insert(userCardProgress).values({
      userId: internalUserId,
      cardId,
      correctCount: isCorrect ? 1 : 0,
      wrongCount: isCorrect ? 0 : 1,
      masteryLevel,
      easeFactor,
      interval,
      nextReview: nextReviewDate || new Date(),
      lastReviewed: new Date(),
    });
  }
}

export async function getDeckProgress(
  firebaseUid: string,
  deckId: string
): Promise<CardProgress[]> {
  const internalUserId = await getInternalUserId(firebaseUid);
  const deckCards = await db.select({ id: cards.id }).from(cards).where(eq(cards.deckId, deckId));
  const cardIds = deckCards.map(c => c.id);

  if (cardIds.length === 0) return [];

  const p = await db
    .select()
    .from(userCardProgress)
    .where(and(
      eq(userCardProgress.userId, internalUserId),
      inArray(userCardProgress.cardId, cardIds)
    ));
    
  return p.map((item) => ({
    userId: firebaseUid,
    cardId: item.cardId,
    correctCount: item.correctCount,
    wrongCount: item.wrongCount,
    masteryLevel: item.masteryLevel,
    easeFactor: item.easeFactor,
    interval: item.interval,
    nextReview: item.nextReview?.toISOString() || null,
    lastReviewed: item.lastReviewed?.toISOString() || null,
  }));
}

export async function getUserProgress(firebaseUid: string): Promise<CardProgress[]> {
  const internalUserId = await getInternalUserId(firebaseUid);
  const p = await db.select().from(userCardProgress).where(eq(userCardProgress.userId, internalUserId));
    
  return p.map((item) => ({
    userId: firebaseUid,
    cardId: item.cardId,
    correctCount: item.correctCount,
    wrongCount: item.wrongCount,
    masteryLevel: item.masteryLevel,
    easeFactor: item.easeFactor,
    interval: item.interval,
    nextReview: item.nextReview?.toISOString() || null,
    lastReviewed: item.lastReviewed?.toISOString() || null,
  }));
}

// ============================================================
// Study Sessions (New feature)
// ============================================================

export async function saveStudySession(
  firebaseUid: string,
  deckId: string,
  mode: string,
  totalQuestions: number,
  correctAnswers: number,
  durationSeconds: number
): Promise<void> {
  const internalUserId = await getInternalUserId(firebaseUid);
  
  await db.insert(studySessions).values({
    userId: internalUserId,
    deckId,
    mode,
    totalQuestions,
    correctAnswers,
    durationSeconds
  });
}

export async function getStudySessions(firebaseUid: string): Promise<StudySession[]> {
  const internalUserId = await getInternalUserId(firebaseUid);
  const rows = await db
    .select()
    .from(studySessions)
    .where(eq(studySessions.userId, internalUserId))
    .orderBy(desc(studySessions.createdAt));

  return rows.map(r => ({
    id: r.id,
    userId: firebaseUid,
    deckId: r.deckId,
    mode: r.mode,
    totalQuestions: r.totalQuestions || 0,
    correctAnswers: r.correctAnswers || 0,
    durationSeconds: r.durationSeconds || 0,
    createdAt: r.createdAt.toISOString()
  }));
}

export async function getStudyStreak(firebaseUid: string): Promise<number> {
  const internalUserId = await getInternalUserId(firebaseUid);
  // calculate streak based on distinct dates from study sessions
  const sessions = await db
    .select({ date: sql<string>`DATE(created_at)` })
    .from(studySessions)
    .where(eq(studySessions.userId, internalUserId))
    .orderBy(desc(sql`DATE(created_at)`))
    .groupBy(sql`DATE(created_at)`)
    .limit(90);

  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < sessions.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedDateStr = expectedDate.toISOString().split("T")[0];

    const actualDateStr = new Date(sessions[i].date).toISOString().split("T")[0];

    if (actualDateStr === expectedDateStr) {
      streak++;
    } else if (i === 0 && actualDateStr === new Date(today.getTime() - 86400000).toISOString().split("T")[0]) {
      // allow streak if they haven't studied today but studied yesterday
      streak++;
      today.setDate(today.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
