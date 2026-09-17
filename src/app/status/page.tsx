import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export const revalidate = 0;

export default async function DailyStatus() {
  const { data: modules } = await supabase.from('modules').select('*').eq('is_active', true).order('name');
  
  const today = new Date().toISOString().split('T')[0];
  const { data: attendance } = await supabase.from('attendance').select('module_id').eq('date', today);

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

  // Group by module
  const markedModules = new Set(attendance?.map(a => a.module_id));

  const total = modules?.length || 0;
  const marked = markedModules.size;
  const pending = total - marked;

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center py-12 px-4 font-sans text-slate-200 relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-pink-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl w-full relative z-10">
        
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

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white">Welcome back!</h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative overflow-hidden group hover:border-blue-500/50 transition-all text-center">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
              <p className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 relative z-10">Total Modules</p>
              <h3 className="text-5xl font-black text-blue-400 relative z-10">{total}</h3>
            </div>
            
            <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden group hover:border-emerald-500/50 transition-all text-center">
              <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Completed</p>
                <div className="bg-emerald-500/20 rounded-full p-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
              </div>
              <h3 className="text-5xl font-black text-emerald-400 relative z-10">{marked}</h3>
            </div>

            <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)] relative overflow-hidden group hover:border-pink-500/50 transition-all text-center">
              <div className="absolute inset-0 bg-pink-500/5 group-hover:bg-pink-500/10 transition-colors"></div>
              <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Pending</p>
                <div className="bg-pink-500/20 rounded-full p-1"><XCircle className="w-4 h-4 text-pink-400" /></div>
              </div>
              <h3 className="text-5xl font-black text-pink-400 relative z-10">{pending}</h3>
            </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
          Module Selection Panel
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {modules?.map(mod => {
            const isMarked = markedModules.has(mod.id);
            const leaderName = leaderMap[mod.id] || mod.responsible_leader || 'No Leader';
            
            return (
              <div key={mod.id} className={`p-5 rounded-2xl border backdrop-blur-xl relative overflow-hidden transition-all hover:scale-[1.02] ${
                isMarked 
                  ? 'bg-emerald-900/30 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'bg-pink-900/20 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.1)]'
              }`}>
                <div className="relative z-10">
                  <div className="font-bold text-lg text-white mb-2">{mod.name}</div>
                  <div className="text-sm text-slate-300 mb-2">
                    Leader: <span className="font-medium text-white">{leaderName}</span>
                  </div>
                  <div className="text-sm text-slate-300 flex items-center justify-between">
                    <span>Status: <span className={`font-medium ${isMarked ? 'text-emerald-400' : 'text-pink-400'}`}>{isMarked ? 'Completed' : 'Pending'}</span></span>
                  </div>
                </div>
                
                {/* Big faint icon in background */}
                <div className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none">
                  {isMarked ? (
                    <CheckCircle2 className="w-24 h-24 text-emerald-400" />
                  ) : (
                    <XCircle className="w-24 h-24 text-pink-400" />
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
