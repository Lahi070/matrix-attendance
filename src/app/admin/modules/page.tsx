'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Module = { id: string; name: string; responsible_leader: string; is_active: boolean };

export default function ManageModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [name, setName] = useState('');
  const [leader, setLeader] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    const { data } = await supabase.from('modules').select('*').order('name');
    if (data) setModules(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const { error } = await supabase.from('modules').insert([{ name, responsible_leader: leader }]);
    if (!error) {
      setName('');
      setLeader('');
      fetchModules();
    } else {
      alert(error.message);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('modules').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      fetchModules();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Modules</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-100">
        <h2 className="font-bold mb-4">Add New Module</h2>
        <form onSubmit={handleAdd} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Module Name</label>
            <input 
              type="text" 
              className="w-full border rounded p-2" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Responsible Leader</label>
            <input 
              type="text" 
              className="w-full border rounded p-2" 
              value={leader} 
              onChange={e => setLeader(e.target.value)} 
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">Add</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Leader</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> : modules.map(mod => (
              <tr key={mod.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{mod.name}</td>
                <td className="p-4 text-gray-600">{mod.responsible_leader}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${mod.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mod.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2 items-center">
                  <Link href={`/admin/modules/${mod.id}`} className="px-3 py-1 text-sm rounded font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 transition-colors">
                    Edit
                  </Link>
                  <button 
                    onClick={() => toggleStatus(mod.id, mod.is_active)}
                    className={`px-3 py-1 text-sm rounded font-bold border transition-colors ${mod.is_active ? 'text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300' : 'text-green-600 hover:bg-green-50 border-green-200 hover:border-green-300'}`}
                  >
                    {mod.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


