import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
    connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/postgres', // Fallback to prevent startup crash
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

// Test connection only if we have a real connection string or we want to log the error
if (connectionString) {
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('Database connection error:', err.message);
        } else {
            console.log('✓ Connected to Neon PostgreSQL');
        }
    });
} else {
    console.error('CRITICAL: DATABASE_URL is missing! Database queries will fail.');
}

export default pool;
