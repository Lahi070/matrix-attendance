import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: mods } = await supabase.from('modules').select('id, name');
  if (!mods) return NextResponse.json({ error: 'No modules found' });

  const toDelete = mods.filter(m => {
    const n = m.name.toLowerCase();
    return n.includes('fcdc') || n.includes('lto') || n.includes('outsource') || n.includes('washing');
  });

  const ids = toDelete.map(m => m.id);

  if (ids.length > 0) {
    const { error: err2 } = await supabase.from('modules').delete().in('id', ids);
    if (err2) return NextResponse.json({ error: err2.message });
  }

  return NextResponse.json({ success: true, deleted_modules: toDelete.map(m => m.name) });
}
