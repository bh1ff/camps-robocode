'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Camp {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  groupCount: number;
  kidCount: number;
  createdAt: string;
}

export default function SuperAdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [camps, setCamps] = useState<Camp[]>([]);
  const [showNewCamp, setShowNewCamp] = useState(false);
  const [newCamp, setNewCamp] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    adminPassword: 'admin2026',
    teacherPassword: 'teacher2026',
  });
  const [importing, setImporting] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const stored = localStorage.getItem('superadmin');
    if (stored) {
      setIsLoggedIn(true);
      loadCamps();
    } else {
      const res = await fetch('/api/superadmin/auth');
      const data = await res.json();
      setNeedsSetup(!data.exists);
    }
  };

  const loadCamps = async () => {
    const res = await fetch('/api/superadmin/camps');
    if (res.ok) {
      const data = await res.json();
      setCamps(data);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/superadmin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        action: needsSetup ? 'register' : 'login',
      }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem('superadmin', JSON.stringify({ email, id: data.id }));
      setIsLoggedIn(true);
      loadCamps();
    } else {
      setError(data.error || 'Authentication failed');
    }
  };

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/superadmin/camps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCamp),
    });

    if (res.ok) {
      setShowNewCamp(false);
      setNewCamp({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        adminPassword: 'admin2026',
        teacherPassword: 'teacher2026',
      });
      loadCamps();
    } else {
      setError('Failed to create camp');
    }
  };

  const handleDeleteCamp = async (id: string) => {
    if (!confirm('Delete this camp? This will remove all data permanently.')) return;

    const res = await fetch(`/api/superadmin/camps/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadCamps();
    }
  };

  const handleImport = async (campId: string, file: File) => {
    setImporting(campId);
    setImportStatus('Uploading...');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`/api/superadmin/camps/${campId}/import`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setImportStatus(`Imported ${data.imported} kids into ${data.groups} groups`);
      loadCamps();
      setTimeout(() => {
        setImporting(null);
        setImportStatus('');
      }, 3000);
    } else {
      setImportStatus(`Error: ${data.error}`);
      setTimeout(() => {
        setImporting(null);
        setImportStatus('');
      }, 5000);
    }
  };

  const handleExport = async (campId: string, format: 'json' | 'csv') => {
    const res = await fetch(`/api/superadmin/camps/${campId}/export?format=${format}`);

    if (format === 'csv') {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `camp_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `camp_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superadmin');
    setIsLoggedIn(false);
  };

  // Login/Register form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen robo-gradient flex items-center justify-center p-4">
        <div className="robo-card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#003439] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl font-black text-[#00adb3]">SA</span>
            </div>
            <h1 className="text-3xl font-heading text-[#003439] mb-2">SUPER ADMIN</h1>
            <p className="text-[#05575c] opacity-70">
              {needsSetup ? 'Create your account' : 'Sign in to manage camps'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#003439] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#003439] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button type="submit" className="w-full robo-btn py-3 px-4 rounded-xl font-semibold text-lg">
              {needsSetup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-[#00adb3] hover:underline">
              Back to Camp Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-[#f0f7f7]">
      {/* Header */}
      <header className="robo-gradient shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00adb3] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">SA</span>
            </div>
            <div>
              <h1 className="text-xl font-heading text-white">SUPER ADMIN</h1>
              <p className="text-white/60 text-sm">Camp Management System</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="robo-card p-6">
            <p className="text-3xl font-heading text-[#003439]">{camps.length}</p>
            <p className="text-sm text-[#05575c]/70">Total Camps</p>
          </div>
          <div className="robo-card p-6">
            <p className="text-3xl font-heading text-[#003439]">
              {camps.reduce((sum, c) => sum + c.groupCount, 0)}
            </p>
            <p className="text-sm text-[#05575c]/70">Total Groups</p>
          </div>
          <div className="robo-card p-6">
            <p className="text-3xl font-heading text-[#003439]">
              {camps.reduce((sum, c) => sum + c.kidCount, 0)}
            </p>
            <p className="text-sm text-[#05575c]/70">Total Campers</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading text-[#003439]">Camps</h2>
          <button
            onClick={() => setShowNewCamp(true)}
            className="robo-btn px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Camp
          </button>
        </div>

        {/* Camp List */}
        <div className="space-y-4">
          {camps.length === 0 ? (
            <div className="robo-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#00adb3]/10 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-[#00adb3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-heading text-[#003439] mb-2">No Camps Yet</h3>
              <p className="text-[#05575c]/70 mb-4">Create your first camp to get started</p>
              <button
                onClick={() => setShowNewCamp(true)}
                className="robo-btn px-6 py-3 rounded-xl font-semibold"
              >
                Create Camp
              </button>
            </div>
          ) : (
            camps.map(camp => (
              <div key={camp.id} className="robo-card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-heading text-[#003439]">{camp.name}</h3>
                    <p className="text-sm text-[#05575c]/70">
                      {new Date(camp.startDate).toLocaleDateString()} - {new Date(camp.endDate).toLocaleDateString()}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <span className="robo-badge">{camp.groupCount} groups</span>
                      <span className="robo-badge-outline">{camp.kidCount} campers</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Import CSV */}
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && importing) handleImport(importing, file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => {
                        setImporting(camp.id);
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-semibold"
                    >
                      Import CSV
                    </button>

                    {/* Export */}
                    <button
                      onClick={() => handleExport(camp.id, 'csv')}
                      className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExport(camp.id, 'json')}
                      className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                    >
                      Export JSON
                    </button>

                    {/* Open Camp */}
                    <button
                      onClick={() => router.push(`/camp/${camp.id}`)}
                      className="px-4 py-2 text-sm robo-btn rounded-lg font-semibold"
                    >
                      Open Camp
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteCamp(camp.id)}
                      className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {importing === camp.id && importStatus && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                    {importStatus}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* New Camp Modal */}
      {showNewCamp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewCamp(false)}>
          <div className="robo-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-heading text-[#003439] mb-4">Create New Camp</h2>

            <form onSubmit={handleCreateCamp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#003439] mb-1">Camp Name</label>
                <input
                  type="text"
                  value={newCamp.name}
                  onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                  placeholder="e.g., Summer Camp 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#003439] mb-1">Description</label>
                <input
                  type="text"
                  value={newCamp.description}
                  onChange={(e) => setNewCamp({ ...newCamp, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#003439] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newCamp.startDate}
                    onChange={(e) => setNewCamp({ ...newCamp, startDate: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#003439] mb-1">End Date</label>
                  <input
                    type="date"
                    value={newCamp.endDate}
                    onChange={(e) => setNewCamp({ ...newCamp, endDate: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#003439] mb-1">Admin Password</label>
                  <input
                    type="text"
                    value={newCamp.adminPassword}
                    onChange={(e) => setNewCamp({ ...newCamp, adminPassword: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#003439] mb-1">Teacher Password</label>
                  <input
                    type="text"
                    value={newCamp.teacherPassword}
                    onChange={(e) => setNewCamp({ ...newCamp, teacherPassword: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <strong>Next step:</strong> After creating the camp, import a CSV file with camper data.
                <br />
                CSV format: <code className="bg-white px-1 rounded">name,age,allergies</code>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewCamp(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold border-2 border-gray-200 text-[#003439] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 robo-btn py-3 px-4 rounded-xl font-semibold"
                >
                  Create Camp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
