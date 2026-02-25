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

        // Fetch all employees in the organization
        const employees = await prisma.employee.findMany({
            where: { orgId }
        });

        // Fetch all active tasks to calculate workload
        const activeTasks = await prisma.task.findMany({
            where: {
                orgId,
                status: { in: ['Assigned', 'In Progress'] }
            }
        });

        // Calculate score for each employee
        const scoredEmployees = employees.map(emp => {
            // 1. Skill Match Score (+10 per matched skill)
            let skillScore = 0;
            const empSkills = emp.skills.map(s => s.toLowerCase());
            skillsRequired.forEach(reqSkill => {
                if (empSkills.includes(reqSkill.toLowerCase())) {
                    skillScore += 10;
                }
            });

            // 2. Workload Penalty (-5 per active task)
            const empActiveTasks = activeTasks.filter(t => t.assignedTo === emp.id).length;
            const workloadPenalty = empActiveTasks * 5;

            const totalScore = skillScore - workloadPenalty;

            return {
                employeeId: emp.id,
                name: emp.name,
                email: emp.email,
                department: emp.department,
                matchedSkills: skillScore / 10,
                activeTasksCount: empActiveTasks,
                score: totalScore
            };
        });

        // Sort by highest score
        scoredEmployees.sort((a, b) => b.score - a.score);

        res.json({ recommendations: scoredEmployees });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

export default router;
