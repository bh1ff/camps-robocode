import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parse } from 'csv-parse/sync';

interface CSVRow {
  name: string;
  age: string;
  allergies?: string;
  group?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campId } = await params;

    // Check camp exists
    const camp = await prisma.camp.findUnique({ where: { id: campId } });
    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const records: CSVRow[] = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Clear existing data for this camp
    await prisma.kid.deleteMany({
      where: { group: { campId } },
    });
    await prisma.scheduleSlot.deleteMany({
      where: { group: { campId } },
    });
    await prisma.group.deleteMany({
      where: { campId },
    });

    // Group kids by age for automatic grouping
    const kidsByAge: Record<number, CSVRow[]> = {};
    for (const record of records) {
      const age = parseInt(record.age) || 8;
      if (!kidsByAge[age]) kidsByAge[age] = [];
      kidsByAge[age].push(record);
    }

    // Create groups and assign kids
    const sortedAges = Object.keys(kidsByAge).map(Number).sort((a, b) => a - b);
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const targetGroupSize = Math.ceil(records.length / 8);

    let currentGroupIndex = 0;
    let currentGroupKids: { name: string; age: number; allergies: string | null }[] = [];
    let minAge = sortedAges[0] || 5;
    let maxAge = minAge;

    const groupsToCreate: {
      name: string;
      ageRange: string;
      kids: { name: string; age: number; allergies: string | null }[];
    }[] = [];

    for (const age of sortedAges) {
      for (const kid of kidsByAge[age]) {
        currentGroupKids.push({
          name: kid.name,
          age: parseInt(kid.age) || 8,
          allergies: kid.allergies || null,
        });
        maxAge = age;

        if (currentGroupKids.length >= targetGroupSize && currentGroupIndex < 7) {
          groupsToCreate.push({
            name: groupNames[currentGroupIndex],
            ageRange: minAge === maxAge ? `${minAge}` : `${minAge}-${maxAge}`,
            kids: [...currentGroupKids],
          });
          currentGroupIndex++;
          currentGroupKids = [];
          minAge = age;
          maxAge = age;
        }
      }
    }

    // Add remaining kids to the last group
    if (currentGroupKids.length > 0) {
      groupsToCreate.push({
        name: groupNames[currentGroupIndex],
        ageRange: minAge === maxAge ? `${minAge}` : `${minAge}-${maxAge}`,
        kids: currentGroupKids,
      });
    }

    // Create groups and kids in database
    const createdGroups: string[] = [];
    for (const groupData of groupsToCreate) {
      const group = await prisma.group.create({
        data: {
          name: groupData.name,
          ageRange: groupData.ageRange,
          campId,
          kids: {
            create: groupData.kids,
          },
        },
      });
      createdGroups.push(group.id);
    }

    // Get areas and sessions
    const areas = await prisma.area.findMany({ where: { campId } });
    const sessions = await prisma.session.findMany({
      where: { campId },
      orderBy: { order: 'asc' },
    });

    // Create rotation schedule (Latin square pattern)
    const groups = await prisma.group.findMany({ where: { campId } });
    const scheduleSlots: { groupId: string; sessionId: string; areaId: string }[] = [];

    groups.forEach((group, groupIndex) => {
      sessions.forEach((session, sessionIndex) => {
        const areaIndex = (groupIndex + sessionIndex) % areas.length;
        scheduleSlots.push({
          groupId: group.id,
          sessionId: session.id,
          areaId: areas[areaIndex].id,
        });
      });
    });

    await prisma.scheduleSlot.createMany({
      data: scheduleSlots,
    });

    return NextResponse.json({
      success: true,
      imported: records.length,
      groups: groupsToCreate.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed: ' + (error as Error).message }, { status: 500 });
  }
}
