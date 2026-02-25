import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, adminEmail, password } = req.body;

        if (!name || !adminEmail || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingOrg = await prisma.organization.findUnique({
            where: { adminEmail }
        });

        if (existingOrg) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const org = await prisma.organization.create({
            data: {
                name,
                adminEmail,
                passwordHash
            }
        });

        res.status(201).json({ message: 'Organization registered successfully', orgId: org.id });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req: Request, res: Response): Promise<any> => {
    try {
        const { adminEmail, password } = req.body;

        const org = await prisma.organization.findUnique({
            where: { adminEmail }
        });

        if (org) {
            const validPassword = await bcrypt.compare(password, org.passwordHash);

            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { orgId: org.id, role: 'Admin' },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '24h' }
            );

            return res.json({ token, orgId: org.id, name: org.name, role: 'Admin' });
        }

        // Fallback to Employee login
        const employee = await prisma.employee.findUnique({
            where: { email: adminEmail }
        });

        if (employee && employee.passwordHash) {
            const validPassword = await bcrypt.compare(password, employee.passwordHash);

            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { orgId: employee.orgId, employeeId: employee.id, role: employee.role },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '24h' }
            );

            return res.json({ token, orgId: employee.orgId, name: employee.name, role: employee.role });
        }

        return res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
