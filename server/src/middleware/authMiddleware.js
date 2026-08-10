import jwt from 'jsonwebtoken';
export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: 'JWT secret is not configured' });
    }
    try {
        const payload = jwt.verify(token, secret);
        req.userId = payload.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
