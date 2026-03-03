// ============================================================
// Flashcard & Deck Types
// ============================================================

export interface FlashCard {
  id: string;
  front: string;
  back: string;
}

export interface Deck {
  id: string;
  title: string;
  slug: string;
  description: string;
  userId: string;
  userDisplayName: string;
  isPublic: boolean;
  cards: FlashCard[];
  createdAt: string;
  updatedAt: string;
}

export interface DeckFormData {
  title: string;
  description: string;
  isPublic: boolean;
  cards: Omit<FlashCard, "id">[];
}

// ============================================================
// User & Auth Types
// ============================================================

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}

// ============================================================
// Study Progress Types
// ============================================================

export interface CardProgress {
  userId: string;
  deckId: string;
  cardId: string;
  correctCount: number;
  wrongCount: number;
  lastReviewedAt: string;
}

export interface StudySession {
  deckId: string;
  deckTitle: string;
  totalCards: number;
  correctCount: number;
  wrongCount: number;
  hardCards: FlashCard[];
  completedAt: Date;
}

export interface StudyActivity {
  userId: string;
  date: string; // YYYY-MM-DD
  cardsStudied: number;
  timestamp: string;
}

// ============================================================
// Analytics Types
// ============================================================

export interface DeckAnalytics {
  deckId: string;
  deckTitle: string;
  totalCards: number;
  studiedCards: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
}

export interface UserAnalytics {
  totalDecks: number;
  totalCards: number;
  totalStudied: number;
  overallAccuracy: number;
  studyStreak: number;
  deckAnalytics: DeckAnalytics[];
}

// ============================================================
// Component Props Types
// ============================================================

export type StudyResult = "known" | "hard" | "again";
