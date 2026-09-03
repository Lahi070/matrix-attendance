import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 0;

export default async function StatusPage() {
  const today = new Date().toISOString().split('T')[0];

  // Fetch all active modules
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('name');

  // Fetch today's attendance records
  const { data: attendance } = await supabase
    .from('attendance')
    .select('module_id, category, status')
    .eq('date', today);

  const attendanceRecords = attendance || [];
  
  // Calculate module status (if there's any record for a module today, consider it marked)
  const markedModuleIds = new Set(attendanceRecords.map(r => r.module_id));

  // Calculate totals
  const totals = {
    'Planning leave': 0,
    'Inform leave': 0,
    'Not inform leave': 0,
    'Dutypay': 0,
    'Half day': 0,
  };

  attendanceRecords.forEach(record => {
    if (record.status === 'Absent' && record.category) {
      if (totals[record.category as keyof typeof totals] !== undefined) {
        totals[record.category as keyof typeof totals]++;
      }
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-blue-800 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Daily Status Report</h1>
            <p className="opacity-80">Date: {new Date().toLocaleDateString()}</p>
          </div>
          <Link href="/" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition-colors text-sm font-medium">
            Home
          </Link>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Module Marking Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules?.map(mod => {
                const isMarked = markedModuleIds.has(mod.id);
                return (
                  <div key={mod.id} className={`p-4 rounded-lg border flex justify-between items-center ${isMarked ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div>
                      <h3 className="font-bold text-gray-800">{mod.name}</h3>
                      <p className="text-sm text-gray-600">Leader: {mod.responsible_leader || 'N/A'}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${isMarked ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {isMarked ? 'Completed' : 'Not Marked'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Overall Daily Totals</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(totals).map(([category, count]) => (
                <div key={category} className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{count}</div>
                  <div className="text-sm font-medium text-gray-600 leading-tight">{category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
