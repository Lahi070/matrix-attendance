/* eslint-disable */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { data: modules } = await supabase.from('modules').select('*');
  
  const cutting = modules?.find(m => m.name === 'Cutting' || m.name.includes('Cutting'));
  const laying = modules?.find(m => m.name === 'Laying' || m.name.includes('Laying'));
  const batch = modules?.find(m => m.name === 'Batch Preparation' || m.name.includes('Batch'));
  const needle = modules?.find(m => m.name === 'Needle recoder' || m.name.includes('Needle'));

  let updates = [];

  if (cutting && laying) {
    const r1 = await supabase.from('team_members').update({ module_id: cutting.id }).eq('module_id', laying.id).select();
    const r2 = await supabase.from('modules').update({ is_active: false }).eq('id', laying.id).select();
    updates.push({ laying_move: r1, laying_disable: r2 });
  }

  if (batch && needle) {
    const r3 = await supabase.from('team_members').update({ module_id: batch.id }).eq('module_id', needle.id).select();
    const r4 = await supabase.from('modules').update({ is_active: false }).eq('id', needle.id).select();
    updates.push({ needle_move: r3, needle_disable: r4 });
  }

  return NextResponse.json({ 
    updates,
    cutting: cutting?.id, laying: laying?.id, batch: batch?.id, needle: needle?.id
  });
}
