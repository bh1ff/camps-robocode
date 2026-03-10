import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campId } = await params;
    const { name, parentName, age, allergies } = await request.json();

    if (!name || !age) {
      return NextResponse.json({ error: 'Name and age are required' }, { status: 400 });
    }

    const groups = await prisma.group.findMany({
      where: { campId },
      include: { children: true },
    });

    if (groups.length === 0) {
      return NextResponse.json({ error: 'No groups exist for this camp' }, { status: 400 });
    }

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || '';

    type GroupScore = { group: typeof groups[0]; score: number };

    const groupScores: GroupScore[] = groups.map((group) => {
      const kids = group.children;
      const avgAge = kids.length > 0
        ? kids.reduce((sum, k) => sum + k.age, 0) / kids.length
        : age;

      const [minAge, maxAge] = group.ageRange.includes('-')
        ? group.ageRange.split('-').map(Number)
        : [Number(group.ageRange), Number(group.ageRange)];

      let ageScore = 0;
      if (age < minAge) ageScore = (minAge - age) * 10;
      else if (age > maxAge) ageScore = (age - maxAge) * 10;
      else ageScore = Math.abs(age - avgAge);

      const sizeScore = kids.length;
      const score = ageScore * 2 + sizeScore;

      return { group, score };
    });

    groupScores.sort((a, b) => a.score - b.score);
    const bestGroup = groupScores[0].group;

    const child = await prisma.child.create({
      data: {
        firstName,
        lastName,
        age: Number(age),
        hasAllergies: !!allergies,
        allergyDetails: allergies || null,
        groupId: bestGroup.id,
      },
    });

    const allChildrenInGroup = [...bestGroup.children, { age: Number(age) }];
    const ages = allChildrenInGroup.map(k => k.age);
    const newMinAge = Math.min(...ages);
    const newMaxAge = Math.max(...ages);
    const newAgeRange = newMinAge === newMaxAge ? `${newMinAge}` : `${newMinAge}-${newMaxAge}`;

    if (newAgeRange !== bestGroup.ageRange) {
      await prisma.group.update({
        where: { id: bestGroup.id },
        data: { ageRange: newAgeRange },
      });
    }

    return NextResponse.json({
      success: true,
      kid: {
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        age: child.age,
        allergies: child.allergyDetails || '',
      },
      assignedGroup: bestGroup.name,
      message: `${firstName} added to Group ${bestGroup.name}`,
    });
  } catch (error) {
    console.error('Add kid error:', error);
    return NextResponse.json({ error: 'Failed to add kid' }, { status: 500 });
  }
}
