import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaClient.js';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function getProjectsController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      include: { tasks: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ projects });
  } catch (error) {
    next(error);
  }
}

export async function createProjectController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const payload = projectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        name: payload.name,
        description: payload.description,
        ownerId: userId,
      },
    });
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
}

export async function updateProjectController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { projectId } = req.params;
    const payload = projectSchema.partial().parse(req.body);

    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing || existing.ownerId !== userId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: payload,
    });
    res.json({ project });
  } catch (error) {
    next(error);
  }
}

export async function deleteProjectController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { projectId } = req.params;

    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing || existing.ownerId !== userId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({ where: { id: projectId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
