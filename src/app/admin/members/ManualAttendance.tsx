'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, CheckCircle2, UserCircle, CalendarDays } from 'lucide-react';

export default function ManualAttendance() {
  const [searchEpf, setSearchEpf] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');
  
  const [member, setMember] = useState<any>(null);
  const [attendance, setAttendance] = useState<{ status: string; category: string; reason_id: string } | null>(null);
  
  const [reasons, setReasons] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['Planning leave', 'Inform leave', 'Maternity', 'Not inform leave', 'Dutypay', 'Half day', 'Shift'];

  useEffect(() => {
    const fetchReasons = async () => {
      const { data } = await supabase.from('absence_reasons').select('*');
      if (data) setReasons(data);
    };
    fetchReasons();
  }, []);

  const getFilteredReasons = (category: string) => {
    if (category === 'Maternity' || category === 'Shift') {
      return [];
    }
    if (category === 'Inform leave') {
      return reasons.filter(r => r.category === 'Inform leave' && !r.reason_text.toLowerCase().includes('maternity'));
    }
    if (category === 'Planning leave' || category === 'Dutypay') {
      const ownReasons = reasons.filter(r => r.category === category);
      const informReasons = reasons.filter(r => r.category === 'Inform leave' && !r.reason_text.toLowerCase().includes('maternity'));
      const combined = [...ownReasons, ...informReasons];
      return Array.from(new Map(combined.map(item => [item.id, item])).values());
    }
    return reasons.filter(r => r.category === category);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEpf) return;
    
    setIsSearching(true);
    setMessage('');
    setMember(null);
    setAttendance(null);

    // 1. Find Member
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select('*, modules(name)')
      .eq('epf', searchEpf)
      .single();

    if (memberError || !memberData) {
      setMessage('Member not found with this EPF.');
      setIsSearching(false);
      return;
    }

    setMember(memberData);

    // 2. Find Today's Attendance
    const today = new Date().toISOString().split('T')[0];
    const { data: attData } = await supabase
      .from('attendance')
      .select('*')
      .eq('member_id', memberData.id)
      .eq('date', today)
      .single();

    if (attData) {
      setAttendance({
        status: attData.status,
        category: attData.category || '',
        reason_id: attData.reason_id || ''
      });
      setMessage('Existing attendance found for today.');
    } else {
      setAttendance({ status: 'Present', category: '', reason_id: '' });
      setMessage('No attendance marked for today yet.');
    }

    setIsSearching(false);
  };

  const handleSave = async () => {
    if (!member || !attendance) return;
    
    // Validation
    if (attendance.status === 'Absent') {
      if (!attendance.category) {
        setMessage('Please select a leave category.');
        return;
      }
      const availableReasons = getFilteredReasons(attendance.category);
      if (availableReasons.length > 0 && !attendance.reason_id) {
        setMessage('Please select a specific reason.');
        return;
      }
    }

    setIsSaving(true);
    setMessage('');
    
    const today = new Date().toISOString().split('T')[0];
    const recordToUpsert = {
      module_id: member.module_id,
      member_id: member.id,
      status: attendance.status,
      category: attendance.status === 'Absent' ? (attendance.category || null) : null,
      reason_id: attendance.status === 'Absent' ? (attendance.reason_id || null) : null,
      date: today,
    };

    // Since member_id + date might not be a unique constraint on its own in the DB (usually it is, but let's delete first to be safe)
    await supabase
      .from('attendance')
      .delete()
      .eq('member_id', member.id)
      .eq('date', today);

    const { error } = await supabase.from('attendance').insert([recordToUpsert]);

    setIsSaving(false);

    if (error) {
      setMessage(`Error saving attendance: ${error.message}`);
    } else {
      setMessage('Attendance saved successfully!');
    }
  };

  return (
    <div className="bg-[#111827]/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.3)] relative overflow-hidden mt-8">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-3 relative z-10">
        <div className="bg-sky-500/20 p-2 rounded-lg border border-sky-500/30">
          <CalendarDays className="w-5 h-5 text-sky-400" />
        </div>
        Manual Attendance Mark
      </h2>
      
      <form onSubmit={handleSearch} className="flex gap-4 mb-6 relative z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Enter EPF Number..." 
            value={searchEpf}
            onChange={(e) => setSearchEpf(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-slate-200 outline-none transition-all font-medium text-sm shadow-inner"
          />
        </div>
        <button type="submit" disabled={isSearching} className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] disabled:opacity-50 text-sm flex items-center gap-2">
          {isSearching ? '...' : 'Search'}
        </button>
      </form>

      {message && (
        <div className={`p-4 rounded-xl mb-5 text-sm font-bold shadow-sm relative z-10 border ${message.includes('Error') || message.includes('not found') || message.includes('Please') ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
          {message}
        </div>
      )}

      {member && attendance && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700 flex flex-col gap-6 relative z-10">
          <div className="flex items-center gap-4 border-b border-slate-700 pb-4">
            <div className="bg-slate-900 p-3 rounded-full shadow-inner border border-slate-700">
              <UserCircle className="w-8 h-8 text-sky-400" />
            </div>
            <div>
              <div className="font-bold text-slate-200 text-lg">{member.name} <span className="text-xs font-bold text-slate-300 bg-slate-700 px-2 py-1 rounded-md ml-2 border border-slate-600">EPF: {member.epf}</span></div>
              <div className="text-sm font-medium text-slate-400 mt-1">Module: <span className="text-sky-400 font-bold">{member.modules?.name}</span></div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <label className={`flex-1 cursor-pointer px-4 py-3 rounded-xl text-sm font-bold border text-center transition-all ${
                attendance.status === 'Present' 
                  ? 'bg-green-950/40 border-green-500/50 text-green-400 shadow-sm' 
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
              }`}>
                <input 
                  type="radio" 
                  name="manual-status" 
                  value="Present" 
                  className="hidden"
                  checked={attendance.status === 'Present'}
                  onChange={() => setAttendance({ ...attendance, status: 'Present', category: '', reason_id: '' })}
                />
                Present
              </label>
              
              <label className={`flex-1 cursor-pointer px-4 py-3 rounded-xl text-sm font-bold border text-center transition-all ${
                attendance.status === 'Absent' 
                  ? 'bg-red-950/40 border-red-500/50 text-red-400 shadow-sm' 
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
              }`}>
                <input 
                  type="radio" 
                  name="manual-status" 
                  value="Absent" 
                  className="hidden"
                  checked={attendance.status === 'Absent'}
                  onChange={() => setAttendance({ ...attendance, status: 'Absent' })}
                />
                Absent
              </label>
            </div>

            {attendance.status === 'Absent' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select 
                  className="w-full border border-slate-700 bg-slate-900/80 rounded-xl p-3 text-sm font-medium text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none shadow-inner transition-all appearance-none"
                  value={attendance.category}
                  onChange={(e) => setAttendance({ ...attendance, category: e.target.value, reason_id: '' })}
                >
                  <option value="">-- Leave Category --</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {attendance.category && getFilteredReasons(attendance.category).length > 0 && (
                  <select 
                    className="w-full border border-slate-700 bg-slate-900/80 rounded-xl p-3 text-sm font-medium text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none shadow-inner transition-all appearance-none"
                    value={attendance.reason_id}
                    onChange={(e) => setAttendance({ ...attendance, reason_id: e.target.value })}
                  >
                    <option value="">-- Specific Reason --</option>
                    {getFilteredReasons(attendance.category).map(r => (
                      <option key={r.id} value={r.id}>{r.reason_text}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
            
            <button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="mt-2 w-full bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 hover:border-emerald-500/50 text-emerald-400 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
