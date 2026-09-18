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

  if (moduleData.name?.toLowerCase().includes('cutting')) {
    const laying = allModules?.find((m: any) => m.name?.toLowerCase().includes('laying'));
    if (laying) moduleIdsToFetch.push(laying.id);
  } else if (moduleData.name?.toLowerCase().includes('batch')) {
    const needle = allModules?.find((m: any) => m.name?.toLowerCase().includes('needle'));
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
    <div 
      className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-8 font-sans text-slate-200 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: 'url("/bg-fingerprint.png")' }}
    >
      {/* Light dark overlay to ensure text readability */}
      <div className="absolute inset-0 bg-[#070b14]/40"></div>

      <div className="max-w-7xl w-full relative z-10">
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
