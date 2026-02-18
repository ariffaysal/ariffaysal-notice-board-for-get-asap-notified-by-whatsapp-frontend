"use client";
import { useEffect, useState } from 'react';
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
  // Changed default to 'All Groups' to make it easier for the user
  const [selectedGroup, setSelectedGroup] = useState('All Groups'); 
  const [loading, setLoading] = useState(false);
  
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null); 
  const [replyTarget, setReplyTarget] = useState<Notice | null>(null);
  const [commonReply, setCommonReply] = useState('');

  // Added 'All Groups' to the array below
  const availableGroups = ['All Groups', '.Net Framework Project', 'Chemistry'];

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data); 
    } catch (err) { console.error("Fetch Error:", err); }
  };

  useEffect(() => {
    fetchNotices();
    const interval = setInterval(fetchNotices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/notices', { 
        title, 
        content, 
        category: 'General', 
        groupName: selectedGroup 
      });
      setTitle('');
      setContent('');
      fetchNotices();
    } catch (err) { alert("Failed to post notice."); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this notice?")) {
      try {
        await api.delete(`/notices/${id}`);
        fetchNotices();
      } catch (err) { alert("Delete failed."); }
    }
  };

  const handleDeleteAll = async () => {
    if (confirm("⚠️ ARE YOU SURE? This will permanently delete ALL notices from the database.")) {
      if (confirm("Final warning: This cannot be undone. Clear everything?")) {
        try {
          await api.delete('/notices/clear-all');
          setNotices([]); 
          alert("All notices cleared successfully.");
        } catch (err) { alert("Failed to clear notices."); }
      }
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
      fetchNotices();
    } catch (err) { alert("Reply failed."); }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen relative pb-20 text-black">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Public Notice Board</h1>

      {/* CREATE NOTICE SECTION */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow-sm p-6 rounded-2xl border mb-12">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Post New Announcement</h2>
        
   <div className="flex flex-col space-y-1">
  <label className="text-xs font-bold text-gray-500 ml-1">Target WhatsApp Group</label>
  <select 
    value={selectedGroup}
    onChange={(e) => setSelectedGroup(e.target.value)}
    className="w-full p-3 border rounded-xl bg-gray-50 text-black outline-none focus:ring-2 focus:ring-blue-500"
  >
    {availableGroups.map((group, index) => (
      <option key={`${group}-${index}`} value={group}>
        {group}
      </option>
    ))}
  </select>
</div>

        <input 
          type="text" placeholder="Notice Title" value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          required
        />
        <textarea 
          placeholder="Write details here..." value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border rounded-xl h-28 text-black outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          required
        />
        <button disabled={loading} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition">
          {loading ? 'Posting...' : 'Broadcast Notice'}
        </button>
      </form>

      <hr className="mb-10 border-gray-200" />

      {/* LIST HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
        {notices.length > 0 && (
          <button 
            onClick={handleDeleteAll} 
            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            Clear All Database
          </button>
        )}
      </div>

      {/* NOTICES LIST */}
      <div className="grid grid-cols-1 gap-4">
        {notices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed text-gray-400">
            No notices available.
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="p-5 bg-white border rounded-2xl shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{notice.name}</h3>
                    {notice.groupName && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100">
                        {notice.groupName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {new Date(notice.createdAt).toLocaleString()}
                  </span>
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

      {/* REPLY DOCK */}
      {replyTarget && (
        <div className="fixed bottom-10 right-10 w-80 bg-white shadow-2xl rounded-2xl border border-gray-200 z-50 animate-in slide-in-from-bottom">
          <div className="bg-green-600 p-4 flex justify-between items-center text-white">
            <div className="flex flex-col">
              <span className="text-[10px] opacity-80 uppercase font-bold">Replying to {replyTarget.groupName}</span>
              <span className="text-xs font-bold truncate">{replyTarget.name}</span>
            </div>
            <button onClick={() => setReplyTarget(null)}>✕</button>
          </div>
          <div className="p-4">
            <textarea value={commonReply} onChange={(e) => setCommonReply(e.target.value)} placeholder="Type WhatsApp reply..." className="w-full p-3 border rounded-xl text-sm h-32 resize-none bg-gray-50" autoFocus />
            <button onClick={handleSendReply} className="w-full mt-3 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition">
              Send to {replyTarget.groupName}
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
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
               <button onClick={() => { setSelectedNotice(null); setReplyTarget(selectedNotice); }} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md">Reply</button>
               <button onClick={() => setSelectedNotice(null)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}