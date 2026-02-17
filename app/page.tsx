"use client";
import { useEffect, useState } from 'react';
import api from './lib/axios';

interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modals and Docks
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null); 
  const [replyTarget, setReplyTarget] = useState<Notice | null>(null);
  const [commonReply, setCommonReply] = useState('');

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data.sort((a: Notice, b: Notice) => b.id - a.id));
    } catch (err) { console.error("Fetch Error:", err); }
  };

  useEffect(() => {
    fetchNotices();
    const interval = setInterval(fetchNotices, 5000);
    return () => clearInterval(interval);
  }, []);

  // Public Notice Board Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/notices', { title, content, category: 'General' });
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

  // --- DELETE ALL FUNCTION ---
  const handleDeleteAll = async () => {
    const firstCheck = confirm("⚠️ ARE YOU SURE? This will permanently delete ALL notices from the browser and database.");
    if (firstCheck) {
      const secondCheck = confirm("Final warning: This action cannot be undone. Clear everything?");
      if (secondCheck) {
        try {
          // Ensure your backend has the @Delete('clear-all') route
          await api.delete('/notices/clear-all');
          setNotices([]); 
          alert("All notices cleared successfully.");
        } catch (err) {
          console.error("Delete All Error:", err);
          alert("Failed to clear notices. Make sure the backend route /notices/clear-all is ready.");
        }
      }
    }
  };

  const handleSendReply = async () => {
    if (!commonReply || !replyTarget) return;
    try {
      await api.post('/notices', { 
        title: "Admin Reply", 
        content: commonReply, 
        category: 'Reply' 
      });
      setCommonReply('');
      setReplyTarget(null);
      fetchNotices();
    } catch (err) { alert("Reply failed."); }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen relative pb-20 text-black">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Public Notice Board</h1>

      {/* CREATE NOTICE SECTION (Public Board) */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow-sm p-6 rounded-2xl border mb-12">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Post New Announcement</h2>
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
        <button 
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Posting...' : 'Broadcast Notice'}
        </button>
      </form>

      <hr className="mb-10 border-gray-200" />

      {/* NOTICES LIST HEADER WITH DELETE ALL */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
        {notices.length > 0 && (
          <button 
            onClick={handleDeleteAll}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            Clear All Notices
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed text-gray-400">
            No notices available. Start by broadcasting one above!
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="p-5 bg-white border rounded-2xl shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {new Date(notice.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                      onClick={() => setSelectedNotice(notice)} 
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium border hover:bg-gray-200"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => setReplyTarget(notice)} 
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 shadow-sm"
                  >
                    Reply
                  </button>
                  <button 
                      onClick={() => handleDelete(notice.id)} 
                      className="bg-white text-red-500 px-3 py-2 rounded-xl text-sm font-medium border border-red-100 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-gray-700 text-sm line-clamp-2 italic">"{notice.content}"</p>
            </div>
          ))
        )}
      </div>

      {/* FLOATING SIDE REPLY DOCK */}
      {replyTarget && (
        <div className="fixed bottom-10 right-10 w-80 bg-white shadow-2xl rounded-2xl border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-green-600 p-4 flex justify-between items-center text-white">
            <span className="text-xs font-bold uppercase truncate">Reply to: {replyTarget.title}</span>
            <button onClick={() => setReplyTarget(null)} className="hover:bg-green-700 p-1 rounded">✕</button>
          </div>
          <div className="p-4">
            <textarea 
              value={commonReply}
              onChange={(e) => setCommonReply(e.target.value)}
              placeholder="Type your WhatsApp reply..."
              className="w-full p-3 border rounded-xl text-black text-sm outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none bg-gray-50 shadow-inner"
              autoFocus
            />
            <button 
              onClick={handleSendReply}
              className="w-full mt-3 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg"
            >
              Send to WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 text-black">
              <h2 className="text-xl font-bold">{selectedNotice.title}</h2>
              <button onClick={() => setSelectedNotice(null)} className="text-gray-400 hover:text-black text-xl font-bold">✕</button>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl border mb-6 max-h-60 overflow-y-auto">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedNotice.content}</p>
            </div>
            <div className="flex gap-3">
               <button 
                  onClick={() => { setSelectedNotice(null); setReplyTarget(selectedNotice); }} 
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-md"
                >
                  Reply
                </button>
                <button onClick={() => setSelectedNotice(null)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300 transition">
                  Close
                </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}