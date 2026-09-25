'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { DownloadCloud, Loader2 } from 'lucide-react';

export default function DownloadCadreButton() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);

      // Fetch all team members with their module names
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          epf,
          name,
          role,
          gender,
          modules (
            name
          )
        `);

      if (error) {
        console.error('Error fetching team members:', error);
        alert('Failed to fetch team members for download.');
        return;
      }

      if (!members || members.length === 0) {
        alert('No data to download.');
        return;
      }

      // Map to the exact format expected by the upload functionality
      const exportData = members.map(m => {
        // Safely extract the module name
        let moduleName = '';
        if (m.modules) {
          if (Array.isArray(m.modules)) {
            moduleName = m.modules[0]?.name || '';
          } else {
            moduleName = (m.modules as any).name || '';
          }
        }

        return {
          'EPF': m.epf || '',
          'Name': m.name || '',
          'NewModule': moduleName,
          'Designation': m.role || '',
          'Gender': m.gender || ''
        };
      });

      // Generate Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Current Cadre');

      // Add a timestamp to the filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Cadre_Backup_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error('Download error:', err);
      alert('An error occurred while generating the file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={loading}
      className="bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-600/40 text-emerald-300 px-5 py-2.5 rounded-lg font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <DownloadCloud className="w-5 h-5" />
      )}
      Download Cadre
    </button>
  );
}
