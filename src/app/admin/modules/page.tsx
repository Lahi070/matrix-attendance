/* eslint-disable */
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
    // We can just call it
    const loadData = async () => {
      setLoading(true);
      const { data } = await supabase.from('modules').select('*').order('name');
      if (data) setModules(data);
      setLoading(false);
    };
    loadData();
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
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-6">Manage Modules</h1>

      <div className="bg-[#111827]/80 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] mb-8 border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="font-bold text-slate-200 mb-6 relative z-10">Add New Module</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-5 items-end relative z-10">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Module Name</label>
            <input 
              type="text" 
              className="w-full border border-slate-700 bg-slate-900/80 text-slate-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none shadow-inner transition-all" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Responsible Leader</label>
            <input 
              type="text" 
              className="w-full border border-slate-700 bg-slate-900/80 text-slate-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none shadow-inner transition-all" 
              value={leader} 
              onChange={e => setLeader(e.target.value)} 
            />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]">
            Add Module
          </button>
        </form>
      </div>

      <div className="bg-[#111827]/80 backdrop-blur-xl rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/80 border-b border-slate-700/50">
              <tr>
                <th className="p-4 text-sm font-semibold tracking-wide text-slate-300">Name</th>
                <th className="p-4 text-sm font-semibold tracking-wide text-slate-300">Leader</th>
                <th className="p-4 text-sm font-semibold tracking-wide text-slate-300">Status</th>
                <th className="p-4 text-sm font-semibold tracking-wide text-slate-300 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium">Loading modules...</td></tr> : modules.map(mod => (
                <tr key={mod.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-200">{mod.name}</td>
                  <td className="p-4 text-slate-400">{mod.responsible_leader || <span className="italic text-slate-600">No Leader</span>}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${mod.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-pink-500/10 text-pink-400 border-pink-500/30'}`}>
                      {mod.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-3 items-center">
                    <Link href={`/admin/modules/${mod.id}`} className="px-4 py-2 text-sm rounded-lg font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-800/50 hover:border-cyan-500/50 transition-all shadow-sm">
                      Edit
                    </Link>
                    <button 
                      onClick={() => toggleStatus(mod.id, mod.is_active)}
                      className={`px-4 py-2 text-sm rounded-lg font-bold border transition-all shadow-sm ${mod.is_active ? 'text-pink-400 hover:text-pink-300 hover:bg-pink-950/40 border-pink-800/50 hover:border-pink-500/50' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border-emerald-800/50 hover:border-emerald-500/50'}`}
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
    </div>
  );
}



