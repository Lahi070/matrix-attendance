/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit2, Save, X, Users } from 'lucide-react';

export default function ManualPercentageCard({ dbTotal, totalAbsent }: { dbTotal: number; totalAbsent: number }) {
  const [manualCadre, setManualCadre] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tempVal, setTempVal] = useState<string>('');

  const activeCadre = manualCadre > 0 ? manualCadre : dbTotal;
  const activePercentage = activeCadre > 0 ? ((totalAbsent / activeCadre) * 100) : 0;

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('system_settings').select('manual_cadre').eq('id', 1).single();
      if (data && data.manual_cadre) {
        setManualCadre(data.manual_cadre);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    const num = parseInt(tempVal, 10);
    // Allow saving 0 to clear the override
    if (isNaN(num) || num < 0) {
      alert("Please enter a valid cadre number");
      return;
    }
    
    const { error } = await supabase.from('system_settings').update({ manual_cadre: num }).eq('id', 1);
    
    if (error) {
      alert("Failed to save: " + error.message);
      console.error(error);
    } else {
      setManualCadre(num);
      setIsEditing(false);
    }
  };

  if (loading) return (
    <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-700/50 relative overflow-hidden animate-pulse h-40">
    </div>
  );

  return (
    <div className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-blue-500/20 shadow-blue-500/10 relative overflow-hidden group">
      {/* Glow effect */}
      <div className="absolute -left-4 -top-4 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl group-hover:bg-pink-500/30 transition-all"></div>
      
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            CALCULATION CADRE
            {!isEditing && (
              <button onClick={() => { setIsEditing(true); setTempVal(String(activeCadre)); }} className="text-slate-500 hover:text-pink-400 transition-colors" title="Edit Cadre Override">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </p>
          <h3 className="text-4xl font-black bg-gradient-to-r from-pink-400 to-red-500 bg-clip-text text-transparent">{activeCadre}</h3>
          <p className="text-pink-500 text-xs font-medium mt-2 tracking-wide uppercase">Absence: {activePercentage.toFixed(1)}%</p>
          
          <div className="mt-3 text-[10px] text-slate-500 font-medium">
            {isEditing ? (
              <div className="flex flex-col gap-2 mt-2 bg-[#1f2937]/80 p-2 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    value={tempVal}
                    onChange={(e) => setTempVal(e.target.value)}
                    className="w-16 bg-[#0a101d] border border-slate-700 rounded px-2 py-1 text-white outline-none focus:border-pink-500 text-xs"
                    placeholder="Clear=0"
                  />
                  <button onClick={handleSave} className="p-1 text-green-400 hover:text-green-300 transition-colors">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-1 text-red-400 hover:text-red-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[9px] text-slate-400">Set to 0 to use System Cadre</div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  System DB Cadre: <span className="text-slate-300 font-bold">{dbTotal}</span> 
                </div>
                {manualCadre > 0 && manualCadre !== dbTotal && (
                  <div className="text-yellow-500/80 mt-1">Manual Cadre Override Active</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-pink-500/10 border border-pink-500/20 p-3 rounded-xl shadow-inner group-hover:bg-pink-500/20 transition-all">
          <Users className="w-5 h-5 text-pink-500" />
        </div>
      </div>
    </div>
  );
}
