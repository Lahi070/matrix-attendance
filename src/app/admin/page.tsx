import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export default async function AdminDashboard() {
  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch team members counts by role
  const { data: members } = await supabase.from('team_members').select('role');
  const roleCounts: Record<string, number> = {};
  members?.forEach(m => {
    roleCounts[m.role] = (roleCounts[m.role] || 0) + 1;
  });

  // 2. Fetch today's absent records
  const { data: absentRecords } = await supabase
    .from('attendance')
    .select(`
      member_id,
      category,
      reason_id,
      team_members ( gender )
    `)
    .eq('date', today)
    .eq('status', 'Absent');

  let maleAbsent = 0;
  let femaleAbsent = 0;
  const informLeaveReasons: Record<string, number> = {};

  if (absentRecords) {
    absentRecords.forEach(record => {
      // Gender count
      const gender = (record.team_members as any)?.gender;
      if (gender === 'Male') maleAbsent++;
      if (gender === 'Female') femaleAbsent++;

      // Inform leave reasons count
      if (record.category === 'Inform leave' && record.reason_id) {
        informLeaveReasons[record.reason_id] = (informLeaveReasons[record.reason_id] || 0) + 1;
      }
    });
  }

  // Fetch reason text for mapping
  const { data: reasonsData } = await supabase.from('absence_reasons').select('id, reason_text').eq('category', 'Inform leave');
  const reasonMap: Record<string, string> = {};
  reasonsData?.forEach(r => {
    reasonMap[r.id] = r.reason_text;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Summary</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Roles Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Staff Counts</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Team Leaders (Indirect)</span>
              <span className="font-bold">{roleCounts['Team Leader'] || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Group Leaders</span>
              <span className="font-bold">{roleCounts['Group Leader'] || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Menders</span>
              <span className="font-bold">{roleCounts['Mender'] || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Team Members</span>
              <span className="font-bold">{roleCounts['Team Member'] || 0}</span>
            </div>
          </div>
        </div>

        {/* Absent Gender Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Absent Today (By Gender)</h2>
          <div className="flex items-center justify-around h-32">
             <div className="text-center">
                <div className="text-4xl font-bold text-blue-500">{maleAbsent}</div>
                <div className="text-gray-500 text-sm mt-1">Male</div>
             </div>
             <div className="text-center">
                <div className="text-4xl font-bold text-pink-500">{femaleAbsent}</div>
                <div className="text-gray-500 text-sm mt-1">Female</div>
             </div>
          </div>
        </div>

        {/* Inform Leave Reasons Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Inform Leave Details (Today)</h2>
          {Object.keys(informLeaveReasons).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(informLeaveReasons).map(([reasonId, count]) => (
                <div key={reasonId} className="flex justify-between items-center">
                  <span className="text-gray-600">{reasonMap[reasonId] || 'Unknown'}</span>
                  <span className="bg-orange-100 text-orange-800 font-bold px-2 py-1 rounded text-sm">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No inform leaves today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
