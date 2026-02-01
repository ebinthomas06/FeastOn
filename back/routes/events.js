// routes/events.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth'); 
const rateLimit = require('express-rate-limit');

const adminMutationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 admin actions per minute
  standardHeaders: true,
  legacyHeaders: false
});





// ==========================================
// 2. CREATE EVENT (Admin)
// ==========================================
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  adminMutationLimiter,
  async (req, res) => {
    const { name, description, date, status } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO events (name, description, date, status) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, description, date, status || 'active']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// ==========================================
// 3. CLOSE / UPDATE EVENT (Admin)
// ==========================================
router.patch(
  '/:id',
  authenticateToken,
  requireAdmin,
  adminMutationLimiter,
  async (req, res) => {    const { id } = req.params;
    // We extract status explicitly. If the admin sends "active", we MUST respect it.
    let { name, description, date, status, time_start, time_end } = req.body;

    try {
        // 1. Update the Main Event Details
        // We do NOT check the time here. If the admin says it's active, it's active.
        const result = await db.query(
            `UPDATE events 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 date = COALESCE($3, date),
                 status = COALESCE($4, status) 
             WHERE event_id = $5 RETURNING *`,
            [name, description, date, status, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: "Event not found" });

        // 2. Update the Slots
if (time_start && time_end) {
    await db.query(
        `UPDATE event_slots 
         SET time_start = $1::timestamp, 
             time_end = $2::timestamp 
         WHERE event_id = $3`,
        [time_start, time_end, id]
    );
}

        res.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// ==========================================
// 4. CREATE SLOT
// ==========================================
router.post(
  '/:id/slots',
  authenticateToken,
  requireAdmin,
  adminMutationLimiter,
  async (req, res) => {
    const { id } = req.params;
    const { floor, counter, capacity, time_start, time_end } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO event_slots (event_id, floor, counter, capacity, time_start, time_end) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [id, floor, counter, capacity, time_start, time_end]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// ==========================================
// 5. DELETE EVENT (Transactional Hard Delete)
// ==========================================
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  adminMutationLimiter,
  async (req, res) => {    const { id } = req.params;
    
    try {
        // Use db.query instead of pool connection
        await db.query('BEGIN');

        // 1. Delete Volunteer Actions
        await db.query(`
            DELETE FROM volunteer_actions 
            WHERE registration_id IN (
                SELECT registration_id FROM registrations WHERE event_id = $1
            )
        `, [id]);

        // 2. Delete Student Registrations
        await db.query('DELETE FROM registrations WHERE event_id = $1', [id]);

        // 3. Delete Event Slots
        await db.query('DELETE FROM event_slots WHERE event_id = $1', [id]);

        // 4. Delete Volunteers assigned to this event
        await db.query('DELETE FROM volunteers WHERE event_id = $1', [id]);

        // 5. Finally, Delete the Main Event
        const result = await db.query('DELETE FROM events WHERE event_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: "Event not found" });
        }

        await db.query('COMMIT');
        res.json({ message: "Event and all related data permanently deleted." });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Server error during deletion" });
    }
});


// ==========================================
// 6. VOLUNTEER MANAGEMENT
// ==========================================

// GET Volunteers for an Event
router.get('/:id/volunteers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT id, name, username FROM volunteers WHERE event_id = $1 ORDER BY name ASC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// ADD a New Volunteer
router.post(
  '/:id/volunteers',
  authenticateToken,
  requireAdmin,
  adminMutationLimiter,
  async (req, res) => {    try {
        const { id } = req.params; // event_id
        const { name, username, password } = req.body;

        const userCheck = await db.query('SELECT * FROM volunteers WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username already taken.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newVol = await db.query(
            'INSERT INTO volunteers (event_id, name, username, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, username',
            [id, name, username, passwordHash]
        );

        res.json(newVol.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// DELETE VOLUNTEER
router.delete(
  '/volunteers/:id',
  authenticateToken,
  requireAdmin,
  adminMutationLimiter,
  async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM volunteer_actions WHERE volunteer_id = $1', [id]);
        const result = await db.query('DELETE FROM volunteers WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Volunteer not found" });
        }

        res.json({ message: "Volunteer deleted successfully" });
    } catch (err) {
        console.error("Error deleting volunteer:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ==========================================
// 7. EVENT STATISTICS & DASHBOARD DATA
// ==========================================

// ADMIN – OVERALL EVENT STATS
router.get(
  '/:id/stats',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      const totalReq = await db.query(`
        SELECT COUNT(*) 
        FROM volunteer_actions va
        JOIN registrations r ON va.registration_id = r.registration_id
        WHERE r.event_id = $1
      `, [id]);

      const batchReq = await db.query(`
        SELECT u.batch, COUNT(*) as count
        FROM volunteer_actions va
        JOIN registrations r ON va.registration_id = r.registration_id
        JOIN users u ON r.student_id = u.user_id
        WHERE r.event_id = $1
        GROUP BY u.batch
        ORDER BY u.batch ASC
      `, [id]);

      const counterReq = await db.query(`
        SELECT 
          CONCAT(va.floor, ' - Counter ', va.counter) AS counter_name,
          COUNT(*) as count
        FROM volunteer_actions va
        JOIN registrations r ON va.registration_id = r.registration_id
        WHERE r.event_id = $1
        GROUP BY va.floor, va.counter
        ORDER BY va.floor, va.counter
      `, [id]);

      res.json({
        total: Number(totalReq.rows[0].count),
        byBatch: batchReq.rows,
        byCounter: counterReq.rows
      });

    } catch (err) {
      console.error('Admin stats error:', err);
      res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  }
);




// ==========================================
// 8. ACTIVE & STUDENT EVENTS
// ==========================================
// 8. GET ACTIVE EVENTS (Student Dashboard)
router.get('/active', async (req, res) => {
    const studentId = req.query.student_id;

    try {
        let query;
        let params = [];
        if (studentId) {
            query = `
                SELECT 
                    e.*, 
                    r.registration_id,
                    r.status as registration_status,
                    r.served_at, 
                    s.floor, 
                    s.counter,
                    s.time_start, 
                    s.time_end
                FROM events e
                LEFT JOIN registrations r ON e.event_id = r.event_id AND r.student_id = $1
                LEFT JOIN event_slots s ON r.slot_id = s.slot_id
                WHERE e.status = 'active' 
                ORDER BY e.date ASC
            `;
            params = [studentId];
        } else {
            query = `
                SELECT * FROM events e
                WHERE status = 'active' 
                ORDER BY date ASC
            `;
        }

        const result = await db.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET ALL EVENTS FOR STUDENT (History + Active)
router.get('/all-for-student', async (req, res) => {
    const studentId = req.query.student_id;

    try {
        if (studentId) {
            const query = `
                SELECT 
                    e.*, 
                    r.registration_id,
                    r.status as registration_status,
                    r.served_at, 
                    s.floor, 
                    s.counter,
                    s.time_start, 
                    s.time_end
                FROM events e
                LEFT JOIN registrations r ON e.event_id = r.event_id AND r.student_id = $1
                LEFT JOIN event_slots s ON r.slot_id = s.slot_id
                WHERE (e.status = 'closed') 
                   OR (e.status = 'active' AND (s.time_end IS NULL OR s.time_end > NOW()))
                ORDER BY e.date DESC, s.time_start DESC
            `;
            
            const result = await db.query(query, [studentId]);
            res.json(result.rows);
        } else {
            res.status(400).json({ error: "Student ID required" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});


// GET SCAN HISTORY
router.get('/:id/scan-history', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100
    const offset = parseInt(req.query.offset) || 0;
    
    try {
        const result = await db.query(`
            SELECT 
                u.name as student_name,
                u.email as roll_number,
                u.batch,
                COALESCE(CONCAT(va.floor, ' - Counter ', va.counter), 'Staff') as counter_name,
                r.served_at as scanned_at
            FROM registrations r
            JOIN users u ON r.student_id = u.user_id
            LEFT JOIN volunteer_actions va ON va.registration_id = r.registration_id
            WHERE r.event_id = $1 AND r.status = 'served'
            ORDER BY r.served_at DESC
            LIMIT $2 OFFSET $3
        `, [id, limit, offset]);

        res.json({ 
            scanHistory: result.rows,
            hasMore: result.rows.length === limit
        });
    } catch (err) {
        console.error('❌ Scan history error:', err);
        res.status(500).json({ error: "Server error fetching scan history" });
    }
});

// Optimized volunteer stats
router.get('/:id/stats/volunteer/:vid', authenticateToken, async (req, res) => {
    const { id, vid } = req.params;
    
    try {
        const [totalResult, batchResult, volunteerResult] = await Promise.all([
            db.query(`
                SELECT COUNT(*) 
                FROM volunteer_actions va
                JOIN registrations r ON va.registration_id = r.registration_id
                WHERE r.event_id = $1 AND va.volunteer_id = $2
            `, [id, vid]),
            
            db.query(`
                SELECT u.batch, COUNT(*) as count
                FROM volunteer_actions va
                JOIN registrations r ON va.registration_id = r.registration_id
                JOIN users u ON r.student_id = u.user_id
                WHERE r.event_id = $1 AND va.volunteer_id = $2
                GROUP BY u.batch
                ORDER BY u.batch ASC
            `, [id, vid]),
            
            db.query('SELECT name FROM volunteers WHERE id = $1', [vid])
        ]);

        res.json({
            total: parseInt(totalResult.rows[0].count),
            byBatch: batchResult.rows,
            volunteerName: volunteerResult.rows[0]?.name || 'Unknown'
        });

    } catch (err) {
        console.error('❌ Volunteer stats error:', err);
        res.status(500).json({ error: "Server error fetching volunteer stats" });
    }
});

// GET available slots
router.get('/:id/slots', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT DISTINCT floor, counter 
            FROM event_slots 
            WHERE event_id = $1 
            ORDER BY floor, counter
        `, [id]);

        res.json({ slots: result.rows });
    } catch (err) {
        console.error('Error fetching event slots:', err);
        res.status(500).json({ error: "Server error" });
    }
});

// UPDATE volunteer's assignment
router.patch(
  '/volunteers/:vid/assignment',
  authenticateToken,
  adminMutationLimiter,
  async (req, res) => {
    const { vid } = req.params;
    const { floor, counter } = req.body;
    try {
        const result = await db.query(`
            UPDATE volunteers 
            SET current_floor = $1, current_counter = $2 
            WHERE id = $3 
            RETURNING id, name, current_floor, current_counter
        `, [floor, counter, vid]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Volunteer not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating volunteer assignment:', err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET SCAN HISTORY FOR SPECIFIC VOLUNTEER (Last 10 scans by that volunteer only)
router.get('/:id/scan-history/volunteer/:volunteerId', authenticateToken, async (req, res) => {
    const { id, volunteerId } = req.params;
    
    try {
        const result = await db.query(`
            SELECT 
                u.name as student_name,
                u.email as roll_number,
                u.batch,
                CONCAT(va.floor, ' - Counter ', va.counter) as counter_name,
                r.served_at as scanned_at
            FROM registrations r
            JOIN users u ON r.student_id = u.user_id
            JOIN volunteer_actions va ON va.registration_id = r.registration_id
            WHERE r.event_id = $1 AND va.volunteer_id = $2 AND r.status = 'served'
            ORDER BY r.served_at DESC
            LIMIT 10
        `, [id, volunteerId]);

        res.json({ scanHistory: result.rows });
    } catch (err) {
        console.error('❌ Volunteer scan history error:', err);
        res.status(500).json({ error: "Server error fetching volunteer scan history" });
    }
});

// GET VOLUNTEER'S ASSIGNED EVENT (No admin required)
router.get('/volunteer/:volunteerId', authenticateToken, async (req, res) => {
    const { volunteerId } = req.params;
    try {
        const result = await db.query(`
            SELECT e.*, 
                   (SELECT time_start FROM event_slots WHERE event_id = e.event_id LIMIT 1) as time_start,
                   (SELECT time_end FROM event_slots WHERE event_id = e.event_id LIMIT 1) as time_end
            FROM events e 
            JOIN volunteers v ON e.event_id = v.event_id
            WHERE v.id = $1
        `, [volunteerId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No event assigned to this volunteer" });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 1. GET ALL EVENTS (Admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        //  RE-ADDED: Auto-Close Logic
        // This checks if the event's End Time is less than the Current Time (in IST)
        await db.query(`
            UPDATE events
            SET status = 'closed'
            WHERE status = 'active'
            AND event_id IN (
                SELECT event_id FROM event_slots
                GROUP BY event_id
                HAVING MAX(time_end) < NOW())
        `);

        // --- Fetch List ---
        const result = await db.query(`
            SELECT e.*, 
                   (SELECT time_start FROM event_slots WHERE event_id = e.event_id LIMIT 1) as time_start,
                   (SELECT time_end FROM event_slots WHERE event_id = e.event_id LIMIT 1) as time_end
            FROM events e 
            ORDER BY date ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;