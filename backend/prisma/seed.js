const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

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
        prisma.employee.create({ data: { orgId: org.id, name: 'Alice Johnson', email: 'alice@technova.com', passwordHash, role: 'Employee', department: 'Engineering', skills: ['React', 'Node.js', 'PostgreSQL'] } }),
        prisma.employee.create({ data: { orgId: org.id, name: 'Bob Smith', email: 'bob@technova.com', passwordHash, role: 'Employee', department: 'Design', skills: ['Figma', 'UI/UX', 'Tailwind'] } }),
        prisma.employee.create({ data: { orgId: org.id, name: 'Charlie Davis', email: 'charlie@technova.com', passwordHash, role: 'Employee', department: 'Engineering', skills: ['Python', 'AWS', 'Docker'] } }),
        prisma.employee.create({ data: { orgId: org.id, name: 'Diana Prince', email: 'diana@technova.com', passwordHash, role: 'Employee', department: 'Product', skills: ['Agile', 'Scrum', 'Jira'] } }),
        prisma.employee.create({ data: { orgId: org.id, name: 'Eve Adams', email: 'eve@technova.com', passwordHash, role: 'Admin', department: 'HR', skills: ['Recruiting', 'Management'] } }),
    ]);

    await prisma.task.create({ data: { orgId: org.id, title: 'Build Frontend Dashboard', description: 'Implement the new React dashboard.', status: 'Assigned', skillsRequired: ['React', 'Tailwind'], assignedTo: employees[0].id } });
    await prisma.task.create({ data: { orgId: org.id, title: 'Design Mobile App', description: 'Create wireframes.', status: 'In Progress', skillsRequired: ['Figma', 'UI/UX'], assignedTo: employees[1].id } });
    await prisma.task.create({ data: { orgId: org.id, title: 'Setup CI/CD Pipeline', description: 'Automate deployments.', status: 'Completed', skillsRequired: ['AWS', 'Docker'], assignedTo: employees[2].id } });

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
