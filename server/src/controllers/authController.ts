import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../services/prismaClient.js';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
});

function createToken(userId: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }

  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

export async function registerController(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      return res.status(400).json({ error: 'No account found with that email' });
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    next(error);
  }
}

export async function meController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(6).optional(),
});

export async function updateProfileController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = updateProfileSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data: { name?: string; password?: string } = {};

    if (payload.name && payload.name !== user.name) {
      data.name = payload.name;
    }

    if (payload.newPassword) {
      if (!payload.currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }
      const passwordMatch = await bcrypt.compare(payload.currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      data.password = await bcrypt.hash(payload.newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, email: true, name: true, createdAt: true },
    });

    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
}
