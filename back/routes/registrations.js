// routes/registrations.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');


const generateToken = () => crypto.randomBytes(16).toString('hex');
const scanLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 3, // Max 3 scans per second per IP
    message: { error: "Too many scan attempts, please wait" }
});

// ==========================================
// 1. REGISTER STUDENT (Auto-assigns Random Slot)
// ==========================================
router.post('/', async (req, res) => {
    const { student_id, event_id } = req.body;

    try {
        // A. Check if Registration Exists
        const check = await db.query(
            'SELECT * FROM registrations WHERE student_id = $1 AND event_id = $2',
            [student_id, event_id]
        );

        // If exists, handle logic
        if (check.rows.length > 0) {
            const existingReg = check.rows[0];

            // If they already ate, DO NOT show the QR again (Redeemed)
            if (existingReg.status === 'served') {
                return res.status(400).json({ 
                    error: "Coupon already redeemed. You have been served.",
                    isRedeemed: true 
                });
            }

            // If registered but not served, just return existing data
            return res.status(200).json({
                message: "Existing registration retrieved",
                data: existingReg 
            });
        }

        // B. Find ANY valid slot for this event
        // We look for slots where the END TIME is in the future.
        // Using NOW() at UTC + 5.5h logic matches the event auto-close logic
        const slots = await db.query(
            `SELECT slot_id FROM event_slots 
             WHERE event_id = $1`, 
            [event_id]
        );

        if (slots.rows.length === 0) {
            return res.status(404).json({ 
                error: "Registration closed. No slots configured for this event." 
            });
        }

        // C. Randomly pick one slot
        const randomSlot = slots.rows[Math.floor(Math.random() * slots.rows.length)];
        
        // D. Create Registration
        const token = generateToken();
        const newReg = await db.query(
            `INSERT INTO registrations (student_id, event_id, slot_id, qr_token, status)
             VALUES ($1, $2, $3, $4, 'registered')
             RETURNING registration_id, qr_token, status`,
            [student_id, event_id, randomSlot.slot_id, token]
        );

        res.status(201).json({
            message: "Registration successful",
            data: newReg.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// ==========================================
// 2. SCAN QR CODE (Volunteer Action)
// ==========================================
router.post('/scan', scanLimiter, async (req, res) => {
    const { qr_token, volunteer_id } = req.body;

    // Input validation
    if (!qr_token || !volunteer_id) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof qr_token !== 'string' || qr_token.length !== 32) {
        return res.status(400).json({ error: "Invalid QR token format" });
    }

    console.log('=== SCAN REQUEST ===');
    console.log('QR Token:', qr_token);
    console.log('Volunteer ID:', volunteer_id);

    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');

        // A. Find Registration with student details in one query
        const regResult = await client.query(`
            SELECT r.*, u.name as student_name, u.email, u.batch
            FROM registrations r
            JOIN users u ON r.student_id = u.user_id
            WHERE r.qr_token = $1
            FOR UPDATE
        `, [qr_token]);
        
        if (regResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Invalid QR Token" });
        }

        const registration = regResult.rows[0];
        console.log('✅ Found registration for:', registration.student_name);

        // B. Get volunteer details
        const volunteerResult = await client.query(
            'SELECT event_id, current_floor, current_counter, name FROM volunteers WHERE id = $1',
            [volunteer_id]
        );

        if (volunteerResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Volunteer not found" });
        }

        const volunteer = volunteerResult.rows[0];

        // C. Validate Event Match
        if (registration.event_id !== volunteer.event_id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ 
                error: "You can only scan QR codes for your assigned event" 
            });
        }

        // D. Check Status
        if (registration.status === 'served') {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: "Student already served",
                student_name: registration.student_name
            });
        }

        // E. Update with proper timezone
        await client.query(
            "UPDATE registrations SET status = 'served', served_at = timezone('Asia/Kolkata', NOW()) WHERE registration_id = $1",
            [registration.registration_id]
        );

        // F. Record volunteer action
        await client.query(
            `INSERT INTO volunteer_actions (volunteer_id, registration_id, action, floor, counter) 
             VALUES ($1, $2, 'scan', $3, $4)`,
            [volunteer_id, registration.registration_id, volunteer.current_floor, volunteer.current_counter]
        );

        await client.query('COMMIT');

        console.log('✅ Scan completed successfully');
        res.json({ 
            message: "Scan successful", 
            student_id: registration.student_id,
            student_name: registration.student_name,
            batch: registration.batch,
            success: true
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Scan error:', err);
        res.status(500).json({ error: "Server error during scan" });
    } finally {
        client.release();
    }
});

module.exports = router;
