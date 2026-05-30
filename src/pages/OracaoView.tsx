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

            // Simple inline parser for **bold** and _italic_
            const parseText = (t: string) => {
              const parts = t.split(/(\*\*.*?\*\*|_.*?_)/g);
              return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('_') && part.endsWith('_')) {
                  return <em key={i} className="text-muted-foreground italic">{part.slice(1, -1)}</em>;
                }
                return part;
              });
            };

            // 1. Numbered Headings (e.g., "1. Silêncio...", "2. Abertura")
            if (/^\d+\.\s/.test(trimmed)) {
              return (
                <h3 key={index} className="font-bold text-foreground mt-8 mb-4 font-sans tracking-tight" style={{ fontSize: `${fontSize * 1.1}px` }}>
                  {trimmed}
                </h3>
              );
            }

            // 2. Pure Italic lines (Rubrics/Instructions)
            if (trimmed.startsWith('_') && trimmed.endsWith('_') && trimmed.indexOf('_', 1) === trimmed.length - 1) {
              return (
                <p key={index} className="italic text-muted-foreground mb-4" style={{ fontSize: `${fontSize * 0.9}px` }}>
                  {trimmed.slice(1, -1)}
                </p>
              );
            }

            // 3. Em-dash lines (Leader/Dirigente)
            if (trimmed.startsWith('—')) {
              return (
                <div key={index} className="flex mb-1.5 mt-2">
                  <span className="w-6 shrink-0 text-foreground font-light">—</span>
                  <p>{parseText(trimmed.substring(1).trim())}</p>
                </div>
              );
            }

            // 4. Regular lines (Response or continuation)
            return (
              <div key={index} className="flex mb-1.5 pl-6">
                <p>{parseText(trimmed)}</p>
              </div>
            );
          })}
        </div>
        
        <div className="w-16 h-px bg-liturgical/30 mt-12 mb-8"></div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Amém</p>
      </div>
    </div>
  );
}
