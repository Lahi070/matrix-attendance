"use client";

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function WeeklyAbsenceChart({ data, currentWeek }: { data: { week: string, percentage: number }[], currentWeek?: string }) {
  const [weeksToShow, setWeeksToShow] = useState<number>(4);
  
  const displayData = data.slice(-weeksToShow);

  return (
    <div className="bg-[#111827]/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-600/30 relative overflow-hidden group flex flex-col mb-8">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-lg font-bold text-slate-200">
          Weekly Absence Percentage
        </h2>
      </div>

      <div className="h-64 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="week" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} domain={[0, (dataMax: number) => Math.max(Math.ceil(dataMax) + 1, 6)]} unit="%" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
              itemStyle={{ color: '#38bdf8' }}
            />
            {currentWeek && (
              <ReferenceLine x={currentWeek} stroke="#fbbf24" strokeOpacity={0.5} strokeWidth={20} />
            )}
            <ReferenceLine y={5.6} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Target 5.6%', fill: '#ef4444', fontSize: 12 }} />
            <Line type="monotone" dataKey="percentage" name="Absence" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center items-center gap-2 mt-6 relative z-10">
        {[4, 8, 12].map(num => (
          <button
            key={num}
            onClick={() => setWeeksToShow(num)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              weeksToShow === num
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50 hover:text-slate-300'
            }`}
          >
            Last {num} Weeks
          </button>
        ))}
      </div>
    </div>
  );
}
