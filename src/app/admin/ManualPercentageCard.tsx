/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit2, Save, X, Percent } from 'lucide-react';

export default function ManualPercentageCard({ dbTotal, totalAbsent }: { dbTotal: number; totalAbsent: number }) {
  const [manualCadre, setManualCadre] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tempVal, setTempVal] = useState<string>('');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('system_settings').select('manual_cadre').eq('id', 1).single();
      if (data) {
        setManualCadre(data.manual_cadre || 0);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    const num = parseInt(tempVal);
    if (isNaN(num) || num < 0) {
      alert("Please enter a valid number");
      return;
    }
    
    // Check if table exists/row exists, upsert using basic update
    const { error } = await supabase.from('system_settings').update({ manual_cadre: num }).eq('id', 1);
    
    if (error) {
      alert("Failed to save. Make sure the system_settings table exists.");
    } else {
      setManualCadre(num);
      setIsEditing(false);
    }
  };

  const activeTotal = manualCadre > 0 ? manualCadre : dbTotal;
  const percentage = activeTotal > 0 ? ((totalAbsent / activeTotal) * 100).toFixed(1) : '0.0';

  if (loading) return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden animate-pulse">
      <div className="h-16"></div>
    </div>
  );

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
      <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
      
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
            Absence % 
            {!isEditing && (
              <button onClick={() => { setIsEditing(true); setTempVal(String(activeTotal)); }} className="text-slate-400 hover:text-white transition-colors" title="Edit Total Cadre">
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </p>
          <h3 className="text-4xl font-black text-red-400">{percentage}%</h3>
          
          <div className="mt-3 text-xs text-slate-400 font-medium">
            {isEditing ? (
              <div className="flex items-center gap-2 mt-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
                <span className="shrink-0 text-slate-300">Target Cadre:</span>
                <input 
                  type="number" 
                  value={tempVal}
                  onChange={(e) => setTempVal(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white outline-none"
                />
                <button onClick={handleSave} className="p-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600 hover:text-white transition-colors">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                Calculated on Cadre: <span className="text-white font-bold">{activeTotal}</span> 
                {manualCadre > 0 && <span className="text-yellow-400 ml-1">(Manual Override)</span>}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30">
          <Percent className="w-6 h-6 text-red-400" />
        </div>
      </div>
    </div>
  );
}
