'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Shield, User } from 'lucide-react';

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'staff', active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetch('/api/admin/staff')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setStaff(data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ email: '', name: '', password: '', role: 'staff', active: true });
    setError('');
    setShowModal(true);
  };

  const openEdit = (user: StaffUser) => {
    setEditing(user);
    setForm({ email: user.email, name: user.name, password: '', role: user.role, active: user.active });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const url = editing ? `/api/admin/staff/${editing.id}` : '/api/admin/staff';
    const method = editing ? 'PUT' : 'POST';

    const payload: Record<string, unknown> = { email: form.email, name: form.name, role: form.role, active: form.active };
    if (form.password) payload.password = form.password;

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Save failed');
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async (user: StaffUser) => {
    if (!confirm(`Remove "${user.name || user.email}"?`)) return;
    const res = await fetch(`/api/admin/staff/${user.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Delete failed');
      return;
    }
    load();
  };

  const updateForm = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003439]">Staff</h1>
          <p className="text-sm text-[#05575c]/60 mt-1">Manage admin panel access</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] transition-colors">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="space-y-2">
        {staff.map((user) => (
          <div key={user.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              user.role === 'superadmin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role === 'superadmin' ? <Shield size={18} /> : <User size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#003439]">{user.name || user.email}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  user.role === 'superadmin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>{user.role}</span>
                {!user.active && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
              </div>
              <p className="text-xs text-[#05575c]/40">{user.email}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(user)} className="p-2 rounded-lg hover:bg-gray-50 text-[#05575c]/40 hover:text-[#003439]">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(user)} className="p-2 rounded-lg hover:bg-red-50 text-[#05575c]/40 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003439] mb-4">{editing ? 'Edit Staff' : 'Add Staff'}</h2>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm mb-3">{error}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" placeholder="email@robocode.uk" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Password {editing && '(leave blank to keep current)'}</label>
                <input type="password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Role</label>
                <select value={form.role} onChange={(e) => updateForm('role', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20">
                  <option value="staff">Staff</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => updateForm('active', e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm text-[#003439]">Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-[#05575c]/60 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.email || (!editing && !form.password)} className="px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
