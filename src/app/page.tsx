import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Scissors, ChevronRight, Activity, ShieldCheck } from 'lucide-react';

export const revalidate = 0; // Disable caching

export default async function Home() {
  const { data: modules, error } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-xl w-full bg-white p-8 sm:p-10 rounded-2xl shadow-2xl border-t-8 border-slate-900">
        
        <div className="flex flex-col items-center mb-10">
          <div className="bg-slate-900 p-4 rounded-full mb-4 shadow-lg shadow-slate-900/20">
            <Scissors className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
            MAS MATRIX
          </h1>
          <h2 className="text-sm font-bold text-red-600 uppercase tracking-[0.2em] bg-red-50 px-3 py-1 rounded-full">
            Sewing Department
          </h2>
        </div>
        
        <div className="flex flex-col gap-4 mb-10">
          <p className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Select Your Module
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules && modules.length > 0 ? (
              modules.map((mod) => (
                <Link 
                  key={mod.id} 
                  href={`/mark/${mod.id}`}
                  className="group relative overflow-hidden bg-white p-5 border-2 border-slate-100 rounded-xl hover:border-slate-900 hover:shadow-lg transition-all duration-300 flex flex-col justify-center"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full -z-10 group-hover:bg-slate-900 transition-colors duration-300"></div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-lg text-slate-800 group-hover:text-slate-900">{mod.name}</div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white relative z-10 transition-colors" />
                  </div>
                  {mod.responsible_leader && (
                    <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                      {mod.responsible_leader}
                    </div>
                  )}
                </Link>
              ))
            ) : (
              <div className="col-span-full p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                No active modules available.
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
           <Link href="/status" className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-md">
             <Activity className="w-4 h-4" />
             Daily Status
           </Link>
           <Link href="/admin" className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-400 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
             <ShieldCheck className="w-4 h-4" />
             Admin Login
           </Link>
        </div>
      </div>
    </div>
  );
}
