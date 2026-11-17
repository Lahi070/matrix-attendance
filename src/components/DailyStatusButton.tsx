'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Loader2 } from 'lucide-react';

interface DailyStatusButtonProps {
  className?: string;
}

export default function DailyStatusButton({ className }: DailyStatusButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);
  const router = useRouter();

  // Prefetch route to optimize loading speed
  useEffect(() => {
    router.prefetch('/status');
  }, [router]);

  const isLoading = clicked || isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setClicked(true);
    startTransition(() => {
      router.push('/status');
    });
  };

  const defaultClasses = "flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`${className || defaultClasses} ${isLoading ? 'opacity-85 cursor-wait pointer-events-none' : ''}`}
      aria-label="Daily Status"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin text-white shrink-0" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          <Activity className="w-5 h-5 shrink-0" />
          <span>Daily Status</span>
        </>
      )}
    </button>
  );
}
