import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Attempt to update 'Sunday work' from 'Planning leave' to 'Dutypay'
    const { data, error } = await supabase
      .from('absence_reasons')
      .update({ category: 'Dutypay' })
      .ilike('reason_text', '%Sunday%')
      .eq('category', 'Planning leave')
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, updated: data });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
