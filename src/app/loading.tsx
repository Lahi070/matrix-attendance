import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-sans text-slate-200 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: 'url("/bg-fingerprint.png")' }}
    >
      <div className="absolute inset-0 bg-[#070b14]/50"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-900/30 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-center p-8 rounded-3xl bg-[#0a1120]/95 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] backdrop-blur-md max-w-sm mx-4 text-center">
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin absolute" />
        </div>
        <p className="text-lg font-bold text-slate-100 tracking-wide">
          Loading MAS Matrix
        </p>
        <p className="text-xs text-cyan-400/90 mt-1.5 font-medium animate-pulse tracking-wider uppercase">
          Please wait a moment...
        </p>
      </div>
    </div>
  );
}
