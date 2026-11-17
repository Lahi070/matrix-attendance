'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);
  const router = useRouter();

  // Prefetch route on mount
  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  const isLoading = clicked || isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setClicked(true);
    startTransition(() => {
      router.push(href);
    });
  };

  const defaultClasses = "bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 hover:border-slate-500 text-slate-300 px-5 py-2.5 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-lg cursor-pointer";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`${className || defaultClasses} ${isLoading ? 'opacity-85 cursor-wait pointer-events-none' : ''}`}
      aria-label={label}
    >
      {isLoading ? (
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
    </button>
  );
}
