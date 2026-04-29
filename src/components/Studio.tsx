import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, Play, Type, Wrench, Plus, Layers, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { type MuralFoto } from '@/lib/store';
import { toast } from 'sonner';
import { FRAMES, type FrameType } from '@/lib/molduras';

interface StudioProps {
  photos: MuralFoto[];
  onClose: () => void;
  onSave: (blob: Blob, legenda: string) => Promise<void>;
}

type StudioTool = 'colagem' | 'slideshow' | 'moldura' | 'texto' | 'ferramentas';

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

  // 6 Opções de Colagem avançadas
  const layouts = [
    { class: "grid grid-cols-2 grid-rows-2 gap-[2px]", icon: <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[1px]"><div className="bg-current"/><div className="bg-current"/><div className="bg-current"/><div className="bg-current"/></div> },
    { class: "grid grid-cols-2 grid-rows-2 gap-[2px] [grid-template-areas:'a_a''b_c']", icon: <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[1px] [grid-template-areas:'a_a''b_c']"><div className="bg-current [grid-area:a]"/><div className="bg-current [grid-area:b]"/><div className="bg-current [grid-area:c]"/></div> },
    { class: "grid grid-cols-2 gap-[2px]", icon: <div className="w-full h-full grid grid-cols-2 gap-[1px]"><div className="bg-current"/><div className="bg-current"/></div> },
    { class: "flex flex-col gap-[2px]", icon: <div className="w-full h-full flex flex-col gap-[1px]"><div className="bg-current flex-1"/><div className="bg-current flex-1"/><div className="bg-current flex-1"/></div> },
    { class: "grid grid-cols-3 grid-rows-3 gap-[2px] [grid-template-areas:'a_a_a''b_b_c''b_b_c']", icon: <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[1px] [grid-template-areas:'a_a_a''b_b_c''b_b_c']"><div className="bg-current [grid-area:a]"/><div className="bg-current [grid-area:b]"/><div className="bg-current [grid-area:c]"/></div> }
  ];

  const getAreaClass = (idx: number, layoutCode: number) => {
    if (layoutCode === 1) return idx === 0 ? "col-span-2 row-span-1 [grid-area:a]" : (idx === 1 ? "[grid-area:b]" : "[grid-area:c]");
    if (layoutCode === 4) return idx === 0 ? "col-span-3 [grid-area:a]" : (idx === 1 ? "col-span-2 row-span-2 [grid-area:b]" : "[grid-area:c]");
    return "";
  };

  const handleExport = async () => {
    if (!studioRef.current) return;
    setIsProcessing(true);
    const toastId = toast.loading("Preparando com carinho...");
    
    try {
      await new Promise(r => setTimeout(r, 400));
      const canvas = await html2canvas(studioRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          await onSave(blob, textOverlay || "Momento especial da Catequese ✨");
          toast.success("Foto salva com alegria!", { id: toastId });
          onClose();
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.95);
    } catch (e) {
      toast.error("Ops! Erro ao gerar a arte", { id: toastId });
      setIsProcessing(false);
    }
  };

  const FrameRender = FRAMES.find(f => f.id === frame)?.Overlay || (() => null);

  return (
    <div className="fixed inset-0 z-[300] bg-gradient-to-br from-indigo-50/95 via-sky-50/95 to-amber-50/95 backdrop-blur-3xl flex flex-col items-center animate-in slide-in-from-bottom-5">
      {/* HEADER ALEGRE */}
      <div className="w-full flex items-center justify-between p-4 px-6 md:px-8 mt-2">
        <button onClick={onClose} className="p-3 bg-white/70 shadow-sm rounded-full text-zinc-600 hover:scale-105 hover:bg-white active:scale-95 transition-all">
          <X className="w-5 h-5" strokeWidth={3} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="font-black text-primary text-xl tracking-tight">Estúdio Mágico</h2>
          <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-none">Criando Memórias</span>
        </div>
        <button 
          onClick={handleExport}
          disabled={isProcessing}
          className="px-5 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" strokeWidth={3} />}
          PRONTO
        </button>
      </div>

      {/* VIEWPORT CONTIDO */}
      <div className="flex-1 w-full max-w-lg flex items-center justify-center p-6 sm:p-10 perspective-[1000px]">
        <div 
          ref={studioRef}
          className={`relative w-full aspect-square bg-white shadow-2xl overflow-hidden rounded-xl transition-all duration-300 ring-4 ring-white/50`}
          style={{ 
            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) transform-style:preserve-3d`
          }}
        >
          {activeTool === 'colagem' && (
            <div className={`w-full h-full bg-white ${layouts[selectedLayout].class}`}>
              {photos.slice(0, 5).map((p, idx) => (
                <div key={p.id} className={`relative overflow-hidden ${getAreaClass(idx, selectedLayout)}`}>
                  <img src={p.url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                </div>
              ))}
            </div>
          )}

          {(activeTool !== 'colagem') && (
            <div className="w-full h-full relative">
               {activeTool === 'slideshow' ? (
                 <SlideshowPreview photos={photos} />
               ) : (
                 <img src={photos[0].url} className="w-full h-full object-cover" crossOrigin="anonymous" />
               )}
            </div>
          )}

          {/* MOLDURA E TEXTO GLOBAL SOBRE TUDO */}
          {activeTool !== 'slideshow' && (
            <>
              {textOverlay && (
                <div className="absolute inset-0 flex items-center justify-center p-8 z-20 pointer-events-none">
                  <p className="text-white font-black text-3xl md:text-4xl text-center leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] uppercase italic" style={{ fontFamily: 'var(--font-heading)' }}>
                    {textOverlay}
                  </p>
                </div>
              )}
              <div className="absolute inset-0 z-30 pointer-events-none">
                 <FrameRender />
              </div>
            </>
          )}
        </div>
      </div>

      {/* TOOL OPTIONS ALEGRE */}
      <div className="w-full max-w-xl shrink-0 pb-safe bg-white/70 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[40px] px-2 border-t border-white">
        
        <div className="h-32 flex items-center justify-center px-4 w-full">
          {activeTool === 'colagem' && (
            <div className="flex gap-4 w-full px-4 overflow-x-auto hide-scrollbar pb-2 pt-2">
              {layouts.map((l, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedLayout(idx)}
                  className={`w-16 h-16 shrink-0 rounded-2xl transition-all flex items-center justify-center p-3 relative ${selectedLayout === idx ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                  {l.icon}
                </button>
              ))}
            </div>
          )}

          {activeTool === 'moldura' && (
            <div className="flex gap-4 w-full px-2 overflow-x-auto hide-scrollbar pb-2 pt-2 snap-x">
              {FRAMES.map((f) => (
                <FrameThumb key={f.id} def={f} active={frame === f.id} onClick={() => setFrame(f.id)} />
              ))}
            </div>
          )}

          {activeTool === 'texto' && (
             <div className="w-full max-w-xs mx-auto animate-in fade-in zoom-in-95">
               <input 
                type="text" 
                placeholder="Escreva algo lindo..." 
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                className="w-full bg-slate-100/80 border-[3px] border-transparent rounded-[24px] px-6 py-4 text-center font-bold text-slate-700 outline-none focus:border-primary/50 focus:bg-white shadow-inner transition-all placeholder:text-slate-400"
               />
             </div>
          )}

          {activeTool === 'ferramentas' && (
            <div className="w-full max-w-sm space-y-4 px-4">
               <div className="space-y-1">
                 <div className="flex justify-between text-[11px] font-black uppercase text-slate-500"><span>Cores</span><span>{saturation}%</span></div>
                 <input type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(parseInt(e.target.value))} className="w-full accent-primary h-2 bg-slate-200 rounded-full appearance-none" />
               </div>
               <div className="space-y-1">
                 <div className="flex justify-between text-[11px] font-black uppercase text-slate-500"><span>Luz</span><span>{brightness}%</span></div>
                 <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-full accent-amber-500 h-2 bg-slate-200 rounded-full appearance-none" />
               </div>
            </div>
          )}

          {activeTool === 'slideshow' && (
            <div className="text-center bg-indigo-50 px-6 py-3 rounded-3xl text-indigo-500">
              <Play className="w-6 h-6 mx-auto mb-1 opacity-80" />
              <p className="text-[10px] font-black uppercase tracking-widest">Visualização Viva Selecionada</p>
            </div>
          )}
        </div>

        {/* TABS INFERIORES MODERNAS */}
        <div className="flex items-center gap-1 sm:gap-2 px-2 pb-4 pt-1 w-full max-w-sm mx-auto overflow-x-auto hide-scrollbar justify-center">
           <ToolBtn active={activeTool === 'colagem'} icon={Layers} label="Colagem" onClick={() => setActiveTool('colagem')} />
           <ToolBtn active={activeTool === 'moldura'} icon={ImageIcon} label="Molduras" onClick={() => setActiveTool('moldura')} />
           <ToolBtn active={activeTool === 'texto'} icon={Type} label="Adicionar Mimos" onClick={() => setActiveTool('texto')} />
           <ToolBtn active={activeTool === 'ferramentas'} icon={Wrench} label="Ajustes" onClick={() => setActiveTool('ferramentas')} />
           {photos.length > 1 && <ToolBtn active={activeTool === 'slideshow'} icon={Play} label="Slide" onClick={() => setActiveTool('slideshow')} />}
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1.5 transition-all p-2 rounded-2xl ${active ? 'bg-primary/10 scale-105' : 'hover:bg-slate-100/50'}`}
    >
      <div className={`p-3 rounded-full transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-transparent text-slate-400'}`}>
        <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className={`text-[9px] font-black uppercase tracking-tighter truncate w-full text-center ${active ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
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
         crossOrigin="anonymous"
         className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-1000" 
       />
       <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
         {photos.map((_, i) => (
           <div key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-white shadow-sm' : 'w-2 bg-white/40'}`} />
         ))}
       </div>
    </div>
  );
}

function FrameThumb({ def, active, onClick }: { def: any, active: boolean, onClick: () => void }) {
  const Render = def.Overlay;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 snap-center transition-all px-1 ${active ? 'scale-110' : 'opacity-80 hover:opacity-100'}`}
    >
      <div className={`w-[72px] h-[72px] shrink-0 rounded-2xl overflow-hidden border-[3px] flex items-center justify-center relative bg-white transition-colors duration-300 ${active ? 'border-primary shadow-lg shadow-primary/20' : 'border-slate-200 shadow-sm'}`}>
        <div className="absolute inset-0 bg-slate-100/50" />
        <div className="absolute inset-0 origin-top-left pointer-events-none" style={{ transform: 'scale(0.18)' }}>
          <div className="w-[400px] h-[400px] relative">
            <Render />
          </div>
        </div>
      </div>
      <span className={`text-[9px] font-black uppercase tracking-wider ${active ? 'text-primary' : 'text-slate-500'}`}>{def.name}</span>
    </button>
  );
}
