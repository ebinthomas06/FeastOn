const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 200, // Increase from 20 to 50 for 2k traffic
    min: 50, // Add minimum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // Increase from 2000
    statement_timeout: 5000, // Increase from 3000 for peak load
    query_timeout: 5000,
});

// Connection error handling
pool.on('error', (err) => {
    console.error('Database pool error:', err);
});

module.exports = {
    query: async (text, params) => {
        const start = Date.now();
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            if (duration > 1000) {
                console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
            }
            return res;
        } catch (err) {
            console.error('Query error:', err.message, 'Query:', text.substring(0, 100));
            throw err;
        }
    },
    pool // Export pool for transactions
};
