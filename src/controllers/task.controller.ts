import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth';

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, status, assignedToId } = req.query;

    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;

    if (req.user!.role !== 'OWNER') {
      where.brandId = { in: req.user!.brandIds };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, title, description, priority, assignedToId, dueDate } = req.body;

    if (!brandId || !title || !description) {
      return res.status(400).json({ error: 'brandId, title, and description are required' });
    }

    const task = await prisma.task.create({
      data: {
        brandId,
        title,
        description,
        priority,
        assignedToId,
        createdById: req.user!.id,
        dueDate: dueDate ? new Date(dueDate) : undefined
      },
      include: {
        brand: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignedToId, dueDate } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : undefined
      },
      include: {
        brand: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
