import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../services/prismaClient.js';
import { z } from 'zod';
const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
function createToken(userId) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT secret is not configured');
    }
    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}
export async function registerController(req, res, next) {
    try {
        const payload = registerSchema.parse(req.body);
        const existing = await prisma.user.findUnique({ where: { email: payload.email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const hashedPassword = await bcrypt.hash(payload.password, 10);
        const user = await prisma.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                password: hashedPassword,
            },
        });
        const token = createToken(user.id);
        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (error) {
        next(error);
    }
}
export async function loginController(req, res, next) {
    try {
        const payload = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email: payload.email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid login credentials' });
        }
        const passwordMatch = await bcrypt.compare(payload.password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Invalid login credentials' });
        }
        const token = createToken(user.id);
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (error) {
        next(error);
    }
}
