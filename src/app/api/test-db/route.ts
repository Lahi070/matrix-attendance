import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const epf = searchParams.get('epf');
  const newModuleId = searchParams.get('module');

  if (!epf) {
    const { data } = await supabase.from('team_members').select('id, name, epf, module_id').limit(5);
    return NextResponse.json({ message: 'Provide epf and module params', sample: data });
  }

  // Find member
  const { data: member } = await supabase.from('team_members').select('*').eq('epf', epf).single();
  if (!member) return NextResponse.json({ error: 'Member not found' });

  if (newModuleId) {
    // Attempt update
    const { data: updated, error } = await supabase
      .from('team_members')
      .update({ module_id: newModuleId })
      .eq('id', member.id)
      .select('*, modules(name)');
      
    return NextResponse.json({
      action: 'UPDATE',
      error,
      updated
    });
  }

  return NextResponse.json({ member });
}
