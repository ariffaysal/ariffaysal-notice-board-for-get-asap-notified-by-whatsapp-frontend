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

  // 1. INITIAL FETCH: Sync Notices and Approved Groups from DB
  const fetchData = async () => {
    try {
      const noticeRes = await api.get('/notices');
      setNotices(noticeRes.data); 

      const groupRes = await api.get('/notices/settings/groups');
      if (groupRes.data) {
        setOfficialGroups(groupRes.data);
      }
    } catch (err) { console.error("Sync Error:", err); }
  };

  useEffect(() => {
    // Load blocked groups from local storage (privacy stays local)
    const savedBlocked = localStorage.getItem('blockedGroups');
    if (savedBlocked) setBlockedGroups(JSON.parse(savedBlocked));

    setMounted(true);
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. DATABASE SYNC HELPER
  const syncGroupsToDB = async (updatedList: string[]) => {
    try {
      await api.post('/notices/settings/groups', { groups: updatedList });
    } catch (err) { console.error("DB Save Failed:", err); }
  };

  const availableGroups = useMemo(() => {
    return ['All Groups', ...officialGroups];
  }, [officialGroups]);

  const pendingGroups = useMemo(() => {
    const allDetected = notices
      .map(n => n.groupName)
      .filter((name): name is string => !!name && name !== 'All Groups');
    const uniqueDetected = Array.from(new Set(allDetected));
    
    return uniqueDetected.filter(group => 
      !officialGroups.includes(group) && !blockedGroups.includes(group)
    );
  }, [notices, officialGroups, blockedGroups]);

  const publicNotices = useMemo(() => {
    return notices.filter(n => !n.groupName || officialGroups.includes(n.groupName));
  }, [notices, officialGroups]);

  // --- ACTIONS ---

  const handleApproveGroup = async (groupName: string) => {
    const updated = [...officialGroups, groupName];
    setOfficialGroups(updated);
    await syncGroupsToDB(updated);
  };

  const handleRejectGroup = async (groupName: string) => {
    if (confirm(`Rejecting "${groupName}" will hide it and DELETE its history. Proceed?`)) {
      try {
        await api.delete(`/notices/group/${encodeURIComponent(groupName)}`);
        const updated = [...blockedGroups, groupName];
        setBlockedGroups(updated);
        localStorage.setItem('blockedGroups', JSON.stringify(updated));
        fetchData();
      } catch (err) { alert("Failed to clear group messages."); }
    }
  };
  
  const handleRemoveGroup = async (groupName: string) => {
    if (confirm(`Remove "${groupName}"? This will delete notices and remove it from menu.`)) {
      try {
        await api.delete(`/notices/group/${encodeURIComponent(groupName)}`);
        const updated = officialGroups.filter(g => g !== groupName);
        setOfficialGroups(updated);
        await syncGroupsToDB(updated);
        
        if (selectedGroup === groupName) setSelectedGroup('All Groups');
        fetchData();
      } catch (err) { alert("Failed to delete group notices."); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/notices', { 
        title, 
        content, 
        category: 'General', 
        groupName: selectedGroup,
        approvedGroups: officialGroups 
      });
      setTitle(''); 
      setContent(''); 
      fetchData();
    } catch (err) { alert("Failed to post notice."); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this notice?")) {
      try { await api.delete(`/notices/${id}`); fetchData(); }
      catch (err) { alert("Delete failed."); }
    }
  };

  const handleDeleteAll = async () => {
    if (confirm("⚠️ ARE YOU SURE? This will permanently delete ALL notices.")) {
      try { await api.delete('/notices/clear-all'); fetchData(); alert("All notices cleared."); }
      catch (err) { alert("Failed to clear notices."); }
    }
  };

  const handleSendReply = async () => {
    if (!commonReply || !replyTarget) return;
    try {
      await api.post('/notices', { 
        title: "Admin Reply", 
        content: commonReply, 
        category: 'Reply', 
        groupName: replyTarget.groupName 
      });
      setCommonReply(''); 
      setReplyTarget(null); 
      fetchData();
    } catch (err) { alert("Reply failed."); }
  };

  if (!mounted) return null;

  return (
    <main className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen relative pb-20 text-black">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Public Notice Board</h1>

      {/* MODERATION BOX */}
      {pendingGroups.length > 0 && (
        <div className="mb-8 bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
            🔔 New Groups Detected (Action Required)
          </h2>
          <div className="flex flex-wrap gap-3">
            {pendingGroups.map(group => (
              <div key={group} className="flex items-center gap-1 bg-white border border-amber-300 rounded-xl p-1 pr-2 shadow-sm">
                <button onClick={() => handleApproveGroup(group)} className="px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-50 rounded-lg transition">
                  Approve "{group}"
                </button>
                <div className="w-[1px] h-4 bg-amber-200"></div>
                <button onClick={() => handleRejectGroup(group)} className="px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-700 transition">
                  Reject
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow-sm p-6 rounded-2xl border mb-12">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Post New Announcement</h2>
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-gray-500 ml-1">Target WhatsApp Group</label>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 text-black outline-none focus:ring-2 focus:ring-blue-500">
            {availableGroups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
        <input type="text" placeholder="Notice Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" required />
        <textarea placeholder="Write details here..." value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-3 border rounded-xl h-28 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" required />
        <button disabled={loading} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition">
          {loading ? 'Posting...' : 'Broadcast Notice'}
        </button>
      </form>

      <hr className="mb-10 border-gray-200" />

      {/* LIST */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Official Activities</h2>
        {notices.length > 0 && (
          <button onClick={handleDeleteAll} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm">
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {publicNotices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed text-gray-400">
            No official notices yet. Approve a group above to start.
          </div>
        ) : (
          publicNotices.map((notice) => (
            <div key={notice.id} className="p-5 bg-white border rounded-2xl shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{notice.name}</h3>
                    {notice.groupName && (
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100 uppercase">
                          {notice.groupName}
                        </span>
                        <button onClick={() => handleRemoveGroup(notice.groupName!)} className="text-[10px] text-gray-300 hover:text-red-500">✕</button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(notice.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedNotice(notice)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium border hover:bg-gray-200">View</button>
                  <button onClick={() => setReplyTarget(notice)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700">Reply</button>
                  <button onClick={() => handleDelete(notice.id)} className="bg-white text-red-500 px-3 py-2 rounded-xl text-sm font-medium border border-red-100 hover:bg-red-50">Delete</button>
                </div>
              </div>
              <p className="text-gray-700 text-sm line-clamp-2 italic">"{notice.message}"</p>
            </div>
          ))
        )}
      </div>

      {/* OVERLAYS */}
      {replyTarget && (
        <div className="fixed bottom-10 right-10 w-80 bg-white shadow-2xl rounded-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="bg-green-600 p-4 flex justify-between items-center text-white">
            <div className="flex flex-col">
              <span className="text-[10px] opacity-80 uppercase font-bold">Replying to {replyTarget.groupName}</span>
              <span className="text-xs font-bold truncate">{replyTarget.name}</span>
            </div>
            <button onClick={() => setReplyTarget(null)}>✕</button>
          </div>
          <div className="p-4">
            <textarea value={commonReply} onChange={(e) => setCommonReply(e.target.value)} className="w-full p-3 border rounded-xl text-sm h-32 resize-none bg-gray-50 outline-none focus:ring-1 focus:ring-green-500" autoFocus />
            <button onClick={handleSendReply} className="w-full mt-3 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition">Send</button>
          </div>
        </div>
      )}

      {selectedNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">{selectedNotice.name}</h2>
              <button onClick={() => setSelectedNotice(null)} className="text-gray-400 hover:text-black text-xl font-bold">✕</button>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl border mb-6">
              <span className="text-[10px] text-blue-600 font-bold uppercase block mb-2">Group: {selectedNotice.groupName || 'General'}</span>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedNotice.message}</p>
            </div>
            <div className="flex gap-3">
               <button onClick={() => { setSelectedNotice(null); setReplyTarget(selectedNotice); }} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">Reply</button>
               <button onClick={() => setSelectedNotice(null)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}