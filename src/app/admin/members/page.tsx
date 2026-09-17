/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ArrowRightLeft, CheckCircle2, UserCircle, Plus, Trash2 } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  
  // Add State
  const [name, setName] = useState('');
  const [epf, setEpf] = useState('');
  const [gender, setGender] = useState('Female');
  const [role, setRole] = useState('Team Member');
  const [workerType, setWorkerType] = useState('Direct');

  useEffect(() => {
    if (role === 'Team Member') setWorkerType('Direct');
    else setWorkerType('Indirect');
  }, [role]);
  const [moduleId, setModuleId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Transfer State
  const [searchEpf, setSearchEpf] = useState('');
  const [foundMember, setFoundMember] = useState<any | null>(null);
  const [transferModuleId, setTransferModuleId] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: mData } = await supabase.from('team_members').select('*, modules(name)');
    const { data: modData } = await supabase.from('modules').select('*').order('name');
    if (mData) {
      const sorted = mData.sort((a, b) => {
        const epfA = parseInt(a.epf, 10);
        const epfB = parseInt(b.epf, 10);
        if (isNaN(epfA) && isNaN(epfB)) return a.epf.localeCompare(b.epf);
        if (isNaN(epfA)) return 1;
        if (isNaN(epfB)) return -1;
        return epfA - epfB;
      });
      setMembers(sorted);
    }
    if (modData) setModules(modData);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !epf || !moduleId) return;
    setIsAdding(true);
    
    const { error, data } = await supabase.from('team_members').insert([
      { name, epf, gender, role, module_id: moduleId, worker_type: workerType }
    ]).select('*, modules(name)');
    
    setIsAdding(false);
    if (!error && data) {
      setName(''); setEpf('');
      setMembers(prev => [data[0], ...prev]);
    } else {
      alert(error?.message || 'Error adding member');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEpf) return;
    setIsSearching(true);
    setTransferMessage('');
    const { data, error } = await supabase
      .from('team_members')
      .select('*, modules(name)')
      .eq('epf', searchEpf)
      .single();

    if (data) {
      setFoundMember(data);
      setTransferModuleId(data.module_id);
    } else {
      setFoundMember(null);
      setTransferMessage('Member not found with this EPF.');
    }
    setIsSearching(false);
  };

  const handleTransfer = async () => {
    if (!foundMember || !transferModuleId) return;
    
    const { error, data } = await supabase
      .from('team_members')
      .update({ module_id: transferModuleId })
      .eq('id', foundMember.id)
      .select('*, modules(name)');

    if (error) {
      console.error('Update error:', error);
      setTransferMessage(`Error updating member: ${error.message}`);
    } else if (!data || data.length === 0) {
      setTransferMessage('Error: RLS policy blocked the update or member not found.');
    } else {
      setTransferMessage('Member transferred successfully!');
      setFoundMember(null);
      setSearchEpf('');
      
      // Update local state to avoid Next.js aggressive fetch caching
      setMembers(prev => prev.map(m => m.id === data[0].id ? data[0] : m));
    }
  };

  const handleDelete = async () => {
    if (!foundMember) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${foundMember.name} (EPF: ${foundMember.epf})?`)) return;
    
    setIsDeleting(true);
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', foundMember.id);
      
    setIsDeleting(false);

    if (error) {
      console.error('Delete error:', error);
      setTransferMessage(`Error deleting member: ${error.message}`);
    } else {
      setTransferMessage('Member deleted successfully!');
      setFoundMember(null);
      setSearchEpf('');
      
      // Remove from local state
      setMembers(prev => prev.filter(m => m.id !== foundMember.id));
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-6xl">
      <div className="relative z-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Manage Members</h1>
        <p className="text-slate-400 font-medium">Add new members or transfer existing ones between modules.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
        
        {/* Transfer Member Section */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-3 relative z-10">
            <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            </div>
            Transfer Member
          </h2>
          
          <form onSubmit={handleSearch} className="flex gap-4 mb-6 relative z-10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Enter EPF Number..." 
                value={searchEpf}
                onChange={(e) => setSearchEpf(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-200 outline-none transition-all font-medium text-sm shadow-inner"
              />
            </div>
            <button type="submit" disabled={isSearching} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:opacity-50 text-sm flex items-center gap-2">
              {isSearching ? '...' : 'Search'}
            </button>
          </form>

          {transferMessage && (
            <div className={`p-4 rounded-xl mb-5 text-sm font-bold shadow-sm relative z-10 border ${transferMessage.includes('Error') || transferMessage.includes('not found') ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
              {transferMessage}
            </div>
          )}

          {foundMember && (
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700 flex flex-col gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-3 rounded-full shadow-inner border border-slate-700">
                  <UserCircle className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-lg">{foundMember.name} <span className="text-xs font-bold text-slate-300 bg-slate-700 px-2 py-1 rounded-md ml-2 border border-slate-600">EPF: {foundMember.epf}</span></div>
                  <div className="text-sm font-medium text-slate-400 mt-1">Current: <span className="text-indigo-400 font-bold">{foundMember.modules?.name}</span></div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-5 border-t border-slate-700/50">
                <select 
                  value={transferModuleId}
                  onChange={(e) => setTransferModuleId(e.target.value)}
                  className="flex-1 border border-slate-700 bg-slate-900/80 rounded-xl p-3 text-sm font-medium text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-inner transition-all appearance-none"
                >
                  {modules.map(mod => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={handleTransfer} className="flex-1 sm:flex-none bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 hover:border-emerald-500/50 text-emerald-400 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-sm whitespace-nowrap">
                    <CheckCircle2 className="w-4 h-4" />
                    Transfer
                  </button>
                  <button onClick={handleDelete} disabled={isDeleting} className="flex-1 sm:flex-none bg-pink-950/40 hover:bg-pink-900/60 border border-pink-800/50 hover:border-pink-500/50 text-pink-400 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-sm whitespace-nowrap disabled:opacity-50">
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Member Section */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-3 relative z-10">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
              <Plus className="w-5 h-5 text-emerald-400" />
            </div>
            Add New Member
          </h2>
          <form onSubmit={handleAdd} className="space-y-5 relative z-10">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                <input type="text" className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm font-medium text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">EPF</label>
                <input type="text" className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm font-medium text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner" value={epf} onChange={e => setEpf(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gender</label>
                <select className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm font-medium text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner appearance-none" value={gender} onChange={e => setGender(e.target.value)}>
                  <option>Female</option>
                  <option>Male</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                <select className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm font-medium text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner appearance-none" value={role} onChange={e => setRole(e.target.value)}>
                  <option>Team Member</option>
                  <option>Group Leader</option>
                  <option>Mender</option>
                  <option>Team Leader</option>
                  <option>Indirect</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assign to Module</label>
              <select className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm font-bold text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner appearance-none" value={moduleId} onChange={e => setModuleId(e.target.value)} required>
                <option value="" className="text-slate-500">Select...</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="pt-3">
              <button type="submit" disabled={isAdding} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50 text-sm">
                {isAdding ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* List Section */}
      <div className="bg-[#111827]/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.3)] overflow-hidden relative z-10">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/40">
          <h2 className="text-lg font-bold text-slate-200">All Team Members <span className="text-sm font-bold text-indigo-300 bg-indigo-900/50 border border-indigo-800/50 px-3 py-1 rounded-full ml-3">{members.length}</span></h2>
        </div>
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-900/95 shadow-sm z-10 backdrop-blur-md">
              <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">EPF</th>
                <th className="p-4">Name</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Role</th>
                <th className="p-4">Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {members.map((member, index) => (
                <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 text-slate-500 font-bold text-center text-sm">{index + 1}</td>
                  <td className="p-4 text-slate-300 font-bold text-sm">{member.epf}</td>
                  <td className="p-4 text-slate-200 font-bold text-sm">{member.name}</td>
                  <td className="p-4 text-slate-400 text-sm">{member.gender}</td>
                  <td className="p-4">
                    <span className="bg-slate-800 border border-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs">{member.role}</span>
                  </td>
                  <td className="p-4 text-indigo-400 font-bold text-sm">{member.modules?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


