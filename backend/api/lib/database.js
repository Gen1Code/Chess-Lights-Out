import dotenv from 'dotenv';
import { createPool } from '@vercel/postgres';

dotenv.config();

const db = createPool({
    connectionString: process.env.POSTGRES_URL,
    max: 10,  // Maximum number of connections in the pool
    idleTimeoutMillis: 1000,  // 1 seconds idle time before a connection is closed
    connectionTimeoutMillis: 2000,  // 2 seconds to wait for a connection to be established
});
console.log('PostgreSQL pool initialized');

if(process.env.NODE_ENV === 'production') {
    let client;
    try {
         client = await db.connect();

        await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            user_id UUID UNIQUE NOT NULL,
            name TEXT NOT NULL
        );`);

        await client.query(`
        CREATE TABLE IF NOT EXISTS games (
            id SERIAL PRIMARY KEY,
            white_player UUID REFERENCES users(user_id) ON DELETE SET NULL,
            black_player UUID REFERENCES users(user_id) ON DELETE SET NULL,
            moves TEXT,
            status varchar(60) NOT NULL DEFAULT 'ongoing',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);

        console.log("Database setup complete");
    } catch (err) {
        console.error("Database setup failed:", err);
    } finally {
        client.release();
    }
}
      
export default db;