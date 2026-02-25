import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/metrics', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;

        const totalEmployeesCount = await prisma.employee.count({ where: { orgId } });

        const tasks = await prisma.task.findMany({ where: { orgId } });

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t: any) => t.status === 'Completed').length;
        const inProgressTasks = tasks.filter((t: any) => t.status === 'In Progress').length;
        const assignedTasks = tasks.filter((t: any) => t.status === 'Assigned').length;

        // Calculate a simple productivity score based on completed tasks
        const productivityScore = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        // Get active employees (employees who have at least one In Progress or Assigned task)
        const activeAssignees = new Set(
            tasks.filter((t: any) => t.status !== 'Completed' && t.assignedTo).map((t: any) => t.assignedTo)
        );
        const activeEmployeesCount = activeAssignees.size;

        res.json({
            totalEmployees: totalEmployeesCount,
            activeEmployees: activeEmployeesCount,
            tasks: {
                total: totalTasks,
                completed: completedTasks,
                inProgress: inProgressTasks,
                assigned: assignedTasks
            },
            productivityScore
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
});

export default router;
