// Simple password-based auth for demo purposes
// In production, use proper authentication

export const ADMIN_PASSWORD = 'robocamp2026';
export const TEACHER_PASSWORD = 'teacher2026';

export function validatePassword(password: string, role: 'admin' | 'teacher'): boolean {
  if (role === 'admin') {
    return password === ADMIN_PASSWORD;
  }
  return password === TEACHER_PASSWORD || password === ADMIN_PASSWORD;
}

export function getStoredAuth(): { role: 'admin' | 'teacher' | null; authenticated: boolean } {
  if (typeof window === 'undefined') {
    return { role: null, authenticated: false };
  }

  const stored = localStorage.getItem('campAuth');
  if (!stored) {
    return { role: null, authenticated: false };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { role: null, authenticated: false };
  }
}

export function setStoredAuth(role: 'admin' | 'teacher'): void {
  localStorage.setItem('campAuth', JSON.stringify({ role, authenticated: true }));
}

export function clearStoredAuth(): void {
  localStorage.removeItem('campAuth');
}
