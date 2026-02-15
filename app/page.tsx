"use client";
import { useEffect, useState } from 'react';
import api from './lib/axios'; 

// 1. Updated Interface to match your NestJS Entity exactly
interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  createdAt: string; // TypeORM sends dates as strings in JSON
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch data from NestJS
  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch (err) {
      console.error("Connection Error:", err);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  //  Send data to NestJS
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    
    try {
      // Sending the object to the @Body() in NestJS
      await api.post('/notices', { 
        title, 
        content, 
        category: 'General' 
      });
      
      // Reset form on success
      setTitle('');
      setContent('');
      await fetchNotices(); // Refresh list to show the new item
    } catch (err: any) {
      console.error("POST Error:", err.response?.data || err.message);
      alert("Failed to post. Check if Backend is running and CORS is enabled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Notice Board</h1>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow p-6 rounded-lg border mb-10">
        <input 
          type="text"
          placeholder="Notice Title" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-black"
          required
        />
        <textarea 
          placeholder="Write your notice here..." 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded h-32 focus:ring-2 focus:ring-blue-500 outline-none text-black"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2 rounded font-bold text-white transition ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Posting...' : 'Post Notice'}
        </button>
      </form>

      {/* LIST */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <p className="text-center text-gray-500">No notices found.</p>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-gray-800">{notice.title}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {notice.category}
                </span>
              </div>
              <p className="text-gray-600 mt-2">{notice.content}</p>
              <p className="text-[10px] text-gray-400 mt-3">
                Posted on: {new Date(notice.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}