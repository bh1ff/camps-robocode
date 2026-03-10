import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const url = process.env.TURSO_DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

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

  // --- Locations ---
  const solihull = await prisma.location.create({
    data: {
      name: 'Robocode Centre (Solihull)',
      address: 'Solihull, West Midlands',
      region: 'solihull',
      capacityPerDay: 70,
      hafSeatsTotal: 200,
      allowsPaid: true,
    },
  });

  const kingshurst = await prisma.location.create({
    data: {
      name: 'Kingshurst (Tudor Grange Academy)',
      address: 'Tudor Grange Academy, Kingshurst',
      region: 'solihull',
      capacityPerDay: 38,
      hafSeatsTotal: 150,
      allowsPaid: false,
    },
  });

  const bcu = await prisma.location.create({
    data: {
      name: 'Birmingham City University (Curzon Building)',
      address: 'Curzon Building, Birmingham City University',
      region: 'birmingham',
      capacityPerDay: 45,
      hafSeatsTotal: 320,
      allowsPaid: false,
    },
  });

  console.log('Created 3 locations');

  // --- Camps (one per location) ---
  const solihullCamp = await prisma.camp.create({
    data: {
      name: 'Easter 2026 - Solihull',
      description: 'Robocode Holiday Tech Camp at Solihull Centre (HAF + Paid)',
      startDate: new Date('2026-03-30'),
      endDate: new Date('2026-04-09'),
      adminPassword: 'robocamp2026',
      teacherPassword: 'teacher2026',
      lunchTime: '12:00-12:30',
      locationId: solihull.id,
    },
  });

  const kingshurstCamp = await prisma.camp.create({
    data: {
      name: 'Easter 2026 - Kingshurst',
      description: 'Robocode Holiday Tech Camp at Tudor Grange Academy (HAF)',
      startDate: new Date('2026-03-30'),
      endDate: new Date('2026-04-02'),
      adminPassword: 'robocamp2026',
      teacherPassword: 'teacher2026',
      lunchTime: '12:30-13:00',
      locationId: kingshurst.id,
    },
  });

  const bcuCamp = await prisma.camp.create({
    data: {
      name: 'Easter 2026 - BCU',
      description: 'Robocode Holiday Tech Camp at Birmingham City University (HAF)',
      startDate: new Date('2026-03-30'),
      endDate: new Date('2026-04-09'),
      adminPassword: 'robocamp2026',
      teacherPassword: 'teacher2026',
      lunchTime: '13:30-14:00',
      locationId: bcu.id,
    },
  });

  console.log('Created 3 camps');

  // --- Camp Days ---
  // Solihull: 8 days (Mon-Thu Week 1 + Mon-Thu Week 2)
  const solihullDays = [
    { date: '2026-03-30', dayLabel: 'Monday 30th March',    weekNumber: 1 },
    { date: '2026-03-31', dayLabel: 'Tuesday 31st March',   weekNumber: 1 },
    { date: '2026-04-01', dayLabel: 'Wednesday 1st April',  weekNumber: 1 },
    { date: '2026-04-02', dayLabel: 'Thursday 2nd April',   weekNumber: 1 },
    { date: '2026-04-06', dayLabel: 'Monday 6th April',     weekNumber: 2 },
    { date: '2026-04-07', dayLabel: 'Tuesday 7th April',    weekNumber: 2 },
    { date: '2026-04-08', dayLabel: 'Wednesday 8th April',  weekNumber: 2 },
    { date: '2026-04-09', dayLabel: 'Thursday 9th April',   weekNumber: 2 },
  ];

  for (const day of solihullDays) {
    await prisma.campDay.create({
      data: { date: new Date(day.date), dayLabel: day.dayLabel, weekNumber: day.weekNumber, campId: solihullCamp.id },
    });
  }

  // Kingshurst: 4 days (Mon-Thu Week 1 only)
  const kingshurstDays = solihullDays.filter(d => d.weekNumber === 1);
  for (const day of kingshurstDays) {
    await prisma.campDay.create({
      data: { date: new Date(day.date), dayLabel: day.dayLabel, weekNumber: day.weekNumber, campId: kingshurstCamp.id },
    });
  }

  // BCU: 7 days (Mon-Thu Week 1 + Tue-Thu Week 2 — Easter Monday excluded)
  const bcuDays = solihullDays.filter(d => !(d.date === '2026-04-06'));
  for (const day of bcuDays) {
    await prisma.campDay.create({
      data: { date: new Date(day.date), dayLabel: day.dayLabel, weekNumber: day.weekNumber, campId: bcuCamp.id },
    });
  }

  console.log('Created camp days (Solihull: 8, Kingshurst: 4, BCU: 7)');

  // --- Default sessions for each camp ---
  const sessionDefs = [
    { name: 'Session 1', time: '10:15-11:00', order: 1 },
    { name: 'Session 2', time: '11:00-11:45', order: 2 },
    { name: 'Session 3', time: '12:15-13:00', order: 3 },
    { name: 'Session 4', time: '13:00-13:45', order: 4 },
  ];

  for (const camp of [solihullCamp, kingshurstCamp, bcuCamp]) {
    await prisma.session.createMany({
      data: sessionDefs.map(s => ({ ...s, campId: camp.id })),
    });
  }
  console.log('Created sessions for all camps');

  // --- Default areas for Solihull ---
  const solihullAreas = [
    { name: 'Robotics A', type: 'robotics' },
    { name: 'Robotics B', type: 'robotics' },
    { name: 'Board Room (3DPA)', type: '3dprinting' },
    { name: 'Esports Room (3DPB)', type: '3dprinting' },
    { name: 'Game Dev A', type: 'gamedev' },
    { name: 'Game Dev B', type: 'gamedev' },
    { name: 'Game Area', type: 'game' },
  ];
  await prisma.area.createMany({
    data: solihullAreas.map(a => ({ ...a, campId: solihullCamp.id })),
  });

  // Simpler area setup for other locations
  const simpleAreas = [
    { name: 'Activity Room 1', type: 'robotics' },
    { name: 'Activity Room 2', type: 'gamedev' },
    { name: 'Activity Room 3', type: '3dprinting' },
    { name: 'Activity Room 4', type: 'game' },
  ];
  for (const camp of [kingshurstCamp, bcuCamp]) {
    await prisma.area.createMany({
      data: simpleAreas.map(a => ({ ...a, campId: camp.id })),
    });
  }
  console.log('Created areas for all camps');

  console.log('\nDatabase seeded successfully!');
  console.log('\nSuperadmin: admin@robocode.uk / admin');
  console.log('Camp passwords: admin=robocamp2026, teacher=teacher2026');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
