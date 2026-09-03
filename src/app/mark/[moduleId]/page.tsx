import { supabase } from '@/lib/supabase';
import AttendanceForm from './AttendanceForm';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Disable caching for dynamic data

interface PageProps {
  params: {
    moduleId: string;
  };
}

export default async function MarkAttendancePage({ params }: PageProps) {
  // Wait for params in Next.js 15+ (if using it), but for 14 it's fine.
  // Actually, in next 15 `params` is a promise, so let's await it just in case:
  const { moduleId } = await params;

  const { data: moduleData, error: moduleError } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (moduleError || !moduleData) {
    return notFound();
  }

  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('id, name, epf, gender')
    .eq('module_id', moduleId)
    .order('epf');

  const { data: reasons, error: reasonsError } = await supabase
    .from('absence_reasons')
    .select('id, category, reason_text')
    .order('category')
    .order('reason_text');

  return (
    <AttendanceForm 
      moduleId={moduleId}
      moduleName={moduleData.name}
      members={members || []}
      reasons={reasons || []}
    />
  );
}
