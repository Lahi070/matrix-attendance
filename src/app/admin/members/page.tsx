'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ArrowRightLeft, CheckCircle2, UserCircle, Plus } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  
  // Add State
  const [name, setName] = useState('');
  const [epf, setEpf] = useState('');
  const [gender, setGender] = useState('Female');
  const [role, setRole] = useState('Team Member');
  const [moduleId, setModuleId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Transfer State
  const [searchEpf, setSearchEpf] = useState('');
  const [foundMember, setFoundMember] = useState<any | null>(null);
  const [transferModuleId, setTransferModuleId] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: mData } = await supabase.from('team_members').select('*, modules(name)');
    const { data: modData } = await supabase.from('modules').select('*').order('name');
    if (mData) setMembers(mData);
    if (modData) setModules(modData);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !epf || !moduleId) return;
    setIsAdding(true);
    
    const { error } = await supabase.from('team_members').insert([
      { name, epf, gender, role, module_id: moduleId }
    ]);
    
    setIsAdding(false);
    if (!error) {
      setName(''); setEpf('');
      fetchData();
    } else {
      alert(error.message);
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
      .select();

    if (error) {
      console.error('Update error:', error);
      setTransferMessage(`Error updating member: ${error.message}`);
    } else if (!data || data.length === 0) {
      setTransferMessage('Error: RLS policy blocked the update or member not found.');
    } else {
      setTransferMessage('Member transferred successfully!');
      setFoundMember(null);
      setSearchEpf('');
      fetchData(); // Refresh list
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Members</h1>
        <p className="text-slate-500 font-medium">Add new members or transfer existing ones between modules.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Transfer Member Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
            Transfer Member
          </h2>
          
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Enter EPF Number..." 
                value={searchEpf}
                onChange={(e) => setSearchEpf(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-medium text-sm"
              />
            </div>
            <button type="submit" disabled={isSearching} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm">
              {isSearching ? '...' : 'Search'}
            </button>
          </form>

          {transferMessage && (
            <div className={`p-3 rounded-lg mb-4 text-sm font-bold ${transferMessage.includes('Error') || transferMessage.includes('not found') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {transferMessage}
            </div>
          )}

          {foundMember && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100">
                  <UserCircle className="w-10 h-10 text-slate-400" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">{foundMember.name} <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded ml-2">EPF: {foundMember.epf}</span></div>
                  <div className="text-sm font-medium text-slate-500 mt-1">Current: <span className="text-slate-900 font-bold">{foundMember.modules?.name}</span></div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-200">
                <select 
                  value={transferModuleId}
                  onChange={(e) => setTransferModuleId(e.target.value)}
                  className="flex-1 border-2 border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-slate-900"
                >
                  {modules.map(mod => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                </select>
                <button onClick={handleTransfer} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Transfer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Member Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Add New Member
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
                <input type="text" className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-medium focus:border-slate-900 outline-none" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">EPF</label>
                <input type="text" className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-medium focus:border-slate-900 outline-none" value={epf} onChange={e => setEpf(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                <select className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-medium focus:border-slate-900 outline-none" value={gender} onChange={e => setGender(e.target.value)}>
                  <option>Female</option>
                  <option>Male</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                <select className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-medium focus:border-slate-900 outline-none" value={role} onChange={e => setRole(e.target.value)}>
                  <option>Team Member</option>
                  <option>Group Leader</option>
                  <option>Mender</option>
                  <option>Team Leader</option>
                  <option>Indirect</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assign to Module</label>
              <select className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700 focus:border-slate-900 outline-none" value={moduleId} onChange={e => setModuleId(e.target.value)} required>
                <option value="">Select...</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={isAdding} className="w-full bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm">
                {isAdding ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">All Team Members <span className="text-sm font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full ml-2">{members.length}</span></h2>
        </div>
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-4">EPF</th>
                <th className="p-4">Name</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Role</th>
                <th className="p-4">Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-900 font-bold text-sm">{member.epf}</td>
                  <td className="p-4 text-slate-700 font-medium text-sm">{member.name}</td>
                  <td className="p-4 text-slate-500 text-sm">{member.gender}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md text-xs">{member.role}</span>
                  </td>
                  <td className="p-4 text-slate-800 font-bold text-sm">{member.modules?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
