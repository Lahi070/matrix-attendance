'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ManageReasons() {
  const [reasons, setReasons] = useState<any[]>([]);
  const [category, setCategory] = useState('Inform leave');
  const [reasonText, setReasonText] = useState('');

  const categories = ['Planning leave', 'Inform leave', 'Not inform leave', 'Dutypay', 'Half day'];

  const fetchReasons = async () => {
    const { data } = await supabase.from('absence_reasons').select('*').order('category').order('reason_text');
    if (data) setReasons(data);
  };

  useEffect(() => { fetchReasons(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonText) return;
    const { error } = await supabase.from('absence_reasons').insert([{ category, reason_text: reasonText }]);
    if (!error) {
      setReasonText('');
      fetchReasons();
    } else {
      alert(error.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Absence Reasons</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-100 max-w-xl">
        <h2 className="font-bold mb-4">Add New Reason</h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select className="w-full border rounded p-2" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Reason Text</label>
            <input type="text" className="w-full border rounded p-2" value={reasonText} onChange={e => setReasonText(e.target.value)} required />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 w-max">Add Reason</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Category</th>
              <th className="p-4">Reason</th>
            </tr>
          </thead>
          <tbody>
            {reasons.map(r => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-700">{r.category}</td>
                <td className="p-4">{r.reason_text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
