import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";
import { oracoesBase } from "@/data/oracoes";

export default function OracaoView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const oracao = oracoesBase.find(o => o.id === id);

  const [fontSize, setFontSize] = useState(18); // Default font size in px
  const [fullScreen, setFullScreen] = useState(false);

  // Toggle full screen mode
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  if (!oracao) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-sm font-bold text-muted-foreground">Oração não encontrada</p>
        <button onClick={() => navigate("/modulos/oracoes")} className="text-liturgical font-bold text-sm">Voltar</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${fullScreen ? "bg-amber-50/90 dark:bg-zinc-950 fixed inset-0 z-50 overflow-y-auto" : "pb-20"}`}>
      
      {/* Top Bar */}
      <div className={`sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-black/5 transition-all ${fullScreen ? "opacity-0 hover:opacity-100" : ""}`}>
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => fullScreen ? toggleFullScreen() : navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-black/5 shadow-sm active:scale-90 transition-all text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFontSize(prev => Math.max(14, prev - 2))} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-black/5 shadow-sm active:scale-90 transition-all text-foreground"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setFontSize(prev => Math.min(32, prev + 2))} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-black/5 shadow-sm active:scale-90 transition-all text-foreground"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1"></div>
            <button 
              onClick={toggleFullScreen} 
              className={`w-10 h-10 flex items-center justify-center rounded-xl border border-black/5 shadow-sm active:scale-90 transition-all ${fullScreen ? "bg-liturgical text-white" : "bg-white dark:bg-zinc-900 text-foreground"}`}
            >
              {fullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12 animate-fade-in flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-liturgical/10 text-xs font-black text-liturgical uppercase tracking-widest mb-6">
          {oracao.categoria}
        </span>
        
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-4 leading-tight">
          {oracao.titulo}
        </h1>
        
        {oracao.descricao && (
          <p className="text-sm font-medium text-muted-foreground mb-10 italic border-b border-black/5 pb-6 w-full max-w-md mx-auto">
            {oracao.descricao}
          </p>
        )}

        <div 
          className="font-serif text-foreground/90 w-full text-left transition-all duration-300"
          style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: '1.6',
            marginTop: oracao.descricao ? '0' : '2rem'
          }}
        >
          {oracao.texto.split('\n').map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return <div key={index} className="h-4"></div>;

            // Headers like "ABERTURA", "HINO"
            if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && !trimmed.includes(':') && !trimmed.startsWith('(')) {
              return (
                <h3 key={index} className="font-bold text-liturgical mt-10 mb-3 border-b border-liturgical/20 pb-2 tracking-widest font-sans" style={{ fontSize: `${fontSize * 1.1}px` }}>
                  {trimmed}
                </h3>
              );
            }

            // Rubrics/Instructions like "(Todos de pé)"
            if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
              return (
                <p key={index} className="italic text-muted-foreground mb-4" style={{ fontSize: `${fontSize * 0.85}px` }}>
                  {trimmed}
                </p>
              );
            }

            // Dialogues like "Dirigente: Vem..."
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex > 0 && colonIndex < 20) {
              const speaker = trimmed.substring(0, colonIndex);
              const text = trimmed.substring(colonIndex + 1);
              return (
                <p key={index} className="mb-3 whitespace-pre-wrap pl-4 -ml-4 border-l-2 border-transparent hover:border-liturgical/30 transition-colors">
                  <span className="font-bold text-foreground font-sans text-[0.9em] uppercase tracking-wide mr-1">{speaker}:</span>
                  {text}
                </p>
              );
            }

            // Default paragraph
            return (
              <p key={index} className="mb-4 whitespace-pre-wrap">
                {trimmed}
              </p>
            );
          })}
        </div>
        
        <div className="w-16 h-px bg-liturgical/30 mt-12 mb-8"></div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Amém</p>
      </div>
    </div>
  );
}
