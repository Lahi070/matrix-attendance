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
    if (!designation || designation.trim() === '') return 'Team Member';
    const d = designation.toLowerCase().trim();
    if (d === 'n/a' || d === 'na') return 'N/A';
    if (d.includes('senior executive') || d.includes('sr executive') || d.includes('sr. executive')) return 'Senior Executive';
    if (d.includes('executive') || d.includes('exec')) return 'Executive';
    if (d.includes('dgm')) return 'DGM';
    if (d.includes('am') && d.length <= 3) return 'AM';
    if (d === 'am' || d.includes('assistant manager')) return 'AM';
    if (d.includes('gl') || d.includes('group leader')) return 'Group Leader';
    if (d.includes('tl') || d.includes('team leader')) return 'Team Leader';
    if (d.includes('mender')) return 'Mender';
    if (d.includes('indirect')) return 'Indirect';
    return 'Team Member';
  };

  const mapGender = (gender: string) => {
    if (!gender || gender.trim() === '') return 'N/A';
    const g = gender.toLowerCase().trim();
    if (g === 'n/a' || g === 'na' || g === '-' || g === 'n/ a') return 'N/A';
    if (g === 'm' || g === 'male') return 'Male';
    if (g === 'f' || g === 'female') return 'Female';
    return 'N/A';
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
        moduleMap[m.name.trim().toLowerCase()] = m.id;
      });

      // 2. Process valid rows
      const validRows = [];
      const excelEpfs = new Set<string>();

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

        const cleanEpf = String(epf).trim();
        const rawGender = gender !== null && gender !== undefined ? String(gender).trim() : '';
        const rawDesig = desig !== null && desig !== undefined ? String(desig).trim() : '';
        
        // Log first few for debugging
        if (validRows.length < 5) {
          addLog(`[DEBUG] EPF=${cleanEpf} Name=${name} rawGender="${rawGender}" mapped="${mapGender(rawGender)}" rawDesig="${rawDesig}"`);
        }

        validRows.push({
          epf: cleanEpf,
          name: String(name).trim(),
          modName: modNameStr,
          modNameLower,
          gender: rawGender,
          desig: rawDesig
        });
        excelEpfs.add(cleanEpf);
      }

      addLog(`Found ${validRows.length} valid members after ignoring unneeded modules.`);

      // 3. Create missing modules
      const excelModules = [...new Set(validRows.map(r => r.modName))];
      for (const modName of excelModules) {
        const lower = modName.toLowerCase();
        if (!moduleMap[lower]) {
          addLog(`Creating new module: ${modName}`);
          const { data: newMod, error } = await supabase.from('modules').insert({ name: modName, is_active: true }).select('id').single();
          if (error) throw new Error(`Module create error: ${error.message}`);
          if (newMod) moduleMap[lower] = newMod.id;
        }
      }

      // 4. Get existing members by EPF
      const { data: existingMembers, error: membersErr } = await supabase.from('team_members').select('id, epf');
      if (membersErr) throw new Error(`Fetch members error: ${membersErr.message}`);
      
      const epfMap: Record<string, string> = {};
      const membersToDelete: string[] = [];

      existingMembers?.forEach(m => {
        epfMap[m.epf] = m.id;
        if (!excelEpfs.has(m.epf)) {
          membersToDelete.push(m.epf);
        }
      });

      // 5. Delete members not in excel
      if (membersToDelete.length > 0) {
        addLog(`Removing ${membersToDelete.length} members who are no longer in the Excel sheet...`);
        // Delete in batches of 100
        for (let i = 0; i < membersToDelete.length; i += 100) {
          const batch = membersToDelete.slice(i, i + 100);
          const batchIds = existingMembers?.filter(m => batch.includes(m.epf)).map(m => m.id) || [];
          if (batchIds.length > 0) {
            const { error: attErr } = await supabase.from('attendance').delete().in('member_id', batchIds);
            if (attErr) throw new Error(`Delete attendance error: ${attErr.message}`);
          }
          const { error: delErr } = await supabase.from('team_members').delete().in('epf', batch);
          if (delErr) throw new Error(`Delete members error: ${delErr.message}`);
        }
        addLog(`Successfully removed old members.`);
      }

      // 6. Upsert rows
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
          const { error: updErr } = await supabase.from('team_members').update(payload).eq('epf', r.epf);
          if (updErr) throw new Error(`Update member error: ${updErr.message}`);
          updated++;
        } else {
          const { error: insErr } = await supabase.from('team_members').insert(payload);
          if (insErr) throw new Error(`Insert member error: ${insErr.message}`);
          inserted++;
        }

        if (i % 10 === 0) {
          setProgress(Math.round((i / validRows.length) * 100));
        }
      }

      // 7. Cleanup Empty Modules
      addLog(`Cleaning up any empty modules...`);
      const { data: allMods } = await supabase.from('modules').select('id, name');
      const { data: allMembers } = await supabase.from('team_members').select('module_id');
      if (allMods && allMembers) {
        const activeModuleIds = new Set(allMembers.map(m => m.module_id));
        const emptyMods = allMods.filter(m => !activeModuleIds.has(m.id));
        if (emptyMods.length > 0) {
          const emptyIds = emptyMods.map(m => m.id);
          const { error: errA } = await supabase.from('attendance').delete().in('module_id', emptyIds);
          if (errA) throw new Error(`Cleanup att error: ${errA.message}`);
          const { error: errM } = await supabase.from('modules').delete().in('id', emptyIds);
          if (errM) throw new Error(`Cleanup mod error: ${errM.message}`);
          addLog(`Removed ${emptyMods.length} empty modules.`);
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
    <div className="min-h-screen bg-transparent p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-[#111827]/80 backdrop-blur-xl rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-slate-700/50 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 relative z-10">Upload Cadre (Excel)</h1>
        <p className="text-slate-400 mb-8 relative z-10 font-medium">
          Upload the HR Excel sheet to automatically sync members. <br/>
          <strong className="text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20 ml-1">Note:</strong> Anyone NOT in the Excel sheet will be removed from the system. 
          Unneeded modules (FCDC, LTO, etc.) are ignored.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 relative z-10">
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-3 file:px-6
              file:rounded-xl file:border-0
              file:text-sm file:font-bold
              file:bg-indigo-900/40 file:text-indigo-400
              hover:file:bg-indigo-900/60 file:border file:border-indigo-800/50 cursor-pointer bg-slate-900/80 border border-slate-700 rounded-xl transition-all file:transition-all"
          />
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {loading ? 'Processing...' : 'Upload'}
          </button>
        </div>

        {loading && (
          <div className="mb-8 relative z-10">
            <div className="w-full bg-slate-800/80 rounded-full h-3 mb-3 border border-slate-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs font-bold text-slate-400 text-right">{progress}% completed</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 p-5 rounded-xl flex items-start gap-4 mb-8 border border-emerald-500/30 relative z-10 shadow-inner">
            <CheckCircle className="w-7 h-7 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-lg">Database Updated Successfully!</h3>
              <p className="text-sm mt-1 text-emerald-500">The cadre has been perfectly synchronized with the Excel sheet.</p>
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 overflow-hidden relative z-10 shadow-inner">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/80">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Process Logs</h3>
            </div>
            <div className="max-h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 custom-scrollbar pr-2">
              {logs.map((log, i) => (
                <div key={i} className="bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/30">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
