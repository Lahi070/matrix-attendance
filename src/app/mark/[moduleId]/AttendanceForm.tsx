'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Planning leave', 'Inform leave', 'Not inform leave', 'Dutypay', 'Half day'];

  const handleStatusChange = (memberId: string, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: { status, category: '', reason_id: '' }, // Reset category/reason when switching
    }));
    setError('');
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    for (const member of members) {
      const record = attendance[member.id];
      if (!record || !record.status) {
        setError(`Not Complete: Please mark attendance for ${member.name} (${member.epf})`);
        return;
      }
      if (record.status === 'Absent') {
        if (!record.category || !record.reason_id) {
          setError(`Not Complete: Please select leave category and reason for ${member.name}`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    // Prepare data for DB
    const recordsToInsert = members.map((member) => ({
      module_id: moduleId,
      member_id: member.id,
      status: attendance[member.id].status,
      category: attendance[member.id].category || null,
      reason_id: attendance[member.id].reason_id || null,
      date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
    }));

    // Check if records already exist for today and this module
    // For simplicity, we just upsert or delete existing and insert.
    // Let's delete existing records for this module for today first to allow re-submission
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
      alert('Attendance marked successfully!');
      router.push('/status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{moduleName}</h1>
            <p className="opacity-80">Mark Attendance for {new Date().toLocaleDateString()}</p>
          </div>
          <Link href="/" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition-colors text-sm font-medium">
            Back
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Wait! </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">EPF</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Gender</th>
                  <th className="p-4 font-semibold text-center w-32">Status</th>
                  <th className="p-4 font-semibold w-1/3">Absence Details</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const record = attendance[member.id] || {};
                  return (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{member.epf}</td>
                      <td className="p-4 text-gray-700">{member.name}</td>
                      <td className="p-4 text-gray-500 text-sm">{member.gender}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <label className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            record.status === 'Present' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}>
                            <input 
                              type="radio" 
                              name={`status-${member.id}`} 
                              value="Present" 
                              className="hidden"
                              checked={record.status === 'Present'}
                              onChange={() => handleStatusChange(member.id, 'Present')}
                            />
                            P
                          </label>
                          <label className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            record.status === 'Absent' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}>
                            <input 
                              type="radio" 
                              name={`status-${member.id}`} 
                              value="Absent" 
                              className="hidden"
                              checked={record.status === 'Absent'}
                              onChange={() => handleStatusChange(member.id, 'Absent')}
                            />
                            A
                          </label>
                        </div>
                      </td>
                      <td className="p-4">
                        {record.status === 'Absent' && (
                          <div className="flex flex-col gap-2">
                            <select 
                              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                              value={record.category || ''}
                              onChange={(e) => handleCategoryChange(member.id, e.target.value)}
                            >
                              <option value="">-- Select Category --</option>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            {record.category && (
                              <select 
                                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={record.reason_id || ''}
                                onChange={(e) => handleReasonChange(member.id, e.target.value)}
                              >
                                <option value="">-- Select Reason --</option>
                                {reasons.filter(r => r.category === record.category).map(r => (
                                  <option key={r.id} value={r.id}>{r.reason_text}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Submit Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
