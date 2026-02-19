"use client";
import { useEffect, useState } from 'react';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

export default function SettingsPage() {
  const [officialGroups, setOfficialGroups] = useState<string[]>([]);
  const [pendingGroups, setPendingGroups] = useState<string[]>([]);

  const fetchSettings = async () => {
    // GET API call
    const res = await api.get('/notices/settings/groups');
    setOfficialGroups(res.data);
    
    // Also fetch notices to discover new groups
    const noticeRes = await api.get('/notices');
    const detected = Array.from(new Set(noticeRes.data.map((n: any) => n.groupName)))
      .filter((g: any) => g && !res.data.includes(g));
    setPendingGroups(detected as string[]);
  };

  const saveGroups = async (newList: string[]) => {
    // SEND (POST) API call
    await api.post('/notices/settings/groups', { groups: newList });
    fetchSettings();
  };

  useEffect(() => { fetchSettings(); }, []);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Navbar />
      <h1 className="text-2xl font-bold mb-4">API Group Management</h1>
      
      <section className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="font-bold text-blue-600 mb-4">Approved Official Groups</h2>
        <div className="flex flex-wrap gap-2">
          {officialGroups.map(group => (
            <span key={group} className="bg-blue-50 px-3 py-1 rounded-full border flex items-center gap-2">
              {group}
              <button onClick={() => saveGroups(officialGroups.filter(g => g !== group))} className="text-red-400">✕</button>
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}