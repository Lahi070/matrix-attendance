/* eslint-disable */
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Activity, Users } from 'lucide-react';

export const revalidate = 0;

export default async function DailyStatus() {
  const { data: rawModules } = await supabase.from('modules').select('*').eq('is_active', true);
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
  
  const today = new Date().toISOString().split('T')[0];
  // Fetch detailed attendance for both module marking status and dashboard summary
  const { data: attendance } = await supabase
    .from('attendance')
    .select('module_id, status, category, reason_id, team_members(gender, role)')
    .eq('date', today);

  // Get Team Leaders for each module
  const { data: teamLeaders } = await supabase
    .from('team_members')
    .select('name, module_id')
    .eq('role', 'Team Leader');
  
  const leaderMap: Record<string, string> = {};
  teamLeaders?.forEach(tl => {
    if (leaderMap[tl.module_id]) {
      leaderMap[tl.module_id] += `, ${tl.name}`;
    } else {
      leaderMap[tl.module_id] = tl.name;
    }
  });

  // Group by module for marking status
  const markedModules = new Set(attendance?.map(a => a.module_id));

  const total = modules?.length || 0;
  const marked = markedModules.size;
  const pending = total - marked;

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('module_id, role');

  const excludedRoles = ['DGM', 'AM', 'Executive', 'Senior Executive'];
  
  // Dashboard Summary Data Processing
  let maleAbsent = 0;
  let femaleAbsent = 0;
  let directAbsent = 0;
  let indirectAbsent = 0;

  const roleCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {
    'Planning leave': 0,
    'Inform leave': 0,
    'Not inform': 0,
    'Dutypay': 0,
    'Half day': 0
  };

  const cadreCountByModule = (teamMembers || []).reduce((acc: Record<string, number>, member) => {
    if (!excludedRoles.includes(member.role || '')) {
      // Role counts for summary
      roleCounts[member.role] = (roleCounts[member.role] || 0) + 1;
      
      // Cadre counts by module
      if (member.module_id) {
        acc[member.module_id] = (acc[member.module_id] || 0) + 1;
      }
    }
    return acc;
  }, {});

  if (attendance) {
    attendance.filter(a => a.status === 'Absent').forEach(record => {
      const teamMember = record.team_members as any;
      const gender = teamMember?.gender;
      const role = teamMember?.role;
      
      // Exclude Maternity from total absence count
      if (record.category !== 'Maternity') {
        if (gender === 'Male') maleAbsent++;
        if (gender === 'Female') femaleAbsent++;
        
        if (role === 'Indirect') {
          indirectAbsent++;
        } else if (role && !excludedRoles.includes(role)) {
          directAbsent++;
        }
      }

      if (record.category && record.category !== 'Maternity') {
        categoryCounts[record.category] = (categoryCounts[record.category] || 0) + 1;
      }
    });
  }


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

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-8 font-sans text-slate-200 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: 'url("/bg-fingerprint.png")' }}
    >
      {/* Light dark overlay to ensure text readability */}
      <div className="absolute inset-0 bg-[#070b14]/40"></div>

      {/* Ambient background blur */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl w-full relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
              Daily Status
            </h1>
            <p className="text-slate-400 font-medium tracking-wide">
              {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 hover:border-slate-500 text-slate-300 px-5 py-2.5 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-lg">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Roles Summary */}
          <div className="bg-[#111827]/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-600/30 relative overflow-hidden group">
            <h2 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700 pb-3 relative z-10 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Staff Counts
            </h2>
            <div className="space-y-3 relative z-10">
              {[
                { label: 'Indirect', count: roleCounts['Indirect'] || 0, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                { label: 'Team Leaders', count: roleCounts['Team Leader'] || 0, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                { label: 'Group Leaders', count: roleCounts['Group Leader'] || 0, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
                { label: 'Menders', count: roleCounts['Mender'] || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center ${item.bg} border ${item.border} p-3 rounded-xl transition-all hover:brightness-110`}>
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <span className={`font-bold text-lg ${item.color}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Absentees Summary */}
          <div className="bg-[#111827]/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-600/30 relative overflow-hidden group flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3 relative z-10">
              <h2 className="text-lg font-bold text-slate-200">Total Absentees</h2>
              <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div className="flex gap-4 mb-4 relative z-10">
               <div className="flex-1 flex flex-col justify-center items-center bg-red-900/20 border border-red-500/30 rounded-2xl py-4">
                  <div className="text-5xl font-black text-red-400 mb-1">{maleAbsent + femaleAbsent}</div>
                  <div className="text-red-500 font-bold text-[10px] uppercase tracking-widest mt-1">Total Absent</div>
               </div>
            </div>
            
            <div className="space-y-2 relative z-10 mt-auto">
              <div className="flex justify-between items-center bg-slate-800/50 border border-slate-600/30 p-2.5 rounded-xl hover:bg-slate-700/50 transition-colors">
                <span className="font-medium text-sm text-indigo-400 truncate pr-2">Direct</span>
                <span className="font-bold px-3 py-1 rounded-lg text-sm bg-indigo-500/20 text-indigo-300">{directAbsent}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 border border-slate-600/30 p-2.5 rounded-xl hover:bg-slate-700/50 transition-colors">
                <span className="font-medium text-sm text-cyan-400 truncate pr-2">Indirect</span>
                <span className="font-bold px-3 py-1 rounded-lg text-sm bg-cyan-500/20 text-cyan-300">{indirectAbsent}</span>
              </div>
            </div>
          </div>
          
          {/* Absence Categories Summary */}
          <div className="bg-[#111827]/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-600/30 relative overflow-hidden group flex flex-col">
            <h2 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700 pb-3 relative z-10 flex-shrink-0">
              Absence Breakdown
            </h2>
            <div className="space-y-2 relative z-10 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {Object.entries(categoryCounts)
                .map(([category, count]) => {
                let colorClass = "text-slate-300";
                let bgClass = "bg-slate-700";
                
                if (category === 'Not inform') {
                  colorClass = "text-red-400";
                  bgClass = "bg-red-500/20 text-red-300";
                } else if (category === 'Inform leave' || category === 'Planning leave') {
                  colorClass = "text-blue-400";
                  bgClass = "bg-blue-500/20 text-blue-300";
                } else if (category === 'Dutypay') {
                  colorClass = "text-emerald-400";
                  bgClass = "bg-emerald-500/20 text-emerald-300";
                } else if (category === 'Half day') {
                  colorClass = "text-amber-400";
                  bgClass = "bg-amber-500/20 text-amber-300";
                }

                return (
                  <div key={category} className="flex justify-between items-center bg-slate-800/50 border border-slate-600/30 p-2.5 rounded-xl hover:bg-slate-700/50 transition-colors">
                    <span className={`font-medium text-sm truncate pr-2 ${colorClass}`} title={category}>
                      {category}
                    </span>
                    <span className={`font-bold px-3 py-1 rounded-lg text-sm ${bgClass}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#111827]/40 backdrop-blur-xl p-6 rounded-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative overflow-hidden group hover:border-blue-500/50 transition-all text-center">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
              <p className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 relative z-10">Total Modules</p>
              <h3 className="text-5xl font-black text-blue-400 relative z-10">{total}</h3>
            </div>
            
            <div className="bg-[#111827]/40 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden group hover:border-emerald-500/50 transition-all text-center">
              <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Completed</p>
                <div className="bg-emerald-500/20 rounded-full p-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
              </div>
              <h3 className="text-5xl font-black text-emerald-400 relative z-10">{marked}</h3>
            </div>

            <div className="bg-[#111827]/40 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)] relative overflow-hidden group hover:border-pink-500/50 transition-all text-center">
              <div className="absolute inset-0 bg-pink-500/5 group-hover:bg-pink-500/10 transition-colors"></div>
              <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Pending</p>
                <div className="bg-pink-500/20 rounded-full p-1"><XCircle className="w-4 h-4 text-pink-400" /></div>
              </div>
              <h3 className="text-5xl font-black text-pink-400 relative z-10">{pending}</h3>
            </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
          Module Details
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {modules
            ?.filter(mod => {
              const n = mod.name?.toLowerCase() || '';
              return !n.includes('laying') && !n.includes('needle');
            })
            .map((mod) => {
            const isMarked = markedModules.has(mod.id);
            const leaderName = leaderMap[mod.id] || mod.responsible_leader || 'No Leader';
            const cadreCount = cadreCountByModule[mod.id] || 0;
            
            return (
              <div key={mod.id} className={`p-4 rounded-xl border backdrop-blur-md relative overflow-hidden transition-all hover:scale-105 ${
                isMarked 
                  ? 'bg-emerald-900/20 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                  : 'bg-pink-900/10 border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.1)]'
              }`}>
                <div className="relative z-10">
                  <div className="font-bold text-base text-white mb-1 truncate" title={mod.name}>{mod.name}</div>
                  <div className="text-[11px] text-slate-300 mb-1 flex items-center justify-between">
                    <span>TL: <span className="font-medium text-white truncate max-w-[60px] inline-block align-bottom" title={leaderName}>{leaderName}</span></span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center justify-between mb-1">
                    <span>Cadre: <span className="font-medium text-white">{cadreCount}</span></span>
                  </div>
                  <div className="text-[11px] font-bold">
                    <span className={`${isMarked ? 'text-emerald-400' : 'text-pink-400'}`}>{isMarked ? 'Completed' : 'Pending'}</span>
                  </div>
                </div>
                
                {/* Big faint icon in background */}
                <div className="absolute -right-3 -bottom-3 opacity-10 pointer-events-none">
                  {isMarked ? (
                    <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                  ) : (
                    <XCircle className="w-16 h-16 text-pink-400" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
