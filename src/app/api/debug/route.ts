import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Check Office module members with their roles
  const { data: officeMod } = await supabase
    .from('modules')
    .select('id, name')
    .ilike('name', '%office%')
    .single();

  let officeMembers = null;
  if (officeMod) {
    const { data } = await supabase
      .from('team_members')
      .select('epf, name, gender, role')
      .eq('module_id', officeMod.id);
    officeMembers = data;
  }

  // Check EPFs 1234, 1551, 1552
  const { data: specific } = await supabase
    .from('team_members')
    .select('epf, name, gender, role')
    .in('epf', ['1234', '1417', '1551', '1552']);

  return NextResponse.json({
    office_module: officeMod,
    office_members: officeMembers,
    specific_members: specific
  });
}
