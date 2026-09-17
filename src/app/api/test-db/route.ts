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

  const updates = [];

  // Move Laying -> Cutting
  if (cutting && laying) {
    updates.push(
      supabase.from('team_members').update({ module_id: cutting.id }).eq('module_id', laying.id)
    );
    updates.push(
      supabase.from('modules').update({ is_active: false }).eq('id', laying.id)
    );
  }

  // Move Needle recoder -> Batch Preparation
  if (batch && needle) {
    updates.push(
      supabase.from('team_members').update({ module_id: batch.id }).eq('module_id', needle.id)
    );
    updates.push(
      supabase.from('modules').update({ is_active: false }).eq('id', needle.id)
    );
  }

  await Promise.all(updates);

  return NextResponse.json({ success: true, message: 'Merged modules successfully' });
}

