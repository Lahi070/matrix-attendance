import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Activity, CheckCircle2, XCircle } from 'lucide-react';

export const revalidate = 0;

export default async function DailyStatus() {
  const { data: modules } = await supabase.from('modules').select('*').eq('is_active', true).order('name');
  
  const today = new Date().toISOString().split('T')[0];
  const { data: attendance } = await supabase.from('attendance').select('module_id').eq('date', today);

  // Group by module
  const markedModules = new Set(attendance?.map(a => a.module_id));

  const total = modules?.length || 0;
  const marked = markedModules.size;
  const pending = total - marked;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-slate-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-indigo-400" />
              Daily Status
            </h1>
            <p className="text-slate-400 font-medium mt-1 tracking-wide">
              {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
          <Link href="/" className="relative z-10 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>

        <div className="p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
             <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
               <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total</p>
               <h3 className="text-3xl font-black text-slate-800">{total}</h3>
             </div>
             <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
               <p className="text-sm font-bold text-green-600 uppercase tracking-wider mb-1">Completed</p>
               <h3 className="text-3xl font-black text-green-700">{marked}</h3>
             </div>
             <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
               <p className="text-sm font-bold text-red-600 uppercase tracking-wider mb-1">Pending</p>
               <h3 className="text-3xl font-black text-red-700">{pending}</h3>
             </div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Module Completion Status</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules?.map(mod => {
              const isMarked = markedModules.has(mod.id);
              return (
                <div key={mod.id} className={`p-4 rounded-xl border-2 flex items-center justify-between transition-colors ${
                  isMarked 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div>
                    <div className={`font-bold ${isMarked ? 'text-green-900' : 'text-red-900'}`}>{mod.name}</div>
                    <div className={`text-xs font-medium mt-0.5 ${isMarked ? 'text-green-600' : 'text-red-600'}`}>
                      {mod.responsible_leader || 'No Leader'}
                    </div>
                  </div>
                  {isMarked ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
