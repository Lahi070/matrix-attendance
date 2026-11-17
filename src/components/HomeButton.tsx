'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface HomeButtonProps {
  label?: string;
  className?: string;
  href?: string;
}

export default function HomeButton({
  label = 'Home',
  className,
  href = '/',
}: HomeButtonProps) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  const defaultClasses = "bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 hover:border-slate-500 text-slate-300 px-5 py-2.5 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-lg cursor-pointer";

  return (
    <>
      <Link
        href={href}
        onClick={() => setLoading(true)}
        className={`${className || defaultClasses} ${loading ? 'opacity-85 pointer-events-none' : ''}`}
        aria-label={label}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{label}</span>
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
              Loading {label === 'Back' ? 'Home' : label}
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
