'use client';

import { useEffect, useState } from 'react';
import { Trash2, Download, Mail } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  source: string;
  region: string | null;
  createdAt: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('');

  const load = () => {
    fetch('/api/admin/subscribers')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSubscribers(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const regions = [...new Set(subscribers.map((s) => s.region).filter(Boolean))] as string[];

  const filtered = regionFilter === '__none__'
    ? subscribers.filter((s) => !s.region)
    : regionFilter
      ? subscribers.filter((s) => s.region === regionFilter)
      : subscribers;

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this subscriber?')) return;
    await fetch(`/api/admin/subscribers/${id}`, { method: 'DELETE' });
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  };

  const exportCsv = () => {
    const header = 'Email,Source,Region,Date\n';
    const rows = filtered
      .map((s) => `${s.email},${s.source},${s.region || ''},${new Date(s.createdAt).toLocaleDateString()}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading text-[#003439]">Subscribers</h1>
          <p className="text-sm text-[#05575c]/60 mt-1">
            Email signups from the website ({filtered.length}{regionFilter ? ` in ${regionFilter}` : ''} of {subscribers.length} total)
          </p>
        </div>
        {subscribers.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#003439] text-white rounded-xl hover:bg-[#004a52] transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {regions.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
          >
            <option value="">All regions</option>
            {regions.sort().map((r) => (
              <option key={r} value={r}>{r} ({subscribers.filter((s) => s.region === r).length})</option>
            ))}
            <option value="__none__">No region set ({subscribers.filter((s) => !s.region).length})</option>
          </select>
          {regionFilter && (
            <button onClick={() => setRegionFilter('')} className="text-xs text-[#05575c]/50 hover:text-[#003439]">Clear</button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Mail size={40} className="mx-auto text-[#05575c]/20 mb-3" />
          <p className="text-[#05575c]/50 font-medium">{regionFilter ? 'No subscribers in this region' : 'No subscribers yet'}</p>
          <p className="text-sm text-[#05575c]/30 mt-1">
            Email signups from the website will appear here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 text-xs text-[#05575c]/40 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Email</th>
                <th className="text-left px-5 py-3 font-semibold">Region</th>
                <th className="text-left px-5 py-3 font-semibold">Source</th>
                <th className="text-left px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#003439]">{s.email}</td>
                  <td className="px-5 py-3 text-[#05575c]/60">{s.region || <span className="text-[#05575c]/25">—</span>}</td>
                  <td className="px-5 py-3 text-[#05575c]/60 capitalize">{s.source}</td>
                  <td className="px-5 py-3 text-[#05575c]/60">
                    {new Date(s.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#05575c]/30 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
