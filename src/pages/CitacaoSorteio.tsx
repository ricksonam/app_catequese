import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Book, Shuffle, Users, Save, Maximize, Minimize, Scroll, Cross, Plus, X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTurmas, useCatequizandos, useCitacoes, useSaveHistoricoCitacao, useHistoricoCitacoes } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CitacaoBiblica } from "@/lib/store";

const LIVROS_ANTIGO = [
  "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio",
  "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel", "1 Reis", "2 Reis",
  "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Tobias", "Judite",
  "Ester", "1 Macabeus", "2 Macabeus", "Jó", "Salmos", "Provérbios",
  "Eclesiastes", "Cânticos", "Sabedoria", "Eclesiástico", "Isaías",
  "Jeremias", "Lamentações", "Baruc", "Ezequiel", "Daniel", "Oséias",
  "Joel", "Amós", "Obadias", "Jonas", "Miquéias", "Naum", "Habacuc",
  "Sofonias", "Ageu", "Zacarias", "Malaquias"
];

const LIVROS_NOVO = [
  "Mateus", "Marcos", "Lucas", "João", "Atos dos Apóstolos",
  "Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses",
  "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo",
  "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João",
  "3 João", "Judas", "Apocalipse"
];

const LIVROS_CAPITULOS: Record<string, number> = {
  "Gênesis": 50, "Êxodo": 40, "Levítico": 27, "Números": 36, "Deuteronômio": 34,
  "Josué": 24, "Juízes": 21, "Rute": 4, "1 Samuel": 31, "2 Samuel": 24, "1 Reis": 22, "2 Reis": 25,
  "1 Crônicas": 29, "2 Crônicas": 36, "Esdras": 10, "Neemias": 13, "Tobias": 14, "Judite": 16,
  "Ester": 10, "1 Macabeus": 16, "2 Macabeus": 15, "Jó": 42, "Salmos": 150, "Provérbios": 31,
  "Eclesiastes": 12, "Cânticos": 8, "Sabedoria": 19, "Eclesiástico": 51, "Isaías": 66,
  "Jeremias": 52, "Lamentações": 5, "Baruc": 6, "Ezequiel": 48, "Daniel": 14, "Oséias": 14,
  "Joel": 4, "Amós": 9, "Obadias": 1, "Jonas": 4, "Miquéias": 7, "Naum": 3, "Habacuc": 3,
  "Sofonias": 3, "Ageu": 2, "Zacarias": 14, "Malaquias": 3,
  "Mateus": 28, "Marcos": 16, "Lucas": 24, "João": 21, "Atos dos Apóstolos": 28,
  "Romanos": 16, "1 Coríntios": 16, "2 Coríntios": 13, "Gálatas": 6, "Efésios": 6, "Filipenses": 4,
  "Colossenses": 4, "1 Tessalonicenses": 5, "2 Tessalonicenses": 3, "1 Timóteo": 6, "2 Timóteo": 4,
  "Tito": 3, "Filemom": 1, "Hebreus": 13, "Tiago": 5, "1 Pedro": 5, "2 Pedro": 3, "1 João": 5, "2 João": 1,
  "3 João": 1, "Judas": 1, "Apocalipse": 22
};

const LIVROS_BIBLICOS = [...LIVROS_ANTIGO, ...LIVROS_NOVO];

const CAPITULOS_BIBLICOS = [
  "Gênesis 1", "Gênesis 12", "Êxodo 20", "Salmo 23", "Salmo 91", 
  "Provérbios 3", "Isaías 53", "Mateus 5", "Mateus 6", "Lucas 1",
  "Lucas 15", "João 1", "João 15", "Atos 2", "Romanos 8", 
  "1 Coríntios 13", "Hebreus 11", "Apocalipse 21"
];

export default function CitacaoSorteio() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { data: turmas } = useTurmas();
  const { data: citacoesBase = [] } = useCitacoes();
  const saveHistorico = useSaveHistoricoCitacao();
  
  const [categoriaSorteio, setCategoriaSorteio] = useState<"citacao" | "livro" | "capitulo" | "antigo" | "novo">("citacao");
  const [livroSelecionadoParaCapitulo, setLivroSelecionadoParaCapitulo] = useState<string>("");
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const { data: catequizandos = [] } = useCatequizandos(selectedTurma || undefined);
  
  const [nomesAvulsos, setNomesAvulsos] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState("");

  const [sorteando, setSorteando] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [citacaoAtual, setCitacaoAtual] = useState<{titulo: string; texto: string; sub: string} | null>(null);
  const [participanteAtual, setParticipanteAtual] = useState<string | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  
  const [resultados, setResultados] = useState<Record<string, string>>({});
  const [filaAlunos, setFilaAlunos] = useState<string[]>([]);
  
  const [showHistorico, setShowHistorico] = useState(false);
  const { data: historico = [] } = useHistoricoCitacoes(selectedTurma || undefined);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    
    const audio = new Audio("https://www.orangefreesounds.com/wp-content/uploads/2019/05/Drum-roll-suspense-award.mp3");
    audioRef.current = audio;

    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const adicionarNome = () => {
    const nome = novoNome.trim();
    if (nome && !nomesAvulsos.includes(nome)) {
      setNomesAvulsos([...nomesAvulsos, nome]);
      setNovoNome("");
    }
  };

  const removerNome = (nome: string) => {
    setNomesAvulsos(nomesAvulsos.filter(n => n !== nome));
  };

  const getAlistaParticipantes = () => {
    const nomesTurma = catequizandos.map(c => c.nome);
    return [...new Set([...nomesTurma, ...nomesAvulsos])];
  };

  const getEvangelhoDia = async () => {
    if (categoriaSorteio !== "citacao") return null;
    try {
      const res = await fetch("https://api-liturgia-diaria.vercel.app/");
      const data = await res.json();
      if (data.evangelho) {
        return {
          id: "evangelho-dia",
          referencia: data.evangelho.referencia,
          texto: data.evangelho.texto,
          categoria: "Evangelho do Dia"
        } as CitacaoBiblica;
      }
    } catch (e) {
      console.error("Erro ao buscar evangelho", e);
    }
    return null;
  };

  const iniciarSorteio = () => {
    if (categoriaSorteio === "capitulo" && !livroSelecionadoParaCapitulo) {
      toast.error("Selecione um livro para sortear os capítulos.");
      return;
    }
    const lista = getAlistaParticipantes();
    if (lista.length === 0) {
      toast.error("Adicione participantes ou selecione uma turma.");
      return;
    }
    setResultados({});
    setFilaAlunos(lista);
    setCitacaoAtual(null);
    setMostrarResultado(false);
    toast.success("Sorteio preparado!");
  };

  const sortear = async () => {
    if (filaAlunos.length === 0) {
      toast.info("Todos os participantes já receberam um item!");
      return;
    }

    setSorteando(true);
    setMostrarResultado(false);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    let poolValores: {titulo: string; texto: string; sub: string}[] = [];

    if (categoriaSorteio === "citacao") {
        let pool = [...citacoesBase];
        const evangelho = await getEvangelhoDia();
        if (evangelho) pool = [evangelho, ...pool];
        
        // Fallback for citacoes
        if (pool.length === 0) {
            pool.push({
                id: '1', 
                referencia: 'Salmos 23', 
                texto: 'O Senhor é meu pastor, nada me faltará.',
                categoria: "Salmos"
            });
        }
        poolValores = pool.map(p => ({
            titulo: p.referencia,
            texto: `"${p.texto}"`,
            sub: p.categoria || "Palavra Divina"
        }));
    } else if (categoriaSorteio === "livro") {
        poolValores = LIVROS_BIBLICOS.map(l => ({
            titulo: "Livro Bíblico",
            texto: l,
            sub: "Leia as histórias e ensinamentos deste livro!"
        }));
    } else if (categoriaSorteio === "antigo") {
        poolValores = LIVROS_ANTIGO.map(l => ({
            titulo: "Antigo Testamento",
            texto: l,
            sub: "Descubra a sabedoria dos livros antigos!"
        }));
    } else if (categoriaSorteio === "novo") {
        poolValores = LIVROS_NOVO.map(l => ({
            titulo: "Novo Testamento",
            texto: l,
            sub: "Siga os passos de Jesus e dos Apóstolos!"
        }));
    } else {
        const totalCapitulos = LIVROS_CAPITULOS[livroSelecionadoParaCapitulo] || 1;
        const caps = Array.from({ length: totalCapitulos }, (_, i) => i + 1);
        poolValores = caps.map(c => ({
            titulo: livroSelecionadoParaCapitulo,
            texto: `Capítulo ${c}`,
            sub: "Reze e reflita sobre este capítulo"
        }));
    }

    let count = 0;
    const interval = setInterval(() => {
      count++;
      
      if (count > 40) {
        clearInterval(interval);
        const finalCitacao = poolValores[Math.floor(Math.random() * poolValores.length)];
        
        setTimeout(() => {
          setCitacaoAtual(finalCitacao);
          const alunoNome = filaAlunos[0];
          setParticipanteAtual(alunoNome);
          
          setResultados(prev => ({ ...prev, [alunoNome]: `${finalCitacao.titulo}: ${finalCitacao.texto}` }));
          setFilaAlunos(prev => prev.slice(1));
          
          setSorteando(false);
          setMostrarResultado(true);
        }, 500);
      }
    }, 80);
  };

  const salvarNoHistorico = async () => {
    if (Object.keys(resultados).length === 0) return;
    try {
      await saveHistorico.mutateAsync({
        turmaId: selectedTurma || undefined,
        data: new Date().toISOString(),
        tipo: 'individual',
        resultados
      });
      toast.success("Resultados salvos no histórico!");
    } catch (e) {
      toast.error("Erro ao salvar histórico");
    }
  };

  const isConfigMode = filaAlunos.length === 0 && !citacaoAtual && !sorteando;

  return (
    <div ref={containerRef} className={cn(
      "min-h-full flex flex-col transition-all duration-500",
      isFullscreen ? "bg-[#fdf8f0] p-6 lg:p-12" : "space-y-5"
    )}>
      {/* Header */}
      <div className={cn("flex items-center gap-3 animate-fade-in", isFullscreen ? "hidden" : "flex")}>
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-amber-950/80">Sorteio Bíblico</h1>
          <p className="text-[10px] text-amber-900/60 uppercase tracking-widest font-black">Palavra de Vida</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleFullscreen} className="rounded-xl border-amber-200 text-amber-900 border-2 bg-amber-50">
            <Maximize className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistorico(true)} className="rounded-xl font-bold border-amber-200 text-amber-900 border-2 bg-amber-50">
            Histórico
          </Button>
        </div>
      </div>

      {isFullscreen && (
        <div className="absolute top-6 right-6 z-50">
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-amber-100/80 border-2 border-amber-200/50 text-amber-900 backdrop-blur-sm rounded-full shadow-lg">
            <Minimize className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Config Panel */}
      {isConfigMode && (
         <div className="float-card p-6 md:p-8 space-y-8 border-t-8 border-t-amber-600 bg-white/60 backdrop-blur-sm animate-float-up shadow-xl shadow-amber-900/10">
           
           {/* Categoria Selection Chips */}
           <div className="space-y-3">
             <div className="flex items-center gap-2">
               <Book className="h-5 w-5 text-amber-600" />
               <h3 className="font-black text-amber-950 uppercase tracking-wider text-sm">O que Deseja Sortear?</h3>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 w-full">
               <button 
                 onClick={() => setCategoriaSorteio("citacao")} 
                 className={cn("w-full px-3 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 text-center", categoriaSorteio === "citacao" ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20" : "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400")}
               >
                 Citação Bíblica
               </button>
               <button 
                  onClick={() => setCategoriaSorteio("antigo")} 
                  className={cn("w-full px-3 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 text-center", categoriaSorteio === "antigo" ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20" : "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400")}
                >
                  Antigo Testamento
                </button>
                <button 
                  onClick={() => setCategoriaSorteio("novo")} 
                  className={cn("w-full px-3 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 text-center", categoriaSorteio === "novo" ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20" : "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400")}
                >
                  Novo Testamento
                </button>
                <button 
                  onClick={() => setCategoriaSorteio("livro")} 
                  className={cn("w-full px-3 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 text-center", categoriaSorteio === "livro" ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20" : "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400")}
                >
                  Todos os Livros
                </button>
                <button 
                  onClick={() => setCategoriaSorteio("capitulo")} 
                  className={cn("w-full px-3 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 text-center", categoriaSorteio === "capitulo" ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20" : "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400")}
                >
                  Capítulo
                </button>
             </div>
           </div>

           {categoriaSorteio === "capitulo" && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Book className="h-4 w-4 text-amber-600" />
                  <h3 className="font-black text-amber-950 uppercase tracking-wider text-xs">Selecione o Livro para Sortear Capítulos</h3>
                </div>
                <select 
                  value={livroSelecionadoParaCapitulo}
                  onChange={(e) => setLivroSelecionadoParaCapitulo(e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-amber-200 bg-white/80 font-bold px-4 text-amber-900 focus:outline-none focus:border-amber-600 transition-colors"
                >
                  <option value="">Escolha um livro...</option>
                  <optgroup label="Antigo Testamento">
                    {LIVROS_ANTIGO.map(l => <option key={l} value={l}>{l}</option>)}
                  </optgroup>
                  <optgroup label="Novo Testamento">
                    {LIVROS_NOVO.map(l => <option key={l} value={l}>{l}</option>)}
                  </optgroup>
                </select>
              </div>
            )}

           <div className="h-px bg-amber-900/10 w-full" />

           {/* Participants Selection */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-3">
               <div className="flex items-center gap-2">
                 <Users className="h-5 w-5 text-amber-600" />
                 <h3 className="font-black text-amber-950 uppercase tracking-wider text-sm">Selecione uma Turma</h3>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 {turmas?.map((t) => (
                   <button
                     key={t.id}
                     onClick={() => {
                        setSelectedTurma(selectedTurma === t.id ? "" : t.id);
                     }}
                     className={cn(
                       "p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center group relative overflow-hidden",
                       selectedTurma === t.id 
                         ? "border-amber-600 bg-amber-50 shadow-md shadow-amber-900/10 ring-2 ring-amber-600/20" 
                         : "border-border hover:border-amber-500/30 bg-white"
                     )}
                   >
                     <div className={cn(
                       "w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm",
                       selectedTurma === t.id ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-800"
                     )}>
                       <Users className="h-4 w-4" />
                     </div>
                     <p className={cn("text-xs font-black leading-tight", selectedTurma === t.id ? "text-amber-900" : "text-amber-950")}>{t.nome}</p>
                   </button>
                 ))}
               </div>
             </div>

             <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-amber-600" />
                    <h3 className="font-black text-amber-950 uppercase tracking-wider text-sm">Nomes Avulsos</h3>
                </div>
                <div className="flex gap-2">
                    <Input
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                        placeholder="Digite o nome"
                        className="border-2 border-amber-200 focus-visible:ring-amber-600 h-12 rounded-xl bg-white/80 font-bold"
                        onKeyDown={(e) => e.key === "Enter" && adicionarNome()}
                    />
                    <Button onClick={adicionarNome} className="h-12 w-12 rounded-xl bg-amber-600 hover:bg-amber-700 shadow-md shrink-0">
                        <Plus className="h-5 w-5 font-black text-white" />
                    </Button>
                </div>
                {nomesAvulsos.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 max-h-32 overflow-y-auto">
                        {nomesAvulsos.map((nome) => (
                            <span key={nome} className="inline-flex flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-xs font-bold text-amber-900">
                                {nome}
                                <button onClick={() => removerNome(nome)} className="hover:text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-colors">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
             </div>
           </div>

           <Button onClick={iniciarSorteio} className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-lg gap-2 shadow-xl shadow-amber-900/20 active:scale-95 transition-all">
             <Scroll className="h-6 w-6" /> PREPARAR SORTEIO
           </Button>
         </div>
      )}

      {/* Draw Stage */}
      {!isConfigMode && (
        <div className={cn(
            "flex-1 flex flex-col items-center justify-center relative min-h-[400px]",
            isFullscreen && "min-h-[80vh]"
        )}>
           <div className={cn(
             "relative w-full max-w-4xl transition-all duration-700",
             sorteando ? "scale-105" : "scale-100"
           )}>
             {/* Parchment UI */}
             <div className={cn(
               "bg-[#fffbf2] border-[6px] border-[#e6d0a8] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[40px] p-8 md:p-16 text-center space-y-8 relative overflow-hidden",
               isFullscreen ? "py-24" : ""
             )}>
               {/* Design Elements */}
               <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-20">
                 <Cross className="h-12 w-12 text-amber-900" />
               </div>
               
               <div className="min-h-[220px] flex flex-col items-center justify-center space-y-6">
                 {sorteando ? (
                   <div className="space-y-4">
                     <div className="w-24 h-24 border-8 border-amber-900/20 border-t-amber-900 rounded-full animate-spin mx-auto shadow-inner" />
                     <p className="text-amber-900 font-serif italic text-xl animate-pulse">Sondando os caminhos...</p>
                     <div className="flex justify-center gap-1">
                       <div className="w-2 h-2 rounded-full bg-amber-900/20 animate-bounce [animation-delay:-0.3s]" />
                       <div className="w-2 h-2 rounded-full bg-amber-900/20 animate-bounce [animation-delay:-0.15s]" />
                       <div className="w-2 h-2 rounded-full bg-amber-900/20 animate-bounce" />
                     </div>
                   </div>
                 ) : citacaoAtual && mostrarResultado ? (
                   <div className={cn(
                     "space-y-6 transition-all duration-1000",
                     mostrarResultado ? "animate-in fade-in zoom-in-95" : "opacity-0"
                   )}>
                     {participanteAtual && (
                       <div className="inline-block px-6 py-2 bg-amber-950 text-white rounded-full text-sm font-black uppercase tracking-[0.2em] mb-4 shadow-xl shadow-amber-900/20">
                         {participanteAtual}
                       </div>
                     )}
                     <div className="h-px w-32 bg-amber-900/20 mx-auto" />
                     <p className={cn(
                       "font-serif text-amber-950 leading-relaxed font-bold",
                       citacaoAtual.texto.length > 200 ? "text-xl md:text-2xl" : "text-3xl md:text-5xl"
                     )}>
                       {citacaoAtual.texto}
                     </p>
                     <p className="text-lg md:text-xl font-black text-amber-800 uppercase tracking-widest bg-amber-100/50 inline-block px-4 py-1.5 rounded-xl border border-amber-200">
                       — {citacaoAtual.titulo}
                     </p>
                     {citacaoAtual.sub && (
                       <div className="pt-2">
                          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{citacaoAtual.sub}</span>
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="space-y-4 opacity-30 group">
                     <Scroll className="h-24 w-24 text-amber-900 mx-auto group-hover:scale-110 transition-transform" />
                     <p className="font-serif italic text-amber-900 text-xl font-bold">Inicie o Sorteio...</p>
                   </div>
                 )}
               </div>

               {/* Main Action Button */}
               {!sorteando && (
                 <div className="pt-8">
                   <button 
                     onClick={sortear}
                     disabled={filaAlunos.length === 0}
                     className={cn(
                       "w-36 h-36 rounded-full border-8 border-[#f4ead5] bg-amber-800 text-white shadow-2xl flex flex-col items-center justify-center transition-all active:scale-90 hover:scale-105 mx-auto relative group",
                       filaAlunos.length === 0 ? "grayscale opacity-50 cursor-not-allowed" : "animate-pulse hover:animate-none"
                     )}
                   >
                     <Shuffle className="h-10 w-10 mb-1" />
                     <span className="text-[11px] font-black uppercase tracking-widest mt-1">SORTEAR</span>
                     {!sorteando && filaAlunos.length > 0 && (
                        <div className="absolute -inset-4 border-2 border-amber-800/20 rounded-full animate-ping opacity-30 group-hover:hidden" />
                     )}
                   </button>
                   <p className="text-[11px] font-black text-amber-900/40 uppercase tracking-[0.2em] mt-8 bg-amber-900/5 px-4 py-2 rounded-full inline-block">
                       Restantes: {filaAlunos.length}
                   </p>
                 </div>
               )}
             </div>
           </div>
        </div>
      )}

      {/* Action Footer */}
      {!isConfigMode && !sorteando && (
         <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-8 animate-fade-in z-10 w-full max-w-4xl mx-auto px-4 mt-auto">
            {Object.keys(resultados).length > 0 && (
               <Button onClick={salvarNoHistorico} className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-900/20 gap-2">
                 <Save className="h-5 w-5" /> SALVAR RESULTADOS
               </Button>
            )}
            <Button onClick={() => setFilaAlunos([])} variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl font-black gap-2 border-2 text-muted-foreground hover:bg-muted">
               VOLTAR AO INÍCIO
            </Button>
         </div>
      )}

      {/* Historico Dialog */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl bg-[#fdf8f0]">
          <div className="bg-amber-900 p-6 text-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-serif font-black">Histórico de Sorteios</DialogTitle>
              <button onClick={() => setShowHistorico(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {historico.length === 0 && <p className="text-center italic text-amber-900/40 py-8 font-bold">Nenhum sorteio salvo.</p>}
            {historico.map((h) => (
              <div key={h.id} className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-3 relative group overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-amber-900 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    {new Date(h.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="space-y-2 mt-3">
                  {Object.entries(h.resultados).map(([nome, txt]) => (
                    <div key={nome} className="text-sm border-l-4 border-amber-500 pl-3 py-2 bg-amber-50/50 rounded-r-xl leading-snug">
                      <span className="font-bold text-amber-950 block text-xs underline decoration-amber-200 underline-offset-4 mb-1">{nome}</span>
                      <span className="text-amber-900/90 font-medium italic">{txt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
