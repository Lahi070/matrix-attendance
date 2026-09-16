import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Step 1: Check current data for these EPFs
  const { data: members, error: fetchErr } = await supabase
    .from('team_members')
    .select('id, epf, name, gender, role')
    .in('epf', ['1234', '1417', '1551', '1552']);

  // Step 2: Try to update EPF 1234 gender to N/A directly
  const { data: updateResult, error: updateErr } = await supabase
    .from('team_members')
    .update({ gender: 'N/A' })
    .eq('epf', '1234')
    .select('id, epf, name, gender');

  // Step 3: Check total count
  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true });

  // Step 4: Check modules
  const { data: modules } = await supabase
    .from('modules')
    .select('id, name');

  return NextResponse.json({
    step1_current_data: members,
    step1_error: fetchErr?.message || null,
    step2_update_result: updateResult,
    step2_update_error: updateErr?.message || null,
    step3_total_members: count,
    step4_modules: modules?.map(m => m.name),
    step4_module_count: modules?.length
  });
}
