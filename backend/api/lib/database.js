import dotenv from "dotenv";
import { createPool } from "@vercel/postgres";

dotenv.config();

const db = createPool({
  connectionString: process.env.POSTGRES_URL,
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 1000, // 1 seconds idle time before a connection is closed
  connectionTimeoutMillis: 2000, // 2 seconds to wait for a connection to be established
});
console.log("PostgreSQL pool initialized");

async function setupDatabase() {
  let client;
  try {
    client = await db.connect();

    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          user_id UUID UNIQUE NOT NULL,
          name TEXT NOT NULL
        );`;

    const createGamesTable = `
        CREATE TABLE IF NOT EXISTS games (
          id SERIAL PRIMARY KEY,
          game_id UUID UNIQUE NOT NULL,
          white_player UUID REFERENCES users(user_id) ON DELETE SET NULL,
          black_player UUID REFERENCES users(user_id) ON DELETE SET NULL,
          moves TEXT DEFAULT '[]',
          board TEXT,
          maze TEXT,
          status VARCHAR(60) NOT NULL DEFAULT 'not started',
          lights_out_setting BOOLEAN NOT NULL DEFAULT FALSE,
          maze_Setting VARCHAR(10) NOT NULL DEFAULT 'Off',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`;

    await client.query(createUsersTable);
    await client.query(createGamesTable);

    console.log("Database setup complete");
  } catch (err) {
    console.error("Database setup failed", err);
  } finally {
    if (client) client.release();
  }
}

if (process.env.NODE_ENV === "production") {
  setupDatabase();
}

export default db;