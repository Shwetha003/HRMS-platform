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
        const { title, description, skillsRequired, assignedTo, dueDate } = req.body;

        const task = await prisma.task.create({
            data: {
                orgId,
                title,
                description,
                skillsRequired: skillsRequired || [],
                assignedTo,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT update task status (Employee/Admin)
router.put('/:id/status', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;
        const employeeId = req.user!.employeeId;
        const role = req.user!.role;
        const id = req.params.id as string;
        const { status, txHash } = req.body;

        const task = await prisma.task.findUnique({ where: { id } });
        if (!task || task.orgId !== orgId) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Only assigned employee or Admin can update status
        if (role !== 'Admin' && task.assignedTo !== employeeId) {
            return res.status(403).json({ error: 'Not authorized to update this task' });
        }

        const dataToUpdate: any = { status };
        if (txHash) {
            dataToUpdate.txHash = txHash;
        }

        // Logic for tracking time explicitly
        if (status === 'In Progress' && task.status !== 'In Progress') {
            dataToUpdate.startedAt = new Date();
        } else if (status === 'Completed' && task.status !== 'Completed') {
            dataToUpdate.completedAt = new Date();
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: dataToUpdate
        });

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task status' });
    }
});

// PUT update a task (Admin can update anything)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { orgId } = req.user!;
        const id = req.params.id as string;
        const { title, description, skillsRequired, status, assignedTo } = req.body;

        const existingTask = await prisma.task.findUnique({ where: { id } });

        if (!existingTask || existingTask.orgId !== orgId) {
            return res.status(404).json({ error: 'Task not found' });
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
