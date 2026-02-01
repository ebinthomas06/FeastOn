// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
const db = require('./db');
const rateLimit = require('express-rate-limit');

const volunteerLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,                // 500 requests per IP
  standardHeaders: true,
  legacyHeaders: false
});

// Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const registrationRoutes = require('./routes/registrations');

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   Global Middleware
====================== */
app.use(cors());

app.use(express.json());

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
  referrerPolicy: false,
  strictTransportSecurity: false,
  xContentTypeOptions: false,
  xDnsPrefetchControl: false,
  xDownloadOptions: false,
  xFrameOptions: false,
  xPermittedCrossDomainPolicies: false,
  xPoweredBy: false,
  xXssProtection: false
}));

app.use(compression());

/* ======================
   Serve React Frontend
====================== */
app.use(express.static(path.join(__dirname, 'public')));

/* ======================
   API Routes
====================== */
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/registrations', registrationRoutes);

/* ======================
   API Health Check
====================== */
app.get('/api', (req, res) => {
  res.json({ message: 'Mess Coupon System API is running' });
});

/* ======================
   React SPA Fallback
====================== */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ======================
   Global Error Handler
====================== */
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ======================
   Auto-close Logic
====================== */
setInterval(async () => {
  try {
    const activeCheck = await db.query(
      "SELECT COUNT(*) AS count FROM events WHERE status = 'active'"
    );

    const activeCount = parseInt(activeCheck.rows[0].count);

    if (activeCount > 0) {
      const result = await db.query(`
        UPDATE events
        SET status = 'closed'
        WHERE status = 'active'
        AND event_id IN (
          SELECT event_id
          FROM event_slots
          GROUP BY event_id
          HAVING MAX(time_end) < NOW()
        )
      `);

      if (result.rowCount > 0) {
        console.log(`✅ Auto-closed ${result.rowCount} expired events`);
      }
    }
  } catch (err) {
    console.error('❌ Auto-close error:', err);
  }
}, 120000);

/* ======================
   Start Server
====================== */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});