/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit2, Save, X, Percent } from 'lucide-react';

export default function ManualPercentageCard({ dbTotal, totalAbsent }: { dbTotal: number; totalAbsent: number }) {
  const [manualPercentage, setManualPercentage] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tempVal, setTempVal] = useState<string>('');

  const calculatedPercentage = dbTotal > 0 ? ((totalAbsent / dbTotal) * 100) : 0;

  useEffect(() => {
    const fetchSettings = async () => {
      // We store the manual percentage override in the existing manual_cadre column
      // Values > 200 are treated as cadre count (old logic), values <= 200 as direct percentage
      const { data } = await supabase.from('system_settings').select('manual_cadre').eq('id', 1).single();
      if (data && data.manual_cadre && data.manual_cadre <= 200) {
        // This is a percentage value stored in manual_cadre
        setManualPercentage(data.manual_cadre);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    const num = parseFloat(tempVal);
    if (isNaN(num) || num < 0 || num > 100) {
      alert("Please enter a valid percentage between 0 and 100");
      return;
    }
    
    // Store percentage in manual_cadre column (values ≤ 200 = percentage override)
    const { error } = await supabase.from('system_settings').update({ manual_cadre: num }).eq('id', 1);
    
    if (error) {
      alert("Failed to save: " + error.message);
      console.error(error);
    } else {
      setManualPercentage(num);
      setIsEditing(false);
    }
  };

  const activePercentage = manualPercentage > 0 ? manualPercentage : calculatedPercentage;

  if (loading) return (
    <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-700/50 relative overflow-hidden animate-pulse h-40">
    </div>
  );

  return (
    <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-blue-500/20 shadow-blue-500/10 relative overflow-hidden group">
      {/* Pink/Red glow effect */}
      <div className="absolute -left-4 -top-4 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl group-hover:bg-pink-500/30 transition-all"></div>
      
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            ABSENCE % 
            {!isEditing && (
              <button onClick={() => { setIsEditing(true); setTempVal(String(activePercentage.toFixed(1))); }} className="text-slate-500 hover:text-pink-400 transition-colors" title="Edit Percentage">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </p>
          <h3 className="text-4xl font-black bg-gradient-to-r from-pink-400 to-red-500 bg-clip-text text-transparent">{activePercentage.toFixed(1)}%</h3>
          <p className="text-pink-500 text-xs font-medium mt-2 tracking-wide uppercase">ABSENCE</p>
          
          <div className="mt-3 text-[10px] text-slate-500 font-medium">
            {isEditing ? (
              <div className="flex items-center gap-2 mt-2 bg-[#1f2937]/80 p-2 rounded-lg border border-slate-700/50">
                <span className="shrink-0 text-slate-400">%</span>
                <input 
                  type="number"
                  step="0.1"
                  value={tempVal}
                  onChange={(e) => setTempVal(e.target.value)}
                  className="w-16 bg-[#0a101d] border border-slate-700 rounded px-2 py-1 text-white outline-none focus:border-pink-500 text-xs"
                />
                <button onClick={handleSave} className="p-1 text-green-400 hover:text-green-300 transition-colors">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-1 text-red-400 hover:text-red-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  Total System Cadre: <span className="text-slate-300 font-bold">{dbTotal}</span> 
                </div>
                {manualPercentage > 0 && (
                  <div className="text-yellow-500/80 mt-1">Manual Override Active</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-pink-500/10 border border-pink-500/20 p-3 rounded-xl shadow-inner group-hover:bg-pink-500/20 transition-all">
          <Percent className="w-5 h-5 text-pink-500" />
        </div>
      </div>
    </div>
  );
}
