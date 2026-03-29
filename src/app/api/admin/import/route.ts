import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import prisma from '@/lib/db';

interface RowData {
  location: string;
  weekStart: string;
  childFirst: string;
  childLast: string;
  age: number;
  allergies: string;
  parentFirst: string;
  parentLast: string;
  parentPhone: string;
  parentEmail: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
}

function autoGroup(kids: { name: string; age: number }[]) {
  const sorted = [...kids].sort((a, b) => a.age - b.age);
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F'];
  const numGroups = groupNames.length;
  const baseSize = Math.floor(sorted.length / numGroups);
  const remainder = sorted.length % numGroups;

  const groups: Record<string, { ageRange: string; kids: typeof sorted }> = {};
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

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-admin-role');
  if (role !== 'superadmin') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheet = workbook.getWorksheet('Camp Import Template') || workbook.worksheets[0];
    if (!sheet) {
      return NextResponse.json({ success: false, message: 'No worksheet found in the file' }, { status: 400 });
    }

    // Parse rows
    const rows: RowData[] = [];
    const errors: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const getValue = (col: number): string => {
        const cell = row.getCell(col);
        return cell.value?.toString()?.trim() || '';
      };

      const location = getValue(1);
      const weekStart = getValue(2);
      const childFirst = getValue(3);
      const childLast = getValue(4);
      const ageStr = getValue(5);
      const allergies = getValue(6);
      const parentFirst = getValue(7);
      const parentLast = getValue(8);
      const parentPhone = getValue(9);
      const parentEmail = getValue(10);
      const monday = getValue(11).toUpperCase() === 'Y';
      const tuesday = getValue(12).toUpperCase() === 'Y';
      const wednesday = getValue(13).toUpperCase() === 'Y';
      const thursday = getValue(14).toUpperCase() === 'Y';

      // Skip empty rows
      if (!childFirst && !childLast) return;

      // Validate required fields
      if (!location) { errors.push(`Row ${rowNumber}: Missing location`); return; }
      if (!childFirst) { errors.push(`Row ${rowNumber}: Missing child first name`); return; }
      if (!childLast) { errors.push(`Row ${rowNumber}: Missing child last name`); return; }

      const age = parseInt(ageStr);
      if (isNaN(age)) { errors.push(`Row ${rowNumber}: Invalid age "${ageStr}"`); return; }

      if (!monday && !tuesday && !wednesday && !thursday) {
        errors.push(`Row ${rowNumber}: No days selected for ${childFirst} ${childLast}`);
        return;
      }

      rows.push({
        location, weekStart, childFirst, childLast, age, allergies,
        parentFirst, parentLast, parentPhone, parentEmail,
        monday, tuesday, wednesday, thursday,
      });
    });

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid data rows found',
        details: { campsCreated: 0, childrenCreated: 0, errors },
      });
    }

    // Group rows by location + weekStart
    const campGroups = new Map<string, RowData[]>();
    for (const row of rows) {
      const key = `${row.location}|${row.weekStart}`;
      if (!campGroups.has(key)) campGroups.set(key, []);
      campGroups.get(key)!.push(row);
    }

    let campsCreated = 0;
    let childrenCreated = 0;

    // Get or create active season
    let season = await prisma.season.findFirst({ where: { active: true } });
    if (!season) {
      season = await prisma.season.create({
        data: {
          title: 'Easter 2026',
          slug: 'easter-2026',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-09'),
          active: true,
        },
      });
    }

    for (const [key, campRows] of campGroups) {
      const [locationName, weekStartStr] = key.split('|');

      // Get or create location
      let location = await prisma.location.findFirst({
        where: { name: { equals: locationName } },
      });
      if (!location) {
        location = await prisma.location.create({
          data: {
            name: locationName,
            slug: locationName.toLowerCase().replace(/\s+/g, '-'),
            region: 'Default',
            capacityPerDay: 50,
            hafSeatsTotal: 50,
          },
        });
      }

      // Parse week start date
      const weekStart = weekStartStr ? new Date(weekStartStr) : new Date();
      const dayDates = [
        new Date(weekStart),
        new Date(weekStart.getTime() + 86400000),
        new Date(weekStart.getTime() + 86400000 * 2),
        new Date(weekStart.getTime() + 86400000 * 3),
      ];
      const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];

      // Create camp
      const camp = await prisma.camp.create({
        data: {
          name: `${locationName} - Week ${weekStartStr || 'Import'}`,
          description: `Imported from Excel`,
          startDate: dayDates[0],
          endDate: dayDates[3],
          adminPassword: 'robocamp2026',
          teacherPassword: 'teacher2026',
          lunchTime: '12:00-13:00',
          locationId: location.id,
          seasonId: season.id,
        },
      });

      // Create camp days
      const campDays = [];
      for (let i = 0; i < 4; i++) {
        const campDay = await prisma.campDay.create({
          data: {
            date: dayDates[i],
            dayLabel: `${dayLabels[i]} ${dayDates[i].getDate()}${getOrdinal(dayDates[i].getDate())} ${dayDates[i].toLocaleDateString('en-GB', { month: 'long' })}`,
            weekNumber: 1,
            campId: camp.id,
          },
        });
        campDays.push(campDay);
      }

      // Create sessions and areas
      await Promise.all([
        prisma.session.create({ data: { name: 'Session 1', time: '10:00-11:00', order: 1, campId: camp.id } }),
        prisma.session.create({ data: { name: 'Session 2', time: '11:00-12:00', order: 2, campId: camp.id } }),
        prisma.session.create({ data: { name: 'Session 3', time: '13:00-14:00', order: 3, campId: camp.id } }),
      ]);

      const areas = await Promise.all([
        prisma.area.create({ data: { name: 'Mechanical', type: 'mechanical', campId: camp.id } }),
        prisma.area.create({ data: { name: 'Electronic', type: 'electronic', campId: camp.id } }),
        prisma.area.create({ data: { name: 'Physical', type: 'physical', campId: camp.id } }),
      ]);

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          type: 'haf',
          status: 'confirmed',
          parentFirstName: 'HAF',
          parentLastName: 'Import',
          parentEmail: 'haf@import',
          parentPhone: '',
          address: '',
          postcode: '',
          campId: camp.id,
        },
      });

      // Collect unique kids and their day attendance
      const kidsMap = new Map<string, { row: RowData; days: boolean[] }>();
      for (const row of campRows) {
        const kidKey = `${row.childFirst}|${row.childLast}`;
        if (!kidsMap.has(kidKey)) {
          kidsMap.set(kidKey, { row, days: [row.monday, row.tuesday, row.wednesday, row.thursday] });
        }
      }

      // Auto-group kids
      const allKids = Array.from(kidsMap.values()).map(k => ({
        name: `${k.row.childFirst} ${k.row.childLast}`,
        age: k.row.age,
      }));
      const groups = autoGroup(allKids);

      // Create groups and children
      const kidToChildId = new Map<string, string>();
      for (const [groupName, groupData] of Object.entries(groups)) {
        const group = await prisma.group.create({
          data: { name: groupName, ageRange: groupData.ageRange, campId: camp.id },
        });

        for (const kid of groupData.kids) {
          const kidKey = kid.name.split(' ')[0] + '|' + kid.name.split(' ').slice(1).join(' ');
          const kidData = kidsMap.get(kidKey);
          if (!kidData) continue;

          const child = await prisma.child.create({
            data: {
              firstName: kidData.row.childFirst,
              lastName: kidData.row.childLast,
              age: kidData.row.age,
              hasAllergies: !!kidData.row.allergies,
              allergyDetails: kidData.row.allergies || null,
              groupId: group.id,
              bookingId: booking.id,
            },
          });
          kidToChildId.set(kidKey, child.id);
          childrenCreated++;
        }
      }

      // Create day bookings
      for (const [kidKey, kidData] of kidsMap) {
        const childId = kidToChildId.get(kidKey);
        if (!childId) continue;

        for (let d = 0; d < 4; d++) {
          if (kidData.days[d]) {
            await prisma.childDayBooking.create({
              data: { childId, campDayId: campDays[d].id },
            });
          }
        }
      }

      // Create schedule rotation
      // Paired rotation: A&B together, C&D together, E&F together
      const rotation: Record<string, number[]> = {
        'A': [0, 1, 2], 'B': [0, 1, 2], 'C': [1, 2, 0],
        'D': [1, 2, 0], 'E': [2, 0, 1], 'F': [2, 0, 1],
      };

      const dbGroups = await prisma.group.findMany({ where: { campId: camp.id } });
      const sessions = await prisma.session.findMany({ where: { campId: camp.id }, orderBy: { order: 'asc' } });

      for (const group of dbGroups) {
        const areaIndices = rotation[group.name] || [0, 1, 2];
        for (let s = 0; s < sessions.length; s++) {
          await prisma.scheduleSlot.create({
            data: { groupId: group.id, sessionId: sessions[s].id, areaId: areas[areaIndices[s]].id },
          });
        }
      }

      campsCreated++;
    }

    return NextResponse.json({
      success: true,
      message: `Import complete! ${campsCreated} camp(s) created with ${childrenCreated} children.`,
      details: { campsCreated, childrenCreated, errors },
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 500 });
  }
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
