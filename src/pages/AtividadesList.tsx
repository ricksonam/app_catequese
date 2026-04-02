import { useParams, useNavigate } from "react-router-dom";
import { getAtividades, saveAtividade, deleteAtividade, getTurmas, getCatequizandos, ATIVIDADE_TIPOS, CONDUCAO_TIPOS, type Atividade, type AtividadeTipo, type AtividadeModalidade, type ConducaoTipo } from "@/lib/store";
import { ArrowLeft, Plus, ListChecks, Trash2, MapPin, Clock, Calendar, FileText, Car, Printer, Users, ChevronRight, X, CheckCircle2, Pencil } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface FormData {
  nome: string; descricao: string; tipo: AtividadeTipo; modalidade: AtividadeModalidade;
  conducao: ConducaoTipo | ''; data: string; local: string; horario: string; observacao: string;
}
const emptyForm: FormData = { nome: "", descricao: "", tipo: "Eventos geral", modalidade: "interna", conducao: "", data: "", local: "", horario: "", observacao: "" };

const fillFormFromItem = (item: Atividade): FormData => ({
  nome: item.nome, descricao: item.descricao || '', tipo: item.tipo, modalidade: item.modalidade || 'interna',
  conducao: item.conducao || '', data: item.data || '', local: item.local || '', horario: item.horario || '', observacao: item.observacao || '',
});

const tipoColors: Record<string, string> = {
  'Retiro': 'bg-primary/10 text-primary', 'Celebração': 'bg-liturgical/10 text-liturgical',
  'Encontro de pais': 'bg-accent/15 text-accent-foreground', 'Gincana': 'bg-success/10 text-success',
  'Passeios': 'bg-gold/15 text-gold', 'Jornada': 'bg-primary/10 text-primary',
  'Eventos geral': 'bg-muted text-muted-foreground', 'Outros': 'bg-muted text-muted-foreground',
};

export default function AtividadesList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find(t => t.id === id);
  const [list, setList] = useState(getAtividades(id));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Atividade | null>(null);
  const [presencaOpen, setPresencaOpen] = useState(false);
  const [presencaItem, setPresencaItem] = useState<Atividade | null>(null);

  const catequizandos = getCatequizandos(id);
  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);

  const handleAdd = () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    if (editingId) {
      const existing = list.find(a => a.id === editingId);
      saveAtividade({
        ...existing!, nome: form.nome, descricao: form.descricao, tipo: form.tipo, modalidade: form.modalidade,
        conducao: form.modalidade === 'externa' ? (form.conducao as ConducaoTipo) : undefined,
        data: form.data, local: form.local, horario: form.horario, observacao: form.observacao,
      });
      setList(getAtividades(id)); setForm({ ...emptyForm }); setEditingId(null); setOpen(false);
      setViewItem(null);
      toast.success("Atividade atualizada!");
    } else {
      saveAtividade({
        id: crypto.randomUUID(), turmaId: id!, nome: form.nome, descricao: form.descricao,
        tipo: form.tipo, modalidade: form.modalidade, conducao: form.modalidade === 'externa' ? (form.conducao as ConducaoTipo) : undefined,
        data: form.data, local: form.local, horario: form.horario, observacao: form.observacao,
        presencas: [], criadoEm: new Date().toISOString(),
      });
      setList(getAtividades(id)); setForm({ ...emptyForm }); setOpen(false);
      toast.success("Atividade criada!");
    }
  };

  const handleEdit = (item: Atividade) => {
    setForm(fillFormFromItem(item));
    setEditingId(item.id);
    setViewItem(null);
    setOpen(true);
  };

  const handleDelete = (aid: string) => { deleteAtividade(aid); setList(getAtividades(id)); setViewItem(null); toast.success("Removida!"); };

  const togglePresenca = (catId: string) => {
    if (!presencaItem) return;
    const p = presencaItem.presencas || [];
    const updated = p.includes(catId) ? p.filter(x => x !== catId) : [...p, catId];
    const newItem = { ...presencaItem, presencas: updated };
    saveAtividade(newItem);
    setPresencaItem(newItem);
    setList(getAtividades(id));
  };

  const printAutorizacao = (item: Atividade) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const cats = getCatequizandos(id);
    w.document.write(`<!DOCTYPE html><html><head><title>Autorização</title><style>
      body{font-family:Arial,sans-serif;padding:40px;color:#333}
      h1{font-size:18px;text-align:center;margin-bottom:8px}
      h2{font-size:14px;text-align:center;font-weight:normal;margin-bottom:30px;color:#666}
      .info{margin-bottom:20px;font-size:13px;line-height:1.8}
      .line{border-bottom:1px solid #333;margin-top:60px;width:70%;margin-left:auto;margin-right:auto}
      .label{text-align:center;font-size:12px;color:#666;margin-top:6px}
      .section{page-break-inside:avoid;margin-bottom:40px}
      @media print{body{padding:20px}}
    </style></head><body>`);
    cats.forEach(cat => {
      w.document.write(`<div class="section">
        <h1>AUTORIZAÇÃO DE PARTICIPAÇÃO</h1>
        <h2>${turma?.nome || 'Turma'} — ${item.nome}</h2>
        <div class="info">
          <p>Eu, __________________________________________, responsável pelo(a) catequizando(a) <strong>${cat.nome}</strong>, autorizo sua participação na atividade descrita abaixo:</p>
          <p><strong>Atividade:</strong> ${item.nome}</p>
          <p><strong>Tipo:</strong> ${item.tipo} (${item.modalidade === 'externa' ? 'Externa' : 'Interna'})</p>
          ${item.data ? `<p><strong>Data:</strong> ${new Date(item.data + 'T00:00').toLocaleDateString('pt-BR')}</p>` : ''}
          ${item.horario ? `<p><strong>Horário:</strong> ${item.horario}</p>` : ''}
          ${item.local ? `<p><strong>Local:</strong> ${item.local}</p>` : ''}
          ${item.conducao ? `<p><strong>Condução:</strong> ${item.conducao}</p>` : ''}
          ${item.observacao ? `<p><strong>Obs:</strong> ${item.observacao}</p>` : ''}
        </div>
        <div class="line"></div>
        <p class="label">Assinatura do Responsável</p>
        <br/><p style="text-align:center;font-size:11px;color:#999">Data: ____/____/________</p>
      </div>`);
    });
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Atividades</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome} • {list.length} atividades</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><button className="action-btn-sm"><Plus className="h-4 w-4" /> Nova</button></DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
            <DialogHeader><DialogTitle>Nova Atividade</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <FieldInput label="Nome *" value={form.nome} onChange={(v) => updateField("nome", v)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
                <textarea value={form.descricao} onChange={(e) => updateField("descricao", e.target.value)} className="form-input min-h-[60px] resize-none" placeholder="Descreva a atividade..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo</label>
                <select value={form.tipo} onChange={(e) => updateField("tipo", e.target.value)} className="form-input">
                  {ATIVIDADE_TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Modalidade */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Modalidade</label>
                <div className="flex gap-2">
                  {(['interna', 'externa'] as const).map(m => (
                    <button key={m} type="button" onClick={() => updateField("modalidade", m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.modalidade === m ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'}`}>
                      {m === 'interna' ? '🏠 Interna' : '🌍 Externa'}
                    </button>
                  ))}
                </div>
              </div>

              {form.modalidade === 'externa' && (
                <div className="animate-fade-in">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo de Condução</label>
                  <select value={form.conducao} onChange={(e) => updateField("conducao", e.target.value)} className="form-input">
                    <option value="">Selecione...</option>
                    {CONDUCAO_TIPOS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Data" type="date" value={form.data} onChange={(v) => updateField("data", v)} />
                <FieldInput label="Horário" type="time" value={form.horario} onChange={(v) => updateField("horario", v)} />
              </div>
              <FieldInput label="Local" value={form.local} onChange={(v) => updateField("local", v)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação</label>
                <textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="form-input min-h-[60px] resize-none" />
              </div>
              <button onClick={handleAdd} className="w-full action-btn">Criar Atividade</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {list.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-liturgical/10 text-liturgical mx-auto mb-3"><ListChecks className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhuma atividade cadastrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((item, i) => (
            <button key={item.id} onClick={() => setViewItem(item)}
              className="w-full float-card flex items-center gap-3 px-4 py-3.5 animate-float-up text-left" style={{ animationDelay: `${i * 50}ms` }}>
              <span className={`pill-btn text-[10px] ${tipoColors[item.tipo] || 'bg-muted text-muted-foreground'}`}>{item.tipo}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {item.data && new Date(item.data + 'T00:00').toLocaleDateString("pt-BR")}
                  {item.horario && ` • ${item.horario}`}
                  {item.local && ` • ${item.local}`}
                </p>
              </div>
              {item.modalidade === 'externa' && <Car className="h-3.5 w-3.5 text-primary shrink-0" />}
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Detail View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="rounded-2xl border-border/30 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          {viewItem && (
            <>
              {/* Header */}
              <div className={`px-5 pt-5 pb-4 ${tipoColors[viewItem.tipo]?.replace(/text-\S+/, '') || 'bg-muted'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className={`inline-block pill-btn text-[10px] mb-2 ${tipoColors[viewItem.tipo] || 'bg-muted text-muted-foreground'}`}>
                      {viewItem.tipo} • {viewItem.modalidade === 'externa' ? 'Externa' : 'Interna'}
                    </span>
                    <h2 className="text-lg font-bold text-foreground">{viewItem.nome}</h2>
                  </div>
                  <button onClick={() => handleDelete(viewItem.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {viewItem.data && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-medium text-foreground">{new Date(viewItem.data + 'T00:00').toLocaleDateString("pt-BR")}</span>
                    </div>
                  )}
                  {viewItem.horario && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-medium text-foreground">{viewItem.horario}</span>
                    </div>
                  )}
                  {viewItem.local && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 col-span-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-medium text-foreground">{viewItem.local}</span>
                    </div>
                  )}
                  {viewItem.conducao && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 col-span-2">
                      <Car className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-medium text-foreground">Condução: {viewItem.conducao}</span>
                    </div>
                  )}
                </div>

                {viewItem.descricao && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-xl p-3">{viewItem.descricao}</p>
                  </div>
                )}
                {viewItem.observacao && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Observação</p>
                    <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-xl p-3">{viewItem.observacao}</p>
                  </div>
                )}

                {/* Presença summary */}
                <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-success" />
                    <span className="text-xs font-semibold text-foreground">
                      Presenças: {(viewItem.presencas || []).length}/{catequizandos.length}
                    </span>
                  </div>
                  <button onClick={() => { setPresencaItem(viewItem); setPresencaOpen(true); }}
                    className="text-xs font-semibold text-primary hover:underline">Registrar</button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button onClick={() => { setPresencaItem(viewItem); setPresencaOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
                    <CheckCircle2 className="h-4 w-4" /> Presença
                  </button>
                  {viewItem.modalidade === 'externa' && (
                    <button onClick={() => printAutorizacao(viewItem)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold/10 text-gold text-sm font-semibold hover:bg-gold/20 transition-colors">
                      <Printer className="h-4 w-4" /> Autorização
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Presença Dialog */}
      <Dialog open={presencaOpen} onOpenChange={setPresencaOpen}>
        <DialogContent className="rounded-2xl border-border/30 max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Presença</DialogTitle></DialogHeader>
          {presencaItem && (
            <div className="space-y-1 mt-2">
              <p className="text-xs text-muted-foreground mb-3">{presencaItem.nome} • {(presencaItem.presencas || []).length}/{catequizandos.length} presentes</p>
              {catequizandos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum catequizando cadastrado</p>
              ) : catequizandos.map(cat => {
                const present = (presencaItem.presencas || []).includes(cat.id);
                return (
                  <button key={cat.id} onClick={() => togglePresenca(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${present ? 'bg-success/10' : 'bg-muted/30 hover:bg-muted/50'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${present ? 'bg-success text-white' : 'border-2 border-muted-foreground/30'}`}>
                      {present && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <span className={`text-sm font-medium ${present ? 'text-foreground' : 'text-muted-foreground'}`}>{cat.nome}</span>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <input ref={ref} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="form-input" />
    </div>
  );
}
