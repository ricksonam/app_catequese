export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center animate-in fade-in duration-500">
      {/* Decorative background pulse */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative group">
        {/* Glowing ring around the icon */}
        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse scale-150 opacity-50" />
        
        <div className="relative bg-white dark:bg-zinc-900 w-28 h-28 rounded-[32px] shadow-2xl border border-primary/20 flex items-center justify-center animate-pulse-gentle">
          <img src="/app-icon.svg" className="w-full h-full p-2" alt="Catequese" />
        </div>
      </div>

      <div className="mt-10 text-center space-y-3 animate-float-up" style={{ animationDelay: '300ms' }}>
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-foreground tracking-tighter">Catequese IvC</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-[1px] w-4 bg-primary/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Iniciação à Vida Cristã</p>
            <div className="h-[1px] w-4 bg-primary/30" />
          </div>
        </div>
      </div>
      
      {/* Loading Progress Bar */}
      <div className="absolute bottom-20 flex flex-col items-center gap-4 w-full px-12 max-w-xs">
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/50">
          <div 
            className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" 
            style={{ 
              animation: 'progress-loading 2s ease-in-out forwards' 
            }} 
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
           <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Iniciando catequese...</p>
        </div>
      </div>

      <style>{`
        @keyframes progress-loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.95; }
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
