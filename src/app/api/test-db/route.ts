/* eslint-disable */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Add a test member
  const testEpf = 'TEST-9999';
  const { data: inserted, error: insertError } = await supabase
    .from('team_members')
    .insert([
      { name: 'Test User', epf: testEpf, gender: 'Female', role: 'Team Member', module_id: 'a302a0c8-0836-4c5c-b1cf-c32846ceaaa3' } // using random module ID from seed
    ])
    .select();

  if (insertError) {
    return NextResponse.json({ step: 'INSERT', error: insertError });
  }

  // 2. Read the member
  const { data: read, error: readError } = await supabase
    .from('team_members')
    .select('*')
    .eq('epf', testEpf)
    .single();

  // 3. Delete the member
  const { error: deleteError } = await supabase
    .from('team_members')
    .delete()
    .eq('epf', testEpf);

  return NextResponse.json({
    success: true,
    message: 'Test completed: Inserted, Read, and Deleted successfully.',
    inserted_record: inserted,
    read_record: read,
    delete_error: deleteError
  });
}

