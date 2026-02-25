import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    await prisma.task.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.organization.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 10);
    const org = await prisma.organization.create({
        data: {
            name: 'TechNova Solutions',
            adminEmail: 'admin@technova.com',
            passwordHash
        }
    });

    const employees = await Promise.all([
        prisma.employee.create({ data: { orgId: org.id, name: 'Alice Johnson', email: 'alice@technova.com', role: 'Employee', department: 'Engineering', skills: ['React', 'Node.js', 'PostgreSQL'] } }),
        prisma.employee.create({ data: { orgId: org.id, name: 'Bob Smith', email: 'bob@technova.com', role: 'Employee', department: 'Design', skills: ['Figma', 'UI/UX', 'Tailwind'] } }),
        prisma.employee.create({ data: { orgId: org.id, name: 'Charlie Davis', email: 'charlie@technova.com', role: 'Employee', department: 'Engineering', skills: ['Python', 'AWS', 'Docker'] } }),
    ]);

    await prisma.task.create({ data: { orgId: org.id, title: 'Build Frontend Dashboard', description: 'Implement the new React dashboard using Figma designs.', status: 'Assigned', skillsRequired: ['React', 'Tailwind'], assignedTo: employees[0].id } });
    await prisma.task.create({ data: { orgId: org.id, title: 'Design Mobile App', description: 'Create wireframes for the new mobile application.', status: 'In Progress', skillsRequired: ['Figma', 'UI/UX'], assignedTo: employees[1].id } });

    console.log('Seeding finished.');
    console.log('Login credentials:');
    console.log('Email: admin@technova.com');
    console.log('Password: password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
