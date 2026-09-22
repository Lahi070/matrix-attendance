/* eslint-disable */
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Activity, Users } from 'lucide-react';
import AbsenceBreakdownPanel from './AbsenceBreakdownPanel';
import WeeklyAbsenceChart from './WeeklyAbsenceChart';
import DailyAbsenceChart from './DailyAbsenceChart';

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
  
  // Calculate date 12 weeks ago
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  const twelveWeeksAgoStr = twelveWeeksAgo.toISOString().split('T')[0];

  // Fetch detailed attendance for today (for dashboard summary)
  const { data: attendance } = await supabase
    .from('attendance')
    .select('module_id, status, category, reason_id, team_members(gender, role)')
    .eq('date', today);

  // Build a moduleId → moduleName lookup from already-fetched modules data
  const moduleNameById: Record<string, string> = {};
  (rawModules || []).forEach(m => { moduleNameById[m.id] = m.name; });

  // Fetch historical attendance for the last 12 weeks (and all data for daily stats)
  const { data: historicalAttendance } = await supabase
    .from('attendance')
    .select('date, status')
    .limit(100000);

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

  // Process historical data for chart
  const weeklyDataMap = new Map<string, { total: number, absent: number }>();
  
  // Pre-fill the last 12 weeks to ensure graph has data points even if no attendance was marked
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const dateObj = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dateObj.getUTCDay() || 7;
    dateObj.setUTCDate(dateObj.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dateObj.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((dateObj.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    weeklyDataMap.set(`W${weekNo}`, { total: 0, absent: 0 });
  }

  // Process data for daily chart (Monday to Friday)
  const dailyData: { month: string, day: string, total: number, absent: number }[] = [];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  if (historicalAttendance) {
    historicalAttendance.forEach(record => {
      const dateObj = new Date(record.date);
      const dayName = daysOfWeek[dateObj.getDay()];
      const monthName = monthsOfYear[dateObj.getMonth()];
      
      if (dayName !== 'Sunday' && dayName !== 'Saturday') {
        dailyData.push({
          month: monthName,
          day: dayName,
          total: 1,
          absent: record.status === 'Absent' ? 1 : 0
        });
      }
      // ISO Week calculation
      const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      
      const weekLabel = `W${weekNo}`;
      
      if (!weeklyDataMap.has(weekLabel)) {
        weeklyDataMap.set(weekLabel, { total: 0, absent: 0 });
      }
      
      const weekStats = weeklyDataMap.get(weekLabel)!;
      weekStats.total += 1;
      if (record.status === 'Absent') {
        weekStats.absent += 1;
      }
    });
  }

  const weeklyChartData = Array.from(weeklyDataMap.entries())
    .map(([week, stats]) => ({
      week,
      percentage: stats.total > 0 ? Number(((stats.absent / stats.total) * 100).toFixed(1)) : 0
    }))
    // Sort by week number
    .sort((a, b) => {
      const wA = parseInt(a.week.replace('W', ''));
      const wB = parseInt(b.week.replace('W', ''));
      return wA - wB;
    });

  const roleCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {
    'Planning leave': 0,
    'Inform leave': 0,
    'Not inform': 0,
    'Dutypay': 0,
    'Half day': 0
  };
  const directCounts: Record<string, number> = { ...categoryCounts };
  const indirectCounts: Record<string, number> = { ...categoryCounts };

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

  // Roles that are always Indirect (supervisory/support staff)
  const indirectRoles = ['Team Leader', 'Group Leader', 'Mender'];
  // Modules that are Indirect (support departments)
  const indirectModuleKeywords = ['technical', 'office'];

  function isIndirect(moduleName: string, role: string | null | undefined): boolean {
    // Indirect by ROLE: Team Leaders, Group Leaders, Menders
    if (role && indirectRoles.some(ir => role.toLowerCase().includes(ir.toLowerCase()))) return true;
    // Indirect by MODULE: Technical, Office departments
    const lower = moduleName.toLowerCase();
    if (indirectModuleKeywords.some(kw => lower.includes(kw))) return true;
    // Everyone else (regular Team Members in Cutting, Batch, Training, Sewing lines) = Direct
    return false;
  }

  if (attendance) {
    attendance.filter(a => a.status === 'Absent').forEach(record => {
      const teamMember = record.team_members as any;
      const gender = teamMember?.gender;
      const role = teamMember?.role;
      // Use the pre-built lookup map — guaranteed to work without any join
      const moduleName: string = moduleNameById[record.module_id] || '';

      // Apply correct factory classification
      const isIndirectEmployee = isIndirect(moduleName, role);

      // Exclude Maternity from total absence count
      if (record.category !== 'Maternity') {
        if (gender === 'Male') maleAbsent++;
        if (gender === 'Female') femaleAbsent++;

        if (isIndirectEmployee) {
          indirectAbsent++;
        } else if (!role || !excludedRoles.includes(role)) {
          directAbsent++;
        }
      }

      if (record.category && record.category !== 'Maternity') {
        categoryCounts[record.category] = (categoryCounts[record.category] || 0) + 1;

        if (isIndirectEmployee) {
          indirectCounts[record.category] = (indirectCounts[record.category] || 0) + 1;
        } else if (!role || !excludedRoles.includes(role)) {
          directCounts[record.category] = (directCounts[record.category] || 0) + 1;
        }
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">          {/* Total Absentees Summary */}
          <div className="bg-[#111827]/40 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-slate-600/30 relative overflow-hidden group flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2 relative z-10">
              <h2 className="text-lg font-bold text-slate-200">Total Absentees</h2>
              <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div className="flex flex-grow relative z-10">
               <div className="flex-1 flex flex-col justify-center items-center bg-red-900/20 border border-red-500/30 rounded-xl py-3">
                  <div className="text-5xl font-black text-red-400 mb-1">{maleAbsent + femaleAbsent}</div>
                  <div className="text-red-500 font-bold text-[10px] uppercase tracking-widest mt-1">Total Absent</div>
               </div>
            </div>
          </div>

          <AbsenceBreakdownPanel 
            totalCounts={categoryCounts} 
            directCounts={directCounts} 
            indirectCounts={indirectCounts} 
          />
        </div>

        <WeeklyAbsenceChart data={weeklyChartData} />
        <DailyAbsenceChart data={dailyData} />

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
