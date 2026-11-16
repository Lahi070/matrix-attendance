'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

export default function ModuleToggleButton({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <button
        type="submit"
        disabled
        aria-label="Updating module status"
        className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 cursor-wait shrink-0"
      >
        <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
        <span>Loading</span>
      </button>
    );
  }

  return (
    <button
      type="submit"
      title={isActive ? 'Turn Off Module' : 'Turn On Module'}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors duration-200 ease-in-out border border-transparent ${
        isActive ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-600 hover:bg-slate-500'
      }`}
    >
      <span className="sr-only">Toggle Module</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0.5 inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isActive ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
