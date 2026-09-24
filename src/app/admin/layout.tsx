'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Grid, Settings, FileSpreadsheet, LogOut, Command, UserPlus, Lock, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

const ADMIN_PASSWORD = 'admin123#';
const SESSION_KEY = 'admin_auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === 'true') setIsAuthed(true);
    setChecking(false);
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsAuthed(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthed(false);
  };

  const nav = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Modules', path: '/admin/modules', icon: Grid },
    { name: 'Members', path: '/admin/members', icon: Users },
    { name: 'Assign TL', path: '/admin/assign-tl', icon: UserPlus },
    { name: 'Reasons', path: '/admin/reasons', icon: Settings },
    { name: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
  ];

  if (checking) return null;

  if (!isAuthed) {
    return (
      <div className="flex h-screen bg-[#070b14] font-sans items-center justify-center">
        <div className="absolute top-0 left-0 w-full h-full bg-blue-900/5 pointer-events-none" />
        <div className="w-full max-w-sm mx-4">
          <div className="bg-[#0a101d] border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-4 rounded-2xl shadow-lg shadow-cyan-500/20">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-1">Admin Access</h1>
            <p className="text-slate-400 text-sm text-center mb-6">Enter password to continue</p>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Password"
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors pr-10 text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-xs text-center">{error}</p>
              )}

              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
              >
                Enter Admin
              </button>

              <Link href="/" className="block text-center text-slate-500 hover:text-slate-300 text-xs transition-colors mt-2">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        
        <div className="p-4 border-t border-slate-800/60 mt-auto space-y-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 text-slate-400 hover:bg-red-900/30 hover:text-red-300 rounded-xl transition-all font-medium text-sm w-full"
          >
            <Lock className="w-5 h-5" />
            Lock Admin
          </button>
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
