import jwt from 'jsonwebtoken';

// Verify Bearer token and attach user info to request
export function authRequired(req, res, next) {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { userId, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}