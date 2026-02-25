import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// GET all tasks (Admin gets all org tasks, Employee gets assigned tasks)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { orgId, role, employeeId } = req.user!;

        if (role === 'Admin') {
            const tasks = await prisma.task.findMany({ where: { orgId } });
            return res.json(tasks);
        } else {
            const tasks = await prisma.task.findMany({ where: { orgId, assignedTo: employeeId || '' } });
            return res.json(tasks);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST create a task (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;
        const { title, description, skillsRequired, assignedTo } = req.body;

        const task = await prisma.task.create({
            data: {
                orgId,
                title,
                description,
                skillsRequired: skillsRequired || [],
                assignedTo
            }
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT update a task (Admin can update anything, Employee can only update status if assigned)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { orgId, role, employeeId } = req.user!;
        const id = req.params.id as string;
        const { title, description, skillsRequired, status, assignedTo } = req.body;

        const existingTask = await prisma.task.findUnique({ where: { id } });

        if (!existingTask || existingTask.orgId !== orgId) {
            return res.status(404).json({ error: 'Task not found' });
        }

        if (role === 'Employee') {
            if (existingTask.assignedTo !== employeeId) {
                return res.status(403).json({ error: 'Cannot update unassigned task' });
            }
            // Employee only updates status
            const updated = await prisma.task.update({
                where: { id },
                data: { status }
            });
            return res.json(updated);
        }

        // Admin updates everything
        const updated = await prisma.task.update({
            where: { id },
            data: { title, description, skillsRequired, status, assignedTo }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE a task (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;
        const id = req.params.id as string;

        const existing = await prisma.task.findUnique({ where: { id } });
        if (!existing || existing.orgId !== orgId) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await prisma.task.delete({
            where: { id }
        });

        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
