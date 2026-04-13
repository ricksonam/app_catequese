export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center animate-in fade-in duration-500">
      {/* Decorative background pulse */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] animate-pulse" />
      </div>

      <div className="relative group perspective-1000">
        {/* Glowing ring around the icon - enlarged and better contrast */}
        <div className="absolute -inset-10 bg-primary/25 rounded-full blur-3xl animate-pulse scale-125 opacity-40 transform-gpu" />
        
        <div className="relative w-56 h-56 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center animate-float-float transform-gpu will-change-transform shadow-2xl">
          <img src="/app-icon.png" className="w-full h-full object-contain p-2" alt="Catequese" />
        </div>
      </div>

      <div className="mt-8 text-center space-y-4 animate-float-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-center gap-3">
          <div className="h-[1px] w-8 bg-primary/30" />
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-primary drop-shadow-sm">Iniciação à Vida Cristã</p>
          <div className="h-[1px] w-8 bg-primary/30" />
        </div>
      </div>
      
      {/* Loading Progress Bar */}
      <div className="absolute bottom-20 flex flex-col items-center gap-5 w-full px-12 max-w-sm">
        <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden border border-border/40 backdrop-blur-sm">
          <div 
            className="h-full bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)]" 
            style={{ 
              animation: 'progress-loading 2s ease-in-out forwards' 
            }} 
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 backdrop-blur-md">
           <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
           <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Preparando encontro...</p>
        </div>
      </div>

      <style>{`
        @keyframes progress-loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        @keyframes float-float {
          0%, 100% { transform: translateY(0) scale(1) translate3d(0,0,0); }
          50% { transform: translateY(-20px) scale(1.02) translate3d(0,0,0); }
        }
        .animate-float-float {
          animation: float-float 3s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
