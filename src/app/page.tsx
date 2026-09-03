import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 0; // Disable caching

export default async function Home() {
  const { data: modules, error } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          MAS Matrix
        </h1>
        <h2 className="text-md font-medium text-center text-gray-500 mb-8 uppercase tracking-wider">
          Sewing Department
        </h2>
        
        <div className="flex flex-col gap-4 mb-8">
          <p className="text-sm font-medium text-gray-600 mb-2 text-center">Select Module</p>
          {modules && modules.length > 0 ? (
            modules.map((mod) => (
              <Link 
                key={mod.id} 
                href={`/mark/${mod.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-gray-800 group-hover:text-blue-700">{mod.name}</div>
                  <div className="text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
                {mod.responsible_leader && (
                  <div className="text-xs text-gray-500 mt-1">Leader: {mod.responsible_leader}</div>
                )}
              </Link>
            ))
          ) : (
            <p className="text-center text-gray-500 bg-gray-50 py-4 rounded border border-gray-200">No active modules. (Or database not connected)</p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
           <Link href="/status" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
             View Daily Status
           </Link>
           <Link href="/admin" className="text-gray-400 hover:text-gray-600 font-medium">
             Admin Login
           </Link>
        </div>
      </div>
    </div>
  );
}
