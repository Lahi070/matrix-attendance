/* eslint-disable */
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function UploadCadrePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const mapRole = (designation: string) => {
    if (!designation) return 'Team Member';
    const d = designation.toLowerCase();
    if (d.includes('gl')) return 'Group Leader';
    if (d.includes('team leader')) return 'Team Leader';
    if (d.includes('mender')) return 'Mender';
    if (d.includes('indirect')) return 'Indirect';
    return 'Team Member';
  };

  const mapGender = (gender: string) => {
    if (gender === 'Male' || gender === 'Female') return gender;
    return 'Female';
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setSuccess(false);
    setLogs([]);
    addLog(`Starting upload for ${file.name}...`);

    try {
      const dataBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);

      addLog(`Found ${rows.length} rows in the Excel sheet.`);

      // 1. Get existing modules
      const { data: existingModules } = await supabase.from('modules').select('id, name');
      const moduleMap: Record<string, string> = {};
      existingModules?.forEach(m => {
        moduleMap[m.name] = m.id;
      });

      // 2. Extract unique modules from Excel and create missing ones
      const excelModules = [...new Set(rows.map(r => r['New Module']).filter(Boolean))];
      for (const modName of excelModules) {
        if (!moduleMap[modName as string]) {
          addLog(`Creating new module: ${modName}`);
          const { data: newMod } = await supabase.from('modules').insert({ name: modName, is_active: true }).select('id').single();
          if (newMod) moduleMap[modName as string] = newMod.id;
        }
      }

      // 3. Get existing members by EPF
      const { data: existingMembers } = await supabase.from('team_members').select('id, epf');
      const epfMap: Record<string, string> = {};
      existingMembers?.forEach(m => {
        epfMap[m.epf] = m.id;
      });

      // 4. Process rows
      let updated = 0;
      let inserted = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.EPF || !row.Name || !row['New Module']) continue;

        const epf = String(row.EPF).trim();
        const name = String(row.Name).trim();
        const gender = mapGender(row.Gender);
        const role = mapRole(row.Designation);
        const moduleId = moduleMap[row['New Module']];

        if (!moduleId) continue;

        const payload = {
          name,
          epf,
          gender,
          role,
          module_id: moduleId
        };

        if (epfMap[epf]) {
          // Update
          await supabase.from('team_members').update(payload).eq('epf', epf);
          updated++;
        } else {
          // Insert
          await supabase.from('team_members').insert(payload);
          inserted++;
        }

        if (i % 10 === 0) {
          setProgress(Math.round((i / rows.length) * 100));
        }
      }

      setProgress(100);
      addLog(`Successfully inserted ${inserted} and updated ${updated} members!`);
      setSuccess(true);
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Upload Cadre (Excel)</h1>
        <p className="text-slate-500 mb-6">
          Upload the HR Excel sheet to automatically add new members and update existing ones. 
          Make sure the sheet has columns: <span className="font-mono bg-slate-100 px-1">EPF</span>, 
          <span className="font-mono bg-slate-100 px-1">Name</span>, 
          <span className="font-mono bg-slate-100 px-1">Gender</span>, 
          <span className="font-mono bg-slate-100 px-1">Designation</span>, 
          <span className="font-mono bg-slate-100 px-1">New Module</span>.
        </p>

        <div className="flex items-center gap-4 mb-6">
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-full"
          />
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {loading ? 'Processing...' : 'Upload'}
          </button>
        </div>

        {loading && (
          <div className="mb-6">
            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: ${progress}% }}></div>
            </div>
            <p className="text-xs text-slate-500 text-right">{progress}% completed</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-start gap-3 mb-6 border border-green-200">
            <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">Database Updated Successfully!</h3>
              <p className="text-sm mt-1">The cadre has been synchronized with the Excel sheet.</p>
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-slate-900 rounded-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Process Logs</h3>
            </div>
            <div className="max-h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
