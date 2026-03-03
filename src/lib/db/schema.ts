import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const decks = pgTable("decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  userId: varchar("user_id", { length: 128 }).notNull(), // Map with Firebase Auth UID
  userDisplayName: varchar("user_display_name", { length: 255 }).notNull(),
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
  order: integer("order").notNull(), // In case users want to order cards
});

export const progress = pgTable("progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  deckId: uuid("deck_id")
    .references(() => decks.id, { onDelete: "cascade" })
    .notNull(),
  cardId: uuid("card_id")
    .references(() => cards.id, { onDelete: "cascade" })
    .notNull(),
  correctCount: integer("correct_count").default(0).notNull(),
  wrongCount: integer("wrong_count").default(0).notNull(),
  lastReviewedAt: timestamp("last_reviewed_at").defaultNow().notNull(),
});

export const studyActivities = pgTable("study_activities", {
  id: varchar("id", { length: 255 }).primaryKey(), // E.g: uid_YYYY-MM-DD
  userId: varchar("user_id", { length: 128 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  cardsStudied: integer("cards_studied").default(0).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
