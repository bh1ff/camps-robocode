import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface AdminTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'robocode-admin-secret-change-in-production'
);

const COOKIE_NAME = 'admin_token';
const EXPIRY = '7d';

export async function signToken(payload: Omit<AdminTokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function getCookieName() {
  return COOKIE_NAME;
}
