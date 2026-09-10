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
      <h1 className="text-2xl font-bold mb-6">Attendance Reports</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-xl">
        <h2 className="font-bold mb-4">Export Excel Report</h2>
        <div className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
            <input type="date" className="w-full border rounded p-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">End Date</label>
            <input type="date" className="w-full border rounded p-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        
        <button 
          onClick={generateReport}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Download .xlsx Report'}
        </button>
        <p className="text-xs text-gray-500 mt-4">
          The report will include EPF, Name, Module, Days Present, and counts for each leave category in the selected date range.
        </p>
      </div>
    </div>
  );
}

