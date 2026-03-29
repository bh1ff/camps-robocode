import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const url = process.env.TURSO_DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

type Kid = { name: string; age: number; allergies: string | null };

// Per-day attendance from HAF_shirley_all_week1.xlsx
const shirleyDays: { day: string; date: string; kids: Kid[] }[] = [
  {
    day: 'Monday 30th March',
    date: '2026-03-30',
    kids: [
      { name: "Nathan Ho", age: 13, allergies: null },
      { name: "Isla Keeling", age: 7, allergies: null },
      { name: "Lucen Hancock", age: 15, allergies: null },
      { name: "Ural Altay", age: 9, allergies: null },
      { name: "Umay Altay", age: 11, allergies: null },
      { name: "Sasha Costa Silva", age: 12, allergies: null },
      { name: "Ricky Costa Silva", age: 8, allergies: null },
      { name: "Atharv Ranjan", age: 9, allergies: null },
      { name: "Navya Patel", age: 11, allergies: null },
      { name: "Veet Patel", age: 7, allergies: null },
      { name: "Zakariyya Ul-Haq", age: 9, allergies: null },
      { name: "Inaya Ul-Haq", age: 10, allergies: null },
      { name: "Umaiza Ul-Haq", age: 6, allergies: null },
      { name: "Benjamin Tomkinson", age: 9, allergies: null },
      { name: "Rumaisa Ayaz", age: 12, allergies: null },
      { name: "Harrison Endsor", age: 9, allergies: "Hayfever" },
      { name: "Abdulazeez Khan", age: 12, allergies: null },
      { name: "Eesa Razzaq", age: 7, allergies: null },
      { name: "Basma Fakirane", age: 13, allergies: null },
      { name: "Zeyad Fakirane", age: 8, allergies: null },
      { name: "Abdullah Ali", age: 12, allergies: null },
      { name: "Aditti Archana Kannan", age: 9, allergies: null },
      { name: "Finley Kenny", age: 7, allergies: null },
      { name: "Patrick Kenny", age: 8, allergies: null },
      { name: "Nahiyan Ahmed", age: 10, allergies: null },
      { name: "Bear Richards", age: 6, allergies: null },
      { name: "Jamie Hollingsworth", age: 14, allergies: null },
      { name: "Sofia Payne", age: 11, allergies: null },
      { name: "Olivia Payne", age: 8, allergies: "Nuts" },
      { name: "Anson Shek", age: 13, allergies: null },
      { name: "Ariadne Molloy-Litt", age: 10, allergies: null },
      { name: "Krish Keshvara", age: 8, allergies: null },
      { name: "Yash Bapodra", age: 8, allergies: "Nuts & Sea food" },
      { name: "Ryan Cheng", age: 11, allergies: "Hayfever and Dust" },
      { name: "Theo Chan", age: 11, allergies: "Hayfever and Dust" },
      { name: "Freddie Smith", age: 10, allergies: null },
      { name: "Luca Dumitru", age: 10, allergies: null },
      { name: "Travis Lau", age: 7, allergies: null },
      { name: "Yahya Mohamed", age: 11, allergies: "Shrimps, Salmon, Tuna, Strawberries, Humus, Sesame" },
      { name: "Cherry Yun Qian Chong", age: 13, allergies: null },
      { name: "Richie Guang Yao Chong", age: 11, allergies: null },
      { name: "Hasan Salman", age: 14, allergies: null },
      { name: "Abdullah Khalid", age: 10, allergies: "Kiwi" },
      { name: "Yusha Khalid", age: 8, allergies: null },
      { name: "Mustafa Khalid", age: 7, allergies: null },
      { name: "Nour Berdek", age: 11, allergies: null },
    ],
  },
  {
    day: 'Tuesday 31st March',
    date: '2026-03-31',
    kids: [
      { name: "Nathan Ho", age: 13, allergies: null },
      { name: "Theodoro Rooms", age: 7, allergies: null },
      { name: "Lucen Hancock", age: 15, allergies: null },
      { name: "Aiden Sherwood Sweeney", age: 8, allergies: null },
      { name: "Ural Altay", age: 9, allergies: null },
      { name: "Umay Altay", age: 11, allergies: null },
      { name: "Sasha Costa Silva", age: 12, allergies: null },
      { name: "Ricky Costa Silva", age: 8, allergies: null },
      { name: "Yahya Khan", age: 11, allergies: null },
      { name: "Yusha Khan", age: 9, allergies: null },
      { name: "Atharv Ranjan", age: 9, allergies: null },
      { name: "Navya Patel", age: 11, allergies: null },
      { name: "Veet Patel", age: 7, allergies: null },
      { name: "Zakariyya Ul-Haq", age: 9, allergies: null },
      { name: "Inaya Ul-Haq", age: 10, allergies: null },
      { name: "Umaiza Ul-Haq", age: 6, allergies: null },
      { name: "Rumaisa Ayaz", age: 12, allergies: null },
      { name: "Harrison Endsor", age: 9, allergies: "Hayfever" },
      { name: "Abdullah Ali", age: 12, allergies: null },
      { name: "Aditti Archana Kannan", age: 9, allergies: null },
      { name: "Finley Kenny", age: 7, allergies: null },
      { name: "Patrick Kenny", age: 8, allergies: null },
      { name: "Jamie Hollingsworth", age: 14, allergies: null },
      { name: "Anson Shek", age: 13, allergies: null },
      { name: "Krish Keshvara", age: 8, allergies: null },
      { name: "Yash Bapodra", age: 8, allergies: "Nuts & Sea food" },
      { name: "Ryan Cheng", age: 11, allergies: "Hayfever and Dust" },
      { name: "Theo Chan", age: 11, allergies: "Hayfever and Dust" },
      { name: "Freddie Smith", age: 10, allergies: null },
      { name: "Luca Dumitru", age: 10, allergies: null },
      { name: "Yahya Mohamed", age: 11, allergies: "Shrimps, Salmon, Tuna, Strawberries, Humus, Sesame" },
      { name: "Siar Vakaj", age: 7, allergies: null },
      { name: "Elias-Blue Buckley", age: 13, allergies: null },
      { name: "Cherry Yun Qian Chong", age: 13, allergies: null },
      { name: "Richie Guang Yao Chong", age: 11, allergies: null },
      { name: "Hasan Salman", age: 14, allergies: null },
      { name: "Nour Berdek", age: 11, allergies: null },
    ],
  },
  {
    day: 'Wednesday 1st April',
    date: '2026-04-01',
    kids: [
      { name: "Nathan Ho", age: 13, allergies: null },
      { name: "Isla Keeling", age: 7, allergies: null },
      { name: "Theodoro Rooms", age: 7, allergies: null },
      { name: "Lucen Hancock", age: 15, allergies: null },
      { name: "Ural Altay", age: 9, allergies: null },
      { name: "Umay Altay", age: 11, allergies: null },
      { name: "Sasha Costa Silva", age: 12, allergies: null },
      { name: "Ricky Costa Silva", age: 8, allergies: null },
      { name: "Atharv Ranjan", age: 9, allergies: null },
      { name: "Navya Patel", age: 11, allergies: null },
      { name: "Veet Patel", age: 7, allergies: null },
      { name: "Zakariyya Ul-Haq", age: 9, allergies: null },
      { name: "Inaya Ul-Haq", age: 10, allergies: null },
      { name: "Umaiza Ul-Haq", age: 6, allergies: null },
      { name: "Benjamin Tomkinson", age: 9, allergies: null },
      { name: "Rumaisa Ayaz", age: 12, allergies: null },
      { name: "Harrison Endsor", age: 9, allergies: "Hayfever" },
      { name: "Abdulazeez Khan", age: 12, allergies: "Kiwi" },
      { name: "Eesa Razzaq", age: 7, allergies: null },
      { name: "Abdullah Ali", age: 12, allergies: null },
      { name: "Aditti Archana Kannan", age: 9, allergies: null },
      { name: "Nahiyan Ahmed", age: 10, allergies: null },
      { name: "Jamie Hollingsworth", age: 14, allergies: null },
      { name: "Anson Shek", age: 13, allergies: null },
      { name: "Krish Keshvara", age: 8, allergies: null },
      { name: "Yash Bapodra", age: 8, allergies: "Nuts & Sea food" },
      { name: "Ryan Cheng", age: 11, allergies: "Hayfever and Dust" },
      { name: "Theo Chan", age: 11, allergies: "Hayfever and Dust" },
      { name: "Freddie Smith", age: 10, allergies: null },
      { name: "Luca Dumitru", age: 10, allergies: null },
      { name: "Yahya Mohamed", age: 11, allergies: "Shrimps, Salmon, Tuna, Strawberries, Humus, Sesame" },
      { name: "Cherry Yun Qian Chong", age: 13, allergies: null },
      { name: "Richie Guang Yao Chong", age: 11, allergies: null },
      { name: "Hasan Salman", age: 14, allergies: null },
      { name: "Abdullah Khalid", age: 10, allergies: "Kiwi" },
      { name: "Yusha Khalid", age: 8, allergies: null },
      { name: "Mustafa Khalid", age: 7, allergies: null },
      { name: "Nour Berdek", age: 11, allergies: null },
    ],
  },
  {
    day: 'Thursday 2nd April',
    date: '2026-04-02',
    kids: [
      { name: "Nathan Ho", age: 13, allergies: null },
      { name: "Isla Keeling", age: 7, allergies: null },
      { name: "Lucen Hancock", age: 15, allergies: null },
      { name: "Aiden Sherwood Sweeney", age: 8, allergies: null },
      { name: "Ural Altay", age: 9, allergies: null },
      { name: "Umay Altay", age: 11, allergies: null },
      { name: "Sasha Costa Silva", age: 12, allergies: null },
      { name: "Ricky Costa Silva", age: 8, allergies: null },
      { name: "Atharv Ranjan", age: 9, allergies: null },
      { name: "Navya Patel", age: 11, allergies: null },
      { name: "Veet Patel", age: 7, allergies: null },
      { name: "Zakariyya Ul-Haq", age: 9, allergies: null },
      { name: "Inaya Ul-Haq", age: 10, allergies: null },
      { name: "Umaiza Ul-Haq", age: 6, allergies: null },
      { name: "Benjamin Tomkinson", age: 9, allergies: null },
      { name: "Rumaisa Ayaz", age: 12, allergies: null },
      { name: "Harrison Endsor", age: 9, allergies: "Hayfever" },
      { name: "Abdulazeez Khan", age: 12, allergies: "Kiwi" },
      { name: "Abdullah Ali", age: 12, allergies: null },
      { name: "Ahmad Ali", age: 15, allergies: null },
      { name: "Basma Fakirane", age: 13, allergies: null },
      { name: "Zeyad Fakirane", age: 8, allergies: null },
      { name: "Aditti Archana Kannan", age: 9, allergies: null },
      { name: "Mikaeel Tahir", age: 10, allergies: null },
      { name: "Nahiyan Ahmed", age: 10, allergies: null },
      { name: "Jibreel Tahir", age: 11, allergies: "Kiwi" },
      { name: "Nuuh Tahir", age: 8, allergies: null },
      { name: "Finley Kenny", age: 7, allergies: null },
      { name: "Patrick Kenny", age: 8, allergies: null },
      { name: "Jamie Hollingsworth", age: 14, allergies: null },
      { name: "Sofia Payne", age: 11, allergies: null },
      { name: "Olivia Payne", age: 8, allergies: "Nuts" },
      { name: "Anson Shek", age: 13, allergies: null },
      { name: "Krish Keshvara", age: 8, allergies: null },
      { name: "Yash Bapodra", age: 8, allergies: "Nuts & Sea food" },
      { name: "Ryan Cheng", age: 11, allergies: "Hayfever and Dust" },
      { name: "Theo Chan", age: 11, allergies: "Hayfever and Dust" },
      { name: "Freddie Smith", age: 10, allergies: null },
      { name: "Luca Dumitru", age: 10, allergies: null },
      { name: "Muhammad Iqbal", age: 11, allergies: null },
      { name: "Elias-Blue Buckley", age: 13, allergies: null },
      { name: "Cherry Yun Qian Chong", age: 13, allergies: null },
      { name: "Richie Guang Yao Chong", age: 11, allergies: null },
      { name: "Hasan Salman", age: 14, allergies: null },
      { name: "Nour Berdek", age: 11, allergies: null },
    ],
  },
];

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName: lastName || firstName };
}

function autoGroup(kids: Kid[]) {
  const sorted = [...kids].sort((a, b) => a.age - b.age);
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F'];
  const numGroups = groupNames.length;
  const baseSize = Math.floor(sorted.length / numGroups);
  const remainder = sorted.length % numGroups;

  const groups: Record<string, { ageRange: string; kids: Kid[] }> = {};
  let offset = 0;

  for (let i = 0; i < numGroups; i++) {
    const size = baseSize + (i < remainder ? 1 : 0);
    const groupKids = sorted.slice(offset, offset + size);
    offset += size;

    if (groupKids.length === 0) break;

    const minAge = groupKids[0].age;
    const maxAge = groupKids[groupKids.length - 1].age;
    const ageRange = minAge === maxAge ? `${minAge}` : `${minAge}-${maxAge}`;

    groups[groupNames[i]] = { ageRange, kids: groupKids };
  }

  return groups;
}

async function main() {
  console.log('Seeding Shirley Week 1 - one camp per day...\n');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@robocode.uk' },
    update: {},
    create: {
      email: 'admin@robocode.uk',
      name: 'Admin',
      password: hashedPassword,
      role: 'superadmin',
    },
  });
  console.log('Admin user created: admin@robocode.uk / admin');

  // Create location
  const location = await prisma.location.create({
    data: {
      name: 'Shirley',
      slug: 'shirley',
      address: 'Shirley, Southampton',
      region: 'Southampton',
      capacityPerDay: 50,
      hafSeatsTotal: 50,
    },
  });

  // Create season
  const season = await prisma.season.create({
    data: {
      title: 'Easter 2026',
      slug: 'easter-2026',
      startDate: new Date('2026-03-30'),
      endDate: new Date('2026-04-09'),
      active: true,
    },
  });

  // Create one camp for the whole week
  const camp = await prisma.camp.create({
    data: {
      name: 'Shirley - Week 1',
      description: 'HAF Shirley Easter 2026 Week 1',
      startDate: new Date('2026-03-30'),
      endDate: new Date('2026-04-02'),
      adminPassword: 'robocamp2026',
      teacherPassword: 'teacher2026',
      lunchTime: '12:00-13:00',
      locationId: location.id,
      seasonId: season.id,
    },
  });

  // Create camp days
  const campDays = [];
  for (const dayData of shirleyDays) {
    const campDay = await prisma.campDay.create({
      data: {
        date: new Date(dayData.date),
        dayLabel: dayData.day,
        weekNumber: 1,
        campId: camp.id,
      },
    });
    campDays.push({ campDay, dayData });
  }

  // Create sessions
  const sessions = await Promise.all([
    prisma.session.create({ data: { name: 'Session 1', time: '10:00-11:00', order: 1, campId: camp.id } }),
    prisma.session.create({ data: { name: 'Session 2', time: '11:00-12:00', order: 2, campId: camp.id } }),
    prisma.session.create({ data: { name: 'Session 3', time: '13:00-14:00', order: 3, campId: camp.id } }),
  ]);

  // Create areas
  const areas = await Promise.all([
    prisma.area.create({ data: { name: 'Mechanical', type: 'mechanical', campId: camp.id } }),
    prisma.area.create({ data: { name: 'Electronic', type: 'electronic', campId: camp.id } }),
    prisma.area.create({ data: { name: 'Physical', type: 'physical', campId: camp.id } }),
  ]);

  // Collect all unique kids across all days
  const allKidsMap = new Map<string, Kid>();
  for (const dayData of shirleyDays) {
    for (const kid of dayData.kids) {
      allKidsMap.set(kid.name, kid);
    }
  }
  const allKids = Array.from(allKidsMap.values());

  // Group all unique kids
  const groups = autoGroup(allKids);

  // Create a booking for HAF kids
  const booking = await prisma.booking.create({
    data: {
      type: 'haf',
      status: 'confirmed',
      parentFirstName: 'HAF',
      parentLastName: 'Import',
      parentEmail: 'haf@robocode.uk',
      parentPhone: '',
      address: '',
      postcode: '',
      campId: camp.id,
    },
  });

  // Create groups and children
  const kidToChildId = new Map<string, string>();

  for (const [groupName, groupData] of Object.entries(groups)) {
    const group = await prisma.group.create({
      data: {
        name: groupName,
        ageRange: groupData.ageRange,
        campId: camp.id,
      },
    });

    for (const kid of groupData.kids) {
      const { firstName, lastName } = splitName(kid.name);
      const child = await prisma.child.create({
        data: {
          firstName,
          lastName,
          age: kid.age,
          hasAllergies: !!kid.allergies,
          allergyDetails: kid.allergies,
          groupId: group.id,
          bookingId: booking.id,
        },
      });
      kidToChildId.set(kid.name, child.id);
    }
  }

  // Create ChildDayBooking records for each day
  for (const { campDay, dayData } of campDays) {
    let dayCount = 0;
    for (const kid of dayData.kids) {
      const childId = kidToChildId.get(kid.name);
      if (childId) {
        await prisma.childDayBooking.create({
          data: {
            childId,
            campDayId: campDay.id,
          },
        });
        dayCount++;
      }
    }
    console.log(`  ${dayData.day}: ${dayCount} kids booked`);
  }

  // Create schedule rotation
  const rotation: Record<string, number[]> = {
    'A': [0, 1, 2],
    'B': [0, 2, 1],
    'C': [1, 2, 0],
    'D': [1, 0, 2],
    'E': [2, 0, 1],
    'F': [2, 1, 0],
  };

  const dbGroups = await prisma.group.findMany({ where: { campId: camp.id } });
  for (const group of dbGroups) {
    const areaIndices = rotation[group.name] || [0, 1, 2];
    for (let s = 0; s < sessions.length; s++) {
      await prisma.scheduleSlot.create({
        data: {
          groupId: group.id,
          sessionId: sessions[s].id,
          areaId: areas[areaIndices[s]].id,
        },
      });
    }
  }

  const groupSummary = Object.entries(groups)
    .map(([n, g]) => `${n}(${g.ageRange}):${g.kids.length}`)
    .join(', ');
  console.log(`\nGroups: ${groupSummary}`);
  console.log(`Total unique kids: ${allKids.length}`);
  console.log('\nDone! Shirley Week 1 camp created with 4 days.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
