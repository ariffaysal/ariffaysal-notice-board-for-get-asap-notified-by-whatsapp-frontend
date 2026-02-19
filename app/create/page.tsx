"use client";
import { useState, useEffect } from 'react';
import api from '../lib/axios';

import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';

export default function CreateNotice() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [groups, setGroups] = useState([]);
  const router = useRouter();

  useEffect(() => {
    api.get('/notices/settings/groups').then(res => setGroups(res.data));
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await api.post('/notices', { title, content, groupName: 'All Groups', approvedGroups: groups });
    router.push('/'); // Redirect back to board after SENDING
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Navbar />
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border shadow-lg">
        {/* Your Form Inputs Here */}
        <button className="bg-blue-600 text-white p-4 rounded-xl w-full font-bold">Broadcast via API</button>
      </form>
    </main>
  );
}