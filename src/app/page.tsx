/* eslint-disable */
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-200">
      <div className="max-w-xl w-full bg-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 border-t-4 border-t-red-600">
        
        <div className="flex flex-col items-center mb-10">
          <div className="bg-black p-4 rounded-full mb-4 shadow-lg border border-slate-800">
            <Scissors className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1 tracking-tight">
            MAS MATRIX
          </h1>
          <h2 className="text-sm font-bold text-red-500 uppercase tracking-[0.2em] bg-red-950/30 border border-red-900/50 px-3 py-1 rounded-full mt-2">
            Sewing Department
          </h2>
        </div>
        
        <div className="flex flex-col gap-4 mb-10">
          <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            Select Your Module
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules && modules.length > 0 ? (
              modules.map((mod) => (
                <Link 
                  key={mod.id} 
                  href={`/mark/${mod.id}`}
                  className="group relative overflow-hidden bg-slate-950 p-5 border border-slate-800 rounded-xl hover:border-slate-500 hover:shadow-lg transition-all duration-300 flex flex-col justify-center"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-slate-900 rounded-bl-full -z-10 group-hover:bg-slate-800 transition-colors duration-300"></div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-lg text-slate-200 group-hover:text-white">{mod.name}</div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-green-400 relative z-10 transition-colors" />
                  </div>
                  {mod.responsible_leader && (
                    <div className="text-xs font-medium text-slate-500 bg-slate-900 px-2 py-1 rounded w-fit border border-slate-800">
                      {mod.responsible_leader}
                    </div>
                  )}
                </Link>
              ))
            ) : (
              <div className="col-span-full p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-dashed border-slate-800">
                No active modules available.
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between gap-4">
           <Link href="/status" className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md">
             <Activity className="w-4 h-4" />
             Daily Status
           </Link>
           <Link href="/admin" className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-300 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
             <ShieldCheck className="w-4 h-4" />
             Admin Login
           </Link>
        </div>
      </div>
    </div>
  );
}

