'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

type Member = { id: string; name: string; epf: string; gender: string };
type Reason = { id: string; category: string; reason_text: string };

interface Props {
  moduleId: string;
  moduleName: string;
  members: Member[];
  reasons: Reason[];
}

export default function AttendanceForm({ moduleId, moduleName, members, reasons }: Props) {
  const router = useRouter();
  const [attendance, setAttendance] = useState<Record<string, { status: string; category?: string; reason_id?: string }>>({});
  const [error, setError] = useState('');
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Planning leave', 'Inform leave', 'Not inform leave', 'Dutypay', 'Half day'];

  const handleStatusChange = (memberId: string, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: { status, category: '', reason_id: '' },
    }));
    // Clear error for this row
    if (errorIds.has(memberId)) {
      const newErrorIds = new Set(errorIds);
      newErrorIds.delete(memberId);
      setErrorIds(newErrorIds);
    }
  };

  const handleCategoryChange = (memberId: string, category: string) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], category, reason_id: '' },
    }));
  };

  const handleReasonChange = (memberId: string, reason_id: string) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], reason_id },
    }));
    if (errorIds.has(memberId)) {
      const newErrorIds = new Set(errorIds);
      newErrorIds.delete(memberId);
      setErrorIds(newErrorIds);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const newErrorIds = new Set<string>();

    // Validation
    for (const member of members) {
      const record = attendance[member.id];
      if (!record || !record.status) {
        newErrorIds.add(member.id);
      } else if (record.status === 'Absent' && (!record.category || !record.reason_id)) {
        newErrorIds.add(member.id);
      }
    }

    if (newErrorIds.size > 0) {
      setErrorIds(newErrorIds);
      setError(`Cannot submit. You missed marking attendance or reasons for ${newErrorIds.size} team member(s). See highlighted rows.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const recordsToInsert = members.map((member) => ({
      module_id: moduleId,
      member_id: member.id,
      status: attendance[member.id].status,
      category: attendance[member.id].category || null,
      reason_id: attendance[member.id].reason_id || null,
      date: new Date().toISOString().split('T')[0],
    }));

    await supabase
      .from('attendance')
      .delete()
      .eq('module_id', moduleId)
      .eq('date', new Date().toISOString().split('T')[0]);

    const { error: insertError } = await supabase.from('attendance').insert(recordsToInsert);

    setIsSubmitting(false);

    if (insertError) {
      setError('Error saving attendance: ' + insertError.message);
    } else {
      router.push('/status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 md:px-10 md:py-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              {moduleName}
            </h1>
            <p className="text-slate-400 font-medium mt-1 tracking-wide">
              ATTENDANCE &bull; {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
          <Link href="/" className="relative z-10 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-8 rounded-r-lg shadow-sm flex items-start gap-3 animate-pulse">
              <AlertCircle className="text-red-600 w-6 h-6 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-red-800 font-bold text-lg">Incomplete Submission</h3>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 w-24">EPF</th>
                  <th className="p-4">Name</th>
                  <th className="p-4 text-center w-40">Status</th>
                  <th className="p-4 w-1/3">Absence Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => {
                  const record = attendance[member.id] || {};
                  const hasError = errorIds.has(member.id);
                  
                  return (
                    <tr key={member.id} className={`transition-colors ${hasError ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                      <td className="p-4 font-bold text-slate-800">
                        {member.epf}
                        {hasError && <AlertCircle className="w-4 h-4 text-red-500 inline ml-2" />}
                      </td>
                      <td className="p-4 font-medium text-slate-600">
                        {member.name}
                        <div className="text-xs text-slate-400 font-normal mt-0.5">{member.gender}</div>
                      </td>
                      
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <label className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                            record.status === 'Present' 
                              ? 'bg-green-100 border-green-500 text-green-800 shadow-sm' 
                              : hasError ? 'bg-white border-red-300 text-slate-500 hover:bg-slate-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                          }`}>
                            <input 
                              type="radio" 
                              name={`status-${member.id}`} 
                              value="Present" 
                              className="hidden"
                              checked={record.status === 'Present'}
                              onChange={() => handleStatusChange(member.id, 'Present')}
                            />
                            Present
                          </label>
                          <label className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                            record.status === 'Absent' 
                              ? 'bg-red-100 border-red-500 text-red-800 shadow-sm' 
                              : hasError ? 'bg-white border-red-300 text-slate-500 hover:bg-slate-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                          }`}>
                            <input 
                              type="radio" 
                              name={`status-${member.id}`} 
                              value="Absent" 
                              className="hidden"
                              checked={record.status === 'Absent'}
                              onChange={() => handleStatusChange(member.id, 'Absent')}
                            />
                            Absent
                          </label>
                        </div>
                      </td>
                      <td className="p-4">
                        {record.status === 'Absent' ? (
                          <div className="flex flex-col gap-2">
                            <select 
                              className={`w-full border-2 rounded-lg p-2 text-sm focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors font-medium ${(!record.category && hasError) ? 'border-red-400 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-700'}`}
                              value={record.category || ''}
                              onChange={(e) => handleCategoryChange(member.id, e.target.value)}
                            >
                              <option value="">-- Leave Category --</option>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            {record.category && (
                              <select 
                                className={`w-full border-2 rounded-lg p-2 text-sm focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors font-medium ${(!record.reason_id && hasError) ? 'border-red-400 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-700'}`}
                                value={record.reason_id || ''}
                                onChange={(e) => handleReasonChange(member.id, e.target.value)}
                              >
                                <option value="">-- Specific Reason --</option>
                                {reasons.filter(r => r.category === record.category).map(r => (
                                  <option key={r.id} value={r.id}>{r.reason_text}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-300 italic px-2">N/A</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-10 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 text-lg active:scale-95"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  Submit Attendance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
