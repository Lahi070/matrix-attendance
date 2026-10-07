"use client";

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { X, Download } from 'lucide-react';

type CategoryCounts = Record<string, number>;

interface AbsentMemberDetail {
  epf: string;
  name: string;
  moduleName: string;
  category: string;
  reasonId: string | null;
  isIndirect: boolean;
}

interface AbsenceBreakdownPanelProps {
  totalCounts: CategoryCounts;
  directCounts: CategoryCounts;
  indirectCounts: CategoryCounts;
  detailedAbsentees?: AbsentMemberDetail[];
  reasonMap?: Record<string, string>;
}

export default function AbsenceBreakdownPanel({ 
  totalCounts, 
  directCounts, 
  indirectCounts,
  detailedAbsentees = [],
  reasonMap = {}
}: AbsenceBreakdownPanelProps) {
  const [filter, setFilter] = useState<'total' | 'direct' | 'indirect'>('total');
  
  // Modal State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  let currentCounts = totalCounts;
  if (filter === 'direct') currentCounts = directCounts;
  if (filter === 'indirect') currentCounts = indirectCounts;

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const getFilteredAbsentees = () => {
    if (!selectedCategory) return [];
    
    const catLower = selectedCategory.toLowerCase();
    const isNotInform = catLower.includes('not inform');

    return detailedAbsentees.filter(member => {
      // 1. Filter by category
      const memberCatLower = member.category.toLowerCase();
      let matchesCat = false;
      
      if (isNotInform && memberCatLower.includes('not inform')) {
        matchesCat = true;
      } else if (member.category === selectedCategory) {
        matchesCat = true;
      }

      if (!matchesCat) return false;

      // 2. Filter by Direct/Indirect toggle
      if (filter === 'direct' && member.isIndirect) return false;
      if (filter === 'indirect' && !member.isIndirect) return false;

      return true;
    });
  };

  const filteredAbsentees = getFilteredAbsentees();

  const exportToExcel = () => {
    if (filteredAbsentees.length === 0) return;

    const data = filteredAbsentees.map((m, index) => ({
      'No.': index + 1,
      'EPF Number': m.epf,
      'Name': m.name,
      'Module': m.moduleName,
      'Category': m.category,
      'Reason': m.reasonId ? (reasonMap[m.reasonId] || 'N/A') : 'N/A',
      'Type': m.isIndirect ? 'Indirect' : 'Direct'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Absentees");
    
    // Auto-size columns
    const wscols = [
      { wch: 5 }, // No.
      { wch: 15 }, // EPF
      { wch: 30 }, // Name
      { wch: 20 }, // Module
      { wch: 20 }, // Category
      { wch: 30 }, // Reason
      { wch: 10 }, // Type
    ];
    worksheet['!cols'] = wscols;

    const fileName = `${selectedCategory}_Absentees_${filter}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  const exportTotalToExcel = () => {
    if (detailedAbsentees.length === 0) return;

    // Filter by the current Total/Direct/Indirect dropdown
    const absenteesToExport = detailedAbsentees.filter(member => {
      if (filter === 'direct' && member.isIndirect) return false;
      if (filter === 'indirect' && !member.isIndirect) return false;
      return true;
    });

    if (absenteesToExport.length === 0) return;

    const data = absenteesToExport.map((m, index) => ({
      'No.': index + 1,
      'EPF Number': m.epf,
      'Name': m.name,
      'Module': m.moduleName,
      'Category': m.category,
      'Reason': m.reasonId ? (reasonMap[m.reasonId] || 'N/A') : 'N/A',
      'Type': m.isIndirect ? 'Indirect' : 'Direct'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All_Absentees");
    
    // Auto-size columns
    const wscols = [
      { wch: 5 }, // No.
      { wch: 15 }, // EPF
      { wch: 30 }, // Name
      { wch: 20 }, // Module
      { wch: 20 }, // Category
      { wch: 30 }, // Reason
      { wch: 10 }, // Type
    ];
    worksheet['!cols'] = wscols;

    const fileName = `Total_Absentees_${filter}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <>
      <div className="bg-[#111827]/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-600/30 relative overflow-hidden group flex flex-col h-full min-h-[300px]">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3 relative z-10 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-200">
            Absence Breakdown
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportTotalToExcel}
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
              title="Download Total Absentees"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'total' | 'direct' | 'indirect')}
              className="bg-slate-800/80 border border-slate-600/50 text-slate-200 text-sm rounded-lg px-2 py-1 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="total">Total</option>
              <option value="direct">Direct</option>
              <option value="indirect">Indirect</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2 relative z-10 overflow-y-auto pr-2 custom-scrollbar flex-grow">
          {Object.entries(currentCounts).map(([category, count]) => {
            let colorClass = "text-slate-300";
            let bgClass = "bg-slate-700 text-slate-300";
            let hoverBg = "hover:bg-slate-700/50";
            
            const catLower = category.toLowerCase();
            
            if (catLower.includes('not inform')) {
              colorClass = "text-red-400";
              bgClass = "bg-red-500/20 text-red-300";
              hoverBg = "hover:bg-red-500/10 hover:border-red-500/30";
            } else if (category === 'Inform leave' || category === 'Planning leave') {
              colorClass = "text-blue-400";
              bgClass = "bg-blue-500/20 text-blue-300";
              hoverBg = "hover:bg-blue-500/10 hover:border-blue-500/30";
            } else if (category === 'Dutypay') {
              colorClass = "text-emerald-400";
              bgClass = "bg-emerald-500/20 text-emerald-300";
              hoverBg = "hover:bg-emerald-500/10 hover:border-emerald-500/30";
            } else if (category === 'Half day') {
              colorClass = "text-amber-400";
              bgClass = "bg-amber-500/20 text-amber-300";
              hoverBg = "hover:bg-amber-500/10 hover:border-amber-500/30";
            }

            return (
              <div 
                key={category} 
                onClick={() => count > 0 && handleCategoryClick(category)}
                className={`flex justify-between items-center bg-slate-800/50 border border-slate-600/30 p-2.5 rounded-xl transition-all ${count > 0 ? 'cursor-pointer ' + hoverBg : 'opacity-60 grayscale'}`}
              >
                <span className={`font-medium text-sm truncate pr-2 ${colorClass}`} title={category}>
                  {category.toLowerCase().includes('not inform') ? 'Not inform' : category}
                </span>
                <span className={`font-bold px-3 py-1 rounded-lg text-sm ${bgClass}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Detailed View */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                {selectedCategory}
                <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-md border border-slate-700">
                  {filteredAbsentees.length} Members ({filter})
                </span>
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={exportToExcel}
                  className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-5 overflow-auto custom-scrollbar flex-1">
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/50 text-slate-200 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">EPF</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Module</th>
                      <th className="p-4 hidden sm:table-cell">Type</th>
                      <th className="p-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredAbsentees.length > 0 ? (
                      filteredAbsentees.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 font-bold text-white">{m.epf}</td>
                          <td className="p-4">{m.name}</td>
                          <td className="p-4 text-blue-300">{m.moduleName}</td>
                          <td className="p-4 hidden sm:table-cell">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${m.isIndirect ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                              {m.isIndirect ? 'INDIRECT' : 'DIRECT'}
                            </span>
                          </td>
                          <td className="p-4 italic text-slate-400">
                            {m.reasonId ? (reasonMap[m.reasonId] || 'N/A') : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No members found for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
