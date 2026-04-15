import { useTurmas, useEncontros, useCatequizandos, useJoinTurma } from "@/hooks/useSupabaseData";
import { ETAPAS_CATEQUESE } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Plus, CalendarDays, Users, Link2, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function TurmasList() {
  const { data: turmas = [], isLoading } = useTurmas();
  const { data: encontros = [] } = useEncontros();
  const { data: catequizandos = [] } = useCatequizandos();
  const navigate = useNavigate();
  const joinMutation = useJoinTurma();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [code, setCode] = useState("");

  // Esconde a barra de navegação inferior quando o modal de código estiver aberto
  useEffect(() => {
    const nav = document.getElementById('bottom-nav-bar');
    if (!nav) return;
    if (joinModalOpen) {
      nav.style.display = 'none';
    } else {
      nav.style.display = '';
    }
    return () => { nav.style.display = ''; };
  }, [joinModalOpen]);

  const closeJoinModal = () => { setJoinModalOpen(false); setCode(""); };

  const handleJoin = async () => {
    if (code.trim().length < 8) {
      toast.error("O código deve ter 8 caracteres.");
      return;
    }
    try {
      const result = await joinMutation.mutateAsync(code.trim());
      toast.success(`Acesso concedido à turma "${result.nome}"!`);
      setJoinModalOpen(false);
      setCode("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar na turma.");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <h1 className="text-xl font-bold text-foreground">Turmas</h1>
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all active:scale-95"
          >
            <Link2 className="h-3.5 w-3.5" /> Entrar com Código
          </button>
          <button onClick={() => navigate("/turmas/nova")} className="action-btn-sm"><Plus className="h-4 w-4" /> Nova</button>
        </div>
      </div>

      {turmas.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><BookOpen className="h-6 w-6" /></div>
          <h3 className="font-bold text-foreground mb-1">Nenhuma turma cadastrada</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie sua primeira turma ou entre com um código compartilhado.</p>
          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-sm font-black bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all active:scale-95"
          >
            <Link2 className="h-4 w-4" /> Entrar com Código
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {turmas.map((turma, i) => {
            const tEncontros = encontros.filter(e => e.turmaId === turma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === turma.id);
            const etapa = ETAPAS_CATEQUESE.find((e) => e.id === turma.etapa);
            return (
              <div
                key={turma.id}
                onClick={() => navigate(`/turmas/${turma.id}`)}
                className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[hsl(var(--gold))]/60 via-[hsl(var(--liturgical))]/40 to-primary/40 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.12)] animate-float-up transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                {/* Moldura litúrgica interna */}
                <div className="absolute inset-[3px] rounded-xl border border-white/50 dark:border-white/10 z-20 pointer-events-none opacity-60 mix-blend-overlay"></div>

                <div className="relative flex flex-col p-4 rounded-[14px] bg-card w-full h-full overflow-hidden">

                  {/* Marca d'água de fundo */}
                  <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                    <BookOpen className="w-32 h-32 text-primary" />
                  </div>

                  {/* Badge Compartilhada */}
                  {turma.isShared && (
                    <div className="absolute top-3 right-3 z-30 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                      <Link2 className="h-2.5 w-2.5" />
                      Compartilhada
                    </div>
                  )}

                  <div className="flex flex-col items-center justify-center mb-5 relative z-30 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0 shadow-md mb-3 group-hover:scale-110 transition-transform duration-500">
                      <BookOpen className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {turma.nome} <span className="opacity-40 font-bold ml-1">— {turma.ano}</span>
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">{turma.diaCatequese} • {turma.horario} • {turma.local}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 flex-wrap relative z-30">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/10 shadow-sm">
                      <CalendarDays className="h-3.5 w-3.5" /><span>{tEncontros.length} encontros</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/10 shadow-sm">
                      <Users className="h-3.5 w-3.5" /><span>{tCatequizandos.length} catequizandos</span>
                    </div>
                    {etapa && <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/10 shadow-sm">{etapa.label}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Entrar com Código ── */}
      {joinModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) closeJoinModal(); }}
        >
          <div className="w-full max-w-sm bg-card rounded-[32px] shadow-2xl p-6 space-y-5 animate-float-up">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">Entrar com Código</h2>
                <p className="text-xs text-muted-foreground mt-1">Digite o código de 8 caracteres da turma</p>
              </div>
              <button onClick={closeJoinModal} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Ex: TP847293"
                maxLength={8}
                autoFocus
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-border bg-background text-foreground text-center text-2xl font-black tracking-[0.3em] uppercase placeholder:text-muted-foreground/40 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-[10px] text-center text-muted-foreground">
                O código é fornecido pelo catequista responsável pela turma
              </p>
            </div>

            <button
              onClick={handleJoin}
              disabled={joinMutation.isPending || code.trim().length < 8}
              className="w-full py-3.5 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-wider hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              {joinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {joinMutation.isPending ? "Verificando..." : "Entrar na Turma"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
