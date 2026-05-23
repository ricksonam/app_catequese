import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NOMES_TURMA, DIAS_SEMANA, type Turma } from "@/lib/store";
import { useTurmas, useTurmaMutation, useComunidades, useCatequistas, useParoquias, useParoquiaMutation, useComunidadeMutation } from "@/hooks/useSupabaseData";
import { EtapaMap } from "@/components/EtapaMap";
import { ArrowLeft, Check, ChevronRight, Pencil, Search, Plus, Trash2, Mail, Phone, User, Users, Building2, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn, mascaraTelefone } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CoordenadorInfo } from "@/lib/store";

// Paleta de cores únicas por índice — nunca repete as mesmas para todos
const CAT_PALETTE = [
  { card: "bg-blue-50 border-blue-400",    avatar: "bg-blue-500",    check: "bg-blue-500 border-blue-500",    text: "text-blue-700",    ring: "ring-blue-400/30"   },
  { card: "bg-emerald-50 border-emerald-400", avatar: "bg-emerald-500", check: "bg-emerald-500 border-emerald-500", text: "text-emerald-700", ring: "ring-emerald-400/30" },
  { card: "bg-violet-50 border-violet-400",   avatar: "bg-violet-500",  check: "bg-violet-500 border-violet-500",  text: "text-violet-700",  ring: "ring-violet-400/30"  },
  { card: "bg-amber-50 border-amber-400",     avatar: "bg-amber-500",   check: "bg-amber-500 border-amber-500",   text: "text-amber-700",   ring: "ring-amber-400/30"   },
  { card: "bg-rose-50 border-rose-400",       avatar: "bg-rose-500",    check: "bg-rose-500 border-rose-500",    text: "text-rose-700",    ring: "ring-rose-400/30"    },
  { card: "bg-cyan-50 border-cyan-400",       avatar: "bg-cyan-500",    check: "bg-cyan-500 border-cyan-500",    text: "text-cyan-700",    ring: "ring-cyan-400/30"    },
  { card: "bg-orange-50 border-orange-400",   avatar: "bg-orange-500",  check: "bg-orange-500 border-orange-500",  text: "text-orange-700",  ring: "ring-orange-400/30"  },
  { card: "bg-pink-50 border-pink-400",       avatar: "bg-pink-500",    check: "bg-pink-500 border-pink-500",    text: "text-pink-700",    ring: "ring-pink-400/30"    },
];

export default function TurmaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: turmas = [], isLoading: isLoadingTurmas } = useTurmas();
  const { data: comunidades = [] } = useComunidades();
  const { data: catequistas = [] } = useCatequistas();
  const { data: paroquias = [] } = useParoquias();
  const mutation = useTurmaMutation();
  const paroquiaMutation = useParoquiaMutation();
  const comunidadeMutation = useComunidadeMutation();

  const isEditing = Boolean(id);
  const existingTurma = turmas.find(t => t.id === id);

  const [form, setForm] = useState({
    nome: "",
    ano: "1° Ano",
    diaCatequese: "",
    horario: "",
    local: "",
    etapa: "",
    outrosDados: "",
    comunidadeId: "",
    catequistasIds: [] as string[],
    coordenadores: [] as CoordenadorInfo[],
    codigoAcesso: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Cadastro inline de Paróquia
  const [showNovaParoquia, setShowNovaParoquia] = useState(false);
  const [novaParoquiaNome, setNovaParoquiaNome] = useState("");
  const [novaParoquiaCidade, setNovaParoquiaCidade] = useState("");
  const [novaParoquiaDiocese, setNovaParoquiaDiocese] = useState("");
  const [isSavingParoquia, setIsSavingParoquia] = useState(false);

  // Cadastro inline de Comunidade
  const [showNovaComunidade, setShowNovaComunidade] = useState(false);
  const [novaComunidadeNome, setNovaComunidadeNome] = useState("");
  const [novaComunidadeParoquiaId, setNovaComunidadeParoquiaId] = useState("");
  const [isSavingComunidade, setIsSavingComunidade] = useState(false);

  useEffect(() => {
    if (isEditing && existingTurma) {
      setForm({
        nome: existingTurma.nome,
        ano: existingTurma.ano,
        diaCatequese: existingTurma.diaCatequese,
        horario: existingTurma.horario,
        local: existingTurma.local,
        etapa: existingTurma.etapa,
        outrosDados: existingTurma.outrosDados || "",
        comunidadeId: existingTurma.comunidadeId || "",
        catequistasIds: existingTurma.catequistasIds || [],
        coordenadores: existingTurma.coordenadores || [],
        codigoAcesso: existingTurma.codigoAcesso || "",
      });
    }
  }, [isEditing, existingTurma]);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleCatequista = (catId: string) => {
    const ids = form.catequistasIds.includes(catId)
      ? form.catequistasIds.filter(x => x !== catId)
      : [...form.catequistasIds, catId];
    update("catequistasIds", ids);
  };

  const addCoordenador = () => {
    const newCoord: CoordenadorInfo = { id: crypto.randomUUID(), nome: "", telefone: "", email: "" };
    update("coordenadores", [...form.coordenadores, newCoord]);
  };

  const removeCoordenador = (id: string) => {
    update("coordenadores", form.coordenadores.filter(c => c.id !== id));
  };

  const updateCoordenador = (id: string, field: keyof CoordenadorInfo, value: string) => {
    update("coordenadores", form.coordenadores.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSalvarParoquia = async () => {
    if (!novaParoquiaNome.trim()) {
      toast.error("Informe o nome da paróquia.");
      return;
    }
    setIsSavingParoquia(true);
    try {
      await paroquiaMutation.mutateAsync({
        id: crypto.randomUUID(),
        nome: novaParoquiaNome.trim(),
        cidade: novaParoquiaCidade.trim(),
        diocese: novaParoquiaDiocese.trim(),
      } as any);
      toast.success("Paróquia cadastrada com sucesso!");
      setNovaParoquiaNome("");
      setNovaParoquiaCidade("");
      setNovaParoquiaDiocese("");
      setShowNovaParoquia(false);
    } catch (err: any) {
      toast.error("Erro ao cadastrar paróquia: " + err.message);
    } finally {
      setIsSavingParoquia(false);
    }
  };

  const handleSalvarComunidade = async () => {
    if (!novaComunidadeNome.trim()) {
      toast.error("Informe o nome da comunidade.");
      return;
    }
    setIsSavingComunidade(true);
    try {
      const newId = crypto.randomUUID();
      await comunidadeMutation.mutateAsync({
        id: newId,
        nome: novaComunidadeNome.trim(),
        paroquiaId: novaComunidadeParoquiaId || undefined,
      } as any);
      toast.success("Comunidade cadastrada com sucesso!");
      update("comunidadeId", newId);
      setNovaComunidadeNome("");
      setNovaComunidadeParoquiaId("");
      setShowNovaComunidade(false);
    } catch (err: any) {
      toast.error("Erro ao cadastrar comunidade: " + err.message);
    } finally {
      setIsSavingComunidade(false);
    }
  };

  const handleSave = async () => {
    if (!form.nome || !form.diaCatequese || !form.horario || !form.comunidadeId || form.catequistasIds.length === 0) {
      toast.error("Preencha todos os campos obrigatórios, incluindo comunidade e catequistas"); return;
    }

    const invalidCoord = form.coordenadores.find(c => !c.nome.trim());
    if (invalidCoord) {
      toast.error("O nome de todos os coordenadores é obrigatório");
      return;
    }

    if (isSaving) return;
    setIsSaving(true);
    const turma: Turma = {
      id: isEditing ? id! : crypto.randomUUID(),
      ...form,
      criadoEm: isEditing ? existingTurma?.criadoEm || new Date().toISOString() : new Date().toISOString()
    };
    try {
      await mutation.mutateAsync(turma);
      toast.success(isEditing ? "Alterações salvas!" : "Turma criada com sucesso!");
      navigate(`/turmas/${turma.id}`);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
      setIsSaving(false);
    }
  };

  const filteredCatequistas = catequistas.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputCls = "form-input h-12 text-base font-bold";
  const labelCls = "text-xs font-black text-zinc-900 uppercase tracking-widest";
  const labelWithRedAsterisk = (label: string) => label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  return (
    <div className="space-y-6 pb-10">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <h1 className="text-xl font-bold text-foreground inline-flex items-center gap-2">
          {isEditing ? <><Pencil className="h-5 w-5" /> Editar Turma</> : "Nova Turma"}
        </h1>
      </div>

      <div className="space-y-5">

        {/* ── CARD: IDENTIFICAÇÃO DA TURMA ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-primary/5 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-base">🏛️</div>
            <span className="text-sm font-black uppercase tracking-wider text-primary">Identificação</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className={labelCls}>{labelWithRedAsterisk("Nome da Turma *")}</label>
              <select value={form.nome} onChange={(e) => update("nome", e.target.value)} className={inputCls}>
                <option value="">Selecione...</option>
                {NOMES_TURMA.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelCls}>{labelWithRedAsterisk("Ano/Ciclo *")}</label>
                <select value={form.ano} onChange={(e) => update("ano", e.target.value)} className="form-input h-11">
                  <option value="1° Ano">1° Ano</option>
                  <option value="2° Ano">2° Ano</option>
                  <option value="3° Ano">3° Ano</option>
                  <option value="Ciclo 1">Ciclo 1</option>
                  <option value="Ciclo 2">Ciclo 2</option>
                  <option value="Ciclo 3">Ciclo 3</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>{labelWithRedAsterisk("Dia do Encontro *")}</label>
                <select value={form.diaCatequese} onChange={(e) => update("diaCatequese", e.target.value)} className="form-input h-11">
                  <option value="">Selecione...</option>
                  {DIAS_SEMANA.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/5">
              <div className="space-y-2">
                <label className={labelCls}>{labelWithRedAsterisk("Horário *")}</label>
                <input type="time" value={form.horario} onChange={(e) => update("horario", e.target.value)} className="form-input h-11" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Local</label>
                <input type="text" value={form.local} onChange={(e) => update("local", e.target.value)} className="form-input h-11" placeholder="Ex: Salão Paroquial" />
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD: COMUNIDADE ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-blue-50 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-base">⛪</div>
            <span className="text-sm font-black uppercase tracking-wider text-blue-600">Comunidade</span>
          </div>
          <div className="p-5 space-y-5">

            {/* Seleção de Comunidade */}
            <div className="space-y-2">
              <label className={labelCls}>{labelWithRedAsterisk("Comunidade *")}</label>
              {comunidades.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  Nenhuma comunidade cadastrada. Cadastre uma abaixo.
                </div>
              ) : (
                <select value={form.comunidadeId} onChange={(e) => update("comunidadeId", e.target.value)} className="form-input h-11">
                  <option value="">Selecione...</option>
                  {comunidades.map((c) => <option key={c.id} value={c.id}>{c.name || c.nome}</option>)}
                </select>
              )}
            </div>

            {/* Botões de acesso rápido ao cadastro inline */}
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => { setShowNovaComunidade(!showNovaComunidade); setShowNovaParoquia(false); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2",
                  showNovaComunidade
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                {showNovaComunidade ? "Fechar" : "+ Nova Comunidade"}
                {showNovaComunidade ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => { setShowNovaParoquia(!showNovaParoquia); setShowNovaComunidade(false); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2",
                  showNovaParoquia
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100"
                )}
              >
                <Building2 className="h-3.5 w-3.5" />
                {showNovaParoquia ? "Fechar" : "+ Nova Paróquia"}
                {showNovaParoquia ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* Formulário inline: Nova Comunidade */}
            {showNovaComunidade && (
              <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-black uppercase tracking-widest text-blue-700">Nova Comunidade</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-600">Nome da Comunidade *</label>
                  <input
                    type="text"
                    value={novaComunidadeNome}
                    onChange={(e) => setNovaComunidadeNome(e.target.value)}
                    placeholder="Ex: Comunidade São José"
                    className="form-input h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-600">Paróquia (opcional)</label>
                  <select
                    value={novaComunidadeParoquiaId}
                    onChange={(e) => setNovaComunidadeParoquiaId(e.target.value)}
                    className="form-input h-10 text-sm"
                  >
                    <option value="">Selecione uma paróquia...</option>
                    {paroquias.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleSalvarComunidade}
                  disabled={isSavingComunidade || !novaComunidadeNome.trim()}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingComunidade ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Check className="h-3.5 w-3.5" /> Salvar Comunidade</>
                  )}
                </button>
              </div>
            )}

            {/* Formulário inline: Nova Paróquia */}
            {showNovaParoquia && (
              <div className="p-4 rounded-2xl bg-violet-50 border-2 border-violet-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-black uppercase tracking-widest text-violet-700">Nova Paróquia</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-violet-600">Nome da Paróquia *</label>
                  <input
                    type="text"
                    value={novaParoquiaNome}
                    onChange={(e) => setNovaParoquiaNome(e.target.value)}
                    placeholder="Ex: Paróquia Nossa Senhora Aparecida"
                    className="form-input h-10 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-600">Cidade</label>
                    <input
                      type="text"
                      value={novaParoquiaCidade}
                      onChange={(e) => setNovaParoquiaCidade(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="form-input h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-600">Diocese</label>
                    <input
                      type="text"
                      value={novaParoquiaDiocese}
                      onChange={(e) => setNovaParoquiaDiocese(e.target.value)}
                      placeholder="Ex: Diocese de SP"
                      className="form-input h-10 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSalvarParoquia}
                  disabled={isSavingParoquia || !novaParoquiaNome.trim()}
                  className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingParoquia ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Check className="h-3.5 w-3.5" /> Salvar Paróquia</>
                  )}
                </button>
              </div>
            )}

            {/* Coordenação da Pastoral */}
            <div className="pt-4 border-t border-black/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-900">Coordenação da Pastoral</span>
                </div>
                <button
                  onClick={addCoordenador}
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {form.coordenadores.map((coord, idx) => (
                <div key={coord.id} className="p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-100 space-y-3 relative group animate-in zoom-in-95">
                  <button
                    onClick={() => removeCoordenador(coord.id)}
                    className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                      <User className="h-3 w-3" /> Nome do Coordenador {idx + 1} *
                    </label>
                    <input
                      type="text"
                      value={coord.nome}
                      onChange={(e) => updateCoordenador(coord.id, "nome", e.target.value)}
                      placeholder="Nome completo"
                      className="form-input h-9 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> Telefone/WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={coord.telefone}
                        onChange={(e) => updateCoordenador(coord.id, "telefone", mascaraTelefone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        className="form-input h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> E-mail
                      </label>
                      <input
                        type="email"
                        value={coord.email}
                        onChange={(e) => updateCoordenador(coord.id, "email", e.target.value)}
                        placeholder="email@exemplo.com"
                        className="form-input h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {form.coordenadores.length === 0 && (
                <p className="text-[10px] text-zinc-400 font-medium italic text-center py-2">
                  Nenhum coordenador adicionado. Clique no "+" para adicionar.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── CARD: CATEQUISTA ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-emerald-50 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-base">👥</div>
            <span className="text-sm font-black uppercase tracking-wider text-emerald-600">Catequista</span>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <label className={labelCls}>{labelWithRedAsterisk("Catequista Responsável *")}</label>
              <select value={form.catequistasIds[0] || ""} onChange={(e) => update("catequistasIds", e.target.value ? [e.target.value] : [])} className="form-input h-11">
                <option value="">Selecione...</option>
                {catequistas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── CARD: TEMPO DA CATEQUESE ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-orange-50 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-base">⏳</div>
            <span className="text-sm font-black uppercase tracking-wider text-orange-600">Tempo da Catequese</span>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-3">
              <label className={labelCls}>Selecione o tempo:</label>
              <EtapaMap etapaAtual={form.etapa} onSelect={(etapaId) => update("etapa", etapaId)} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Observações Adicionais</label>
              <textarea
                value={form.outrosDados}
                onChange={(e) => update("outrosDados", e.target.value)}
                className="form-input min-h-[100px] resize-none border-2 border-zinc-800"
                placeholder="Observações, recomendações..."
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={mutation.isPending || !form.nome || !form.diaCatequese || !form.comunidadeId || form.catequistasIds.length === 0}
        className="w-full action-btn h-14 text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] animate-float-up"
        style={{ animationDelay: '300ms' }}
      >
        {mutation.isPending ? "Salvando..." : (isEditing ? "SALVAR ALTERAÇÕES" : "CRIAR ESTA TURMA")}
      </button>
    </div>
  );
}
