import dotenv from "dotenv";
import { sql } from "@vercel/postgres";

dotenv.config();

async function setupDatabase() {
    let client;
    try {
        client = await sql.connect();

        await client.sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      user_id UUID UNIQUE NOT NULL,
      name TEXT NOT NULL
    );`;

        await client.sql`CREATE TABLE IF NOT EXISTS games (
          id SERIAL PRIMARY KEY,
          game_id UUID UNIQUE NOT NULL,
          white_player UUID REFERENCES users(user_id) ON DELETE SET NULL,
          black_player UUID REFERENCES users(user_id) ON DELETE SET NULL,
          moves TEXT DEFAULT '[]',
          board TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          maze TEXT DEFAULT '{}',
          status VARCHAR(20) NOT NULL DEFAULT 'not started',
          lights_out_setting BOOLEAN NOT NULL DEFAULT FALSE,
          maze_setting VARCHAR(10) NOT NULL DEFAULT 'Off',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`;

        console.log("Database setup complete");
    } catch (err) {
        console.error("Database setup failed", err);
    } finally {
        if (client) client.release();
    }
}

if (process.env.NODE_ENV === "production") {
    await setupDatabase();
}