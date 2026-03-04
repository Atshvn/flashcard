import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Starting DB migration...");

  try {
    // 1. Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT now()
      );
    `;
    console.log("1. Created users table");

    // 2. Migrate data into users
    // First, from decks
    await sql`
      INSERT INTO users (firebase_uid, email, name)
      SELECT DISTINCT user_id, user_id || '@example.com', user_display_name FROM decks
      ON CONFLICT (firebase_uid) DO NOTHING;
    `;
    try {
      await sql`
        INSERT INTO users (firebase_uid, email, name)
        SELECT DISTINCT user_id, user_id || '@example.com', 'Unknown' FROM progress
        ON CONFLICT (firebase_uid) DO NOTHING;
      `;
    } catch (e: any) { console.warn("Skipped progress users load:", e.message); }

    try {
      await sql`
        INSERT INTO users (firebase_uid, email, name)
        SELECT DISTINCT user_id, user_id || '@example.com', 'Unknown' FROM study_activities
        ON CONFLICT (firebase_uid) DO NOTHING;
      `;
    } catch (e: any) { console.warn("Skipped study_activities users load:", e.message); }
    console.log("2. Migrated data into users");

    // 3. Prepare tables (decks, progress, study_activities) to use UUID user_id
    // DECKS
    // await sql`ALTER TABLE decks ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;`;
    // await sql`UPDATE decks SET owner_id = (SELECT id FROM users WHERE users.firebase_uid = decks.user_id) WHERE owner_id IS NULL;`;
    // await sql`ALTER TABLE decks DROP COLUMN user_id;`;
    // await sql`ALTER TABLE decks RENAME COLUMN owner_id TO user_id;`;
    // await sql`ALTER TABLE decks ALTER COLUMN user_id SET NOT NULL;`;
    console.log("3a. Skipped decks.user_id as it was already migrated");

    // PROGRESS -> user_card_progress
    try {
      await sql`ALTER TABLE progress RENAME TO user_card_progress;`;
      await sql`ALTER TABLE user_card_progress ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;`;
      await sql`UPDATE user_card_progress SET owner_id = (SELECT id FROM users WHERE users.firebase_uid = user_card_progress.user_id) WHERE owner_id IS NULL;`;
      await sql`ALTER TABLE user_card_progress DROP COLUMN user_id;`;
      await sql`ALTER TABLE user_card_progress RENAME COLUMN owner_id TO user_id;`;
      await sql`ALTER TABLE user_card_progress ALTER COLUMN user_id SET NOT NULL;`;
      console.log("3b. Updated user_card_progress.user_id to UUID");
    } catch (e: any) { console.warn("Skipping progress alter:", e.message); }

    // STUDY_ACTIVITIES
    try {
      await sql`ALTER TABLE study_activities ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;`;
      await sql`UPDATE study_activities SET owner_id = (SELECT id FROM users WHERE users.firebase_uid = study_activities.user_id) WHERE owner_id IS NULL;`;
      await sql`ALTER TABLE study_activities DROP COLUMN user_id;`;
      await sql`ALTER TABLE study_activities RENAME COLUMN owner_id TO user_id;`;
      await sql`ALTER TABLE study_activities ALTER COLUMN user_id SET NOT NULL;`;
      console.log("3c. Updated study_activities.user_id to UUID");
    } catch (e: any) { console.warn("Skipping study_activities alter:", e.message); }

    // 4. Add new columns to cards
    await sql`ALTER TABLE cards ADD COLUMN IF NOT EXISTS example_sentence TEXT;`;
    await sql`ALTER TABLE cards ADD COLUMN IF NOT EXISTS audio_url TEXT;`;
    await sql`ALTER TABLE cards ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`;
    console.log("4. Added columns to cards");

    // 5. Add new columns to user_card_progress
    try {
      await sql`ALTER TABLE user_card_progress RENAME COLUMN last_reviewed_at TO last_reviewed;`;
    } catch(e: any) {}
    try {
      await sql`ALTER TABLE user_card_progress DROP COLUMN IF NOT EXISTS deck_id;`;
      await sql`ALTER TABLE user_card_progress ADD COLUMN IF NOT EXISTS mastery_level INT DEFAULT 0;`;
      await sql`ALTER TABLE user_card_progress ADD COLUMN IF NOT EXISTS ease_factor FLOAT DEFAULT 2.5;`;
      await sql`ALTER TABLE user_card_progress ADD COLUMN IF NOT EXISTS interval INT DEFAULT 1;`;
      await sql`ALTER TABLE user_card_progress ADD COLUMN IF NOT EXISTS next_review TIMESTAMP;`;
      await sql`ALTER TABLE user_card_progress DROP CONSTRAINT IF EXISTS user_card_progress_user_id_card_id_key;`;
      await sql`ALTER TABLE user_card_progress ADD UNIQUE (user_id, card_id);`;
      console.log("5. Updated user_card_progress columns");
    } catch(e: any) { console.warn("Skipped step 5 user_card_progress alter", e.message); }

    // 6. Create study_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        deck_id UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
        mode TEXT NOT NULL,
        total_questions INT,
        correct_answers INT,
        duration_seconds INT,
        created_at TIMESTAMP DEFAULT now()
      );
    `;
    console.log("6. Created study_sessions table");

    // 7. Add requested indexes
    await sql`CREATE INDEX IF NOT EXISTS study_sessions_user_id_idx ON study_sessions(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS study_sessions_deck_id_idx ON study_sessions(deck_id);`;
    await sql`CREATE INDEX IF NOT EXISTS cards_deck_id_idx ON cards(deck_id);`;
    await sql`CREATE INDEX IF NOT EXISTS user_card_progress_next_review_idx ON user_card_progress(next_review);`;
    await sql`CREATE INDEX IF NOT EXISTS user_card_progress_mastery_idx ON user_card_progress(mastery_level);`;
    console.log("7. Added indexes");

    console.log("Migration complete!");
  } catch (e: any) {
    console.error("Migration failed:", e.message);
    if (e.query) console.error("Query:", e.query);
  }
}

main();
