import { supabase } from '@/lib/supabase';
import AttendanceForm from './AttendanceForm';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Disable caching

export default async function MarkAttendancePage({ params }: { params: { moduleId: string } }) {
  const { moduleId } = await params;
  
  const { data: allModules } = await supabase.from('modules').select('*');
  const moduleData = allModules?.find((m: any) => m.id === moduleId);

  if (!moduleData) {
    return notFound();
  }

  let moduleIdsToFetch = [moduleId];

  if (moduleData.name === 'Cutting') {
    const laying = allModules?.find((m: any) => m.name === 'Laying');
    if (laying) moduleIdsToFetch.push(laying.id);
  } else if (moduleData.name === 'Batch Preparation') {
    const needle = allModules?.find((m: any) => m.name === 'Needle recoder');
    if (needle) moduleIdsToFetch.push(needle.id);
  }

  const { data: rawMembers } = await supabase
    .from('team_members')
    .select('id, name, epf, gender, role')
    .in('module_id', moduleIdsToFetch)
    .not('role', 'in', '("DGM","AM","Executive","Senior Executive")');

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
