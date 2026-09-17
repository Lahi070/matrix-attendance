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
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Assign Team Leader</h1>
        <p className="text-slate-400 mt-1">Search by EPF or Name, then assign as TL to a module</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-emerald-400">Success!</h3>
            <p className="text-emerald-300/80 text-sm">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-pink-500/10 border border-pink-500/30 p-4 rounded-xl flex items-start gap-3 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
          <AlertCircle className="w-6 h-6 text-pink-400 shrink-0 mt-0.5" />
          <p className="text-pink-400 font-medium">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="font-bold text-slate-200 mb-4 relative z-10">Step 1: Search Member</h2>
        <div className="flex gap-3 relative z-10">
          <input
            type="text"
            placeholder="Enter EPF number or Name..."
            value={searchEpf}
            onChange={(e) => setSearchEpf(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 border border-slate-700 bg-slate-900/80 text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none shadow-inner transition-all"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-6 space-y-3 relative z-10">
            <p className="text-sm text-slate-400 font-medium">Found {searchResults.length} result(s):</p>
            {searchResults.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedMember?.id === m.id
                    ? 'bg-cyan-900/30 border-cyan-500/50 ring-1 ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-800/40 border-slate-700 hover:border-cyan-500/40 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-200">{m.name}</span>
                    <span className="text-slate-400 ml-2 text-sm">EPF: {m.epf}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      m.role === 'Team Leader' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                      m.role === 'Group Leader' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                      'bg-slate-800 text-slate-400 border-slate-600'
                    }`}>{m.role}</span>
                    <div className="text-xs text-slate-500 mt-1.5">Module: <span className="text-slate-300 font-medium">{m.module_name}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign */}
      {selectedMember && (
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-slate-700/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h2 className="font-bold text-slate-200 mb-4 relative z-10">Step 2: Assign as Team Leader</h2>
          <div className="bg-cyan-950/30 p-4 rounded-xl border border-cyan-800/50 mb-5 relative z-10">
            <p className="text-sm text-cyan-300/80">
              Selected: <strong className="text-cyan-400">{selectedMember.name}</strong> (EPF: {selectedMember.epf}) — 
              Current Role: <strong className="text-cyan-400">{selectedMember.role}</strong>, 
              Current Module: <strong className="text-cyan-400">{selectedMember.module_name}</strong>
            </p>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-4 items-end relative z-10">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Assign to Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full border border-slate-700 bg-slate-900/80 text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none shadow-inner transition-all appearance-none"
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
              className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] text-slate-900"
            >
              <UserPlus className="w-5 h-5" />
              Assign as TL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
