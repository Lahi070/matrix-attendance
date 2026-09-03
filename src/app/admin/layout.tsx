import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white">MAS Admin</h2>
          <p className="text-gray-400 text-sm mt-1">Sewing Dept</p>
        </div>
        <nav className="flex-1 px-4 flex flex-col gap-2">
          <Link href="/admin" className="p-3 rounded hover:bg-gray-800 transition">Dashboard</Link>
          <Link href="/admin/modules" className="p-3 rounded hover:bg-gray-800 transition">Manage Modules</Link>
          <Link href="/admin/members" className="p-3 rounded hover:bg-gray-800 transition">Manage Members</Link>
          <Link href="/admin/reasons" className="p-3 rounded hover:bg-gray-800 transition">Manage Reasons</Link>
          <Link href="/admin/reports" className="p-3 rounded hover:bg-gray-800 transition">Export Reports</Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">← Back to App</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
