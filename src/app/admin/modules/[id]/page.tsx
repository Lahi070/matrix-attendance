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
        <Link href="/admin/modules" className="bg-slate-200 hover:bg-slate-300 p-2 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit Module: {module.name}</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Assign Existing Member to this Module</h2>
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input 
            type="text" 
            placeholder="Enter EPF to search..." 
            className="flex-1 border-2 border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:border-slate-900 outline-none"
            value={searchEpf}
            onChange={(e) => setSearchEpf(e.target.value)}
          />
          <button type="submit" disabled={isSearching} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" /> {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchMessage && <div className="mb-4 text-sm font-bold text-blue-600">{searchMessage}</div>}

        {foundMember && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">{foundMember.name} <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded ml-2">EPF: {foundMember.epf}</span></div>
                <div className="text-sm font-medium text-slate-500 mt-1">Current Module: <span className="text-slate-900 font-bold">{foundMember.modules?.name || 'None'}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Role</label>
                <select className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-medium focus:border-slate-900 outline-none" value={assignRole} onChange={e => setAssignRole(e.target.value)}>
                  <option>Team Member</option>
                  <option>Group Leader</option>
                  <option>Mender</option>
                  <option>Team Leader</option>
                  <option>Office</option>
                  <option>Indirect</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Worker Type</label>
                <select className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-medium focus:border-slate-900 outline-none" value={assignWorkerType} onChange={e => setAssignWorkerType(e.target.value)}>
                  <option>Direct</option>
                  <option>Indirect</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleAssign} className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Assign to Module
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800">Module Members ({members.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">EPF</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No members assigned to this module yet.</td></tr>
              ) : (
                members.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-700">{member.epf}</td>
                    <td className="p-4 font-bold text-slate-900">{member.name}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md text-xs">{member.role}</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md text-xs">{member.worker_type || 'Direct'}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleRemoveFromModule(member.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors" title="Remove from module">
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

