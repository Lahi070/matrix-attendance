/* eslint-disable */
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ChevronRight, Activity, Settings } from 'lucide-react';

export const revalidate = 0; // Disable caching

export default async function Home() {
  const { data: rawModules, error } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true);

  const modules = rawModules ? [...rawModules].sort((a, b) => {
    const matchA = a.name.match(/^(\d+)/);
    const matchB = b.name.match(/^(\d+)/);
    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(matchB[1], 10);
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    }
    if (matchA) return -1;
    if (matchB) return 1;
    return a.name.localeCompare(b.name);
  }) : [];

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('module_id, role');

  const excludedRoles = ['DGM', 'AM', 'Executive', 'Senior Executive'];
  
  const cadreCountByModule = (teamMembers || []).reduce((acc: Record<string, number>, member) => {
    if (member.module_id && !excludedRoles.includes(member.role || '')) {
      acc[member.module_id] = (acc[member.module_id] || 0) + 1;
    }
    return acc;
  }, {});

  if (modules) {
    const cuttingModule = modules.find(m => m.name?.toLowerCase().includes('cutting'));
    const layingModule = modules.find(m => m.name?.toLowerCase().includes('laying'));
    if (cuttingModule && layingModule) {
      const combined = (cadreCountByModule[cuttingModule.id] || 0) + (cadreCountByModule[layingModule.id] || 0);
      cadreCountByModule[cuttingModule.id] = combined;
      cadreCountByModule[layingModule.id] = combined;
    }

    const batchModule = modules.find(m => m.name?.toLowerCase().includes('batch'));
    const needleModule = modules.find(m => m.name?.toLowerCase().includes('needle'));
    if (batchModule && needleModule) {
      const combined = (cadreCountByModule[batchModule.id] || 0) + (cadreCountByModule[needleModule.id] || 0);
      cadreCountByModule[batchModule.id] = combined;
      cadreCountByModule[needleModule.id] = combined;
    }
  }

  // Fetch today's attendance to check which modules are marked
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('module_id')
    .eq('date', today);

  const markedModules = new Set((todayAttendance || []).map(a => a.module_id));

  // Count how many members are marked per module (attendance record count)
  const markedCountByModule: Record<string, number> = {};
  (todayAttendance || []).forEach(a => {
    if (a.module_id) markedCountByModule[a.module_id] = (markedCountByModule[a.module_id] || 0) + 1;
  });

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-sans text-slate-200 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: 'url("/bg-fingerprint.png")' }}
    >
      {/* Light dark overlay to slightly dim the image, without blurring it */}
      <div className="absolute inset-0 bg-[#070b14]/40"></div>

      {/* Ambient background blur */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-900/30 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* More transparent glass container */}
      <div className="max-w-7xl w-full bg-[#0a1120]/30 backdrop-blur-md p-8 sm:p-12 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-slate-600/30 border-t-4 border-t-cyan-500 relative z-10">
        
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6 flex items-center justify-center drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <img 
              src="/logo_transparent.png" 
              alt="Sewing Department Logo" 
              className="w-40 h-auto object-contain drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" 
            />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 tracking-tight text-center">
            MAS MATRIX
          </h1>
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-[0.3em] bg-cyan-900/30 border border-cyan-800/50 px-4 py-1.5 rounded-full mt-2 shadow-inner">
            Sewing Department
          </h2>
        </div>
        
        <div className="flex flex-col gap-4 mb-10">
          <p className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2 justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
            Select Your Module
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {modules && modules.length > 0 ? (
              modules
                .filter(mod => {
                  const n = mod.name?.toLowerCase() || '';
                  return !n.includes('laying') && !n.includes('needle');
                })
                .map((mod) => {
                const cadreCount = cadreCountByModule[mod.id] || 0;
                const markedCount = markedCountByModule[mod.id] || 0;
                const isComplete = markedCount >= cadreCount && cadreCount > 0;
                const isStarted = markedCount > 0;
                return (
                  <Link 
                    key={mod.id} 
                    href={`/mark/${mod.id}`}
                    className={`group relative overflow-hidden p-5 border rounded-2xl transition-all duration-300 flex flex-col justify-center ${
                      isComplete
                        ? 'bg-emerald-900/20 border-emerald-500/40 hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : isStarted
                          ? 'bg-yellow-900/10 border-yellow-500/30 hover:border-yellow-400/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]'
                          : 'bg-[#1f2937]/50 border-slate-700/50 hover:border-cyan-500/50 hover:bg-[#1f2937]/80 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    }`}
                  >
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-colors duration-300"></div>
                    
                    <div className="flex justify-between items-center mb-2 relative z-10">
                      <div className="font-bold text-lg text-slate-200 group-hover:text-cyan-400 transition-colors">{mod.name}</div>
                      <div className="flex items-center gap-2">
                        {/* Complete / Pending badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isComplete
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : isStarted
                              ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                              : 'bg-slate-700/40 border-slate-600/40 text-slate-400'
                        }`}>
                          {isComplete ? '✓ Complete' : isStarted ? '…In Progress' : '○ Pending'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 relative z-10 transition-colors transform group-hover:translate-x-1" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 relative z-10 flex-wrap">
                      {mod.responsible_leader && (
                        <div className="text-xs font-medium text-slate-400 bg-[#0f172a] px-3 py-1 rounded-lg w-fit border border-slate-700/50 shadow-inner">
                          {mod.responsible_leader}
                        </div>
                      )}
                      <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/40 border border-cyan-800/50 px-2 py-1 rounded-lg">
                        Cadre: {cadreCount}
                      </div>
                      {isStarted && (
                        <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                          isComplete ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-800/50' : 'text-yellow-300 bg-yellow-950/40 border border-yellow-800/50'
                        }`}>
                          {markedCount}/{cadreCount} marked
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full p-8 text-center text-slate-500 bg-[#1f2937]/30 rounded-2xl border border-dashed border-slate-700/50">
                No active modules available.
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between gap-4">
           <Link href="/status" className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]">
             <Activity className="w-5 h-5" />
             Daily Status
           </Link>
           <Link href="/admin" className="flex items-center justify-center gap-2 bg-[#1f2937]/80 border border-slate-700 hover:border-slate-500 text-slate-300 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:bg-[#1f2937]">
             <Settings className="w-5 h-5" />
             Admin Login
           </Link>
        </div>
      </div>
    </div>
  );
}

