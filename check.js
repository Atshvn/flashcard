require('dotenv').config({path:'.env.local'});
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'decks'`.then(res => console.log(JSON.stringify(res, null, 2)));
