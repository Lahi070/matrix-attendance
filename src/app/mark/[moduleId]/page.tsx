import { supabase } from '@/lib/supabase';
import AttendanceForm from './AttendanceForm';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Disable caching

export default async function MarkAttendancePage({ params }: { params: { moduleId: string } }) {
  const { moduleId } = await params;
  
  const { data: moduleData } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (!moduleData) {
    return notFound();
  }

  const { data: rawMembers } = await supabase
    .from('team_members')
    .select('id, name, epf, gender')
    .eq('module_id', moduleId);

  const members = (rawMembers || []).sort((a, b) => {
    const epfA = parseInt(a.epf, 10);
    const epfB = parseInt(b.epf, 10);
    if (isNaN(epfA) && isNaN(epfB)) return a.epf.localeCompare(b.epf);
    if (isNaN(epfA)) return 1;
    if (isNaN(epfB)) return -1;
    return epfA - epfB;
  });

  const { data: reasons } = await supabase
    .from('absence_reasons')
    .select('*');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4 font-sans text-slate-200">
      <div className="max-w-4xl w-full">
        <AttendanceForm 
          moduleId={moduleData.id}
          moduleName={moduleData.name}
          members={members || []}
          reasons={reasons || []}
        />
      </div>
    </div>
  );
}
