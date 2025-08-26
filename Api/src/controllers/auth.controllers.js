import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Register: create user with hashed password
export const register = async (req, res) => {
    try {
        const { email, password, name, role, region_name, lat, lon } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ error: 'email already registered' });

        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password_hash, name, role, region_name, lat, lon });

        const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role || 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};
    
// Login: verify password and return token
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'invalid_credentials' });
        const ok = await bcrypt.compare(password, user.password_hash || '');
        if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

        const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role || 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'internal_error' });
    }
};