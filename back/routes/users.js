// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');

const bcrypt = require('bcryptjs');

router.post('/', async (req, res) => {
    const { name, email, role, password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Password is required" });
    }

    try {
        const check = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (check.rows.length > 0) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await db.query(
            `INSERT INTO users (name, email, role, password_hash)
             VALUES ($1, $2, $3, $4)
             RETURNING user_id, name, email, role`,
            [name, email, role || 'student', passwordHash]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// LIST USERS (Helper)
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
