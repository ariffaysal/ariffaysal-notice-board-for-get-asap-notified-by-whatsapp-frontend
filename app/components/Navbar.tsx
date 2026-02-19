import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b sticky top-0 z-10 p-4 shadow-sm mb-6">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <h1 className="font-bold text-xl text-blue-600">Notice System</h1>
        <div className="flex gap-6 font-semibold text-gray-600">
          <Link href="/" className="hover:text-blue-500 transition">📋 Board</Link>
          <Link href="/create" className="hover:text-blue-500 transition">📣 Broadcast</Link>
          <Link href="/settings" className="hover:text-blue-500 transition">⚙️ Settings</Link>
        </div>
      </div>
    </nav>
  );
}