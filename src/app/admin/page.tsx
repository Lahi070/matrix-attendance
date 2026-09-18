/* eslint-disable */
import { supabase } from '@/lib/supabase';
import { Users, LayoutGrid, CheckSquare, Activity, UploadCloud, Percent } from 'lucide-react';
import ManualPercentageCard from './ManualPercentageCard';

export const revalidate = 0;

export default async function AdminDashboard() {
  const excludedRoles = ['DGM', 'AM', 'Executive', 'Senior Executive'];
  
  const { count: memberCount } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).not('role', 'in', '("DGM","AM","Executive","Senior Executive")');
  const { count: moduleCount } = await supabase.from('modules').select('*', { count: 'exact', head: true });
  const { count: activeModuleCount } = await supabase.from('modules').select('*', { count: 'exact', head: true }).eq('is_active', true);
  
  const today = new Date().toISOString().split('T')[0];
  const { data: attendanceData } = await supabase.from('attendance').select('status, category, reason_id, team_members(gender, role)').eq('date', today);
  
  const totalMarked = attendanceData?.length || 0;
  const totalAbsent = attendanceData?.filter(a => a.status === 'Absent' && a.category !== 'Maternity').length || 0;

  let maleAbsent = 0;
  let femaleAbsent = 0;
  const roleCounts: Record<string, number> = {};
  const informLeaveReasons: Record<string, number> = {};

  const { data: allMembers } = await supabase.from('team_members').select('role').not('role', 'in', '("DGM","AM","Executive","Senior Executive")');
  allMembers?.forEach(m => {
    roleCounts[m.role] = (roleCounts[m.role] || 0) + 1;
  });

  if (attendanceData) {
    attendanceData.filter(a => a.status === 'Absent').forEach(record => {
      const gender = (record.team_members as any)?.gender;
      
      // Exclude Maternity from total absence count
      if (record.category !== 'Maternity') {
        if (gender === 'Male') maleAbsent++;
        if (gender === 'Female') femaleAbsent++;
      }

      if (record.category === 'Inform leave' && record.reason_id) {
        informLeaveReasons[record.reason_id] = (informLeaveReasons[record.reason_id] || 0) + 1;
      }
    });
  }

  const { data: reasonsData } = await supabase.from('absence_reasons').select('id, reason_text').eq('category', 'Inform leave');
  const reasonMap: Record<string, string> = {};
  reasonsData?.forEach(r => {
    reasonMap[r.id] = r.reason_text;
  });

  return (
    <div className="space-y-8 font-sans pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Summary</h1>
          <p className="text-slate-400 font-medium mt-1">Matrix System Status</p>
        </div>
        <a href="/admin/upload" className="bg-indigo-600/20 border border-indigo-500/50 hover:bg-indigo-600/40 text-indigo-300 px-5 py-2.5 rounded-lg font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center gap-2 transition-all">
          <UploadCloud className="w-5 h-5" />
          Upload Cadre
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="col-span-1">
          <ManualPercentageCard dbTotal={memberCount || 0} totalAbsent={totalAbsent} />
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-700/50 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Members</p>
              <h3 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{memberCount || 0}</h3>
              <p className="text-cyan-500 text-xs font-medium mt-2 tracking-wide uppercase">MEMBERS</p>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-xl shadow-inner"><Users className="w-5 h-5 text-cyan-400" /></div>
          </div>
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-700/50 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Module Status</p>
              <h3 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">{activeModuleCount || 0} <span className="text-lg text-slate-500 font-bold">/ {moduleCount}</span></h3>
              <p className="text-purple-400 text-xs font-medium mt-2 tracking-wide uppercase">MODULES</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl shadow-inner"><LayoutGrid className="w-5 h-5 text-purple-400" /></div>
          </div>
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-700/50 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Marked Today</p>
              <h3 className="text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">{totalMarked}</h3>
              <p className="text-green-500 text-xs font-medium mt-2 tracking-wide uppercase">MARKED TODAY</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl shadow-inner"><CheckSquare className="w-5 h-5 text-green-400" /></div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles Summary */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-700/50 relative overflow-hidden group">
          <div className="absolute -left-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all pointer-events-none"></div>
          <h2 className="text-lg font-bold text-slate-200 mb-6 border-b border-slate-800 pb-3 relative z-10">
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

        {/* Absent Gender Summary */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-700/50 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition-all pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3 relative z-10">
            <h2 className="text-lg font-bold text-slate-200">Total Absentees</h2>
            <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="flex gap-4 h-36 relative z-10">
             <div className="flex-1 flex flex-col justify-center items-center bg-blue-900/10 border border-blue-500/20 rounded-2xl relative overflow-hidden group/card hover:border-blue-500/40 transition-all">
                <div className="absolute inset-0 bg-blue-500/5 group-hover/card:bg-blue-500/10 transition-colors"></div>
                <div className="text-4xl font-black text-blue-400 mb-1 relative z-10">{maleAbsent}</div>
                <div className="text-blue-500 font-bold text-[10px] uppercase tracking-widest relative z-10">Male</div>
             </div>
             <div className="flex-1 flex flex-col justify-center items-center bg-pink-900/10 border border-pink-500/20 rounded-2xl relative overflow-hidden group/card hover:border-pink-500/40 transition-all">
                <div className="absolute inset-0 bg-pink-500/5 group-hover/card:bg-pink-500/10 transition-colors"></div>
                <div className="text-4xl font-black text-pink-400 mb-1 relative z-10">{femaleAbsent}</div>
                <div className="text-pink-500 font-bold text-[10px] uppercase tracking-widest relative z-10">Female</div>
             </div>
          </div>
        </div>

        {/* Inform Leave Reasons */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-700/50">
          <h2 className="text-lg font-bold text-slate-200 mb-6 border-b border-slate-800 pb-3">Inform Leaves (Today)</h2>
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
            <div className="text-slate-500 text-center py-10 bg-[#1f2937]/20 rounded-xl border border-dashed border-slate-700/50 font-medium text-sm">
              No inform leaves recorded today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
