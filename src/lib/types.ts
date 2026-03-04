export interface FlashCard {
  id: string;
  front: string;
  back: string;
  exampleSentence?: string | null;
  audioUrl?: string | null;
}

export interface Deck {
  id: string;
  title: string;
  slug: string;
  description: string;
  userId: string; // The UUID of the owner in our DB
  firebaseUid?: string; // Additional field to pass info if needed
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
  cards: Omit<FlashCard, "id" | "exampleSentence" | "audioUrl">[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}

export interface CardProgress {
  userId: string;
  cardId: string;
  correctCount: number;
  wrongCount: number;
  masteryLevel: number;
  easeFactor: number;
  interval: number;
  nextReview: string | null;
  lastReviewed: string | null;
}

export interface StudySession {
  id?: string;
  userId: string;
  deckId: string;
  mode: string;
  totalQuestions: number;
  correctAnswers: number;
  durationSeconds: number;
  createdAt: string;
}

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
  learnedWords: number;
  weakWords: number;
  upcomingReviews: number;
}

export type StudyResult = "known" | "hard" | "again";
