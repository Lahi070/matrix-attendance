'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Grid, Settings, FileSpreadsheet, LogOut, Command, UserPlus } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const nav = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Modules', path: '/admin/modules', icon: Grid },
    { name: 'Members', path: '/admin/members', icon: Users },
    { name: 'Assign TL', path: '/admin/assign-tl', icon: UserPlus },
    { name: 'Reasons', path: '/admin/reasons', icon: Settings },
    { name: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="flex h-screen bg-[#070b14] font-sans text-slate-300 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#0a101d] border-r border-slate-800/60 flex flex-col relative z-20">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-cyan-500/20">
              <Command className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">MAS Matrix</h2>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">Matrix System</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 mt-8 space-y-2">
          {nav.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path} 
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-medium text-sm
                ${isActive ? 'bg-gradient-to-r from-blue-900/40 to-transparent text-white border border-blue-800/50 shadow-inner' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800/60 mt-auto">
          <Link href="/" className="flex items-center gap-4 px-4 py-3.5 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-xl transition-all font-medium text-sm">
            <LogOut className="w-5 h-5" />
            Exit Admin
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 relative">
        {/* Ambient Background Glows */}
        <div className="fixed top-[-10%] left-[20%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10 pb-10">
          {children}
        </div>
      </div>
    </div>
  );
}
