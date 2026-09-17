/* eslint-disable */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { data: modules } = await supabase.from('modules').select('*');
  const { data: team_members } = await supabase.from('team_members').select('name, module_id');
  return NextResponse.json({ modules, count: team_members?.length });
}
