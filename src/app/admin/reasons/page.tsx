/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ManageReasons() {
  const [category, setCategory] = useState('Inform leave');
  const [reasonText, setReasonText] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reasons, setReasons] = useState<any[]>([]);

  const categories = ['Planning leave', 'Inform leave', 'Maternity', 'Not inform leave', 'Dutypay', 'Half day'];

  const fetchReasons = async () => {
    const { data } = await supabase.from('absence_reasons').select('*').order('category').order('reason_text');
    if (data) setReasons(data);
  };

  useEffect(() => { 
    fetchReasons(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonText) return;
    const { data, error } = await supabase
      .from('absence_reasons')
      .insert([{ category, reason_text: reasonText }])
      .select();
      
    if (!error && data && data.length > 0) {
      setReasonText('');
      setReasons(prev => {
        const newArray = [...prev, data[0]];
        return newArray.sort((a, b) => a.category.localeCompare(b.category) || a.reason_text.localeCompare(b.reason_text));
      });
    } else {
      alert(error?.message || 'Error: RLS policy blocked the insert.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-6">Manage Absence Reasons</h1>

      <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] mb-8 border border-slate-700/50 max-w-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="font-bold text-slate-200 mb-4 relative z-10">Add New Reason</h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
            <select className="w-full border border-slate-700 bg-slate-900/80 text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none shadow-inner transition-all appearance-none" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Reason Text</label>
            <input type="text" className="w-full border rounded-xl p-3 bg-slate-900/80 border-slate-700 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all shadow-inner" value={reasonText} onChange={e => setReasonText(e.target.value)} required />
          </div>
          <button type="submit" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] w-max mt-2">
            Add Reason
          </button>
        </form>
      </div>

      <div className="bg-[#111827]/80 backdrop-blur-xl rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-slate-700/50 overflow-hidden max-w-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800/80 border-b border-slate-700/50">
            <tr>
              <th className="p-4 text-sm font-semibold tracking-wide text-slate-300">Category</th>
              <th className="p-4 text-sm font-semibold tracking-wide text-slate-300">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {reasons.map(r => (
              <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-bold text-slate-300">{r.category}</td>
                <td className="p-4 text-slate-400">{r.reason_text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

