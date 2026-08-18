import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaClient.js';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().cuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  estimate: z.number().int().positive().optional(),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export async function getTasksController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const tasks = await prisma.task.findMany({
      where: {
        project: { ownerId: userId },
      },
      include: { subtasks: true, project: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
}

export async function createTaskController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const payload = taskSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
    if (!project || project.ownerId !== userId) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const task = await prisma.task.create({
      data: {
        title: payload.title,
        description: payload.description,
        priority: payload.priority ?? 'MEDIUM',
        estimate: payload.estimate,
        dueDate: payload.dueDate,
        projectId: payload.projectId,
      },
      include: { subtasks: true, project: true },
    });
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { taskId } = req.params;
    const payload = taskSchema.partial().parse(req.body);

    const existing = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
    if (!existing || existing.project.ownerId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...payload,
      },
      include: { subtasks: true, project: true },
    });
    res.json({ task });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaskController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { taskId } = req.params;

    const existing = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
    if (!existing || existing.project.ownerId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    await prisma.subtask.deleteMany({ where: { taskId } });
    await prisma.task.delete({ where: { id: taskId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function toggleTaskCompleteController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { taskId } = req.params;

    const existing = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
    if (!existing || existing.project.ownerId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: existing.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
      },
      include: { subtasks: true, project: true },
    });
    res.json({ task: updated });
  } catch (error) {
    next(error);
  }
}
