import { supabase } from '@/lib/supabase';
import { Users, LayoutGrid, CheckSquare, Activity } from 'lucide-react';

export const revalidate = 0;

export default async function AdminDashboard() {
  const { count: memberCount } = await supabase.from('team_members').select('*', { count: 'exact', head: true });
  const { count: moduleCount } = await supabase.from('modules').select('*', { count: 'exact', head: true });
  const { count: activeModuleCount } = await supabase.from('modules').select('*', { count: 'exact', head: true }).eq('is_active', true);
  
  const today = new Date().toISOString().split('T')[0];
  const { data: attendanceData } = await supabase.from('attendance').select('status, category, reason_id, team_members(gender, role)').eq('date', today);
  
  const totalMarked = attendanceData?.length || 0;
  const totalAbsent = attendanceData?.filter(a => a.status === 'Absent').length || 0;

  let maleAbsent = 0;
  let femaleAbsent = 0;
  const roleCounts: Record<string, number> = {};
  const informLeaveReasons: Record<string, number> = {};

  const { data: allMembers } = await supabase.from('team_members').select('role');
  allMembers?.forEach(m => {
    roleCounts[m.role] = (roleCounts[m.role] || 0) + 1;
  });

  if (attendanceData) {
    attendanceData.filter(a => a.status === 'Absent').forEach(record => {
      const gender = (record.team_members as any)?.gender;
      if (gender === 'Male') maleAbsent++;
      if (gender === 'Female') femaleAbsent++;

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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Summary</h1>
        <p className="text-slate-500 font-medium mt-1">Matrix Sewing Department System Status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-1">Total Members</p>
              <h3 className="text-4xl font-black">{memberCount || 0}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl"><Users className="w-6 h-6 text-white" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Active Modules</p>
              <h3 className="text-3xl font-black text-slate-800">{activeModuleCount || 0} <span className="text-lg text-slate-400 font-medium">/ {moduleCount}</span></h3>
            </div>
            <div className="bg-indigo-50 p-3 rounded-xl"><LayoutGrid className="w-6 h-6 text-indigo-600" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Marked Today</p>
              <h3 className="text-3xl font-black text-slate-800">{totalMarked}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-xl"><CheckSquare className="w-6 h-6 text-green-600" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Total Absentees</p>
              <h3 className="text-3xl font-black text-red-600">{totalAbsent}</h3>
            </div>
            <div className="bg-red-50 p-3 rounded-xl"><Activity className="w-6 h-6 text-red-600" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
            Staff Counts
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <span className="text-slate-600 font-medium">Indirect</span>
              <span className="font-bold text-slate-900 text-lg">{roleCounts['Indirect'] || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <span className="text-slate-600 font-medium">Team Leaders</span>
              <span className="font-bold text-slate-900 text-lg">{roleCounts['Team Leader'] || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <span className="text-slate-600 font-medium">Group Leaders</span>
              <span className="font-bold text-slate-900 text-lg">{roleCounts['Group Leader'] || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <span className="text-slate-600 font-medium">Menders</span>
              <span className="font-bold text-slate-900 text-lg">{roleCounts['Mender'] || 0}</span>
            </div>
          </div>
        </div>

        {/* Absent Gender Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Absent Today (Gender)</h2>
          <div className="flex items-center justify-around h-40">
             <div className="text-center bg-blue-50 p-6 rounded-2xl w-full mx-2 border border-blue-100">
                <div className="text-5xl font-black text-blue-600 mb-1">{maleAbsent}</div>
                <div className="text-blue-800 font-bold text-sm uppercase tracking-wider">Male</div>
             </div>
             <div className="text-center bg-pink-50 p-6 rounded-2xl w-full mx-2 border border-pink-100">
                <div className="text-5xl font-black text-pink-600 mb-1">{femaleAbsent}</div>
                <div className="text-pink-800 font-bold text-sm uppercase tracking-wider">Female</div>
             </div>
          </div>
        </div>

        {/* Inform Leave Reasons */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Inform Leave Reasons (Today)</h2>
          {Object.keys(informLeaveReasons).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(informLeaveReasons).map(([id, count]) => (
                <div key={id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:border-slate-300 transition-colors">
                  <span className="text-slate-700 font-medium">{reasonMap[id] || 'Unknown'}</span>
                  <span className="font-bold bg-slate-900 text-white px-3 py-1 rounded-full text-sm">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
              No inform leaves recorded today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

