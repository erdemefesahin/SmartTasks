import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaClient.js';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const subtaskSchema = z.object({
  title: z.string().min(1),
});

export async function createSubtaskController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { taskId } = req.params;
    const payload = subtaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
    if (!task || task.project.ownerId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const subtask = await prisma.subtask.create({
      data: { title: payload.title, taskId },
    });
    res.status(201).json({ subtask });
  } catch (error) {
    next(error);
  }
}

export async function toggleSubtaskController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { subtaskId } = req.params;

    const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId }, include: { task: { include: { project: true } } } });
    if (!subtask || subtask.task.project.ownerId !== userId) {
      return res.status(404).json({ error: 'Subtask not found or unauthorized' });
    }

    const updated = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { completed: !subtask.completed },
    });
    res.json({ subtask: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteSubtaskController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { subtaskId } = req.params;

    const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId }, include: { task: { include: { project: true } } } });
    if (!subtask || subtask.task.project.ownerId !== userId) {
      return res.status(404).json({ error: 'Subtask not found or unauthorized' });
    }

    await prisma.subtask.delete({ where: { id: subtaskId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}