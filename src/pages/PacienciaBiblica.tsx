import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RefreshCw, Trophy, BookOpen, Undo2, Lightbulb, Settings, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import confetti from 'canvas-confetti';

// --- Types ---
type Category = 'missa' | 'santos' | 'sacramentos' | 'oracoes';

interface CardData {
  id: string;
  text: string;
  category: Category;
  value: number; // 1 (A) to 13 (K)
  visible: boolean;
}

interface GameState {
  level: number;
  deck: CardData[];
  waste: CardData[];
  foundations: Record<Category, CardData[]>;
  tableau: CardData[][];
  history: any[];
  timer: number;
  isPlaying: boolean;
  score: number;
}

// --- Constants ---
const CATEGORIES: { id: Category; label: string; color: string; text: string; icon: string }[] = [
  { id: 'missa', label: 'Missa', color: 'bg-[#2e5cb8]', text: 'text-[#2e5cb8]', icon: '⛪' },
  { id: 'santos', label: 'Santos', color: 'bg-[#b8860b]', text: 'text-[#b8860b]', icon: '😇' },
  { id: 'sacramentos', label: 'Sacramentos e Obras', color: 'bg-[#1b4d3e]', text: 'text-[#1b4d3e]', icon: '💧' },
  { id: 'oracoes', label: 'Orações', color: 'bg-[#9b111e]', text: 'text-[#9b111e]', icon: '🙏' },
];

const DATA: Record<Category, string[]> = {
  missa: ['Ritos Iniciais', 'Ato Penitencial', 'Glória', 'Oração Coleta', '1ª Leitura', 'Salmo', 'Evangelho', 'Homilia', 'Credo', 'Ofertório', 'Santo', 'Consagração', 'Comunhão'],
  santos: ['S. Pedro', 'S. Paulo', 'S. João', 'N. Sra Maria', 'S. José', 'S. Francisco', 'S. Antônio', 'Sta Rita', 'Sta Teresinha', 'S. Bento', 'S. Expedito', 'S. Jorge', 'S. Judas'],
  sacramentos: ['Batismo', 'Crisma', 'Eucaristia', 'Confissão', 'Unção', 'Ordem', 'Matrimônio', 'Dar de comer', 'Dar de beber', 'Vestir nus', 'Visitar doentes', 'Enterrar mortos', 'Acolher'],
  oracoes: ['Pai Nosso', 'Ave Maria', 'Glória ao Pai', 'Salve Rainha', 'Creio', 'Santo Anjo', 'Vinde Espírito', 'Terço', 'Via Sacra', 'Angelus', 'Magnificat', 'Te Deum', 'Salmo 23'],
};

const LEVEL_CONFIGS = [
  { cols: 4, draw: 1, initialVisible: 'all', desc: "Introdução" },
  { cols: 5, draw: 1, initialVisible: 'top', desc: "Fácil" },
  { cols: 6, draw: 1, initialVisible: 'top', desc: "Normal" },
  { cols: 7, draw: 1, initialVisible: 'top', desc: "Padrão" },
  { cols: 7, draw: 3, initialVisible: 'top', desc: "Desafio 3" },
  { cols: 8, draw: 1, initialVisible: 'top', desc: "Avançado" },
  { cols: 8, draw: 3, initialVisible: 'top', desc: "Mestre" },
  { cols: 9, draw: 3, initialVisible: 'top', desc: "Épico" },
  { cols: 10, draw: 3, initialVisible: 'top', desc: "Lendário" },
  { cols: 11, draw: 3, initialVisible: 'top', desc: "Impossível" },
];

const LOCAL_STORAGE_KEY = '@PacienciaBiblica:state';

// --- Helper Functions ---
const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  CATEGORIES.forEach(cat => {
    DATA[cat.id].forEach((text, i) => {
      deck.push({ id: `${cat.id}-${i + 1}`, text, category: cat.id, value: i + 1, visible: false });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

export default function PacienciaBiblica() {
  const navigate = useNavigate();
  
  // Game State
  const [level, setLevel] = useState(1);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [waste, setWaste] = useState<CardData[]>([]);
  const [foundations, setFoundations] = useState<Record<Category, CardData[]>>({ missa: [], santos: [], sacramentos: [], oracoes: [] });
  const [tableau, setTableau] = useState<CardData[][]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  // UI State
  const [selected, setSelected] = useState<{ type: 'waste' | 'tableau', colIdx?: number, cardIdx?: number } | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  // Drag State
  const [dragState, setDragState] = useState<{
    cards: CardData[];
    source: { type: 'waste' | 'tableau', colIdx?: number, cardIdx?: number };
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    width: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLevel(parsed.level || 1);
        setDeck(parsed.deck || []);
        setWaste(parsed.waste || []);
        setFoundations(parsed.foundations || { missa: [], santos: [], sacramentos: [], oracoes: [] });
        setTableau(parsed.tableau || []);
        setTimer(parsed.timer || 0);
        setIsPlaying(parsed.isPlaying || false);
        setHistory(parsed.history || []);
      } catch (e) {
        console.error("Failed to load save", e);
        initLevel(1);
      }
    } else {
      initLevel(1);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (tableau.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        level, deck, waste, foundations, tableau, timer, isPlaying, history
      }));
    }
  }, [level, deck, waste, foundations, tableau, timer, isPlaying, history]);

  // Timer
  useEffect(() => {
    let interval: any;
    if (isPlaying && !isWin) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isWin]);

  const saveHistory = () => {
    setHistory(prev => {
      const newHistory = [...prev, { deck, waste, foundations, tableau, score: 0 }];
      if (newHistory.length > 10) newHistory.shift(); // Keep last 10
      return newHistory;
    });
  };

  const undo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setDeck(lastState.deck);
    setWaste(lastState.waste);
    setFoundations(lastState.foundations);
    setTableau(lastState.tableau);
    setHistory(prev => prev.slice(0, -1));
    setSelected(null);
  };

  const initLevel = (newLevel: number) => {
    const config = LEVEL_CONFIGS[newLevel - 1];
    const shuffled = createDeck();
    const newTableau: CardData[][] = Array.from({ length: config.cols }, () => []);
    
    let currentIdx = 0;
    for (let i = 0; i < config.cols; i++) {
      for (let j = 0; j <= i; j++) {
        if (currentIdx < shuffled.length) {
          const card = shuffled[currentIdx++];
          // Initial visibility logic
          let visible = false;
          if (config.initialVisible === 'all') visible = true;
          else if (config.initialVisible === 'top' && j === i) visible = true;
          newTableau[i].push({ ...card, visible });
        }
      }
    }

    setLevel(newLevel);
    setTableau(newTableau);
    setDeck(shuffled.slice(currentIdx));
    setWaste([]);
    setFoundations({ missa: [], santos: [], sacramentos: [], oracoes: [] });
    setSelected(null);
    setHistory([]);
    setTimer(0);
    setIsPlaying(true);
    setIsWin(false);
    setShowLevelSelect(false);
    toast.success(`Nível ${newLevel} iniciado!`);
  };

  const drawCard = () => {
    saveHistory();
    const config = LEVEL_CONFIGS[level - 1];
    const drawCount = config.draw;

    if (deck.length === 0) {
      if (waste.length === 0) return;
      setDeck([...waste].reverse().map(c => ({ ...c, visible: false })));
      setWaste([]);
      return;
    }

    const nextCards = deck.slice(-drawCount).reverse();
    setDeck(prev => prev.slice(0, -drawCount));
    setWaste(prev => [...prev, ...nextCards.map(c => ({ ...c, visible: true }))]);
    setSelected(null);
  };

  // --- Logic ---
  const canMoveToTableau = (card: CardData, targetCol: CardData[]) => {
    if (targetCol.length === 0) return card.value === 13; // King on empty
    const topCard = targetCol[targetCol.length - 1];
    // Solitaire rules: alternating colors, descending values
    const isCardRed = card.category === 'santos' || card.category === 'oracoes';
    const isTopRed = topCard.category === 'santos' || topCard.category === 'oracoes';
    return card.value === topCard.value - 1 && isCardRed !== isTopRed;
  };

  const canMoveToFoundation = (card: CardData, catId: Category) => {
    if (card.category !== catId) return false;
    const targetFoundation = foundations[catId];
    if (targetFoundation.length === 0) return card.value === 1; // Ace on empty
    return card.value === targetFoundation[targetFoundation.length - 1].value + 1;
  };

  const executeMove = (source: any, target: any) => {
    saveHistory();
    let cardsToMove: CardData[] = [];
    let newWaste = [...waste];
    let newTableau = tableau.map(col => [...col]);
    let newFoundations = { ...foundations };

    // 1. Remove from source
    if (source.type === 'waste') {
      cardsToMove = [newWaste.pop()!];
    } else if (source.type === 'tableau') {
      const col = newTableau[source.colIdx];
      cardsToMove = col.slice(source.cardIdx);
      newTableau[source.colIdx] = col.slice(0, source.cardIdx);
      
      // Auto-flip previous card
      const remaining = newTableau[source.colIdx];
      if (remaining.length > 0 && !remaining[remaining.length - 1].visible) {
        remaining[remaining.length - 1].visible = true;
      }
    }

    // 2. Add to target
    if (target.type === 'tableau') {
      newTableau[target.colIdx] = [...newTableau[target.colIdx], ...cardsToMove];
    } else if (target.type === 'foundation') {
      newFoundations[target.catId as Category] = [...newFoundations[target.catId as Category], ...cardsToMove];
    }

    setWaste(newWaste);
    setTableau(newTableau);
    setFoundations(newFoundations);
    setSelected(null);

    // Check win
    if (Object.values(newFoundations).every(f => f.length === 13)) {
      handleWin();
    }
  };

  const handleWin = () => {
    setIsPlaying(false);
    setIsWin(true);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }, 500);
  };

  const autoMoveToFoundation = (card: CardData, source: any) => {
    if (canMoveToFoundation(card, card.category)) {
      executeMove(source, { type: 'foundation', catId: card.category });
      return true;
    }
    return false;
  };

  // --- Click Handlers (Fallback for non-drag) ---
  const handleTableauClick = (colIdx: number, cardIdx: number) => {
    const col = tableau[colIdx];
    const card = col[cardIdx];
    
    if (!card.visible) return;

    if (selected) {
      // Try to move selected here
      const sourceCard = selected.type === 'waste' ? waste[waste.length - 1] : tableau[selected.colIdx!][selected.cardIdx!];
      if (canMoveToTableau(sourceCard, col)) {
        executeMove(selected, { type: 'tableau', colIdx });
        return;
      }
      setSelected(null); // Invalid move, deselect
    } else {
      // Select or Auto-move
      if (cardIdx === col.length - 1) { // Only top card can auto-move to foundation
         if (!autoMoveToFoundation(card, { type: 'tableau', colIdx, cardIdx })) {
           setSelected({ type: 'tableau', colIdx, cardIdx });
         }
      } else {
        setSelected({ type: 'tableau', colIdx, cardIdx });
      }
    }
  };

  const handleEmptyTableauClick = (colIdx: number) => {
    if (selected) {
      const sourceCard = selected.type === 'waste' ? waste[waste.length - 1] : tableau[selected.colIdx!][selected.cardIdx!];
      if (canMoveToTableau(sourceCard, [])) {
        executeMove(selected, { type: 'tableau', colIdx });
      }
      setSelected(null);
    }
  };

  const handleWasteClick = () => {
    if (waste.length === 0) return;
    const topWaste = waste[waste.length - 1];
    
    if (selected?.type === 'waste') {
      setSelected(null);
    } else if (!autoMoveToFoundation(topWaste, { type: 'waste' })) {
      setSelected({ type: 'waste' });
    }
  };

  const handleFoundationClick = (catId: Category) => {
    if (!selected) return;
    const sourceCard = selected.type === 'waste' ? waste[waste.length - 1] : tableau[selected.colIdx!][selected.cardIdx!];
    
    // Can only move single card to foundation
    if (selected.type === 'tableau' && selected.cardIdx !== tableau[selected.colIdx!].length - 1) {
      toast.error("Apenas uma carta pode ir para a base");
      setSelected(null);
      return;
    }

    if (canMoveToFoundation(sourceCard, catId)) {
      executeMove(selected, { type: 'foundation', catId });
    } else {
      setSelected(null);
    }
  };

  // --- Drag & Drop Handlers ---
  const handlePointerDown = (e: React.PointerEvent, source: any, cards: CardData[], width: number) => {
    if (!cards[0].visible) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setDragState({
      cards,
      source,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      width
    });
    setSelected(null); // Clear click selection when dragging starts
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    setDragState(prev => ({
      ...prev!,
      currentX: e.clientX,
      currentY: e.clientY
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Simple hit detection (distance from start to distinguish click vs drag)
    const dist = Math.hypot(dragState.currentX - dragState.startX, dragState.currentY - dragState.startY);
    if (dist < 10) {
      // Treat as click
      if (dragState.source.type === 'waste') handleWasteClick();
      else if (dragState.source.type === 'tableau') handleTableauClick(dragState.source.colIdx!, dragState.source.cardIdx!);
      setDragState(null);
      return;
    }

    // Hit detection for drop zones
    const elementsUnderPointer = document.elementsFromPoint(e.clientX, e.clientY);
    let dropped = false;

    for (const el of elementsUnderPointer) {
      // Check tableau columns
      const colIdxStr = el.getAttribute('data-tableau-col');
      if (colIdxStr !== null) {
        const colIdx = parseInt(colIdxStr);
        if (dragState.source.type === 'tableau' && dragState.source.colIdx === colIdx) break; // Same col
        if (canMoveToTableau(dragState.cards[0], tableau[colIdx])) {
          executeMove(dragState.source, { type: 'tableau', colIdx });
          dropped = true;
        }
        break;
      }

      // Check foundations
      const foundationCat = el.getAttribute('data-foundation-cat');
      if (foundationCat !== null) {
        if (dragState.cards.length === 1 && canMoveToFoundation(dragState.cards[0], foundationCat as Category)) {
          executeMove(dragState.source, { type: 'foundation', catId: foundationCat });
          dropped = true;
        }
        break;
      }
    }

    if (!dropped && dist >= 10 && dragState.cards.length === 1) {
      // Try auto-move to foundation if dragged upwards generically
      if (dragState.currentY < dragState.startY - 50) {
         autoMoveToFoundation(dragState.cards[0], dragState.source);
      }
    }

    setDragState(null);
  };


  // --- Render Helpers ---
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderCard = (card: CardData, isTop: boolean = true) => {
    const cat = CATEGORIES.find(c => c.id === card.category);
    if (!card.visible) {
      return (
        <div className="w-full h-full rounded-lg sm:rounded-xl border border-black/10 shadow-sm flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#e67e22] to-[#d35400] text-white/20">
            {/* Pattern placeholder */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 drop-shadow-md opacity-50" />
            <span className="absolute bottom-1 right-1.5 text-[10px] font-bold opacity-60 font-serif">{card.value}</span>
        </div>
      );
    }

    return (
      <div className={cn(
        "w-full h-full rounded-lg sm:rounded-xl border shadow-sm flex flex-col items-center justify-between p-1 sm:p-1.5 text-center bg-white relative overflow-hidden font-serif",
        cat?.text,
        "border-zinc-200"
      )}>
        <div className="w-full flex justify-between items-start leading-none">
           <span className="text-xs sm:text-sm font-bold">{card.value === 1 ? 'A' : card.value === 11 ? 'J' : card.value === 12 ? 'Q' : card.value === 13 ? 'K' : card.value}</span>
           <span className="text-[10px] sm:text-xs">{cat?.icon}</span>
        </div>
        
        {isTop && (
          <div className="flex-1 flex items-center justify-center w-full px-0.5">
            <span className="text-[9px] sm:text-[11px] font-bold leading-tight break-words text-center text-zinc-800">
              {card.text}
            </span>
          </div>
        )}
        
        {isTop && (
          <div className={cn("w-full h-1 mt-auto rounded-full opacity-80", cat?.color)} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1a472a] flex flex-col overflow-hidden touch-none" ref={containerRef}>
      
      {/* Header Bar */}
      <div className="flex items-center justify-between p-2 sm:p-4 text-white bg-black/20 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/jogos")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold leading-none">Paciência Bíblica</h1>
            <p className="text-[10px] sm:text-xs text-white/70">Nível {level} • {formatTime(timer)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={undo} disabled={history.length === 0} className="text-white hover:bg-white/10 h-8 w-8 rounded-full disabled:opacity-30">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => initLevel(level)} className="text-white hover:bg-white/10 h-8 w-8 rounded-full">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowLevelSelect(true)} className="text-white hover:bg-white/10 h-8 w-8 rounded-full bg-white/5">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 flex flex-col p-2 sm:p-4 gap-4 sm:gap-6 overflow-hidden relative">
        
        {/* Top Row: Deck, Waste, Foundations */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full">
          {/* Deck */}
          <div className="col-span-1 relative aspect-[2/3]">
            <button 
              onClick={drawCard}
              className={cn(
                "absolute inset-0 rounded-lg sm:rounded-xl border flex items-center justify-center transition-transform active:scale-95 shadow-md",
                deck.length > 0 ? "bg-gradient-to-br from-[#e67e22] to-[#d35400] border-white/20" : "bg-black/20 border-white/10"
              )}
            >
              {deck.length > 0 ? (
                <>
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                  <BookOpen className="h-4 w-4 sm:h-8 sm:w-8 text-white/50" />
                </>
              ) : (
                <RefreshCw className="h-4 w-4 sm:h-6 sm:w-6 text-white/20" />
              )}
            </button>
          </div>

          {/* Waste */}
          <div className="col-span-1 relative aspect-[2/3]">
            {waste.length > 0 && (
              <div 
                className={cn(
                  "absolute inset-0 transition-transform",
                  selected?.type === 'waste' ? 'ring-2 ring-amber-400 scale-105 z-10' : ''
                )}
                onPointerDown={(e) => handlePointerDown(e, { type: 'waste' }, [waste[waste.length - 1]], (e.target as HTMLElement).offsetWidth)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {renderCard(waste[waste.length - 1])}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="col-span-1"></div>

          {/* Foundations */}
          {CATEGORIES.map(cat => (
            <div 
              key={cat.id} 
              className="col-span-1 relative aspect-[2/3]"
              data-foundation-cat={cat.id}
              onClick={() => handleFoundationClick(cat.id)}
            >
              <div className={cn(
                "absolute inset-0 rounded-lg sm:rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
                foundations[cat.id].length > 0 ? "border-transparent shadow-lg" : "border-white/30 bg-black/10"
              )}>
                {foundations[cat.id].length === 0 && (
                  <span className="text-xl sm:text-2xl opacity-40">{cat.icon}</span>
                )}
                {foundations[cat.id].length > 0 && renderCard(foundations[cat.id][foundations[cat.id].length - 1])}
              </div>
            </div>
          ))}
        </div>

        {/* Tableau */}
        <div className="flex-1 flex justify-between gap-1 sm:gap-2 overflow-y-auto pb-8 custom-scrollbar">
          {tableau.map((col, colIdx) => (
            <div 
              key={colIdx} 
              className="flex-1 relative min-w-[40px] max-w-[80px]"
              data-tableau-col={colIdx}
              onClick={() => col.length === 0 && handleEmptyTableauClick(colIdx)}
            >
              {col.length === 0 && (
                 <div className="w-full aspect-[2/3] rounded-lg border-2 border-white/10 border-dashed bg-black/5" />
              )}
              {col.map((card, cardIdx) => {
                const isTop = cardIdx === col.length - 1;
                const isSelected = selected?.type === 'tableau' && selected.colIdx === colIdx && selected.cardIdx === cardIdx;
                
                // Hide actual cards if they are part of the drag stack
                const isBeingDragged = dragState?.source.type === 'tableau' && 
                                       dragState.source.colIdx === colIdx && 
                                       cardIdx >= dragState.source.cardIdx!;

                return (
                  <div
                    key={card.id}
                    className={cn(
                      "absolute w-full aspect-[2/3] transition-all",
                      isSelected ? 'ring-2 ring-amber-400 z-10' : '',
                      isBeingDragged ? 'opacity-0' : 'opacity-100'
                    )}
                    style={{ top: `${cardIdx * (card.visible ? 25 : 12)}%` }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (card.visible) {
                         handlePointerDown(e, { type: 'tableau', colIdx, cardIdx }, col.slice(cardIdx), (e.currentTarget as HTMLElement).offsetWidth);
                      }
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  >
                    {renderCard(card, isTop || !card.visible)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

      </div>

      {/* Floating Drag Layer */}
      {dragState && (
        <div 
          className="fixed pointer-events-none z-50 flex flex-col"
          style={{ 
            left: dragState.currentX - (dragState.width / 2), 
            top: dragState.currentY - 20,
            width: dragState.width
          }}
        >
          {dragState.cards.map((card, i) => (
            <div 
              key={card.id} 
              className={cn("w-full aspect-[2/3] shadow-2xl", i > 0 && "-mt-[75%]")}
            >
              {renderCard(card, i === dragState.cards.length - 1)}
            </div>
          ))}
        </div>
      )}

      {/* Level Select Modal */}
      {showLevelSelect && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-zinc-900">Selecionar Nível</h2>
              <Button variant="ghost" onClick={() => setShowLevelSelect(false)}>✕</Button>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 space-y-2">
              {LEVEL_CONFIGS.map((config, idx) => {
                const lvl = idx + 1;
                return (
                  <button
                    key={lvl}
                    onClick={() => initLevel(lvl)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                      level === lvl ? "border-primary bg-primary/5" : "border-zinc-200 hover:border-primary/50"
                    )}
                  >
                    <div>
                      <div className="font-bold text-zinc-900">Nível {lvl}</div>
                      <div className="text-xs text-zinc-500">{config.desc} • {config.cols} colunas</div>
                    </div>
                    {level === lvl && <Play className="h-5 w-5 text-primary fill-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {isWin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-400/20 to-transparent" />
            
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30 text-white animate-bounce">
              <Trophy className="h-10 w-10" />
            </div>
            
            <h2 className="text-2xl font-black text-zinc-900 mb-2">Vitória Divina!</h2>
            <p className="text-zinc-600 text-sm mb-6">
              Você completou o Nível {level} em {formatTime(timer)}!<br/>
              A organização fortalece o espírito.
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => initLevel(level)} 
                className="flex-1 rounded-xl font-bold border-2"
              >
                Refazer
              </Button>
              <Button 
                onClick={() => initLevel(level < 10 ? level + 1 : 1)} 
                className="flex-1 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              >
                {level < 10 ? "Próximo Nível" : "Início"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
