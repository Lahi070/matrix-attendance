'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Loader2 } from 'lucide-react';

interface DailyStatusButtonProps {
  className?: string;
}

export default function DailyStatusButton({ className }: DailyStatusButtonProps) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  const defaultClasses = "flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer";

  return (
    <>
      <Link
        href="/status"
        onClick={() => setLoading(true)}
        className={`${className || defaultClasses} ${loading ? 'opacity-85 pointer-events-none' : ''}`}
        aria-label="Daily Status"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-white shrink-0" />
            <span>Loading Daily Status...</span>
          </>
        ) : (
          <>
            <Activity className="w-5 h-5 shrink-0" />
            <span>Daily Status</span>
          </>
        )}
      </Link>

      {/* Prominent Fullscreen Centered Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070b14]/75 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-[#0a1120]/95 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] max-w-sm mx-4 text-center">
            <div className="relative mb-5 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin absolute" />
            </div>
            <p className="text-lg font-bold text-slate-100 tracking-wide">
              Loading Daily Status
            </p>
            <p className="text-xs text-cyan-400/90 mt-1.5 font-medium animate-pulse tracking-wider uppercase">
              Please wait a moment...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
