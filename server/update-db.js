// Script to update database schema
const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function updateDB() {
    console.log('Updating database schema...');

    try {
        const schema = fs.readFileSync(path.join(__dirname, 'notifications-schema.sql'), 'utf8');
        await pool.query(schema);
        console.log('✓ Notifications table created successfully!');
    } catch (err) {
        console.error('Error updating database:', err.message);
    } finally {
        pool.end();
    }
}

updateDB();
