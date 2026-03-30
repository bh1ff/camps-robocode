'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function CampLoginPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campId } = use(params);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher'>('admin');
  const [campName, setCampName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const auth = localStorage.getItem(`camp_${campId}_auth`);
    if (auth) {
      const { role } = JSON.parse(auth);
      router.push(`/camp/${campId}/${role === 'admin' ? 'dashboard' : 'teacher'}`);
      return;
    }

    // Get camp name
    fetch(`/api/camps/${campId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          router.push('/');
        } else {
          setCampName(data.schedule?.lunch ? 'Camp' : 'Camp');
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/');
      });
  }, [campId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch(`/api/camps/${campId}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, role }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem(`camp_${campId}_auth`, JSON.stringify({
        role,
        campName: data.campName,
      }));
      router.push(`/camp/${campId}/${role === 'admin' ? 'dashboard' : 'teacher'}`);
    } else {
      setError('Invalid password');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center robo-gradient">
        <div className="w-12 h-12 border-4 border-[#00adb3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen robo-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#00adb3] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-[#00d4db] rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="robo-card p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img src="/mascot.png" alt="Robocode" className="w-24 h-24 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-heading text-[#003439] mb-2">ROBOCODE CAMP</h1>
          <p className="text-[#05575c] opacity-70">Camp Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#003439] mb-2">Login As</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-semibold ${
                  role === 'admin'
                    ? 'border-[#00adb3] bg-[#00adb3]/10 text-[#003439]'
                    : 'border-gray-200 text-gray-400 hover:border-[#00adb3]/50'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-semibold ${
                  role === 'teacher'
                    ? 'border-[#00adb3] bg-[#00adb3]/10 text-[#003439]'
                    : 'border-gray-200 text-gray-400 hover:border-[#00adb3]/50'
                }`}
              >
                Teacher
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-[#003439] mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none transition-colors text-[#003439] placeholder-gray-400"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="w-full robo-btn py-3 px-4 rounded-xl font-semibold text-lg">
            Login
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Camps
          </button>
          <a href="/admin" className="text-sm text-[#00adb3] hover:underline">
            Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}
