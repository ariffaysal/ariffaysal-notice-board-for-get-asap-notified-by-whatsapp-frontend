'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function NoticeDetails() {
  const { id } = useParams(); // Grabs the '1' from /notices/1
  const [notice, setNotice] = useState<any>(null);

  useEffect(() => {
    // Fetch specifically from your new GET :id API
    fetch(`http://localhost:3001/notices/${id}`)
      .then((res) => res.json())
      .then((data) => setNotice(data));
  }, [id]);

  if (!notice) return <p>Loading...</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{notice.name}</h1>
      <p className="text-gray-500">Group: {notice.groupName}</p>
      <hr className="my-4" />
      <div className="bg-gray-100 p-4 rounded">
        <pre className="whitespace-pre-wrap">{notice.message}</pre>
      </div>
      <p className="mt-4 text-xs">Sent on: {new Date(notice.createdAt).toLocaleString()}</p>
    </div>
  );
}