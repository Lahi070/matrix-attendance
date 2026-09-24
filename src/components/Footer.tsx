export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#070b14]/95 backdrop-blur-md py-4 mt-auto relative z-50">
      <div className="max-w-[98%] xl:max-w-[95%] mx-auto px-4 flex flex-col xl:flex-row justify-between items-center gap-2 xl:gap-4 text-[11px] md:text-xs text-slate-400/80 font-medium tracking-wide">
        <div className="flex items-center text-center xl:text-left">
          <span>Sewing Floor Operations <span className="mx-1.5 text-slate-500">•</span> Garment Manufacturing</span>
        </div>
        
        <div className="hidden xl:block w-px h-4 bg-slate-800/60"></div>
        
        <div className="flex items-center text-center">
          <span>Developer: W.A. Lahiru S. Dissanayake <span className="mx-1.5 text-slate-500">•</span> Contact: 070 2416664</span>
        </div>
        
        <div className="hidden xl:block w-px h-4 bg-slate-800/60"></div>
        
        <div className="flex items-center text-center xl:text-right">
          <span>Deployed on Vercel Hobby Free Tier <span className="mx-1.5 text-slate-500">•</span> Backed by Supabase Postgres</span>
        </div>
      </div>
    </footer>
  );
}
