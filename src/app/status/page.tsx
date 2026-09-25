/* eslint-disable */
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Activity, Users, LayoutGrid, CheckSquare } from 'lucide-react';
import AbsenceBreakdownPanel from './AbsenceBreakdownPanel';
import WeeklyAbsenceChart from './WeeklyAbsenceChart';
import DailyAbsenceChart from './DailyAbsenceChart';
import HistoricalModal from './HistoricalModal';
import Footer from '@/components/Footer';

export const revalidate = 0;

export default async function DailyStatus() {
  const { data: rawModules } = await supabase.from('modules').select('*').eq('is_active', true);
  const { count: totalModuleCount } = await supabase.from('modules').select('*', { count: 'exact', head: true });
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

  // Fetch db total cadre (excluding management)
  const { count: dbTotal } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .not('role', 'in', '("DGM","AM","Executive","Senior Executive")');

  // Fetch manual cadre from settings (if set, use it to calculate absence percentage)
  const { data: settings } = await supabase
    .from('system_settings')
    .select('manual_cadre')
    .eq('id', 1)
    .single();
  const manualCadre = settings?.manual_cadre || 0;

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
  
  // Calculate current week label
  const now = new Date();
  const dNow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNumNow = dNow.getUTCDay() || 7;
  dNow.setUTCDate(dNow.getUTCDate() + 4 - dayNumNow);
  const yearStartNow = new Date(Date.UTC(dNow.getUTCFullYear(),0,1));
  const currentWeekNo = Math.ceil((((dNow.getTime() - yearStartNow.getTime()) / 86400000) + 1)/7);
  const currentWeekLabel = `W${currentWeekNo}`;

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
    'Not inform leave': 0,
    'Dutypay': 0,
    'Half day': 0
  };
  const directCounts: Record<string, number> = { ...categoryCounts };
  const indirectCounts: Record<string, number> = { ...categoryCounts };
  const informLeaveReasons: Record<string, number> = {};

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

      if (record.category === 'Inform leave' && record.reason_id) {
        informLeaveReasons[record.reason_id] = (informLeaveReasons[record.reason_id] || 0) + 1;
      }

      if (record.category && record.category !== 'Maternity') {
        const cat = record.category.toLowerCase().includes('not inform') ? 'Not inform leave' : record.category;
        
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        if (isIndirectEmployee) {
          indirectCounts[cat] = (indirectCounts[cat] || 0) + 1;
        } else if (!role || !excludedRoles.includes(role)) {
          directCounts[cat] = (directCounts[cat] || 0) + 1;
        }
      }
    });
  }

  const { data: reasonsData } = await supabase.from('absence_reasons').select('id, reason_text').eq('category', 'Inform leave');
  const reasonMap: Record<string, string> = {};
  reasonsData?.forEach(r => {
    reasonMap[r.id] = r.reason_text;
  });

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

  // Count absences per module for today (exclude Maternity & non-Team Members like TL/GL)
  const rolesToExclude = ['Team Leader', 'Group Leader', 'Mender', 'DGM', 'AM', 'Executive', 'Senior Executive'];
  const absentCountByModule: Record<string, number> = {};
  if (attendance) {
    attendance
      .filter(a => {
        const tm = Array.isArray(a.team_members) ? a.team_members[0] : a.team_members;
        const role = (tm as any)?.role;
        return a.status === 'Absent' 
          && a.category !== 'Maternity'
          && (!role || !rolesToExclude.includes(role));
      })
      .forEach(record => {
        const mid = record.module_id;
        if (mid) absentCountByModule[mid] = (absentCountByModule[mid] || 0) + 1;
      });
  }

  // Find module with highest absence
  let highestAbsenceModule = { name: 'N/A', count: 0, percentage: 0 };
  Object.entries(absentCountByModule).forEach(([moduleId, count]) => {
    const cadre = cadreCountByModule[moduleId] || 0;
    const pct = cadre > 0 ? (count / cadre) * 100 : 0;
    if (count > highestAbsenceModule.count) {
      highestAbsenceModule = {
        name: moduleNameById[moduleId] || 'Unknown',
        count,
        percentage: pct,
      };
    }
  });

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
            <HistoricalModal 
              dbTotal={dbTotal || 0} 
              manualCadre={manualCadre} 
              moduleNameById={moduleNameById} 
            />
            <Link href="/" className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 hover:border-slate-500 text-slate-300 px-5 py-2.5 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-lg">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Total Absentees Summary */}
          <div className="bg-[#111827]/40 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-slate-600/30 relative overflow-hidden group flex flex-col">
            <div className="flex justify-between items-center mb-5 border-b border-slate-700 pb-3 relative z-10">
              <h2 className="text-lg font-bold text-slate-200">Total Absentees</h2>
              <div className="bg-slate-800/50 border border-slate-700/50 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            
            {(() => {
              const activeTotalForAbsence = manualCadre > 0 ? manualCadre : dbTotal || 0;
              const totalAbs = maleAbsent + femaleAbsent;
              const absencePercentage = activeTotalForAbsence > 0 ? (totalAbs / activeTotalForAbsence) * 100 : 0;
              const isHigh = absencePercentage > 5.6;
              const colorBg = isHigh ? 'bg-red-900/20' : 'bg-emerald-900/20';
              const colorBorder = isHigh ? 'border-red-500/30' : 'border-emerald-500/30';
              const colorText = isHigh ? 'text-red-400' : 'text-emerald-400';
              const colorLabel = isHigh ? 'text-red-500' : 'text-emerald-500';
              
              return (
                <div className="flex flex-grow relative z-10 gap-4">
                   <div className={`flex-1 flex flex-col justify-center items-center ${colorBg} border ${colorBorder} rounded-xl py-8 px-2 transition-colors`}>
                      <div className={`text-6xl sm:text-7xl font-black ${colorText} mb-2 text-center`}>{totalAbs}</div>
                      <div className={`${colorLabel} font-bold text-[10px] sm:text-xs uppercase tracking-widest text-center`}>Total Absent</div>
                   </div>
                   
                   {/* Absence Percentage Section */}
                   <div className={`flex-1 flex flex-col justify-center items-center ${colorBg} border ${colorBorder} rounded-xl py-8 px-2 transition-colors`}>
                      <div className={`text-6xl sm:text-7xl font-black ${colorText} mb-2 text-center drop-shadow-sm`}>
                        {absencePercentage.toFixed(1)}%
                      </div>
                      <div className={`${colorLabel} font-bold text-[10px] sm:text-xs uppercase tracking-widest text-center`}>Absence %</div>
                   </div>
                </div>
              );
            })()}
          </div>

          <AbsenceBreakdownPanel 
            totalCounts={categoryCounts} 
            directCounts={directCounts} 
            indirectCounts={indirectCounts} 
          />
        </div>

        {/* Highest Absence & Inform Leaves Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            {highestAbsenceModule.count > 0 && (
              <div className="bg-[#111827]/40 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-orange-500/40 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-5 relative z-10">
                  {/* Warning Icon */}
                  <div className="bg-orange-500/15 border border-orange-500/30 p-4 rounded-2xl shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-1">⚠ Highest Absence Module Today</p>
                    <p className="text-2xl font-black text-white leading-tight">{highestAbsenceModule.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-orange-300 font-bold text-sm">{highestAbsenceModule.count} Team Members absent</span>
                      {highestAbsenceModule.percentage > 0 && (
                        <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                          {highestAbsenceModule.percentage.toFixed(1)}% of cadre
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Big Number */}
                  <div className="text-right shrink-0 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-6 py-3">
                    <div className="text-5xl font-black text-orange-400 leading-none">{highestAbsenceModule.count}</div>
                    <div className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mt-1">Absent</div>
                  </div>
                </div>
              </div>
            )}

            {/* Small Summary Cards Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111827]/40 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-lg border border-slate-700/50 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Module Status</p>
                    <h3 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                      {modules.length} <span className="text-sm text-slate-500 font-bold">/ {totalModuleCount || 0}</span>
                    </h3>
                    <p className="text-purple-400 text-[9px] font-bold mt-1 tracking-wider uppercase">MODULES</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded-xl shadow-inner">
                    <LayoutGrid className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-[#111827]/40 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-lg border border-slate-700/50 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Marked Today</p>
                    <h3 className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                      {attendance?.length || 0}
                    </h3>
                    <p className="text-green-500 text-[9px] font-bold mt-1 tracking-wider uppercase">MARKED TODAY</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 p-2 rounded-xl shadow-inner">
                    <CheckSquare className="w-4 h-4 text-green-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inform Leave Reasons */}
          <div className="bg-[#111827]/40 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-slate-700/50 h-full">
            <h2 className="text-lg font-bold text-slate-200 mb-5 border-b border-slate-800/80 pb-3">Inform Leaves (Today)</h2>
            {Object.keys(informLeaveReasons).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(informLeaveReasons).map(([id, count]) => (
                  <div key={id} className="flex justify-between items-center p-3 bg-[#1f2937]/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
                    <span className="text-slate-300 font-medium text-sm">{reasonMap[id] || 'Unknown'}</span>
                    <span className="font-bold bg-slate-800/80 border border-cyan-500/30 text-cyan-400 px-3 py-1 rounded-full text-xs shadow-[0_0_10px_rgba(6,182,212,0.1)]">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-center py-8 bg-[#1f2937]/20 rounded-xl border border-dashed border-slate-700/50 font-medium text-sm">
                No inform leaves recorded today.
              </div>
            )}
          </div>
        </div>

        <WeeklyAbsenceChart data={weeklyChartData} currentWeek={currentWeekLabel} />
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
            const absentCount = absentCountByModule[mod.id] || 0;
            const isHighest = mod.name === highestAbsenceModule.name && highestAbsenceModule.count > 0;
            
            return (
              <div key={mod.id} className={`p-4 rounded-xl border backdrop-blur-md relative overflow-hidden transition-all hover:scale-105 ${
                isHighest
                  ? 'bg-orange-900/20 border-orange-500/50 shadow-[0_0_14px_rgba(249,115,22,0.25)]'
                  : isMarked 
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
                    {absentCount > 0 && (
                      <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded-full ${isHighest ? 'bg-orange-500/20 text-orange-300' : 'bg-red-500/20 text-red-300'}`}>
                        -{absentCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    <span className={`${isMarked ? 'text-emerald-400' : 'text-pink-400'}`}>{isMarked ? '✓ Completed' : '○ Pending'}</span>
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
      <Footer />
    </div>
  );
}
