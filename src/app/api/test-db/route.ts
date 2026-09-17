/* eslint-disable */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { data, error } = await supabase.from('modules').select('*');
  return NextResponse.json(data);
}

