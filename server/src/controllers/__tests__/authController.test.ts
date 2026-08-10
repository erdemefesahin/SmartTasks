import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerController, loginController } from '../authController.js';
import prisma from '../../services/prismaClient.js';

jest.mock('../../services/prismaClient.js');

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Auth controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('registers a new user', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
      password: 'hashed',
    } as any);

    const req: any = { body: { name: 'Jane', email: 'jane@example.com', password: 'password123' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await registerController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
  });

  it('logs in an existing user', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
      password: await bcrypt.hash('password123', 10),
    } as any);

    const req: any = { body: { email: 'jane@example.com', password: 'password123' } };
    const res: any = { json: jest.fn() };
    const next = jest.fn();

    await loginController(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
  });
});
