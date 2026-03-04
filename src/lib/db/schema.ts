import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firebaseUid: text("firebase_uid").unique().notNull(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const decks = pgTable("decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  deckId: uuid("deck_id")
    .references(() => decks.id, { onDelete: "cascade" })
    .notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  description: text("description"),    // pronunciation, example sentence, extra notes
  exampleSentence: text("example_sentence"),
  audioUrl: text("audio_url"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("cards_deck_id_idx").on(table.deckId)
]);

export const userCardProgress = pgTable("user_card_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  cardId: uuid("card_id")
    .references(() => cards.id, { onDelete: "cascade" })
    .notNull(),
  correctCount: integer("correct_count").default(0).notNull(),
  wrongCount: integer("wrong_count").default(0).notNull(),
  masteryLevel: integer("mastery_level").default(0).notNull(),
  easeFactor: real("ease_factor").default(2.5).notNull(),
  interval: integer("interval").default(1).notNull(),
  nextReview: timestamp("next_review"),
  lastReviewed: timestamp("last_reviewed"),
}, (table) => [
  uniqueIndex("progress_user_card_idx").on(table.userId, table.cardId),
  index("progress_next_review_idx").on(table.nextReview),
  index("progress_mastery_idx").on(table.masteryLevel),
  index("progress_user_id_idx").on(table.userId)
]);

export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  deckId: uuid("deck_id")
    .references(() => decks.id, { onDelete: "cascade" })
    .notNull(),
  mode: text("mode").notNull(),
  totalQuestions: integer("total_questions"),
  correctAnswers: integer("correct_answers"),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("study_sessions_user_id_idx").on(table.userId),
  index("study_sessions_deck_id_idx").on(table.deckId),
]);
