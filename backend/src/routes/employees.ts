import { Router, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcrypt';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// GET all employees (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;
        const employees = await prisma.employee.findMany({
            where: { orgId },
            include: { assignedTasks: true }
        });

        const employeesWithScores = employees.map((emp: any) => {
            const total = emp.assignedTasks.length;
            if (total === 0) {
                const { assignedTasks, ...rest } = emp;
                return { ...rest, productivityScore: null };
            }

            const completedTasks = emp.assignedTasks.filter((t: any) => t.status === 'Completed');
            const completedCount = completedTasks.length;
            const completionRate = completedCount / total;

            let onTimeCount = 0;
            completedTasks.forEach((t: any) => {
                if (!t.dueDate || (t.completedAt && new Date(t.completedAt) <= new Date(t.dueDate))) {
                    onTimeCount++;
                }
            });

            const reliabilityRate = completedCount > 0 ? onTimeCount / completedCount : 0;

            // Score formula: 60% based on task completion volume, 40% based on deadline reliability
            const score = Math.round((completionRate * 60) + (reliabilityRate * 40));

            const { assignedTasks, ...rest } = emp;
            return { ...rest, productivityScore: score };
        });

        res.json(employeesWithScores);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// GET self profile (Employee/Admin)
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { orgId, employeeId, role } = req.user!;
        if (role === 'Admin') {
            const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, adminEmail: true } });
            return res.json({ profileType: 'Admin', ...org });
        } else {
            const employee = await prisma.employee.findUnique({ where: { id: employeeId as string } });
            return res.json({ profileType: 'Employee', ...employee });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// PUT update self password
router.put('/me/password', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { employeeId } = req.user!;
        const { currentPassword, newPassword } = req.body;

        if (!employeeId) {
            return res.status(403).json({ error: 'Only employees can change their password here' });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password required' });
        }

        const employee = await prisma.employee.findUnique({ where: { id: employeeId as string } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        if (employee.passwordHash) {
            const valid = await bcrypt.compare(currentPassword, employee.passwordHash);
            if (!valid) {
                return res.status(401).json({ error: 'Incorrect current password' });
            }
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.employee.update({
            where: { id: employeeId as string },
            data: { passwordHash: newHash }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// PUT update self wallet address
router.put('/me/wallet', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { employeeId } = req.user!;
        const { walletAddress } = req.body;

        if (!employeeId) {
            return res.status(403).json({ error: 'Only employees can link wallets' });
        }

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        await prisma.employee.update({
            where: { id: employeeId as string },
            data: { walletAddress }
        });

        res.json({ message: 'Wallet linked successfully', walletAddress });
    } catch (error) {
        res.status(500).json({ error: 'Failed to link wallet' });
    }
});

// POST add an employee (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;
        const { name, email, role, department, skills } = req.body;

        const existing = await prisma.employee.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const passwordHash = await bcrypt.hash('password123', 10);

        const employee = await prisma.employee.create({
            data: {
                orgId,
                name,
                email,
                passwordHash,
                role: role || 'Employee',
                department,
                skills: skills || []
            }
        });

        res.status(201).json(employee);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

// GET a single employee (Admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;
        const id = req.params.id as string;

        const employee = await prisma.employee.findUnique({
            where: { id },
            include: { assignedTasks: true }
        });

        if (!employee || employee.orgId !== orgId) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

// PUT reset employee password (Admin only)
router.put('/:id/reset-password', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;
        const id = req.params.id as string;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ error: 'New password is required' });
        }

        const existing = await prisma.employee.findUnique({ where: { id } });
        if (!existing || existing.orgId !== orgId) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.employee.update({
            where: { id },
            data: { passwordHash }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// PUT update an employee (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;
        const id = req.params.id as string;
        const { name, role, department, skills } = req.body;

        const existing = await prisma.employee.findUnique({ where: { id } });
        if (!existing || existing.orgId !== orgId) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: { name, role, department, skills }
        });

        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// DELETE an employee (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;
        const id = req.params.id as string;

        const existing = await prisma.employee.findUnique({ where: { id } });
        if (!existing || existing.orgId !== orgId) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        await prisma.employee.delete({
            where: { id }
        });

        res.json({ message: 'Employee deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

export default router;
