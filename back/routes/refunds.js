// routes/refunds.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth'); 
const { createRefundSheet, appendRefundToSheet } = require('../utils/googleSheets');

// ==========================================
// HELPERS
// ==========================================

function cleanName(name = '') {
    return name
        .replace(/\s*-\s*IIIT[kK]\s*$/i, '')
        .trim();
}

function rollFromEmail(email = '') {
    const local = email.split('@')[0];
    const match = local.match(/[a-z]+(\d{2})([a-z]{3})(\d{1,4})$/i);
    if (!match) return local;
    const [, yy, branch, num] = match;
    return `20${yy}${branch.toUpperCase()}${num.padStart(4, '0')}`;
}

// ==========================================
// 1. ADMIN: CREATE FORM
// ==========================================
router.post('/forms', authenticateToken, requireAdmin, async (req, res) => {
    const { title, semester, year } = req.body;
    try {
        const sheetTitle = `Mess Refund - ${title} (${semester} ${year})`;
        const adminEmail = 'ebinthomas24bcs99@iiitkottayam.ac.in'; 
        const { spreadsheetId, spreadsheetUrl } = await createRefundSheet(sheetTitle, adminEmail);

        const result = await db.query(
            `INSERT INTO refund_forms (title, semester, year, google_sheet_id, google_sheet_url, status) 
             VALUES ($1, $2, $3, $4, $5, 'hidden') RETURNING *`,
            [title, semester, year, spreadsheetId, spreadsheetUrl]
        );
        res.status(201).json({ message: "Refund form and Google Sheet created successfully!", form: result.rows[0] });
    } catch (err) {
        console.error('\n❌ [API ERROR] POST /forms (Create Refund Form)');
        console.error('User:', req.user?.username || 'Unknown');
        console.error('Payload Sent:', req.body);
        console.error('Error Details:', err.message, err.stack);
        res.status(500).json({ error: "Server error creating form and Google Sheet", details: err.message });
    }
});

// ==========================================
// 2. ADMIN: GET ALL FORMS
// ==========================================
router.get('/forms/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM refund_forms ORDER BY created_at DESC`);
        res.json(result.rows);
    } catch (err) {
        console.error('\n❌ [API ERROR] GET /forms/all');
        console.error('Error Details:', err.message);
        res.status(500).json({ error: "Server error fetching forms" });
    }
});

// ==========================================
// 3. ADMIN: UPDATE FORM STATUS
// ==========================================
router.patch('/forms/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, title, google_sheet_id } = req.body; 
    try {
        const result = await db.query(
            `UPDATE refund_forms 
             SET status = COALESCE($1, status),
                 title = COALESCE($2, title),
                 google_sheet_id = COALESCE($3, google_sheet_id)
             WHERE form_id = $4 RETURNING *`,
            [status, title, google_sheet_id, id]
        );
        if (result.rows.length === 0) {
            console.warn(`⚠️ [API WARNING] PATCH /forms/${id} - Form not found`);
            return res.status(404).json({ error: "Form not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`\n❌ [API ERROR] PATCH /forms/${id}`);
        console.error('Payload Sent:', req.body);
        console.error('Error Details:', err.message);
        res.status(500).json({ error: "Server error updating form" });
    }
});

// ==========================================
// 4. ADMIN: EXPORT FORM DATA TO CSV
// ==========================================
router.get('/forms/:id/export', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT u.name, u.email as roll_number, u.batch, 
                   rs.bank_name, rs.account_holder_name, rs.account_number,
                   rs.ifsc_code, rs.branch_name, rs.updated_at
            FROM refund_submissions rs
            JOIN users u ON rs.student_id = u.user_id
            WHERE rs.form_id = $1
            ORDER BY u.batch ASC, u.name ASC
        `, [id]);

        const fields = ['Name', 'Roll Number', 'Batch', 'Bank Name', 'Account Holder Name', 'Account Number', 'IFSC Code', 'Branch Name', 'Submitted At'];
        const csvRows = [fields.join(',')];

        result.rows.forEach(row => {
            csvRows.push([
                `"${cleanName(row.name)}"`,
                `"${rollFromEmail(row.roll_number)}"`,
                `"${row.batch}"`,
                `"${row.bank_name || ''}"`,
                `"${row.account_holder_name}"`,
                `"${row.account_number}"`,
                `"${row.ifsc_code}"`,
                `"${row.branch_name || ''}"`,
                `"${new Date(row.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}"`
            ].join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=refund_form_${id}_export.csv`);
        res.status(200).send(csvRows.join('\n'));
    } catch (err) {
        console.error(`\n❌ [API ERROR] GET /forms/${id}/export`);
        console.error('Error Details:', err.message);
        res.status(500).json({ error: "Server error exporting data" });
    }
});

// ==========================================
// 5. STUDENT: GET ACTIVE FORMS
// ==========================================
router.get('/active', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT form_id, title, semester, year 
             FROM refund_forms WHERE status = 'active' 
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('\n❌ [API ERROR] GET /active');
        console.error('Error Details:', err.message);
        res.status(500).json({ error: "Server error fetching active forms" });
    }
});

// ==========================================
// 6. STUDENT: GET OWN SUBMISSION
// ==========================================
router.get('/forms/:form_id/my-submission', authenticateToken, async (req, res) => {
    const { form_id } = req.params;
    const student_id = req.user.user_id; 

    try {
        const result = await db.query(`
            SELECT 
                rs.account_holder_name, rs.account_number, rs.ifsc_code,
                rs.bank_name, rs.branch_name, rs.updated_at,
                u.name AS raw_name, u.email
            FROM refund_submissions rs
            JOIN users u ON u.user_id = $2
            WHERE rs.form_id = $1 AND rs.student_id = $2
        `, [form_id, student_id]);

        const userResult = await db.query(
            `SELECT name, email FROM users WHERE user_id = $1`,
            [student_id]
        );

        const user = userResult.rows[0];
        res.json({
            profile: {
                name: cleanName(user?.name || ''),
                email: user?.email || '',
                roll_number: rollFromEmail(user?.email || ''),
            },
            submission: result.rows[0] || null,
        });
    } catch (err) {
        console.error(`\n❌ [API ERROR] GET /forms/${form_id}/my-submission`);
        console.error('Student ID:', student_id);
        console.error('Error Details:', err.message);
        res.status(500).json({ error: "Server error fetching submission" });
    }
});

// ==========================================
// 7. STUDENT: SUBMIT REFUND DETAILS
// ==========================================
router.post('/forms/:form_id/submit', authenticateToken, async (req, res) => {
    const { form_id } = req.params;
    const student_id = req.user.user_id;
    const { account_holder_name, account_number, confirm_account_number, ifsc_code, bank_name, branch_name } = req.body;

    // --- Validation ---
    if (!account_number || account_number !== confirm_account_number) {
        return res.status(400).json({ error: "Account numbers do not match" });
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc_code?.toUpperCase())) {
        return res.status(400).json({ error: "Invalid IFSC Code format (e.g. SBIN0001234)" });
    }
    if (!bank_name?.trim()) {
        return res.status(400).json({ error: "Bank name is required" });
    }
    if (!branch_name?.trim()) {
        return res.status(400).json({ error: "Branch name is required" });
    }

    const normalizedIFSC = ifsc_code.toUpperCase();

    try {
        // Check form is active
        const formResult = await db.query(
            `SELECT status, google_sheet_id FROM refund_forms WHERE form_id = $1`,
            [form_id]
        );
        if (formResult.rows.length === 0 || formResult.rows[0].status !== 'active') {
            return res.status(403).json({ error: "This refund form is closed or inactive." });
        }

        const googleSheetId = formResult.rows[0].google_sheet_id;

        // --- INSERT (unique constraint on (form_id, student_id) handles all duplicate cases) ---
        let submissionResult;
        try {
            submissionResult = await db.query(`
                INSERT INTO refund_submissions 
                    (form_id, student_id, bank_name, account_holder_name, account_number, ifsc_code, branch_name, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING *;
            `, [form_id, student_id, bank_name.trim(), account_holder_name, account_number, normalizedIFSC, branch_name.trim()]);
        } catch (insertErr) {
            // Postgres unique_violation error code
            if (insertErr.code === '23505') {
                return res.status(409).json({
                    error: "You have already submitted this refund form. Contact the mess committee if you need to make changes."
                });
            }
            throw insertErr; // re-throw anything else to the outer catch
        }

        // Fetch student profile for Google Sheet
        const userResult = await db.query(
            `SELECT name, email FROM users WHERE user_id = $1`,
            [student_id]
        );
        const studentProfile = userResult.rows[0];

        // Append to Google Sheet (non-fatal if it fails)
        if (googleSheetId) {
            try {
                await appendRefundToSheet(googleSheetId, {
                    name: cleanName(studentProfile.name),
                    roll_number: rollFromEmail(studentProfile.email),
                    email: studentProfile.email,
                    bank_name: bank_name.trim(),
                    account_holder_name,
                    account_number,
                    ifsc_code: normalizedIFSC,
                    branch_name: branch_name.trim(),
                    updated_at: submissionResult.rows[0].updated_at,
                });
            } catch (sheetErr) {
                console.error('\n⚠️ [GOOGLE SHEETS ERROR] Failed to append to sheet');
                console.error('Sheet ID:', googleSheetId);
                console.error('Error Details:', sheetErr.message);
            }
        }

        res.json({ message: "Refund details submitted successfully!", data: submissionResult.rows[0] });

    } catch (err) {
        console.error(`\n❌ [API ERROR] POST /forms/${form_id}/submit`);
        console.error('Student ID:', student_id);
        console.error('Payload Sent:', { bank_name, account_holder_name, account_number, ifsc_code, branch_name });
        console.error('Error Details:', err.message);
        res.status(500).json({ error: "Server error submitting refund details" });
    }
});

module.exports = router;