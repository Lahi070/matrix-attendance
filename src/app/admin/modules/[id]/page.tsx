/* eslint-disable */
'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function EditModule({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [module, setModule] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [members, setMembers] = useState<any[]>([]);
  
  // Need to unwrap params in Next.js 16+
  const resolvedParams = use(params);
  const moduleId = resolvedParams.id;
  
  // Search state
  const [searchEpf, setSearchEpf] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [foundMember, setFoundMember] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  
  // Assign state
  const [assignRole, setAssignRole] = useState('Team Member');
  const [assignWorkerType, setAssignWorkerType] = useState('Direct');

  const fetchModuleData = async () => {
    const { data: mod } = await supabase.from('modules').select('*').eq('id', moduleId).single();
    if (mod) setModule(mod);

    const { data: mems } = await supabase.from('team_members').select('*').eq('module_id', moduleId);
    if (mems) {
      setMembers(mems.sort((a, b) => parseInt(a.epf) - parseInt(b.epf)));
    }
  };

  useEffect(() => {
    fetchModuleData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (assignRole === 'Team Member') setAssignWorkerType('Direct');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setAssignWorkerType('Indirect');
  }, [assignRole]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEpf) return;
    setIsSearching(true);
    setSearchMessage('');
    
    const { data, error } = await supabase
      .from('team_members')
      .select('*, modules(name)')
      .eq('epf', searchEpf)
      .single();

    if (error || !data) {
      setFoundMember(null);
      setSearchMessage('Member not found with this EPF.');
    } else {
      setFoundMember(data);
      // Auto-set the role to their current role, and worker type to their current worker type if it exists
      setAssignRole(data.role || 'Team Member');
      setAssignWorkerType(data.worker_type || (data.role === 'Team Member' ? 'Direct' : 'Indirect'));
    }
    setIsSearching(false);
  };

  const handleAssign = async () => {
    if (!foundMember) return;
    
    const { error, data } = await supabase
      .from('team_members')
      .update({ module_id: moduleId, role: assignRole, worker_type: assignWorkerType })
      .eq('id', foundMember.id)
      .select('*');

    if (error) {
      setSearchMessage(`Error: ${error.message}`);
    } else if (data && data.length > 0) {
      setSearchMessage('Member assigned successfully!');
      setSearchEpf('');
      setFoundMember(null);
      fetchModuleData(); // Refresh list
    } else {
      setSearchMessage('Error: Member not found or RLS blocked update.');
    }
  };

  const handleRemoveFromModule = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the module?')) return;
    
    const { error } = await supabase
      .from('team_members')
      .update({ module_id: null })
      .eq('id', memberId);

    if (error) {
      alert(`Error removing member: ${error.message}`);
    } else {
      fetchModuleData();
    }
  };

  if (!module) return <div className="p-8">Loading module...</div>;

  return (
    <div className="font-sans space-y-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/modules" className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 p-2.5 rounded-full transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Edit Module: <span className="text-cyan-400">{module.name}</span></h1>
      </div>

      <div className="bg-[#111827]/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="text-lg font-bold text-slate-200 mb-5 relative z-10">Assign Existing Member to this Module</h2>
        <form onSubmit={handleSearch} className="flex gap-4 mb-6 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Enter EPF to search..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200 outline-none transition-all font-medium text-sm shadow-inner"
              value={searchEpf}
              onChange={(e) => setSearchEpf(e.target.value)}
            />
          </div>
          <button type="submit" disabled={isSearching} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50 text-sm flex items-center gap-2">
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchMessage && <div className={`p-4 rounded-xl mb-5 text-sm font-bold shadow-sm relative z-10 border ${searchMessage.includes('Error') || searchMessage.includes('not found') ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>{searchMessage}</div>}

        {foundMember && (
          <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700 flex flex-col gap-5 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-200 text-lg">{foundMember.name} <span className="text-xs font-bold text-slate-300 bg-slate-700 px-2 py-1 rounded-md ml-2 border border-slate-600">EPF: {foundMember.epf}</span></div>
                <div className="text-sm font-medium text-slate-400 mt-1">Current Module: <span className="text-cyan-400 font-bold">{foundMember.modules?.name || 'None'}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-5 border-t border-slate-700/50">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Role</label>
                <select className="w-full border border-slate-700 bg-slate-900/80 rounded-xl p-3 text-sm font-medium text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none shadow-inner transition-all appearance-none" value={assignRole} onChange={e => setAssignRole(e.target.value)}>
                  <option>Team Member</option>
                  <option>Group Leader</option>
                  <option>Mender</option>
                  <option>Team Leader</option>
                  <option>Office</option>
                  <option>Indirect</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Worker Type</label>
                <select className="w-full border border-slate-700 bg-slate-900/80 rounded-xl p-3 text-sm font-medium text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none shadow-inner transition-all appearance-none" value={assignWorkerType} onChange={e => setAssignWorkerType(e.target.value)}>
                  <option>Direct</option>
                  <option>Indirect</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleAssign} className="w-full bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 hover:border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Assign to Module
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#111827]/80 backdrop-blur-xl rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 bg-slate-800/40">
          <h2 className="text-lg font-bold text-slate-200">Module Members <span className="text-sm font-bold text-cyan-300 bg-cyan-900/50 border border-cyan-800/50 px-3 py-1 rounded-full ml-2">{members.length}</span></h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/95 border-b border-slate-700/50">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">EPF</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {members.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No members assigned to this module yet.</td></tr>
              ) : (
                members.map(member => (
                  <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-300">{member.epf}</td>
                    <td className="p-4 font-bold text-slate-200">{member.name}</td>
                    <td className="p-4">
                      <span className="bg-slate-800 border border-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs">{member.role}</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-800 border border-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs">{member.worker_type || 'Direct'}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleRemoveFromModule(member.id)} className="text-pink-500 hover:text-pink-400 hover:bg-pink-950/40 border border-transparent hover:border-pink-800/50 p-2.5 rounded-lg transition-all" title="Remove from module">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

