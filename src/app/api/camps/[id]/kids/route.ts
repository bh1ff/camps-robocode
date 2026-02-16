import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Add a new kid to the camp with auto-sorting into best group
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

    // Get all groups with their kids for this camp
    const groups = await prisma.group.findMany({
      where: { campId },
      include: {
        kids: true,
      },
      orderBy: { name: 'asc' },
    });

    if (groups.length === 0) {
      return NextResponse.json({ error: 'No groups exist for this camp' }, { status: 400 });
    }

    // Find the best group for this kid based on:
    // 1. Age compatibility (prefer groups with similar ages)
    // 2. Group size (prefer smaller groups to balance)
    type GroupScore = { group: typeof groups[0]; score: number; avgAge: number };

    const groupScores: GroupScore[] = groups.map((group) => {
      const kids = group.kids;
      const avgAge = kids.length > 0
        ? kids.reduce((sum, k) => sum + k.age, 0) / kids.length
        : age; // If empty, assume same age

      // Parse age range
      const [minAge, maxAge] = group.ageRange.includes('-')
        ? group.ageRange.split('-').map(Number)
        : [Number(group.ageRange), Number(group.ageRange)];

      // Score based on age fit (lower is better)
      let ageScore = 0;
      if (age < minAge) ageScore = (minAge - age) * 10;
      else if (age > maxAge) ageScore = (age - maxAge) * 10;
      else ageScore = Math.abs(age - avgAge); // Within range, prefer closer to average

      // Score based on group size (prefer smaller groups)
      const sizeScore = kids.length;

      // Combined score (lower is better)
      const score = ageScore * 2 + sizeScore;

      return { group, score, avgAge };
    });

    // Sort by score (lower is better)
    groupScores.sort((a, b) => a.score - b.score);
    const bestGroup = groupScores[0].group;

    // Create the kid in the best group
    const kid = await prisma.kid.create({
      data: {
        name,
        parentName: parentName || null,
        age: Number(age),
        allergies: allergies || null,
        groupId: bestGroup.id,
      },
    });

    // Update group age range if needed
    const allKidsInGroup = [...bestGroup.kids, { age: Number(age) }];
    const ages = allKidsInGroup.map(k => k.age);
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
      kid,
      assignedGroup: bestGroup.name,
      message: `${name} added to Group ${bestGroup.name}`,
    });
  } catch (error) {
    console.error('Add kid error:', error);
    return NextResponse.json({ error: 'Failed to add kid' }, { status: 500 });
  }
}
