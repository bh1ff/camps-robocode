import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, getCookieName } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
    return NextResponse.next();
  }

  const token = request.cookies.get(getCookieName())?.value;

  if (!token) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    const response = pathname.startsWith('/api/admin')
      ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      : NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete(getCookieName());
    return response;
  }

  const headers = new Headers(request.headers);
  headers.set('x-admin-id', payload.userId);
  headers.set('x-admin-email', payload.email);
  headers.set('x-admin-role', payload.role);
  headers.set('x-admin-name', payload.name);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
