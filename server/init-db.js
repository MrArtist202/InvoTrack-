// Script to initialize database schema
const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initDB() {
    console.log('Initializing database schema...');

    try {
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await pool.query(schema);
        console.log('✓ Database schema created successfully!');

        // Verify tables
        const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables created:', tables.rows.map(r => r.table_name).join(', '));

    } catch (err) {
        console.error('Error initializing database:', err.message);
    } finally {
        pool.end();
    }
}

initDB();
