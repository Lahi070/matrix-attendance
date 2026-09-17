/* eslint-disable */
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Scissors, ChevronRight, Activity, Settings } from 'lucide-react';

export const revalidate = 0; // Disable caching

export default async function Home() {
  const { data: modules, error } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('name');

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('module_id, role');

  const excludedRoles = ['DGM', 'AM', 'Executive', 'Senior Executive'];
  
  const cadreCountByModule = (teamMembers || []).reduce((acc: Record<string, number>, member) => {
    if (member.module_id && !excludedRoles.includes(member.role || '')) {
      acc[member.module_id] = (acc[member.module_id] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 font-sans text-slate-200 relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-xl w-full bg-[#111827]/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-700/50 border-t-4 border-t-cyan-500 relative z-10">
        
        <div className="flex flex-col items-center mb-10">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-5 rounded-2xl mb-6 shadow-lg shadow-cyan-500/20">
            <Scissors className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 tracking-tight text-center">
            MAS MATRIX
          </h1>
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-[0.3em] bg-cyan-900/30 border border-cyan-800/50 px-4 py-1.5 rounded-full mt-2 shadow-inner">
            Sewing Department
          </h2>
        </div>
        
        <div className="flex flex-col gap-4 mb-10">
          <p className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2 justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
            Select Your Module
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules && modules.length > 0 ? (
              modules.map((mod, index) => {
                const cadreCount = cadreCountByModule[mod.id] || 0;
                return (
                  <Link 
                    key={mod.id} 
                    href={`/mark/${mod.id}`}
                    className="group relative overflow-hidden bg-[#1f2937]/50 p-5 border border-slate-700/50 rounded-2xl hover:border-cyan-500/50 hover:bg-[#1f2937] hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 flex flex-col justify-center"
                  >
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-colors duration-300"></div>
                    
                    <div className="flex justify-between items-center mb-2 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-500 font-bold opacity-70 text-sm">#{index + 1}</span>
                        <div className="font-bold text-lg text-slate-200 group-hover:text-cyan-400 transition-colors">{mod.name}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 relative z-10 transition-colors transform group-hover:translate-x-1" />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 relative z-10">
                      {mod.responsible_leader && (
                        <div className="text-xs font-medium text-slate-400 bg-[#0f172a] px-3 py-1 rounded-lg w-fit border border-slate-700/50 shadow-inner">
                          {mod.responsible_leader}
                        </div>
                      )}
                      <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/40 border border-cyan-800/50 px-2 py-1 rounded-lg">
                        Cadre: {cadreCount}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full p-8 text-center text-slate-500 bg-[#1f2937]/30 rounded-2xl border border-dashed border-slate-700/50">
                No active modules available.
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between gap-4">
           <Link href="/status" className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]">
             <Activity className="w-5 h-5" />
             Daily Status
           </Link>
           <Link href="/admin" className="flex items-center justify-center gap-2 bg-[#1f2937]/80 border border-slate-700 hover:border-slate-500 text-slate-300 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:bg-[#1f2937]">
             <Settings className="w-5 h-5" />
             Admin Login
           </Link>
        </div>
      </div>
    </div>
  );
}

