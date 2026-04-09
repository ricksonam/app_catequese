import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Shuffle, Printer, RotateCcw, Play, Maximize, Minimize, 
  Trophy, BookOpen, User, Hash, Cross, Ship, Waves, Crown, Heart, 
  Key, Sword, Stars, Baby, Dumbbell, Scissors, Anchor, Sprout, 
  Sparkles, Bell, TreeDeciduous, Gift, Droplets, Hammer, Music, 
  Milestone, Globe, Footprints, ScrollText, Map, Mail, Sun, 
  Fish, Bone, Flame, Binary, Cloud, PenTool, Eye, Flower2, 
  Wheat, GlassWater, Bird, CupSoda, Mountain, Ear, Zap, Leaf, 
  Circle, Dna, Wind, Star, LayoutGrid, X, CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBingoModelos } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BingoModelo, BingoItem } from "@/lib/store";

// Mapping string names to Lucide icons
const IconMap: Record<string, any> = {
  Ship, Waves, Crown, Heart, Key, Sword, Stars, Baby, Dumbbell, Scissors, 
  Anchor, Sprout, Sparkles, Bell, TreeDeciduous, Gift, Droplets, Hammer, 
  Music, Milestone, Globe, Footprints, ScrollText, Map, Mail, Sun, Fish, 
  Bone, Flame, Binary, Cloud, PenTool, Eye, Flower2, Wheat, GlassWater, 
  Bird, CupSoda, Mountain, Ear, Zap, Leaf, Circle, Dna, Wind, Star, 
  Cross, BookOpen, Book: BookOpen
};

const BingoIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = IconMap[name] || Hash;
  return <IconComponent className={className} />;
};

export default function BingoBiblico() {
  const navigate = useNavigate();
  const { data: modelos = [] } = useBingoModelos();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [selectedModelo, setSelectedModelo] = useState<BingoModelo | null>(null);
  const [etapa, setEtapa] = useState<"selecao" | "preparacao" | "jogo">("selecao");
  const [numCartelas, setNumCartelas] = useState(10);
  const [cartelas, setCartelas] = useState<BingoItem[][]>([]);
  
  const [sorteados, setSorteados] = useState<BingoItem[]>([]);
  const [ultimoSorteado, setUltimoSorteado] = useState<BingoItem | null>(null);
  const [sorteando, setSorteando] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const audio = new Audio("https://www.orangefreesounds.com/wp-content/uploads/2019/05/Drum-roll-suspense-award.mp3");
    audioRef.current = audio;
    
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const gerarCartelas = () => {
    if (!selectedModelo) return;
    const novasCartelas: BingoItem[][] = [];
    
    for (let i = 0; i < numCartelas; i++) {
      const shuffle = [...selectedModelo.itens].sort(() => 0.5 - Math.random());
      novasCartelas.push(shuffle.slice(0, 9)); // 3x3 = 9 itens
    }
    
    setCartelas(novasCartelas);
    setEtapa("preparacao");
  };

  const iniciarJogo = () => {
    setSorteados([]);
    setUltimoSorteado(null);
    setEtapa("jogo");
    toast.success("Bingo iniciado!");
  };

  const sortear = () => {
    if (!selectedModelo || sorteando) return;
    
    const disponiveis = selectedModelo.itens.filter(
      item => !sorteados.find(s => s.label === item.label)
    );
    
    if (disponiveis.length === 0) {
      toast.info("Todos os itens já foram sorteados!");
      return;
    }

    setSorteando(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    let count = 0;
    const interval = setInterval(() => {
      const rand = disponiveis[Math.floor(Math.random() * disponiveis.length)];
      setUltimoSorteado(rand);
      count++;
      
      if (count > 30) {
        clearInterval(interval);
        const final = disponiveis[Math.floor(Math.random() * disponiveis.length)];
        setUltimoSorteado(final);
        setSorteados(prev => [final, ...prev]);
        setSorteando(false);
      }
    }, 100);
  };

  const imprimir = () => {
    window.print();
  };

  if (etapa === "selecao") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Bingo Bíblico</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Sorteio e Diversão</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modelos.map(m => (
            <div 
              key={m.id} 
              onClick={() => setSelectedModelo(m)}
              className={cn(
                "float-card p-6 cursor-pointer border-2 transition-all",
                selectedModelo?.id === m.id ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-transparent hover:border-accent"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-black text-lg">{m.nome}</h3>
              <p className="text-sm text-muted-foreground mb-4">{m.categoria} • {m.itens.length} itens</p>
              <div className="flex flex-wrap gap-1">
                {m.itens.slice(0, 5).map((it, i) => (
                  <span key={i} className="text-[10px] bg-muted px-2 py-1 rounded-md">{it.label}</span>
                ))}
                <span className="text-[10px] bg-muted px-2 py-1 rounded-md">...</span>
              </div>
            </div>
          ))}
        </div>

        {selectedModelo && (
          <div className="float-card p-8 text-center animate-reveal">
            <h2 className="text-xl font-black mb-6">Quantas cartelas deseja gerar?</h2>
            <div className="flex items-center justify-center gap-6 mb-8">
              <Button variant="outline" size="icon" onClick={() => setNumCartelas(Math.max(1, numCartelas - 5))}>-</Button>
              <span className="text-4xl font-black text-primary">{numCartelas}</span>
              <Button variant="outline" size="icon" onClick={() => setNumCartelas(numCartelas + 5)}>+</Button>
            </div>
            <Button onClick={gerarCartelas} className="w-full max-w-sm h-14 rounded-2xl text-lg font-black gap-2">
              <Printer className="h-5 w-5" /> GERAR CARTELAS PARA IMPRIMIR
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (etapa === "preparacao") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 print:hidden">
          <Button variant="outline" onClick={() => setEtapa("selecao")} className="rounded-xl">
             Voltar
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold">Imprimir Cartelas</h1>
            <p className="text-xs text-muted-foreground">{selectedModelo?.nome} • 3x3</p>
          </div>
          <Button onClick={imprimir} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2">
            <Printer className="h-4 w-4" /> IMPRIMIR AGORA
          </Button>
        </div>

        {/* Print Layout */}
        <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-8 p-4",
            "print:block print:p-0"
        )}>
          {cartelas.map((cartela, idx) => (
            <div key={idx} className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm break-inside-avoid mb-8 print:border-4 print:mb-12 print:shadow-none min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <Cross className="h-4 w-4" />
                  </div>
                  <h3 className="font-black uppercase text-sm tracking-tighter">Bingo Bíblico</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Cartela #{idx + 1}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3 flex-1">
                {cartela.map((item, i) => (
                  <div key={i} className="aspect-square border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-center p-2 bg-slate-50/30 text-center">
                    <BingoIcon name={item.icon} className="h-8 w-8 mb-2 text-slate-400" />
                    <span className="text-[10px] font-black uppercase leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-center">
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{selectedModelo?.nome}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pb-12 print:hidden">
          <Button onClick={iniciarJogo} size="lg" className="h-16 px-12 rounded-3xl text-xl font-black gap-2 shadow-xl shadow-primary/20 scale-110">
            <Play className="h-6 w-6" /> TUDO PRONTO! COMEÇAR SORTEIO
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-full flex flex-col transition-all duration-500",
      isFullscreen ? "bg-slate-900 p-8 text-white" : "space-y-6"
    )}>
      {/* Game Header */}
      <div className={cn("flex items-center justify-between", isFullscreen ? "mb-12" : "mb-0")}>
        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <button onClick={() => setEtapa("preparacao")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className={cn("font-black", isFullscreen ? "text-3xl" : "text-lg")}>Sorteio Eletrônico</h1>
            <p className={cn("text-[10px] uppercase font-black tracking-widest", isFullscreen ? "text-primary" : "text-muted-foreground")}>
              {selectedModelo?.nome}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant={isFullscreen ? "secondary" : "outline"} size="icon" onClick={() => {
            if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
            else document.exitFullscreen();
          }} className="rounded-xl">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <Button onClick={() => setSorteados([])} variant="destructive" size="icon" className="rounded-xl">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Draw Area */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center space-y-8">
          <div className={cn(
            "w-full max-w-2xl aspect-square md:aspect-video rounded-[3rem] border-8 flex flex-col items-center justify-center p-12 transition-all duration-700 relative overflow-hidden shadow-2xl",
            isFullscreen ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100",
            sorteando ? "scale-105 border-primary" : "scale-100"
          )}>
            {sorteando ? (
              <div className="text-center space-y-6">
                <div className="w-32 h-32 border-[12px] border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-2xl font-black uppercase tracking-[0.5em] animate-pulse">Girando o Globo...</p>
              </div>
            ) : ultimoSorteado ? (
              <div className="text-center space-y-8 animate-in zoom-in-50 duration-500">
                <div className={cn(
                  "w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center shadow-2xl mx-auto border-8",
                  isFullscreen ? "bg-primary text-white border-white/10" : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <BingoIcon name={ultimoSorteado.icon} className="w-24 h-24 md:w-32 md:h-32" />
                </div>
                <h2 className={cn("text-5xl md:text-7xl font-black uppercase tracking-tighter", isFullscreen ? "text-white" : "text-slate-900")}>
                  {ultimoSorteado.label}
                </h2>
              </div>
            ) : (
              <div className="text-center space-y-4 opacity-20">
                <Shuffle className="w-32 h-32 mx-auto" />
                <p className="text-2xl font-black uppercase tracking-widest">Aguardando Sorteio</p>
              </div>
            )}
            
            <div className="absolute top-4 right-6 text-[10px] font-black uppercase opacity-20">Sistema de Sorteio IVC</div>
          </div>

          <Button 
            disabled={sorteando} 
            onClick={sortear}
            className="h-24 w-64 rounded-full text-2xl font-black gap-3 shadow-2xl shadow-primary/40 hover:scale-105 transition-transform bg-primary"
          >
            <Shuffle className="h-8 w-8" /> SORTEAR
          </Button>
        </div>

        {/* History Area */}
        <div className={cn(
          "rounded-[2rem] p-6 flex flex-col space-y-4",
          isFullscreen ? "bg-slate-800" : "bg-muted/30"
        )}>
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-black uppercase text-xs tracking-widest">Chamadas ({sorteados.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[500px]">
            {sorteados.map((s, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 p-3 rounded-2xl animate-reveal",
                i === 0 ? "bg-primary/20 border-2 border-primary" : "bg-background/50 border border-border"
              )}>
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    i === 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>
                  <BingoIcon name={s.icon} className="h-4 w-4" />
                </div>
                <p className="flex-1 font-bold text-sm truncate">{s.label}</p>
                {i === 0 && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
