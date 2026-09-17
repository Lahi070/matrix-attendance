/* eslint-disable */
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

type Member = { id: string; epf: string; name: string; role: string; module_id: string; module_name?: string };
type Module = { id: string; name: string };

export default function AssignTLPage() {
  const [searchEpf, setSearchEpf] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchEpf.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setSelectedMember(null);

    const { data, error: err } = await supabase
      .from('team_members')
      .select('id, epf, name, role, module_id, modules(name)')
      .or(`epf.eq.${searchEpf.trim()},name.ilike.%${searchEpf.trim()}%`);

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const results = (data || []).map((m: any) => ({
      id: m.id,
      epf: m.epf,
      name: m.name,
      role: m.role,
      module_id: m.module_id,
      module_name: m.modules?.name || 'Unknown'
    }));

    setSearchResults(results);
    
    // Load modules
    const { data: mods } = await supabase.from('modules').select('id, name').eq('is_active', true).order('name');
    setModules(mods || []);
    
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedMember || !selectedModule) {
      setError('Please select a member and a module');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    // Update the member's role to Team Leader and move to selected module
    const { error: updErr } = await supabase
      .from('team_members')
      .update({ role: 'Team Leader', module_id: selectedModule })
      .eq('id', selectedMember.id);

    if (updErr) {
      setError(`Error: ${updErr.message}`);
      setLoading(false);
      return;
    }

    const moduleName = modules.find(m => m.id === selectedModule)?.name || 'Unknown';
    setSuccess(`${selectedMember.name} (EPF: ${selectedMember.epf}) has been assigned as Team Leader for module "${moduleName}"`);
    setSelectedMember(null);
    setSearchResults([]);
    setSearchEpf('');
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assign Team Leader</h1>
        <p className="text-slate-500 mt-1">Search by EPF or Name, then assign as TL to a module</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-green-800">Success!</h3>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="font-bold text-slate-800 mb-4">Step 1: Search Member</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter EPF number or Name..."
            value={searchEpf}
            onChange={(e) => setSearchEpf(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-slate-500 font-medium">Found {searchResults.length} result(s):</p>
            {searchResults.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedMember?.id === m.id
                    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800">{m.name}</span>
                    <span className="text-slate-500 ml-2 text-sm">EPF: {m.epf}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      m.role === 'Team Leader' ? 'bg-blue-100 text-blue-700' :
                      m.role === 'Group Leader' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{m.role}</span>
                    <div className="text-xs text-slate-400 mt-1">Module: {m.module_name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign */}
      {selectedMember && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-800 mb-4">Step 2: Assign as Team Leader</h2>
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-4">
            <p className="text-sm text-indigo-800">
              Selected: <strong>{selectedMember.name}</strong> (EPF: {selectedMember.epf}) — 
              Current Role: <strong>{selectedMember.role}</strong>, 
              Current Module: <strong>{selectedMember.module_name}</strong>
            </p>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Assign to Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">-- Select Module --</option>
                {modules.map(mod => (
                  <option key={mod.id} value={mod.id}>{mod.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedModule}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              Assign as TL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
