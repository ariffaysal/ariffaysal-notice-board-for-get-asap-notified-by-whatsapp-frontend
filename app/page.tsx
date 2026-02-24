"use client";
import { useEffect, useState, useMemo } from 'react';
import api from './lib/axios';

interface Notice {
  id: number;
  name: string;
  message: string;
  category: string;
  groupName?: string;
  createdAt: string;
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All Groups');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [replyTarget, setReplyTarget] = useState<Notice | null>(null);
  const [commonReply, setCommonReply] = useState('');

  const [officialGroups, setOfficialGroups] = useState<string[]>([]);
  const [blockedGroups, setBlockedGroups] = useState<string[]>([]);
  const [searchId, setSearchId] = useState('');

  // 1. DATA FETCHING
  const fetchData = async () => {
    try {
      const [noticeRes, groupRes] = await Promise.all([
        api.get('/notices'),
        api.get('/notices/settings/groups')
      ]);
      
      setNotices(Array.isArray(noticeRes.data) ? noticeRes.data : []);

      if (groupRes.data) {
        // Fix: If backend sends "A, B" instead of ["A", "B"], we split it
        const raw = groupRes.data;
        const parsed = Array.isArray(raw) 
          ? raw 
          : typeof raw === 'string' 
            ? raw.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        setOfficialGroups(parsed);
      }
    } catch (err) { 
      console.error("Sync Error:", err); 
    }
  };

  useEffect(() => {
    const savedBlocked = localStorage.getItem('blockedGroups');
    if (savedBlocked) {
      try { setBlockedGroups(JSON.parse(savedBlocked)); } catch (e) { setBlockedGroups([]); }
    }
    setMounted(true);
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. SEARCH LOGIC
  const handleSearchById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) return;
    try {
      const res = await api.get(`/notices/${searchId}`);
      if (res.data) {
        setSelectedNotice(res.data);
        setSearchId('');
      }
    } catch (err) {
      alert(`Notice ID #${searchId} not found.`);
    }
  };

  // 3. COMPUTED LISTS (The Logic Engine)
  const availableGroups = useMemo(() => ['All Groups', ...officialGroups], [officialGroups]);

  const pendingGroups = useMemo(() => {
    const allDetected = notices
      .map(n => n.groupName?.trim())
      .filter((name): name is string => !!name && name !== 'All Groups');

    const uniqueDetected = Array.from(new Set(allDetected));
    const approvedLower = officialGroups.map(g => g.toLowerCase().trim());
    const blockedLower = blockedGroups.map(g => g.toLowerCase().trim());

    return uniqueDetected.filter(group => {
      const lower = group.toLowerCase();
      return !approvedLower.includes(lower) && !blockedLower.includes(lower);
    });
  }, [notices, officialGroups, blockedGroups]);

  const publicNotices = useMemo(() => {
    const approvedLower = officialGroups.map(g => g.toLowerCase().trim());
    return notices.filter(n => {
      if (!n.groupName || n.groupName === 'All Groups') return true;
      return approvedLower.includes(n.groupName.toLowerCase().trim());
    });
  }, [notices, officialGroups]);

  // 4. ACTIONS
  const handleApproveGroup = async (groupName: string) => {
    const updated = [...officialGroups, groupName];
    setOfficialGroups(updated);
    await api.post('/notices/settings/groups', { groups: updated });
    fetchData();
  };

  const handleRejectGroup = (groupName: string) => {
    if (confirm(`Hide messages from "${groupName}"?`)) {
      const updated = [...blockedGroups, groupName];
      setBlockedGroups(updated);
      localStorage.setItem('blockedGroups', JSON.stringify(updated));
    }
  };

  const handleRemoveGroup = async (groupName: string) => {
    if (confirm(`Remove "${groupName}" from official list?`)) {
      const updated = officialGroups.filter(g => g !== groupName);
      setOfficialGroups(updated);
      await api.post('/notices/settings/groups', { groups: updated });
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/notices', {
        title, content, category: 'General', groupName: selectedGroup
      });
      setTitle(''); setContent(''); fetchData();
    } catch (err) { alert("Post failed."); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this notice?")) {
      try { await api.delete(`/notices/${id}`); fetchData(); }
      catch (err) { alert("Delete failed."); }
    }
  };

  const handleSendReply = async () => {
    if (!commonReply || !replyTarget) return;
    try {
      await api.post('/notices', {
        title: "Admin Reply", content: commonReply, category: 'Reply', groupName: replyTarget.groupName
      });
      setCommonReply(''); setReplyTarget(null); fetchData();
    } catch (err) { alert("Reply failed."); }
  };

  if (!mounted) return null;

  return (
    <main className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen pb-20 text-black">
      {/* HEADER & DIAGNOSTICS */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Notice Control Center</h1>
        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          Live: {notices.length} Items
        </div>
      </div>

      {/* 🔔 NEW GROUPS BOX */}
      {pendingGroups.length > 0 && (
        <div className="mb-8 bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm animate-pulse">
          <h2 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">🔔 New WhatsApp Groups Detected</h2>
          <div className="flex flex-wrap gap-3">
            {pendingGroups.map(group => (
              <div key={group} className="flex items-center gap-1 bg-white border border-amber-300 rounded-xl p-1 pr-2 shadow-sm">
                <button onClick={() => handleApproveGroup(group)} className="px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-50 rounded-lg transition">Approve "{group}"</button>
                <div className="w-[1px] h-4 bg-amber-200"></div>
                <button onClick={() => handleRejectGroup(group)} className="px-3 py-1.5 text-xs font-bold text-red-500">Hide</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow-sm p-6 rounded-2xl border mb-12">
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-gray-400 ml-1">Send to Group</label>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
            {availableGroups.map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
        </div>
        <input type="text" placeholder="Subject" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" required />
        <textarea placeholder="Message Details..." value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-3 border rounded-xl h-24 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" required />
        <button disabled={loading} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md">
          {loading ? 'Sending...' : 'Post Notice'}
        </button>
      </form>

      {/* HISTORY LOOKUP */}
      <div className="mb-10 bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-700">Quick ID Lookup</h3>
          <p className="text-[10px] text-gray-400 uppercase">Search database by ID</p>
        </div>
        <form onSubmit={handleSearchById} className="flex gap-2">
          <input type="number" placeholder="ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} className="w-24 p-2 text-sm border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
          <button className="bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition">Find</button>
        </form>
      </div>

      {/* LIST */}
      <h2 className="text-xl font-bold text-gray-800 mb-6">Official Feed</h2>
      <div className="grid grid-cols-1 gap-4">
        {publicNotices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed text-gray-400">Waiting for notices...</div>
        ) : (
          publicNotices.map((notice) => (
            <div key={notice.id} className="p-5 bg-white border rounded-2xl shadow-sm border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-300">#{notice.id}</span>
                    <h3 className="font-bold text-gray-900">{notice.name}</h3>
                    {notice.groupName && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100 uppercase">
                        {notice.groupName}
                        <button onClick={() => handleRemoveGroup(notice.groupName!)} className="ml-2 hover:text-red-500">✕</button>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase">{new Date(notice.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setReplyTarget(notice)} className="text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100">Reply</button>
                  <button onClick={() => handleDelete(notice.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2">Delete</button>
                </div>
              </div>
              <p className="text-gray-700 text-sm italic">{notice.message || '(Empty)'}</p>
            </div>
          ))
        )}
      </div>

      {/* MODALS */}
      {replyTarget && (
        <div className="fixed bottom-6 right-6 w-80 bg-white shadow-2xl rounded-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="bg-green-600 p-4 flex justify-between items-center text-white">
            <span className="text-xs font-bold">Reply to {replyTarget.groupName}</span>
            <button onClick={() => setReplyTarget(null)}>✕</button>
          </div>
          <div className="p-4">
            <textarea value={commonReply} onChange={(e) => setCommonReply(e.target.value)} className="w-full p-3 border rounded-xl text-sm h-32 bg-gray-50 outline-none" placeholder="Type message..." autoFocus />
            <button onClick={handleSendReply} className="w-full mt-3 bg-green-600 text-white py-3 rounded-xl font-bold">Send to WhatsApp</button>
          </div>
        </div>
      )}

      {selectedNotice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Historical Record #{selectedNotice.id}</h2>
            <div className="bg-gray-50 p-4 rounded-xl border text-sm text-gray-700 mb-6">
              {selectedNotice.message}
            </div>
            <button onClick={() => setSelectedNotice(null)} className="w-full bg-gray-200 py-3 rounded-xl font-bold">Close</button>
          </div>
        </div>
      )}
    </main>
  );
}