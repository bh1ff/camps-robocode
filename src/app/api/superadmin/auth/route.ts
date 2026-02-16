import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json();

    if (action === 'register') {
      // Check if any superadmin exists
      const existingAdmin = await prisma.superAdmin.findFirst();
      if (existingAdmin) {
        return NextResponse.json({ error: 'Superadmin already exists' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await prisma.superAdmin.create({
        data: { email, password: hashedPassword },
      });

      return NextResponse.json({ success: true, id: admin.id });
    }

    if (action === 'login') {
      const admin = await prisma.superAdmin.findUnique({ where: { email } });
      if (!admin) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      return NextResponse.json({ success: true, id: admin.id, email: admin.email });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const admin = await prisma.superAdmin.findFirst();
    return NextResponse.json({ exists: !!admin });
  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
