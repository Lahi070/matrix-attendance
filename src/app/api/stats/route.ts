import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data } = await supabase.from('team_members').select('epf, name, gender').in('epf', ['1234', '1417', '1551', '1552']);
  return NextResponse.json({ data });
}
