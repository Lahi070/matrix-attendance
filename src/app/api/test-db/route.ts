/* eslint-disable */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Get modules
  const { data: modules } = await supabase.from('modules').select('*');
  
  const cutting = modules?.find(m => m.name === 'Cutting');
  const laying = modules?.find(m => m.name === 'Laying');
  const batch = modules?.find(m => m.name === 'Batch Preparation');
  const needle = modules?.find(m => m.name === 'Needle recoder');

  let res1 = null;
  let res2 = null;

  // Move Laying -> Cutting
  if (cutting && laying && laying.is_active) {
    res1 = await supabase.from('team_members').update({ module_id: cutting.id }).eq('module_id', laying.id).select();
    await supabase.from('modules').update({ is_active: false }).eq('id', laying.id);
  }

  // Move Needle recoder -> Batch Preparation
  if (batch && needle && needle.is_active) {
    res2 = await supabase.from('team_members').update({ module_id: batch.id }).eq('module_id', needle.id).select();
    await supabase.from('modules').update({ is_active: false }).eq('id', needle.id);
  }

  return NextResponse.json({ 
    success: true, 
    laying_members_moved: res1?.data?.length,
    needle_members_moved: res2?.data?.length,
    res1_error: res1?.error,
    res2_error: res2?.error,
    modules: modules
  });
}
