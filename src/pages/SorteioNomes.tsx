import { useState, useEffect } from "react";
import { ArrowLeft, Shuffle, Trash2, Plus, Users, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useTurmas, useCatequizandos } from "@/hooks/useSupabaseData";
import { toast } from "@/hooks/use-toast";

interface Sorteio {
  id: string;
  titulo: string;
  nomes: string[];
  resultado: string[];
  criado_em: string;
}

export default function SorteioNomes() {
  const navigate = useNavigate();
  const { data: turmas } = useTurmas();
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const { data: catequizandos } = useCatequizandos(selectedTurma || undefined);

  const [titulo, setTitulo] = useState("");
  const [nomes, setNomes] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [resultado, setResultado] = useState<string[]>([]);
  const [disponiveis, setDisponiveis] = useState<string[]>([]);
  const [sorteando, setSorteando] = useState(false);
  const [sorteioAtual, setSorteioAtual] = useState<string | null>(null);

  const [historico, setHistorico] = useState<Sorteio[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);

  useEffect(() => {
    loadHistorico();
  }, []);

  const loadHistorico = async () => {
    const { data } = await supabase
      .from("sorteios")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) {
      setHistorico(data.map((s: any) => ({
        id: s.id,
        titulo: s.titulo,
        nomes: s.nomes as string[],
        resultado: s.resultado as string[],
        criado_em: s.criado_em,
      })));
    }
  };

  const adicionarNome = () => {
    const nome = novoNome.trim();
    if (nome && !nomes.includes(nome)) {
      setNomes([...nomes, nome]);
      setNovoNome("");
    }
  };

  const importarCatequizandos = () => {
    if (!catequizandos?.length) {
      toast({ title: "Nenhum catequizando", description: "Selecione uma turma com catequizandos cadastrados." });
      return;
    }
    const novos = catequizandos.map((c) => c.nome).filter((n) => !nomes.includes(n));
    setNomes([...nomes, ...novos]);
    toast({ title: "Importados!", description: `${novos.length} nomes adicionados.` });
  };

  const removerNome = (nome: string) => {
    setNomes(nomes.filter((n) => n !== nome));
  };

  const iniciarSorteio = () => {
    if (nomes.length === 0) {
      toast({ title: "Sem nomes", description: "Adicione nomes para sortear." });
      return;
    }
    setResultado([]);
    setDisponiveis([...nomes]);
    setSorteioAtual(null);
  };

  const sortearProximo = () => {
    if (disponiveis.length === 0) {
      toast({ title: "Fim!", description: "Todos os nomes já foram sorteados." });
      return;
    }
    setSorteando(true);
    let count = 0;
    const interval = setInterval(() => {
      const rand = disponiveis[Math.floor(Math.random() * disponiveis.length)];
      setSorteioAtual(rand);
      count++;
      if (count > 12) {
        clearInterval(interval);
        const idx = Math.floor(Math.random() * disponiveis.length);
        const sorteado = disponiveis[idx];
        setSorteioAtual(sorteado);
        setResultado((prev) => [...prev, sorteado]);
        setDisponiveis((prev) => prev.filter((_, i) => i !== idx));
        setSorteando(false);
      }
    }, 100);
  };

  const salvarSorteio = async () => {
    if (resultado.length === 0) return;
    const { error } = await supabase.from("sorteios").insert({
      titulo: titulo || "Sorteio sem título",
      nomes: nomes as any,
      resultado: resultado as any,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo!", description: "Sorteio gravado com sucesso." });
      loadHistorico();
    }
  };

  const excluirSorteio = async (id: string) => {
    await supabase.from("sorteios").delete().eq("id", id);
    loadHistorico();
    toast({ title: "Excluído" });
  };

  const carregarSorteio = (s: Sorteio) => {
    setTitulo(s.titulo);
    setNomes(s.nomes);
    setResultado(s.resultado);
    setDisponiveis([]);
    setShowHistorico(false);
  };

  const started = resultado.length > 0 || disponiveis.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Sorteio de Nomes</h1>
        <Button variant="outline" size="sm" onClick={() => { setShowHistorico(true); loadHistorico(); }}>
          Histórico
        </Button>
      </div>

      {/* Config */}
      <div className="float-card p-4 space-y-4 animate-float-up">
        <div className="space-y-2">
          <Label>Título do Sorteio</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Sorteio da leitura" />
        </div>

        <div className="space-y-2">
          <Label>Importar de uma turma</Label>
          <div className="flex gap-2">
            <Select value={selectedTurma} onValueChange={setSelectedTurma}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={importarCatequizandos} disabled={!selectedTurma}>
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Adicionar nome manualmente</Label>
          <div className="flex gap-2">
            <Input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome"
              onKeyDown={(e) => e.key === "Enter" && adicionarNome()}
            />
            <Button variant="outline" size="icon" onClick={adicionarNome}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {nomes.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">{nomes.length} nome(s) na lista</Label>
            <div className="flex flex-wrap gap-1.5">
              {nomes.map((nome) => (
                <span key={nome} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-foreground">
                  {nome}
                  <button onClick={() => removerNome(nome)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sorteio */}
      <div className="float-card p-6 text-center space-y-4 animate-float-up" style={{ animationDelay: "100ms" }}>
        {sorteioAtual && (
          <div className={`text-3xl font-black text-primary py-6 transition-all ${sorteando ? "animate-pulse scale-110" : "scale-100"}`}>
            {sorteioAtual}
          </div>
        )}

        {!started ? (
          <Button onClick={iniciarSorteio} className="w-full gap-2" disabled={nomes.length === 0}>
            <Shuffle className="h-4 w-4" /> Iniciar Sorteio
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={sortearProximo} className="flex-1 gap-2" disabled={sorteando || disponiveis.length === 0}>
              <Shuffle className="h-4 w-4" /> {disponiveis.length === 0 ? "Fim" : "Sortear Próximo"}
            </Button>
            <Button variant="outline" onClick={salvarSorteio} size="icon">
              <Save className="h-4 w-4" />
            </Button>
          </div>
        )}

        {disponiveis.length > 0 && (
          <p className="text-xs text-muted-foreground">{disponiveis.length} restante(s)</p>
        )}
      </div>

      {/* Resultado */}
      {resultado.length > 0 && (
        <div className="float-card p-4 space-y-3 animate-float-up" style={{ animationDelay: "200ms" }}>
          <h3 className="text-sm font-bold text-foreground">Ordem Sorteada</h3>
          <div className="space-y-1.5">
            {resultado.map((nome, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/50">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-sm font-medium text-foreground">{nome}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico Dialog */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Sorteios</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {historico.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum sorteio salvo.</p>}
            {historico.map((s) => (
              <div key={s.id} className="float-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">{s.titulo}</h4>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => carregarSorteio(s)}>Abrir</Button>
                    <Button variant="ghost" size="sm" onClick={() => excluirSorteio(s.id)} className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(s.resultado as string[]).map((n, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{i + 1}. {n}</span>
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
