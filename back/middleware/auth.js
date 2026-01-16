const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_this";

// 1. Verify User is Logged In
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

    if (!token) return res.status(401).json({ error: "Access Denied: No Token Provided" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Access Denied: Invalid Token" });
        req.user = user; // Attach user info to request
        next(); // Move to the next function (the route handler)
    });
};

// 2. Verify User is Admin
const requireAdmin = (req, res, next) => {
    // This runs AFTER authenticateToken, so we have req.user
    console.log('🔍 Admin check - User object:', req.user);
    console.log('🔍 User role:', req.user.role);
    console.log('🔍 Role type:', typeof req.user.role);
    
    if (req.user.role !== 'admin') {
        console.log('❌ Access denied - not admin');
        return res.status(403).json({ error: "Access Denied: Admins Only" });
    }
    
    console.log('✅ Admin access granted');
    next();
};

module.exports = { authenticateToken, requireAdmin };
