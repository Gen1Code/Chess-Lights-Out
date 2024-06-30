import dotenv from 'dotenv';
import { createPool } from '@vercel/postgres';

dotenv.config();

const db = createPool({
    connectionString: process.env.POSTGRES_URL,
    max: 10,  // Maximum number of connections in the pool
    idleTimeoutMillis: 30000,  // 30 seconds idle time before a connection is closed
    connectionTimeoutMillis: 2000,  // 2 seconds to wait for a connection to be established
});
console.log('PostgreSQL pool initialized');
      
export default db;