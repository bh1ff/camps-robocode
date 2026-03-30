import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json();

    if (action === 'register') {
      const existingAdmin = await prisma.adminUser.findFirst({
        where: { role: 'superadmin' },
      });
      if (existingAdmin) {
        return NextResponse.json({ error: 'Superadmin already exists' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await prisma.adminUser.create({
        data: { email, name: 'Admin', password: hashedPassword, role: 'superadmin' },
      });

      return NextResponse.json({ success: true, id: admin.id });
    }

    if (action === 'login') {
      const admin = await prisma.adminUser.findFirst({ where: { email } });
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
    const admin = await prisma.adminUser.findFirst({
      where: { role: 'superadmin' },
    });
    return NextResponse.json({ exists: !!admin });
  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
