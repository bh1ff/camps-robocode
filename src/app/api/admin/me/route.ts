import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    id: request.headers.get('x-admin-id'),
    email: request.headers.get('x-admin-email'),
    name: request.headers.get('x-admin-name'),
    role: request.headers.get('x-admin-role'),
  });
}
