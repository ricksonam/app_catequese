import { useState, useEffect, useRef } from "react";
import { ArrowLeft, RefreshCw, Trophy, BookOpen, Layers, MousePointer2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Card {
  id: string;
  text: string;
  category: string; // 'missa' | 'santos' | 'sacramentos' | 'oracoes'
  value: number; // 1 to 13
  visible: boolean;
}

const CATEGORIES = [
  { id: 'missa', label: 'Missa', color: 'bg-[#2e5cb8]', text: 'text-[#2e5cb8]', icon: '⛪' },
  { id: 'santos', label: 'Santos', color: 'bg-[#b8860b]', text: 'text-[#b8860b]', icon: '😇' },
  { id: 'sacramentos', label: 'Sacramentos', color: 'bg-[#1b4d3e]', text: 'text-[#1b4d3e]', icon: '💧' },
  { id: 'oracoes', label: 'Orações', color: 'bg-[#9b111e]', text: 'text-[#9b111e]', icon: '🙏' },
];

const DATA: Record<string, string[]> = {
  missa: ['Ritos Iniciais', 'Ato Penitencial', 'Glória', 'Oração Coleta', '1ª Leitura', 'Salmo', 'Evangelho', 'Homilia', 'Credo', 'Ofertório', 'Santo', 'Consagração', 'Comunhão'],
  santos: ['S. Pedro', 'S. Paulo', 'S. João', 'N. Sra Maria', 'S. José', 'S. Francisco', 'S. Antônio', 'Sta Rita', 'Sta Teresinha', 'S. Bento', 'S. Expedito', 'S. Jorge', 'S. Judas'],
  sacramentos: ['Batismo', 'Crisma', 'Eucaristia', 'Confissão', 'Unção', 'Ordem', 'Matrimônio', 'Dar de comer', 'Dar de beber', 'Vestir nus', 'Visitar doentes', 'Enterrar mortos', 'Acolher'],
  oracoes: ['Pai Nosso', 'Ave Maria', 'Glória ao Pai', 'Salve Rainha', 'Creio', 'Santo Anjo', 'Vinde Espírito', 'Terço', 'Via Sacra', 'Angelus', 'Magnificat', 'Te Deum', 'Salmo 23'],
};

export default function PacienciaBiblica() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [foundations, setFoundations] = useState<Record<string, Card[]>>({
    missa: [],
    santos: [],
    sacramentos: [],
    oracoes: [],
  });
  const [tableau, setTableau] = useState<Card[][]>([[], [], [], [], [], []]);
  const [selected, setSelected] = useState<{ type: 'waste' | 'tableau', colIdx?: number, cardIdx?: number } | null>(null);

  const initGame = () => {
    const allCards: Card[] = [];
    CATEGORIES.forEach(cat => {
      DATA[cat.id].forEach((text, i) => {
        allCards.push({
          id: `${cat.id}-${i + 1}`,
          text,
          category: cat.id,
          value: i + 1,
          visible: false,
        });
      });
    });

    const shuffled = allCards.sort(() => Math.random() - 0.5);
    const newTableau: Card[][] = [[], [], [], [], [], []];
    let currentIdx = 0;

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j <= i; j++) {
        const card = shuffled[currentIdx++];
        newTableau[i].push({ ...card, visible: j === i });
      }
    }

    setTableau(newTableau);
    setDeck(shuffled.slice(currentIdx));
    setWaste([]);
    setFoundations({ missa: [], santos: [], sacramentos: [], oracoes: [] });
    setSelected(null);
    toast.success("Jogo iniciado! Nível Difícil.");
  };

  useEffect(() => {
    initGame();
  }, []);

  const drawCard = () => {
    if (deck.length === 0) {
      if (waste.length === 0) return;
      setDeck([...waste].reverse().map(c => ({ ...c, visible: false })));
      setWaste([]);
      return;
    }
    const nextCard = deck[deck.length - 1];
    setDeck(prev => prev.slice(0, -1));
    setWaste(prev => [...prev, { ...nextCard, visible: true }]);
    setSelected(null);
  };

  const getCardFromSelection = (sel: typeof selected) => {
    if (!sel) return null;
    if (sel.type === 'waste') return waste[waste.length - 1];
    if (sel.type === 'tableau') return tableau[sel.colIdx!][sel.cardIdx!];
    return null;
  };

  const onTableauClick = (colIdx: number) => {
    const col = tableau[colIdx];
    const topCard = col.length > 0 ? col[col.length - 1] : null;

    // Se já tem algo selecionado, tenta mover para esta coluna
    if (selected) {
      const cardToMove = getCardFromSelection(selected);
      if (!cardToMove) return;

      // Regra de movimento Solitaire:
      // 1. Reis (valor 13) em colunas vazias
      // 2. Valor descendente e categorias DIFERENTES (alternância)
      const canMove = !topCard 
        ? cardToMove.value === 13 
        : (cardToMove.value === topCard.value - 1 && cardToMove.category !== topCard.category);

      if (canMove) {
        moveCards(selected, { type: 'tableau', colIdx });
      } else {
        toast.error("Movimento inválido!");
        setSelected(null);
      }
      return;
    }

    // Se não tem nada selecionado, seleciona a última carta visível ou um conjunto
    if (topCard && topCard.visible) {
      setSelected({ type: 'tableau', colIdx, cardIdx: col.length - 1 });
    }
  };

  const onFoundationClick = (catId: string) => {
    if (!selected) return;
    const cardToMove = getCardFromSelection(selected);
    if (!cardToMove) return;

    // Apenas a última carta do tableau pode ir para a fundação
    if (selected.type === 'tableau' && selected.cardIdx !== tableau[selected.colIdx!].length - 1) {
      toast.error("Apenas a última carta pode ser movida!");
      setSelected(null);
      return;
    }

    const targetFoundation = foundations[catId];
    const canMove = cardToMove.category === catId && 
      ((targetFoundation.length === 0 && cardToMove.value === 1) || 
       (targetFoundation.length > 0 && cardToMove.value === targetFoundation[targetFoundation.length - 1].value + 1));

    if (canMove) {
      moveCards(selected, { type: 'foundation', catId });
    } else {
      toast.error("Ordem incorreta!");
      setSelected(null);
    }
  };

  const moveCards = (from: any, to: any) => {
    let cardsToMove: Card[] = [];
    
    // Pegar as cartas
    if (from.type === 'waste') {
      cardsToMove = [waste[waste.length - 1]];
      setWaste(prev => prev.slice(0, -1));
    } else if (from.type === 'tableau') {
      const col = [...tableau[from.colIdx]];
      cardsToMove = col.slice(from.cardIdx);
      const remaining = col.slice(0, from.cardIdx);
      
      // Auto-flip a carta anterior se necessário
      if (remaining.length > 0 && !remaining[remaining.length - 1].visible) {
        remaining[remaining.length - 1].visible = true;
      }
      
      setTableau(prev => {
        const next = [...prev];
        next[from.colIdx] = remaining;
        return next;
      });
    }

    // Colocar no destino
    if (to.type === 'tableau') {
      setTableau(prev => {
        const next = [...prev];
        next[to.colIdx] = [...next[to.colIdx], ...cardsToMove];
        return next;
      });
    } else if (to.type === 'foundation') {
      setFoundations(prev => ({
        ...prev,
        [to.catId]: [...prev[to.catId], ...cardsToMove]
      }));
    }

    setSelected(null);
    checkWin();
  };

  const checkWin = () => {
    // Se todas as fundações tiverem 13 cartas, venceu
    // Mas as fundações são atualizadas de forma assíncrona, então checaremos no render ou com useEffect
  };

  const isWin = Object.values(foundations).every(f => f.length === 13);

  return (
    <div className="min-h-screen bg-[#1a472a] flex flex-col p-3 space-y-4 overflow-hidden select-none touch-none">
      {/* Header */}
      <div className="flex items-center gap-3 text-white">
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 active:scale-95 transition-all">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black tracking-tight leading-none">Paciência Bíblica</h1>
          <p className="text-[9px] text-white/60 uppercase tracking-[0.2em] font-black mt-1">Modo Hard • 52 Cartas</p>
        </div>
        <Button variant="ghost" size="icon" onClick={initGame} className="rounded-xl text-white hover:bg-white/10 active:rotate-180 transition-all duration-500">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Top Area (Deck + Foundations) */}
      <div className="grid grid-cols-6 gap-2 sm:gap-3 h-24 sm:h-28">
        {/* Deck/Stock */}
        <div className="col-span-1">
          <button 
            onClick={drawCard}
            className={cn(
              "w-full h-full rounded-xl sm:rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 shadow-lg",
              deck.length > 0 
                ? "bg-gradient-to-br from-primary to-primary/80 border-white/20" 
                : "bg-black/20 border-white/10"
            )}
          >
            {deck.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse" />
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow-lg" />
              </div>
            ) : (
              <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-white/20" />
            )}
          </button>
        </div>

        {/* Waste */}
        <div className="col-span-1">
          {waste.length > 0 && (
            <button 
              onClick={() => setSelected({ type: 'waste' })}
              className={cn(
                "w-full h-full bg-gradient-to-b from-white to-zinc-50 rounded-xl sm:rounded-2xl border-2 shadow-md flex flex-col items-center justify-between p-1.5 sm:p-2 text-center transition-all active:scale-95 relative overflow-hidden",
                selected?.type === 'waste' ? "ring-4 ring-amber-400 scale-105 z-50 border-amber-400" : "border-zinc-200",
                CATEGORIES.find(c => c.id === waste[waste.length - 1].category)?.text
              )}
            >
              <div className="w-full flex justify-between items-start opacity-95">
                 <span className="text-[14px] sm:text-[18px] font-black leading-none">{waste[waste.length - 1].value}</span>
                 <span className="text-[12px] sm:text-[14px]">{CATEGORIES.find(c => c.id === waste[waste.length - 1].category)?.icon}</span>
              </div>
              
              <div className="flex-1 flex items-center justify-center px-0.5">
                <span className="text-[9px] sm:text-[12px] font-black leading-tight uppercase tracking-tight sm:tracking-tighter break-words">
                  {waste[waste.length - 1].text}
                </span>
              </div>

              {selected?.type === 'waste' && (
                <div className="absolute inset-0 bg-amber-400/10 pointer-events-none" />
              )}
            </button>
          )}
        </div>

        {/* Foundations */}
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onFoundationClick(cat.id)}
            className={cn(
              "w-full h-full rounded-xl sm:rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-1 sm:p-1.5 transition-all active:scale-95 shadow-inner overflow-hidden",
              foundations[cat.id].length > 0 
                ? cat.color + " border-transparent text-white shadow-lg" 
                : "border-white/40 text-white/70 bg-white/10 backdrop-blur-sm"
            )}
          >
            <span className={cn(
              "text-2xl sm:text-3xl leading-none drop-shadow-md transition-opacity",
              foundations[cat.id].length === 0 && "opacity-80"
            )}>
              {cat.icon}
            </span>
            <span className="text-[7px] sm:text-[10px] font-black uppercase mt-0.5 sm:mt-1 tracking-tighter sm:tracking-widest leading-none text-center px-0.5 w-full break-words">
              {cat.label}
            </span>
            {foundations[cat.id].length > 0 && (
              <span className="text-sm sm:text-lg font-black mt-0.5 sm:mt-1 leading-none">{foundations[cat.id][foundations[cat.id].length - 1].value}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tableau Area */}
      <div className="flex-1 grid grid-cols-6 gap-2 sm:gap-3 overflow-y-auto pb-24 custom-scrollbar">
        {tableau.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-0.5 min-h-[300px]" onClick={() => col.length === 0 && onTableauClick(colIdx)}>
            {col.map((card, cardIdx) => (
              <button
                key={card.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onTableauClick(colIdx);
                }}
                className={cn(
                  "w-full aspect-[2/3] rounded-xl sm:rounded-2xl border-2 shadow-lg flex flex-col items-center justify-between p-1.5 sm:p-2 text-center transition-all relative transform-gpu overflow-hidden",
                  card.visible 
                    ? "bg-gradient-to-b from-white to-zinc-50 border-zinc-200" 
                    : "bg-gradient-to-br from-primary/90 to-primary border-white/20",
                  card.visible ? "translate-y-0" : "-translate-y-2",
                  selected?.type === 'tableau' && selected.colIdx === colIdx && selected.cardIdx === cardIdx 
                    ? "ring-4 ring-amber-400 scale-110 z-50 border-amber-400 shadow-2xl" 
                    : "border-transparent",
                  cardIdx > 0 && "-mt-[105%] sm:-mt-[100%]", // Overlap effect
                  card.visible && CATEGORIES.find(c => c.id === card.category)?.text
                )}
              >
                {card.visible ? (
                  <>
                    <div className="w-full flex justify-between items-start opacity-95">
                       <span className="text-[13px] sm:text-[16px] font-black leading-none">{card.value}</span>
                       <span className="text-[10px] sm:text-[12px]">{CATEGORIES.find(c => c.id === card.category)?.icon}</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center px-0.5">
                      <span className="text-[8px] sm:text-[11px] font-black leading-tight uppercase tracking-tight sm:tracking-tighter break-words">
                        {card.text}
                      </span>
                    </div>

                    {selected?.type === 'tableau' && selected.colIdx === colIdx && selected.cardIdx === cardIdx && (
                      <div className="absolute inset-0 bg-amber-400/10 pointer-events-none" />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
                    <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white/30 drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Win State */}
      {isWin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[40px] p-8 text-center space-y-6 shadow-2xl max-w-sm">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Trophy className="h-12 w-12 text-amber-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-zinc-900 leading-tight">Mestre da Paciência Bíblica!</h2>
              <p className="text-zinc-500 font-medium">Você dominou a arte de organizar a doutrina e a liturgia.</p>
            </div>
            <Button onClick={initGame} className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 bg-primary">
              JOGAR NOVAMENTE
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
