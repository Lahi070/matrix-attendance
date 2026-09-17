/* eslint-disable */
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    setLoading(true);

    // 1. Fetch all members with their module names
    const { data: members } = await supabase
      .from('team_members')
      .select('id, name, epf, modules(name)')
      .order('epf');

    if (!members) {
      setLoading(false);
      return;
    }

    // 2. Fetch attendance records in date range
    const { data: attendance } = await supabase
      .from('attendance')
      .select('member_id, status, category')
      .gte('date', startDate)
      .lte('date', endDate);

    const records = attendance || [];

    // 3. Aggregate data
    const aggregatedData = members.map((member, index) => {
      let presentCount = 0;
      let planning = 0;
      let inform = 0;
      let notInform = 0;
      let dutypay = 0;
      let halfDay = 0;

      records.forEach(rec => {
        if (rec.member_id === member.id) {
          if (rec.status === 'Present') presentCount++;
          if (rec.status === 'Absent' && rec.category === 'Planning leave') planning++;
          if (rec.status === 'Absent' && rec.category === 'Inform leave') inform++;
          if (rec.status === 'Absent' && rec.category === 'Not inform leave') notInform++;
          if (rec.status === 'Absent' && rec.category === 'Dutypay') dutypay++;
          if (rec.status === 'Absent' && rec.category === 'Half day') halfDay++;
        }
      });

      return {
        '#': index + 1,
        'EPF': member.epf,
        'Name': member.name,
        'Module': (member.modules as any)?.name || 'N/A',
        'Days Present': presentCount,
        'Planning Leave': planning,
        'Inform Leave': inform,
        'Not Inform Leave': notInform,
        'Dutypay': dutypay,
        'Half Day': halfDay
      };
    });

    // 4. Generate Excel
    const worksheet = XLSX.utils.json_to_sheet(aggregatedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
    
    XLSX.writeFile(workbook, `Attendance_Report_${startDate}_to_${endDate}.xlsx`);
    
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-6">Attendance Reports</h1>

      <div className="bg-[#111827]/80 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-slate-700/50 max-w-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="font-bold text-slate-200 mb-6 relative z-10">Export Excel Report</h2>
        <div className="flex flex-col sm:flex-row gap-5 items-end mb-8 relative z-10">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Start Date</label>
            <input type="date" className="w-full border border-slate-700 bg-slate-900/80 text-slate-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-inner transition-all color-scheme-dark" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ colorScheme: 'dark' }} />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">End Date</label>
            <input type="date" className="w-full border border-slate-700 bg-slate-900/80 text-slate-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-inner transition-all color-scheme-dark" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ colorScheme: 'dark' }} />
          </div>
        </div>
        
        <button 
          onClick={generateReport}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-slate-900 px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50 relative z-10 text-base"
        >
          {loading ? 'Generating...' : 'Download .xlsx Report'}
        </button>
        <p className="text-xs font-medium text-slate-500 mt-5 relative z-10 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          The report will include EPF, Name, Module, Days Present, and counts for each leave category in the selected date range.
        </p>
      </div>
    </div>
  );
}


