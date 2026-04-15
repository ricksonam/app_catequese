import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, Check, Type, Edit, Download, Image as ImageIcon, Send, Share2, Layers, Zap } from 'lucide-react';
import html2canvas from 'html2canvas';

type FilterType = 'normal' | 'vintage' | 'pb' | 'vibrante' | 'quente' | 'frio';

export type FrameType = 'nenhuma' | 'aniversario' | 'infantil_menina' | 'infantil_menino' | 'eucaristia' | 'retiro';

interface PhotoEditorProps {
  imageSrc: string;
  onClose: () => void;
  onSave: (blob: Blob, legenda: string, isCriatividade: boolean) => Promise<void>;
}

export function PhotoEditor({ imageSrc, onClose, onSave }: PhotoEditorProps) {
  const [filter, setFilter] = useState<FilterType>('normal');
  const [frame, setFrame] = useState<FrameType>('aniversario'); // Default to a decorative frame initially to wow user
  const [text, setText] = useState('');
  const [legenda, setLegenda] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'filtros' | 'molduras' | 'texto'>('molduras');
  
  const containerRef = useRef<HTMLDivElement>(null);

  const getFilterStyle = (f: FilterType) => {
    switch (f) {
      case 'vintage': return 'sepia(40%) contrast(110%) saturate(120%)';
      case 'pb': return 'grayscale(100%) contrast(120%)';
      case 'vibrante': return 'saturate(150%) contrast(110%)';
      case 'quente': return 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
      case 'frio': return 'saturate(110%) hue-rotate(10deg)';
      default: return 'none';
    }
  };

  const currentFilterStyle = getFilterStyle(filter);

  const handleSave = async () => {
    if (!containerRef.current) return;
    setIsProcessing(true);
    try {
      // Small pause to ensure rendering
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(containerRef.current, {
        scale: 2, // High quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#000000'
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          await onSave(blob, legenda || 'Minha Arte', true);
        } else {
          console.error("Falha ao gerar blob");
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.85);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col h-[100dvh] w-full text-white animate-in slide-in-from-bottom-5">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 shrink-0">
        <button onClick={onClose} disabled={isProcessing} className="p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all">
          <X className="w-5 h-5" />
        </button>
        <div className="font-black tracking-widest uppercase text-sm text-primary flex items-center gap-2">
          <Zap className="w-4 h-4" /> Estúdio Mágico
        </div>
        <button 
          onClick={handleSave} 
          disabled={isProcessing}
          className="px-4 py-2 bg-primary text-primary-foreground font-black rounded-full shadow-lg shadow-primary/30 flex items-center gap-2 active:scale-95 transition-all"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          SALVAR
        </button>
      </div>

      {/* CANVAS PREVIEW AREA */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-zinc-900 border-y border-white/5">
        <div 
          ref={containerRef} 
          className="relative max-w-[90%] max-h-[90%] aspect-square shadow-2xl overflow-hidden bg-black flex items-center justify-center rounded-sm"
          style={{ width: '100vw', maxWidth: '400px' }} // keep it squareish or aspect-fit
        >
          {/* Base Image */}
          <img 
            src={imageSrc} 
            alt="Preview" 
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover select-none" 
            style={{ filter: currentFilterStyle, transition: 'filter 0.3s' }} 
          />
          
          {/* Text Overlay */}
          {text && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20">
                <p className="text-white font-black text-2xl text-center leading-tight drop-shadow-md" style={{ fontFamily: 'var(--font-heading)' }}>
                  {text}
                </p>
              </div>
            </div>
          )}

          {/* SVG Frames Overlays */}
          {frame !== 'nenhuma' && <FrameOverlay type={frame} />}
        </div>
      </div>

      {/* EDITOR CONTROLS */}
      <div className="shrink-0 bg-zinc-950 pb-safe">
        {/* Input Text/Legenda (Always visible bottom) */}
        <div className="px-5 pt-4">
          <input 
            type="text" 
            placeholder="Legenda para a postagem..." 
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none transition-all"
          />
        </div>

        {/* Dynamic Panel based on activeTab */}
        <div className="h-32 px-5 py-4 flex items-center overflow-x-auto snap-x hide-scrollbar">
          
          {activeTab === 'filtros' && (
            <div className="flex gap-4 min-w-max px-2">
              {(['normal', 'vintage', 'pb', 'vibrante', 'quente', 'frio'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex flex-col items-center gap-2 snap-center transition-all ${filter === f ? 'scale-110' : 'opacity-60 grayscale'}`}
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-transparent" style={{ borderColor: filter === f ? 'var(--primary)' : 'transparent' }}>
                    <img src={imageSrc} className="w-full h-full object-cover" style={{ filter: getFilterStyle(f) }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{f}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'molduras' && (
            <div className="flex gap-4 min-w-max px-2">
              <FrameThumb type="nenhuma" active={frame === 'nenhuma'} onClick={() => setFrame('nenhuma')} />
              <FrameThumb type="aniversario" active={frame === 'aniversario'} onClick={() => setFrame('aniversario')} />
              <FrameThumb type="infantil_menina" active={frame === 'infantil_menina'} onClick={() => setFrame('infantil_menina')} />
              <FrameThumb type="infantil_menino" active={frame === 'infantil_menino'} onClick={() => setFrame('infantil_menino')} />
              <FrameThumb type="eucaristia" active={frame === 'eucaristia'} onClick={() => setFrame('eucaristia')} />
              <FrameThumb type="retiro" active={frame === 'retiro'} onClick={() => setFrame('retiro')} />
            </div>
          )}

          {activeTab === 'texto' && (
             <div className="w-full max-w-sm mx-auto">
               <textarea
                 placeholder="Digite um texto para aparecer na foto (Ex: Feliz Aniversário!)"
                 value={text}
                 onChange={(e) => setText(e.target.value)}
                 className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary resize-none"
               />
             </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex border-t border-white/5 py-4 px-6 justify-between max-w-sm mx-auto mb-2">
          <button onClick={() => setActiveTab('molduras')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'molduras' ? 'text-primary scale-110' : 'text-white/40 hover:text-white'}`}>
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">Molduras</span>
          </button>
          <button onClick={() => setActiveTab('filtros')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'filtros' ? 'text-primary scale-110' : 'text-white/40 hover:text-white'}`}>
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">Filtros</span>
          </button>
          <button onClick={() => setActiveTab('texto')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'texto' ? 'text-primary scale-110' : 'text-white/40 hover:text-white'}`}>
            <Type className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">Texto</span>
          </button>
        </div>
      </div>
    </div>
  );
}


// --- Frame Overlays Components ---

function FrameOverlay({ type }: { type: FrameType }) {
  if (type === 'aniversario') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="380" height="380" fill="none" stroke="#FBBF24" strokeWidth="8" rx="20" opacity="0.9"/>
        <path d="M0,0 L100,0 L0,100 Z" fill="#FBBF24" opacity="0.8"/>
        <path d="M400,0 L300,0 L400,100 Z" fill="#F472B6" opacity="0.8"/>
        <path d="M0,400 L100,400 L0,300 Z" fill="#60A5FA" opacity="0.8"/>
        <path d="M400,400 L300,400 L400,300 Z" fill="#34D399" opacity="0.8"/>
        {/* Banner */}
        <g transform="translate(200, 350)">
          <path d="M-120,-20 L120,-20 L130,0 L120,20 L-120,20 L-130,0 Z" fill="#FBBF24" filter="drop-shadow(0 4px 3px rgb(0 0 0 / 0.3))" />
          <text x="0" y="6" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="18" fill="white" textAnchor="middle">FELIZ ANIVERSÁRIO</text>
        </g>
      </svg>
    );
  }
  
  if (type === 'infantil_menina') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="400" height="400" fill="none" stroke="#F472B6" strokeWidth="20" opacity="0.8"/>
        <rect x="15" y="15" width="370" height="370" fill="none" stroke="white" strokeWidth="2" strokeDasharray="8 8" opacity="0.9"/>
        {/* Hearts */}
        <path d="M40,60 A1,1 0 0,0 60,60 A1,1 0 0,0 80,60 Q80,80 60,100 Q40,80 40,60" fill="#FBCFE8" />
        <path d="M320,60 A1,1 0 0,0 340,60 A1,1 0 0,0 360,60 Q360,80 340,100 Q320,80 320,60" fill="#FBCFE8" />
        <path d="M40,320 A1,1 0 0,0 60,320 A1,1 0 0,0 80,320 Q80,340 60,360 Q40,340 40,320" fill="#FBCFE8" />
        <path d="M320,320 A1,1 0 0,0 340,320 A1,1 0 0,0 360,320 Q360,340 340,360 Q320,340 320,320" fill="#FBCFE8" />
      </svg>
    );
  }

  if (type === 'infantil_menino') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="400" height="400" fill="none" stroke="#3B82F6" strokeWidth="24" opacity="0.9"/>
        {/* Stars */}
        <polygon points="50,30 56,45 72,45 59,54 64,69 50,60 36,69 41,54 28,45 44,45" fill="#FCD34D" />
        <polygon points="350,30 356,45 372,45 359,54 364,69 350,60 336,69 341,54 328,45 344,45" fill="#FCD34D" />
        <polygon points="50,330 56,345 72,345 59,354 64,369 50,360 36,369 41,354 28,345 44,345" fill="#FCD34D" />
        <polygon points="350,330 356,345 372,345 359,354 364,369 350,360 336,369 341,354 328,345 344,345" fill="#FCD34D" />
      </svg>
    );
  }

  if (type === 'eucaristia') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        {/* Soft white glowing border */}
        <rect x="10" y="10" width="380" height="380" fill="none" stroke="#FEF3C7" strokeWidth="6" rx="8" opacity="0.8"/>
        {/* Cross at the top center */}
        <g transform="translate(200, 40)" fill="#D97706" opacity="0.9">
          <rect x="-3" y="-20" width="6" height="50" rx="2" />
          <rect x="-15" y="-5" width="30" height="6" rx="2" />
        </g>
        <g transform="translate(200, 360)">
          <rect x="-100" y="-15" width="200" height="30" rx="15" fill="#FEF3C7" opacity="0.9"/>
          <text x="0" y="5" fontFamily="serif" fontWeight="bold" fontSize="16" fill="#92400E" textAnchor="middle">PRIMEIRA EUCARISTIA</text>
        </g>
      </svg>
    );
  }

  if (type === 'retiro') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
         <defs>
          <linearGradient id="gradRetiro" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#000000', stopOpacity: 0.8 }} />
            <stop offset="20%" style={{ stopColor: '#000000', stopOpacity: 0 }} />
            <stop offset="70%" style={{ stopColor: '#000000', stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: '#000000', stopOpacity: 0.9 }} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="400" height="400" fill="url(#gradRetiro)" />
        <text x="20" y="370" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="24" fill="white" letterSpacing="2">A PAZ DE CRISTO</text>
        <text x="22" y="385" fontFamily="Inter, sans-serif" fontWeight="500" fontSize="10" fill="#D1D5DB">MOMENTO DE RETIRO</text>
      </svg>
    );
  }

  return null;
}

function FrameThumb({ type, active, onClick }: { type: FrameType, active: boolean, onClick: () => void }) {
  const labels: Record<FrameType, string> = {
    nenhuma: 'Limpa',
    aniversario: 'Aniv.',
    infantil_menina: 'Menina',
    infantil_menino: 'Menino',
    eucaristia: 'Comunhão',
    retiro: 'Retiro'
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 snap-center transition-all ${active ? 'scale-110' : 'opacity-60 grayscale'}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 overflow-hidden border-2 flex items-center justify-center relative" style={{ borderColor: active ? 'var(--primary)' : 'transparent' }}>
        <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-gradient-to-br from-zinc-700 to-zinc-900" />
        <div className="scale-[0.2] origin-center -ml-12 pointer-events-none">
          <FrameOverlay type={type} />
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{labels[type]}</span>
    </button>
  );
}
