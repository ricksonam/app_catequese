import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Trophy, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Card {
  id: string;
  text: string;
  category: string;
  visible: boolean;
}

const CATEGORIES = [
  { id: 'missa', label: 'Missa', color: 'bg-blue-500', icon: '⛪' },
  { id: 'santos', label: 'Santos', color: 'bg-amber-500', icon: '😇' },
  { id: 'sacramentos', label: 'Sacramentos', color: 'bg-emerald-500', icon: '💧' },
  { id: 'oracoes', label: 'Orações', color: 'bg-rose-500', icon: '🙏' },
];

const CARDS_DATA = [
  { text: 'Eucaristia', category: 'missa' },
  { text: 'Ofertório', category: 'missa' },
  { text: 'Comunhão', category: 'missa' },
  { text: 'Homilia', category: 'missa' },
  { text: 'Santo Antônio', category: 'santos' },
  { text: 'Santa Rita', category: 'santos' },
  { text: 'São José', category: 'santos' },
  { text: 'São Paulo', category: 'santos' },
  { text: 'Batismo', category: 'sacramentos' },
  { text: 'Crisma', category: 'sacramentos' },
  { text: 'Confissão', category: 'sacramentos' },
  { text: 'Matrimônio', category: 'sacramentos' },
  { text: 'Pai Nosso', category: 'oracoes' },
  { text: 'Ave Maria', category: 'oracoes' },
  { text: 'Credo', category: 'oracoes' },
  { text: 'Salve Rainha', category: 'oracoes' },
];

export default function PacienciaBiblica() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Card[]>([]);
  const [foundations, setFoundations] = useState<Record<string, Card[]>>({
    missa: [],
    santos: [],
    sacramentos: [],
    oracoes: [],
  });
  const [tableau, setTableau] = useState<Card[][]>([[], [], [], [], [], []]);
  const [selectedCard, setSelectedCard] = useState<{ card: Card, from: { type: 'deck' | 'tableau', index?: number } } | null>(null);

  const initGame = () => {
    const shuffled = [...CARDS_DATA]
      .sort(() => Math.random() - 0.5)
      .map((c, i) => ({ ...c, id: `card-${i}`, visible: true }));
    
    const newTableau: Card[][] = [[], [], [], [], [], []];
    let cardIdx = 0;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j <= i; j++) {
        if (cardIdx < shuffled.length) {
          newTableau[i].push({ ...shuffled[cardIdx], visible: j === i });
          cardIdx++;
        }
      }
    }
    
    setTableau(newTableau);
    setDeck(shuffled.slice(cardIdx));
    setFoundations({ missa: [], santos: [], sacramentos: [], oracoes: [] });
    setSelectedCard(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  const onCardClick = (card: Card, from: { type: 'deck' | 'tableau', index?: number }) => {
    if (!card.visible) return;
    
    if (selectedCard?.card.id === card.id) {
      setSelectedCard(null);
      return;
    }
    
    setSelectedCard({ card, from });
  };

  const onFoundationClick = (catId: string) => {
    if (!selectedCard) return;
    
    if (selectedCard.card.category === catId) {
      // Move to foundation
      setFoundations(prev => ({
        ...prev,
        [catId]: [...prev[catId], selectedCard.card]
      }));
      
      // Remove from source
      if (selectedCard.from.type === 'tableau') {
        setTableau(prev => {
          const next = [...prev];
          next[selectedCard.from.index!].pop();
          if (next[selectedCard.from.index!].length > 0) {
            next[selectedCard.from.index!][next[selectedCard.from.index!].length - 1].visible = true;
          }
          return next;
        });
      } else {
        setDeck(prev => prev.filter(c => c.id !== selectedCard.card.id));
      }
      
      setSelectedCard(null);
      toast.success("Correto!");
    } else {
      toast.error("Categoria incorreta!");
      setSelectedCard(null);
    }
  };

  const isWin = Object.values(foundations).every(f => f.length === 4);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-white border shadow-sm">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-foreground">Paciência Bíblica</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Ordene por categorias</p>
        </div>
        <Button variant="outline" size="icon" onClick={initGame} className="rounded-xl">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Foundations */}
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onFoundationClick(cat.id)}
            className={cn(
              "aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 transition-all",
              foundations[cat.id].length > 0 ? cat.color + " border-transparent text-white" : "border-zinc-200 text-zinc-400"
            )}
          >
            <span className="text-2xl mb-1">{cat.icon}</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">{cat.label}</span>
            <span className="text-lg font-black mt-1">{foundations[cat.id].length}/4</span>
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="flex-1 grid grid-cols-6 gap-1 mt-4">
        {tableau.map((col, i) => (
          <div key={i} className="flex flex-col gap-1">
            {col.map((card, j) => (
              <button
                key={card.id}
                onClick={() => onCardClick(card, { type: 'tableau', index: i })}
                className={cn(
                  "w-full aspect-[2/3] rounded-lg border-2 shadow-sm flex items-center justify-center p-1 text-center transition-all transform",
                  card.visible ? "bg-white border-zinc-200" : "bg-primary/20 border-primary/30",
                  selectedCard?.card.id === card.id && "ring-4 ring-primary ring-offset-2 scale-105 z-50",
                  !card.visible && "cursor-not-allowed"
                )}
              >
                {card.visible ? (
                  <span className="text-[8px] font-bold leading-tight">{card.text}</span>
                ) : (
                  <BookOpen className="h-4 w-4 text-primary/40" />
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Win State */}
      {isWin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[40px] p-8 text-center space-y-6 shadow-2xl max-w-xs">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Trophy className="h-10 w-10 text-amber-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-zinc-900">Parabéns!</h2>
              <p className="text-zinc-500 font-medium">Você organizou todos os itens bíblicos com sucesso!</p>
            </div>
            <Button onClick={initGame} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
              JOGAR NOVAMENTE
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
