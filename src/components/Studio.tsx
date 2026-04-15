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

export function Studio({ photos, onClose, onSave }: StudioProps) {
  const [activeTool, setActiveTool] = useState<StudioTool>('colagem');
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
               {activeTool === 'moldura' && <div className="absolute inset-0 border-[20px] border-primary/30 mix-blend-overlay" />}
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

        <div className="h-40 px-6 flex items-center justify-center animation-in fade-in slide-in-from-bottom-2">
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

  return (
    <div className="w-full h-full relative">
       <img 
         key={photos[idx].id}
         src={photos[idx].url} 
         className="w-full h-full object-cover animate-in fade-in duration-1000" 
       />
       <div className="absolute bottom-4 left-4 right-4 flex gap-1 justify-center">
         {photos.map((_, i) => (
           <div key={i} className={`h-1 rounded-full transition-all ${i === idx ? 'w-4 bg-primary' : 'w-1 bg-white/30'}`} />
         ))}
       </div>
    </div>
  );
}
