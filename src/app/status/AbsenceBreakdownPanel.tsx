"use client";

import { useState } from 'react';

type CategoryCounts = Record<string, number>;

interface AbsenceBreakdownPanelProps {
  totalCounts: CategoryCounts;
  directCounts: CategoryCounts;
  indirectCounts: CategoryCounts;
}

export default function AbsenceBreakdownPanel({ 
  totalCounts, 
  directCounts, 
  indirectCounts 
}: AbsenceBreakdownPanelProps) {
  const [filter, setFilter] = useState<'total' | 'direct' | 'indirect'>('total');
  
  let currentCounts = totalCounts;
  if (filter === 'direct') currentCounts = directCounts;
  if (filter === 'indirect') currentCounts = indirectCounts;

  return (
    <div className="bg-[#111827]/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-600/30 relative overflow-hidden group flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3 relative z-10 flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-200">
          Absence Breakdown
        </h2>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'total' | 'direct' | 'indirect')}
          className="bg-slate-800/80 border border-slate-600/50 text-slate-200 text-sm rounded-lg px-2 py-1 outline-none focus:border-blue-500 transition-colors"
        >
          <option value="total">Total</option>
          <option value="direct">Direct</option>
          <option value="indirect">Indirect</option>
        </select>
      </div>
      
      <div className="space-y-2 relative z-10 overflow-y-auto pr-2 custom-scrollbar flex-grow">
        {Object.entries(currentCounts).map(([category, count]) => {
          let colorClass = "text-slate-300";
          let bgClass = "bg-slate-700";
          
          if (category === 'Not inform') {
            colorClass = "text-red-400";
            bgClass = "bg-red-500/20 text-red-300";
          } else if (category === 'Inform leave' || category === 'Planning leave') {
            colorClass = "text-blue-400";
            bgClass = "bg-blue-500/20 text-blue-300";
          } else if (category === 'Dutypay') {
            colorClass = "text-emerald-400";
            bgClass = "bg-emerald-500/20 text-emerald-300";
          } else if (category === 'Half day') {
            colorClass = "text-amber-400";
            bgClass = "bg-amber-500/20 text-amber-300";
          }

          return (
            <div key={category} className="flex justify-between items-center bg-slate-800/50 border border-slate-600/30 p-2.5 rounded-xl hover:bg-slate-700/50 transition-colors">
              <span className={`font-medium text-sm truncate pr-2 ${colorClass}`} title={category}>
                {category}
              </span>
              <span className={`font-bold px-3 py-1 rounded-lg text-sm ${bgClass}`}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
