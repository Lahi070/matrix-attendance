'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, X, Activity } from 'lucide-react';
import AbsenceBreakdownPanel from './AbsenceBreakdownPanel';

type HistoricalModalProps = {
  dbTotal: number;
  manualCadre: number;
  moduleNameById: Record<string, string>;
};

export default function HistoricalModal({ dbTotal, manualCadre, moduleNameById }: HistoricalModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    totalAbsent: number;
    categoryCounts: Record<string, number>;
    directCounts: Record<string, number>;
    indirectCounts: Record<string, number>;
  } | null>(null);

  const activeCadre = manualCadre > 0 ? manualCadre : dbTotal;

  const indirectRoles = ['Team Leader', 'Group Leader', 'Mender'];
  const indirectModuleKeywords = ['technical', 'office'];

  function isIndirect(moduleName: string, role: string | null | undefined): boolean {
    if (role && indirectRoles.some(ir => role.toLowerCase().includes(ir.toLowerCase()))) return true;
    const lower = moduleName.toLowerCase();
    if (indirectModuleKeywords.some(kw => lower.includes(kw))) return true;
    return false;
  }

  const excludedRoles = ['DGM', 'AM', 'Executive', 'Senior Executive'];

  useEffect(() => {
    if (!date) return;
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      const { data: attendance } = await supabase
        .from('attendance')
        .select('status, category, module_id, team_members(role)')
        .eq('date', date);

      if (!isMounted) return;

      if (!attendance) {
        setData({ totalAbsent: 0, categoryCounts: {}, directCounts: {}, indirectCounts: {} });
        setLoading(false);
        return;
      }

      let tAbsent = 0;
      const defaultCategories = {
        'Planning leave': 0,
        'Inform leave': 0,
        'Not inform leave': 0,
        'Dutypay': 0,
        'Half day': 0
      };
      const catCounts: Record<string, number> = { ...defaultCategories };
      const dirCounts: Record<string, number> = { ...defaultCategories };
      const indCounts: Record<string, number> = { ...defaultCategories };

      attendance.filter(a => a.status === 'Absent').forEach(record => {
        const tm = Array.isArray(record.team_members) ? record.team_members[0] : record.team_members;
        const role = (tm as any)?.role;
        const moduleName = moduleNameById[record.module_id || ''] || '';
        const isIndirectEmployee = isIndirect(moduleName, role);

        if (record.category !== 'Maternity') {
          tAbsent++;
          
          if (record.category) {
            const cat = record.category.toLowerCase().includes('not inform') ? 'Not inform leave' : record.category;
            catCounts[cat] = (catCounts[cat] || 0) + 1;
            if (isIndirectEmployee) {
              indCounts[cat] = (indCounts[cat] || 0) + 1;
            } else if (!role || !excludedRoles.includes(role)) {
              dirCounts[cat] = (dirCounts[cat] || 0) + 1;
            }
          }
        }
      });

      setData({
        totalAbsent: tAbsent,
        categoryCounts: catCounts,
        directCounts: dirCounts,
        indirectCounts: indCounts
      });
      setLoading(false);
    }

    fetchData();
    return () => { isMounted = false; };
  }, [date, moduleNameById]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#1f2937]/80 hover:bg-[#374151] border border-slate-700/50 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all"
      >
        <Calendar className="w-4 h-4" />
        Past Dates
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          
          <div className="bg-[#0a1120] border border-slate-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Historical Absence Data
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1">
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center bg-[#111827]/60 p-4 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-medium">Select Date:</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="bg-[#1f2937] border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500 w-full sm:w-auto"
                />
              </div>

              {!date && (
                <div className="text-center py-10 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                  Please select a past date to view its attendance data.
                </div>
              )}

              {loading && date && (
                <div className="text-center py-10 animate-pulse text-cyan-500">
                  Loading data for {date}...
                </div>
              )}

              {!loading && data && date && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Total Absentees Summary (Same style as daily status) */}
                  <div className="bg-[#111827]/40 p-5 rounded-2xl shadow-lg border border-slate-600/30 flex flex-col">
                    <div className="flex justify-between items-center mb-5 border-b border-slate-700 pb-3">
                      <h2 className="text-lg font-bold text-slate-200">Total Absentees</h2>
                      <div className="bg-slate-800/50 border border-slate-700/50 p-2 rounded-lg">
                        <Activity className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                    {(() => {
                      const absencePercentage = activeCadre > 0 ? (data.totalAbsent / activeCadre) * 100 : 0;
                      const isHigh = absencePercentage > 5.6;
                      const colorBg = isHigh ? 'bg-red-900/20' : 'bg-emerald-900/20';
                      const colorBorder = isHigh ? 'border-red-500/30' : 'border-emerald-500/30';
                      const colorText = isHigh ? 'text-red-400' : 'text-emerald-400';
                      const colorLabel = isHigh ? 'text-red-500' : 'text-emerald-500';
                      
                      return (
                        <div className="flex flex-grow gap-4">
                           <div className={`flex-1 flex flex-col justify-center items-center ${colorBg} border ${colorBorder} rounded-xl py-8 px-2 transition-colors`}>
                              <div className={`text-6xl sm:text-7xl font-black ${colorText} mb-2 text-center`}>{data.totalAbsent}</div>
                              <div className={`${colorLabel} font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1 text-center`}>Total Absent</div>
                           </div>
                           
                           <div className={`flex-1 flex flex-col justify-center items-center ${colorBg} border ${colorBorder} rounded-xl py-8 px-2 transition-colors`}>
                              <div className={`text-6xl sm:text-7xl font-black ${colorText} mb-2 text-center drop-shadow-sm`}>
                                {absencePercentage.toFixed(1)}%
                              </div>
                              <div className={`${colorLabel} font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1 text-center`}>Absence %</div>
                           </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Absence Breakdown Panel */}
                  <AbsenceBreakdownPanel 
                    totalCounts={data.categoryCounts} 
                    directCounts={data.directCounts} 
                    indirectCounts={data.indirectCounts} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
