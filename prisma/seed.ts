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

  // --- Admin User ---
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'k.ayad@robocode.uk' },
    update: {},
    create: {
      email: 'k.ayad@robocode.uk',
      name: 'Khaled Ayad',
      password: hashedPassword,
      role: 'superadmin',
    },
  });
  console.log('Created superadmin: k.ayad@robocode.uk / admin123');

  // --- Season ---
  const easter2026 = await prisma.season.create({
    data: {
      title: 'Easter 2026',
      slug: 'easter-2026',
      startDate: new Date('2026-03-30'),
      endDate: new Date('2026-04-09'),
      active: true,
    },
  });
  console.log('Created season: Easter 2026');

  // --- Default Price Tiers ---
  await prisma.priceTier.createMany({
    data: [
      { days: 1, pricePence: 2500, order: 1, seasonId: easter2026.id },
      { days: 2, pricePence: 4000, order: 2, seasonId: easter2026.id },
      { days: 4, pricePence: 7500, order: 3, seasonId: easter2026.id },
      { days: 8, pricePence: 14000, order: 4, seasonId: easter2026.id },
    ],
  });
  console.log('Created price tiers');

  // --- Locations ---
  const solihull = await prisma.location.create({
    data: {
      name: 'Robocode Shirley Centre',
      slug: 'shirley',
      address: 'The Exchange, 26 Haslucks Green Rd, Shirley, B90 2EL',
      region: 'solihull',
      capacityPerDay: 70,
      hafSeatsTotal: 200,
      allowsPaid: true,
    },
  });

  const kingshurst = await prisma.location.create({
    data: {
      name: 'Tudor Grange Academy Kingshurst',
      slug: 'kingshurst',
      address: 'Cooks Lane, Fordbridge, B37 6NU',
      region: 'solihull',
      capacityPerDay: 38,
      hafSeatsTotal: 150,
      allowsPaid: false,
    },
  });

  const bcu = await prisma.location.create({
    data: {
      name: 'Birmingham City University',
      slug: 'bcu',
      address: 'Curzon Building, 4 Cardigan St, B4 7BD',
      region: 'birmingham',
      capacityPerDay: 45,
      hafSeatsTotal: 320,
      allowsPaid: false,
    },
  });

  console.log('Created 3 locations');

  // --- Camps (linked to season) ---
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
      seasonId: easter2026.id,
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
      seasonId: easter2026.id,
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
      seasonId: easter2026.id,
    },
  });

  console.log('Created 3 camps');

  // --- Camp Days ---
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

  const kingshurstDays = solihullDays.filter(d => d.weekNumber === 1);
  for (const day of kingshurstDays) {
    await prisma.campDay.create({
      data: { date: new Date(day.date), dayLabel: day.dayLabel, weekNumber: day.weekNumber, campId: kingshurstCamp.id },
    });
  }

  const bcuDays = solihullDays.filter(d => !(d.date === '2026-04-06'));
  for (const day of bcuDays) {
    await prisma.campDay.create({
      data: { date: new Date(day.date), dayLabel: day.dayLabel, weekNumber: day.weekNumber, campId: bcuCamp.id },
    });
  }

  console.log('Created camp days (Solihull: 8, Kingshurst: 4, BCU: 7)');

  // --- Default sessions ---
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

  // --- Areas ---
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
  console.log('\nSuperadmin: k.ayad@robocode.uk / admin123');
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
