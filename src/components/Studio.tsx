import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, Check, Sparkles, Layout, Play, Frame, Type, Wrench, ChevronLeft, ChevronRight, Plus, Download, Share2, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { type MuralFoto } from '@/lib/store';
import { toast } from 'sonner';

interface StudioProps {
  photos: MuralFoto[];
  onClose: () => void;
  onSave: (blob: Blob, legenda: string) => Promise<void>;
}

type StudioTool = 'colagem' | 'slideshow' | 'moldura' | 'texto' | 'ferramentas';

export type FrameType = 'nenhuma' | 'aniversario' | 'infantil_menina' | 'infantil_menino' | 'eucaristia' | 'retiro';

export function Studio({ photos, onClose, onSave }: StudioProps) {
  const [activeTool, setActiveTool] = useState<StudioTool>('colagem');
  const [frame, setFrame] = useState<FrameType>('nenhuma');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState(0);
  const [textOverlay, setTextOverlay] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  const studioRef = useRef<HTMLDivElement>(null);

  const layouts = [
    // 4 equals
    "grid grid-cols-2 grid-rows-2 gap-1",
    // 1 big top + 2 small bottom
    "grid grid-cols-2 grid-rows-2 gap-1 [grid-template-areas:'a_a''b_c']",
    // 1 big left + 2 small right
    "grid grid-cols-2 grid-rows-2 gap-1 [grid-template-areas:'a_b''a_c']",
    // 3 horizontal stacks
    "flex flex-col gap-1"
  ];

  const getAreaClass = (idx: number) => {
    if (selectedLayout === 1) return idx === 0 ? "col-span-2 row-span-1" : "";
    if (selectedLayout === 2) return idx === 0 ? "row-span-2 col-span-1" : "";
    return "";
  };

  const handleExport = async () => {
    if (!studioRef.current) return;
    setIsProcessing(true);
    const toastId = toast.loading("Gerando sua obra de arte...");
    
    try {
      await new Promise(r => setTimeout(r, 300));
      const canvas = await html2canvas(studioRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#000000'
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          await onSave(blob, textOverlay || "Criatividade no Estúdio");
          toast.success("Arte salva com sucesso!", { id: toastId });
          onClose();
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.9);
    } catch (e) {
      toast.error("Erro ao gerar imagem", { id: toastId });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-zinc-950 flex flex-col text-white animate-in slide-in-from-bottom-5">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 bg-zinc-900/50 backdrop-blur-xl border-b border-white/5">
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-all">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="font-black uppercase tracking-widest text-sm">Estúdio Mágico</h2>
        </div>
        <button 
          onClick={handleExport}
          disabled={isProcessing}
          className="px-5 py-2.5 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          CRIAR
        </button>
      </div>

      {/* VIEWPORT AREA */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-6 bg-zinc-900 border-b border-white/5">
        <div 
          ref={studioRef}
          className={`relative w-full max-w-[400px] aspect-square bg-black shadow-2xl overflow-hidden rounded-lg transition-all duration-500`}
          style={{ 
            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
          }}
        >
          {activeTool === 'colagem' && (
            <div className={`w-full h-full ${layouts[selectedLayout]}`}>
              {photos.slice(0, 4).map((p, idx) => (
                <div key={p.id} className={`relative overflow-hidden ${getAreaClass(idx)}`}>
                  <img src={p.url} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {activeTool === 'slideshow' && (
             <SlideshowPreview photos={photos} />
          )}

          {activeTool === 'texto' && (
            <div className="w-full h-full relative">
              <img src={photos[0].url} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <p className="text-white font-black text-3xl text-center leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,1)] uppercase italic">
                  {textOverlay || "Sua Palavra Aqui"}
                </p>
              </div>
            </div>
          )}

          {(activeTool === 'moldura' || activeTool === 'ferramentas') && (
            <div className="w-full h-full relative">
               <img src={photos[0].url} className="w-full h-full object-cover" />
               <div className="absolute inset-0 pointer-events-none">
                 <FrameOverlay type={frame} />
               </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTROLS AREA */}
      <div className="shrink-0 bg-zinc-950 pb-safe">
        <div className="flex items-center gap-4 px-6 py-4 overflow-x-auto hide-scrollbar border-b border-white/5 bg-zinc-900/40">
           <ToolBtn active={activeTool === 'colagem'} icon={Layout} label="Colagem" onClick={() => setActiveTool('colagem')} />
           <ToolBtn active={activeTool === 'slideshow'} icon={Play} label="Slide" onClick={() => setActiveTool('slideshow')} />
           <ToolBtn active={activeTool === 'texto'} icon={Type} label="Palavras" onClick={() => setActiveTool('texto')} />
           <ToolBtn active={activeTool === 'moldura'} icon={Frame} label="Molduras" onClick={() => setActiveTool('moldura')} />
           <ToolBtn active={activeTool === 'ferramentas'} icon={Wrench} label="Ferramentas" onClick={() => setActiveTool('ferramentas')} />
        </div>

        <div className="h-32 px-6 flex items-center justify-center animation-in fade-in slide-in-from-bottom-2">
          {activeTool === 'colagem' && (
            <div className="flex gap-4">
              {layouts.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedLayout(idx)}
                  className={`w-16 h-16 rounded-xl border-2 transition-all flex items-center justify-center ${selectedLayout === idx ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5'}`}
                >
                  <Layout className="w-6 h-6 opacity-60" />
                </button>
              ))}
            </div>
          )}

          {activeTool === 'moldura' && (
            <div className="flex gap-4 min-w-max px-2 overflow-x-auto hide-scrollbar w-full">
              <FrameThumb type="nenhuma" active={frame === 'nenhuma'} onClick={() => setFrame('nenhuma')} />
              <FrameThumb type="aniversario" active={frame === 'aniversario'} onClick={() => setFrame('aniversario')} />
              <FrameThumb type="infantil_menina" active={frame === 'infantil_menina'} onClick={() => setFrame('infantil_menina')} />
              <FrameThumb type="infantil_menino" active={frame === 'infantil_menino'} onClick={() => setFrame('infantil_menino')} />
              <FrameThumb type="eucaristia" active={frame === 'eucaristia'} onClick={() => setFrame('eucaristia')} />
              <FrameThumb type="retiro" active={frame === 'retiro'} onClick={() => setFrame('retiro')} />
            </div>
          )}

          {activeTool === 'texto' && (
             <input 
              type="text" 
              placeholder="Digite aqui..." 
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              className="w-full max-w-sm bg-white/5 border-2 border-white/10 rounded-2xl p-4 text-center font-bold text-xl outline-none focus:border-primary transition-all"
             />
          )}

          {activeTool === 'ferramentas' && (
            <div className="w-full max-w-xs space-y-4">
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] font-black uppercase text-white/40"><span>Brilho</span><span>{brightness}%</span></div>
                 <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-full accent-primary" />
               </div>
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] font-black uppercase text-white/40"><span>Contraste</span><span>{contrast}%</span></div>
                 <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="w-full accent-primary" />
               </div>
            </div>
          )}

          {activeTool === 'slideshow' && (
            <div className="text-center">
              <p className="text-xs text-white/40 font-black uppercase tracking-widest">Visualizando {photos.length} fotos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-2 min-w-[70px] transition-all ${active ? 'text-primary scale-110' : 'text-white/40 opacity-60'}`}
    >
      <div className={`p-3 rounded-2xl ${active ? 'bg-primary/20' : 'bg-white/5'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function SlideshowPreview({ photos }: { photos: MuralFoto[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx(prev => (prev + 1) % photos.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [photos]);

    </div>
  );
}

function FrameOverlay({ type }: { type: FrameType }) {
  if (type === 'nenhuma') return null;
  if (type === 'aniversario') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="380" height="380" fill="none" stroke="#FBBF24" strokeWidth="8" rx="20" opacity="0.9"/>
        <path d="M0,0 L100,0 L0,100 Z" fill="#FBBF24" opacity="0.8"/>
        <path d="M400,0 L300,0 L400,100 Z" fill="#F472B6" opacity="0.8"/>
        <path d="M0,400 L100,400 L0,300 Z" fill="#60A5FA" opacity="0.8"/>
        <path d="M400,400 L300,400 L400,300 Z" fill="#34D399" opacity="0.8"/>
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
        <rect x="10" y="10" width="380" height="380" fill="none" stroke="#FEF3C7" strokeWidth="6" rx="8" opacity="0.8"/>
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
      <div className="w-16 h-16 shrink-0 rounded-2xl bg-zinc-800 overflow-hidden border-2 flex items-center justify-center relative" style={{ borderColor: active ? 'var(--primary)' : 'transparent' }}>
        <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-gradient-to-br from-zinc-700 to-zinc-900" />
        <div className="absolute inset-0 origin-top-left pointer-events-none" style={{ transform: 'scale(0.16)' }}>
          <div className="w-[400px] h-[400px] relative">
            <FrameOverlay type={type} />
          </div>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{labels[type]}</span>
    </button>
  );
}
