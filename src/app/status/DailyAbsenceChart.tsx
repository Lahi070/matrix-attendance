"use client";

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label,
} from 'recharts';
import { Check, ChevronDown } from 'lucide-react';

type DailyData = {
  month: string;
  day: string;
  total: number;
  absent: number;
};

export default function DailyAbsenceChart({ data }: { data: DailyData[] }) {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get unique months from data
  const allMonths = useMemo(() => {
    const months = new Set<string>();
    data.forEach(d => months.add(d.month));
    return Array.from(months);
  }, [data]);

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  const chartData = useMemo(() => {
    const activeData = selectedMonths.length > 0 
      ? data.filter(d => selectedMonths.includes(d.month))
      : data;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const agg = new Map(days.map(d => [d, { total: 0, absent: 0 }]));

    activeData.forEach(d => {
      if (agg.has(d.day)) {
        const stats = agg.get(d.day)!;
        stats.total += d.total;
        stats.absent += d.absent;
      }
    });

    return days.map(day => {
      const stats = agg.get(day)!;
      return {
        day,
        percentage: stats.total > 0 ? Number(((stats.absent / stats.total) * 100).toFixed(1)) : 0
      };
    });
  }, [data, selectedMonths]);

  return (
    <div className="bg-[#111827]/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-600/30 relative overflow-hidden group flex flex-col mb-8">
      <div className="flex justify-between items-start sm:items-center mb-6 relative z-30 flex-col sm:flex-row gap-4">
        <h2 className="text-lg font-bold text-slate-200">
          Daily Absence Percentage (Mon - Fri)
        </h2>

        {/* Custom Multi-Select Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-slate-800/80 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 flex items-center gap-2 transition-colors"
          >
            {selectedMonths.length === 0 
              ? 'Overall (All Months)' 
              : `${selectedMonths.length} Month${selectedMonths.length > 1 ? 's' : ''} Selected`}
            <ChevronDown className="w-4 h-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1">
              <div 
                onClick={() => setSelectedMonths([])}
                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 rounded-lg cursor-pointer text-sm text-slate-300 transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedMonths.length === 0 ? 'bg-blue-500 border-blue-500' : 'border-slate-500 bg-slate-900/50'}`}>
                  {selectedMonths.length === 0 && <Check className="w-3 h-3 text-white" />}
                </div>
                Overall
              </div>
              
              <div className="h-px bg-slate-700 my-1"></div>
              
              {allMonths.map(month => (
                <div 
                  key={month}
                  onClick={() => toggleMonth(month)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 rounded-lg cursor-pointer text-sm text-slate-300 transition-colors"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedMonths.includes(month) ? 'bg-blue-500 border-blue-500' : 'border-slate-500 bg-slate-900/50'}`}>
                    {selectedMonths.includes(month) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {month}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-64 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 25, right: 60, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="day" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} domain={[0, (dataMax: number) => Math.max(Math.ceil(dataMax) + 1, 6)]} unit="%" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
              itemStyle={{ color: '#10b981' }}
              formatter={(value: any) => [`${value}%`, 'Absence']}
            />
            <ReferenceLine y={5.6} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1.5}>
              <Label
                value="Target 5.6%"
                position="insideTopRight"
                fill="#f97316"
                fontSize={11}
                fontWeight="bold"
                dy={-6}
              />
            </ReferenceLine>
            <Bar dataKey="percentage" name="Absence" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.percentage > 5.6 ? '#ef4444' : '#10b981'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
