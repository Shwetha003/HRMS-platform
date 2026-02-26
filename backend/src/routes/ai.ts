import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/recommend-assignee', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orgId = req.user!.orgId;
        const { skillsRequired } = req.body as { skillsRequired: string[] };

        if (!skillsRequired) {
            return res.status(400).json({ error: 'skillsRequired array is required' });
        }

        // Fetch all employees in the organization, including their past assigned tasks
        const employees = await prisma.employee.findMany({
            where: { orgId },
            include: { assignedTasks: true }
        });

        // Fetch all active tasks across the org for simple active tracking
        const allActiveTasks = await prisma.task.findMany({
            where: {
                orgId,
                status: { in: ['Assigned', 'In Progress'] }
            }
        });

        // -------------------------------------------------------------
        // V: Velocity (Average time to completion in hours)
        // R: Reliability (Ratio of tasks completed before deadline)
        // M: Skill Match (Base multiplier weight)
        // S = (M * R) - (Active Workload * V)
        // -------------------------------------------------------------
        const DEFAULT_VELOCITY = 24; // Hours (penalty if 0 completed tasks)
        const DEFAULT_RELIABILITY = 1.0; // Perfect ratio until proven otherwise

        const scoredEmployees = employees.map(emp => {
            // 1. Skill Match Score (M)
            let M = 0;
            const empSkills = emp.skills.map(s => s.toLowerCase());
            skillsRequired.forEach(reqSkill => {
                if (empSkills.includes(reqSkill.toLowerCase())) {
                    M += 10;
                }
            });

            // 2. Isolate Completed Tasks to analyze history
            const completedTasks = emp.assignedTasks.filter(t => t.status === 'Completed' && t.startedAt && t.completedAt);
            const totalCompleted = completedTasks.length;

            let V = DEFAULT_VELOCITY;
            let R = DEFAULT_RELIABILITY;

            if (totalCompleted > 0) {
                // Calculate Reliability (R)
                let onTimeCount = 0;
                let totalTimeHours = 0;

                completedTasks.forEach((t: any) => {
                    // Time taken in hours
                    const diffMs = new Date(t.completedAt!).getTime() - new Date(t.startedAt!).getTime();
                    totalTimeHours += (diffMs / (1000 * 60 * 60));

                    // Was it on time? If no due date, assume it's on time for R calculation
                    if (!t.dueDate) {
                        onTimeCount++;
                    } else if (new Date(t.completedAt!) <= new Date(t.dueDate)) {
                        onTimeCount++;
                    }
                });

                R = onTimeCount / totalCompleted;
                V = totalTimeHours / totalCompleted;

                // Set minimum velocity to prevent negative/zero division weirdness
                if (V < 0.5) V = 0.5;
            }

            // 3. Active Workload 
            const activeWorkload = emp.assignedTasks.filter(t => t.status === 'Assigned' || t.status === 'In Progress').length;

            // 4. Final Score (S)
            // S = (Skill Match * R) - (Active Workload * V)
            const S = (M * R) - (activeWorkload * V);

            return {
                employeeId: emp.id,
                name: emp.name,
                department: emp.department,
                metrics: {
                    skillMatch: M,
                    reliability: R.toFixed(2),
                    velocityHours: V.toFixed(1),
                    activeTasksCount: activeWorkload,
                },
                score: Math.round(S * 10) / 10 // Round to 1 decimal
            };
        });

        // Sort by highest score
        scoredEmployees.sort((a, b) => b.score - a.score);

        res.json({ recommendations: scoredEmployees });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

export default router;
