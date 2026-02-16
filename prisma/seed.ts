import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';
import kidsData from '../src/data/kids.json';

const url = process.env.TURSO_DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create superadmin
  const hashedPassword = await bcrypt.hash('admin', 10);
  await prisma.superAdmin.upsert({
    where: { email: 'admin@robocode.uk' },
    update: {},
    create: {
      email: 'admin@robocode.uk',
      password: hashedPassword,
    },
  });
  console.log('Created superadmin: admin@robocode.uk / admin');

  // Create today's camp
  const today = new Date();
  const camp = await prisma.camp.create({
    data: {
      name: 'HAF Tuesday 17th',
      description: 'Holiday Activities and Food Programme',
      startDate: today,
      endDate: today,
      adminPassword: 'robocamp2026',
      teacherPassword: 'teacher2026',
      lunchTime: '11:45-12:15',
    },
  });
  console.log(`Created camp: ${camp.name}`);

  // Create sessions
  const sessions = await Promise.all([
    prisma.session.create({ data: { name: 'Session 1', time: '10:15-11:00', order: 1, campId: camp.id } }),
    prisma.session.create({ data: { name: 'Session 2', time: '11:00-11:45', order: 2, campId: camp.id } }),
    prisma.session.create({ data: { name: 'Session 3', time: '12:15-13:00', order: 3, campId: camp.id } }),
    prisma.session.create({ data: { name: 'Session 4', time: '13:00-13:45', order: 4, campId: camp.id } }),
  ]);
  console.log('Created 4 sessions');

  // Create areas
  const areasData = [
    { name: 'Robotics A', type: 'robotics' },
    { name: 'Robotics B', type: 'robotics' },
    { name: 'Board Room (3DPA)', type: '3dprinting' },
    { name: 'Esports Room (3DPB)', type: '3dprinting' },
    { name: 'Game Dev A', type: 'gamedev' },
    { name: 'Game Dev B', type: 'gamedev' },
    { name: 'Game Area', type: 'game' },
  ];

  const areas = await Promise.all(
    areasData.map(a => prisma.area.create({ data: { ...a, campId: camp.id } }))
  );
  console.log('Created 7 areas');

  // Create groups and kids from existing data
  const groupEntries = Object.entries(kidsData.groups) as [string, { ageRange: string; kids: any[] }][];

  for (const [groupName, groupData] of groupEntries) {
    const group = await prisma.group.create({
      data: {
        name: groupName,
        ageRange: groupData.ageRange,
        campId: camp.id,
      },
    });

    // Create kids
    for (const kid of groupData.kids) {
      await prisma.kid.create({
        data: {
          name: kid.name,
          age: kid.age,
          allergies: kid.allergies || null,
          groupId: group.id,
        },
      });
    }
    console.log(`Created Group ${groupName} with ${groupData.kids.length} kids`);
  }

  // Create rotation schedule - each group does each SUBJECT TYPE once per day
  // Areas: 0=Robotics A, 1=Robotics B, 2=3DPA, 3=3DPB, 4=GameDev A, 5=GameDev B, 6=Game Area
  // Subject types: robotics(0,1), 3dprinting(2,3), gamedev(4,5), game(6)
  // Groups A,C,E,G use "A" variant rooms; Groups B,D,F,H use "B" variant rooms
  const rotation: Record<string, number[]> = {
    'A': [0, 2, 4, 6], // Robotics A → 3DPA → GameDev A → Game Area
    'B': [1, 3, 5, 6], // Robotics B → 3DPB → GameDev B → Game Area
    'C': [2, 4, 6, 0], // 3DPA → GameDev A → Game Area → Robotics A
    'D': [3, 5, 6, 1], // 3DPB → GameDev B → Game Area → Robotics B
    'E': [4, 6, 0, 2], // GameDev A → Game Area → Robotics A → 3DPA
    'F': [5, 6, 1, 3], // GameDev B → Game Area → Robotics B → 3DPB
    'G': [6, 0, 2, 4], // Game Area → Robotics A → 3DPA → GameDev A
    'H': [6, 1, 3, 5], // Game Area → Robotics B → 3DPB → GameDev B
  };

  const groups = await prisma.group.findMany({ where: { campId: camp.id } });

  for (const group of groups) {
    const areaIndices = rotation[group.name] || [0, 1, 2, 3];
    for (let sessionIdx = 0; sessionIdx < sessions.length; sessionIdx++) {
      const areaIdx = areaIndices[sessionIdx] % areas.length;
      await prisma.scheduleSlot.create({
        data: {
          groupId: group.id,
          sessionId: sessions[sessionIdx].id,
          areaId: areas[areaIdx].id,
        },
      });
    }
  }
  console.log('Created rotation schedule');

  console.log('\n✅ Database seeded successfully!');
  console.log('\nSuperadmin login:');
  console.log('  Email: admin@robocode.uk');
  console.log('  Password: admin');
  console.log('\nCamp passwords:');
  console.log('  Admin: robocamp2026');
  console.log('  Teacher: teacher2026');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
