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
    if (!gender) return 'Female';
    if (gender.toLowerCase().includes('male') && !gender.toLowerCase().includes('female')) return 'Male';
    return 'Female';
  };

  const getColVal = (row: any, ...keys: string[]) => {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
      if (row[key] !== undefined) return row[key];
      const match = rowKeys.find(rk => rk.toLowerCase().replace(/\s/g, '') === key.toLowerCase().replace(/\s/g, ''));
      if (match) return row[match];
    }
    return null;
  };

  const excludedModules = ['fcdc', 'lto', 'outsource', 'washing'];

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setSuccess(false);
    setLogs([]);
    addLog(\Starting upload for \...\);

    try {
      const dataBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);

      addLog(\Found \ rows in the Excel sheet.\);

      // 1. Get existing modules
      const { data: existingModules } = await supabase.from('modules').select('id, name');
      const moduleMap: Record<string, string> = {};
      existingModules?.forEach(m => {
        moduleMap[m.name.trim().toLowerCase()] = m.id;
      });

      // 2. Process valid rows
      const validRows = [];
      for (const row of rows) {
        const epf = getColVal(row, 'EPF', 'EmpNo', 'ID');
        const name = getColVal(row, 'Name', 'FullName', 'EmpName', 'EmployeeName');
        const mod = getColVal(row, 'NewModule', 'Module', 'Department', 'New Module');
        const desig = getColVal(row, 'Designation', 'Role', 'Position');
        const gender = getColVal(row, 'Gender', 'Sex');

        if (!epf || !name || !mod) continue;

        const modNameStr = String(mod).trim();
        const modNameLower = modNameStr.toLowerCase();

        // Skip excluded modules
        let isExcluded = false;
        for (const ex of excludedModules) {
          if (modNameLower.includes(ex)) {
            isExcluded = true;
            break;
          }
        }
        if (isExcluded) continue;

        validRows.push({
          epf: String(epf).trim(),
          name: String(name).trim(),
          modName: modNameStr,
          modNameLower,
          gender: String(gender || ''),
          desig: String(desig || '')
        });
      }

      addLog(\Found \ valid members after ignoring unneeded modules.\);

      // 3. Create missing modules
      const excelModules = [...new Set(validRows.map(r => r.modName))];
      for (const modName of excelModules) {
        const lower = modName.toLowerCase();
        if (!moduleMap[lower]) {
          addLog(\Creating new module: \\);
          const { data: newMod } = await supabase.from('modules').insert({ name: modName, is_active: true }).select('id').single();
          if (newMod) moduleMap[lower] = newMod.id;
        }
      }

      // 4. Get existing members by EPF
      const { data: existingMembers } = await supabase.from('team_members').select('id, epf');
      const epfMap: Record<string, string> = {};
      existingMembers?.forEach(m => {
        epfMap[m.epf] = m.id;
      });

      // 5. Upsert rows
      let updated = 0;
      let inserted = 0;

      for (let i = 0; i < validRows.length; i++) {
        const r = validRows[i];
        const moduleId = moduleMap[r.modNameLower];
        if (!moduleId) continue;

        const payload = {
          name: r.name,
          epf: r.epf,
          gender: mapGender(r.gender),
          role: mapRole(r.desig),
          module_id: moduleId
        };

        if (epfMap[r.epf]) {
          await supabase.from('team_members').update(payload).eq('epf', r.epf);
          updated++;
        } else {
          await supabase.from('team_members').insert(payload);
          inserted++;
        }

        if (i % 10 === 0) {
          setProgress(Math.round((i / validRows.length) * 100));
        }
      }

      setProgress(100);
      addLog(\Successfully inserted \ and updated \ members!\);
      setSuccess(true);
    } catch (err: any) {
      addLog(\ERROR: \\);
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
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: \\%\ }}></div>
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
