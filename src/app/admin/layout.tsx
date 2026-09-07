'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Grid, Settings, FileSpreadsheet, LogOut, Scissors } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const nav = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Modules', path: '/admin/modules', icon: Grid },
    { name: 'Members', path: '/admin/members', icon: Users },
    { name: 'Reasons', path: '/admin/reasons', icon: Settings },
    { name: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-10 relative">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-2 rounded-lg">
              <Scissors className="w-6 h-6 text-slate-900" />
            </div>
            <h2 className="text-xl font-black tracking-tight">MAS Admin</h2>
          </div>
          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-8">Matrix System</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {nav.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path} 
                className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-sm
                ${isActive ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : ''}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium text-sm">
            <LogOut className="w-5 h-5" />
            Exit Admin
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
