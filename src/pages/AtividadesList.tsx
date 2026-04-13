import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useAtividades, useAtividadeMutation, useDeleteAtividade, useCatequizandos } from "@/hooks/useSupabaseData";
import { ATIVIDADE_TIPOS, CONDUCAO_TIPOS, type Atividade, type AtividadeTipo, type AtividadeModalidade, type ConducaoTipo } from "@/lib/store";
import { ArrowLeft, Plus, ListChecks, Trash2, MapPin, Clock, Calendar, Car, Printer, Users, ChevronRight, CheckCircle2, Pencil } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReportModule from "@/components/reports/ReportModule";
import { toast } from "sonner";
import { formatarDataVigente } from "@/lib/utils";

// --- Helpers ---
function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="form-input" 
      />
    </div>
  );
}

interface FormData { nome: string; descricao: string; tipo: AtividadeTipo; modalidade: AtividadeModalidade; conducao: ConducaoTipo | ''; data: string; local: string; horario: string; observacao: string; }
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

const TIPO_ICONES: Record<string, string> = {
  'Retiro': '🕊️', 'Celebração': '⛪',
  'Encontro de pais': '👨‍👩‍👧‍👦', 'Gincana': '🎯',
  'Passeios': '🚌', 'Jornada': '✨',
  'Eventos geral': '📅', 'Outros': '📌',
};

export default function AtividadesList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [] } = useTurmas();
  const { data: list = [], isLoading } = useAtividades(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const mutation = useAtividadeMutation();
  const deleteMut = useDeleteAtividade();
  const turma = turmas.find(t => t.id === id);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Atividade | null>(null);
  const [presencaOpen, setPresencaOpen] = useState(false);
  const [presencaItem, setPresencaItem] = useState<Atividade | null>(null);

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);

  const handleAdd = async () => {
    if (!form.nome) { toast.error("Nome Ã© obrigatÃ³rio"); return; }
    try {
      if (editingId) {
        const existing = list.find(a => a.id === editingId);
        await mutation.mutateAsync({ ...existing!, nome: form.nome, descricao: form.descricao, tipo: form.tipo, modalidade: form.modalidade, conducao: form.modalidade === 'externa' ? (form.conducao as ConducaoTipo) : undefined, data: form.data, local: form.local, horario: form.horario, observacao: form.observacao });
        setEditingId(null); setViewItem(null); toast.success("Atividade atualizada!");
      } else {
        await mutation.mutateAsync({ id: crypto.randomUUID(), turmaId: id!, nome: form.nome, descricao: form.descricao, tipo: form.tipo, modalidade: form.modalidade, conducao: form.modalidade === 'externa' ? (form.conducao as ConducaoTipo) : undefined, data: form.data, local: form.local, horario: form.horario, observacao: form.observacao, presencas: [], criadoEm: new Date().toISOString() });
        toast.success("Atividade criada!");
      }
      setForm({ ...emptyForm }); setOpen(false);
    } catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const handleEdit = (item: Atividade) => { setForm(fillFormFromItem(item)); setEditingId(item.id); setViewItem(null); setOpen(true); };
  const handleDelete = async (aid: string) => { try { await deleteMut.mutateAsync(aid); setViewItem(null); toast.success("Removida!"); } catch (err: any) { toast.error("Erro: " + err.message); } };

  const togglePresenca = (catId: string) => {
    if (!presencaItem) return;
    const p = presencaItem.presencas || [];
    const updated = p.includes(catId) ? p.filter(x => x !== catId) : [...p, catId];
    const newItem = { ...presencaItem, presencas: updated };
    mutation.mutate(newItem);
    setPresencaItem(newItem);
  };

  const printAutorizacao = (item: Atividade) => {
    const w = window.open('', '_blank'); if (!w) return;
    const dataFormatada = item.data ? formatarDataVigente(item.data) : '___/___/______';
    w.document.write('<!DOCTYPE html><html><head><title>AutorizaÃ§Ã£o</title><style>@page{margin:15mm 20mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;color:#1a1a1a;font-size:13px;line-height:1.6}.page{page-break-after:always;padding:20px 0}.page:last-child{page-break-after:avoid}.header{text-align:center;border-bottom:3px double #8B4513;padding-bottom:15px;margin-bottom:20px}.header .cross{font-size:28px;color:#8B4513;margin-bottom:4px}.header h1{font-size:16px;font-weight:bold;color:#8B4513;letter-spacing:3px;text-transform:uppercase}.title-box{background:linear-gradient(135deg,#f5e6d3,#faf0e6);border:1px solid #d4a574;border-radius:8px;padding:12px;text-align:center;margin-bottom:18px}.title-box h2{font-size:15px;color:#5c3317}.body-text{margin-bottom:16px;text-align:justify}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;background:#faf8f5;border:1px solid #e8ddd0;border-radius:8px;padding:12px;margin:14px 0}.info-item{display:flex;gap:6px;font-size:12px}.info-item .lbl{font-weight:bold;color:#5c3317}.info-item.full{grid-column:1/-1}.sig-area{margin-top:24px}.sig-row{display:flex;justify-content:space-between;gap:30px;margin-bottom:20px}.sig-block{flex:1;text-align:center}.sig-line{border-bottom:1px solid #333;margin-bottom:4px;height:30px}.sig-label{font-size:10px;color:#666}.footer{text-align:center;font-size:9px;color:#aaa;margin-top:16px;border-top:1px dotted #ddd;padding-top:8px}</style></head><body>');
    catequizandos.forEach(cat => {
      w.document.write(`<div class="page"><div class="header"><div class="cross">âœ</div><h1>AutorizaÃ§Ã£o de ParticipaÃ§Ã£o</h1></div><div class="title-box"><h2>${item.nome}</h2></div><div class="body-text"><p>Eu, ________________________________, responsÃ¡vel por <strong>${cat.nome}</strong>, <strong>AUTORIZO</strong> sua participaÃ§Ã£o na atividade abaixo.</p></div><div class="info-grid"><div class="info-item full"><span class="lbl">Atividade:</span>${item.nome}</div><div class="info-item"><span class="lbl">Data:</span>${dataFormatada}</div><div class="info-item"><span class="lbl">HorÃ¡rio:</span>${item.horario||'A definir'}</div><div class="info-item full"><span class="lbl">Local:</span>${item.local||'A definir'}</div>${item.conducao?`<div class="info-item full"><span class="lbl">Transporte:</span>${item.conducao}</div>`:''}</div><div class="sig-area"><div class="sig-row"><div class="sig-block"><div class="sig-line"></div><div class="sig-label">Assinatura do ResponsÃ¡vel</div></div><div class="sig-block"><div class="sig-line"></div><div class="sig-label">Documento</div></div></div><div class="sig-row"><div class="sig-block"><div class="sig-line"></div><div class="sig-label">Local e Data</div></div><div class="sig-block"><div class="sig-line"></div><div class="sig-label">Telefone</div></div></div></div><div class="footer">Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</div></div>`);
    });
    w.document.write('</body></html>'); w.document.close(); setTimeout(() => w.print(), 300);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn shrink-0"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="min-w-0">
             <h1 className="text-xl font-bold text-foreground truncate">Atividades e Eventos</h1>
             <p className="text-xs text-muted-foreground truncate">{turma?.nome} • {list.length} atividades</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex-1 sm:flex-none">
             {id && <ReportModule context="atividades" turmaId={id} />}
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ ...emptyForm }); } }}>
            <DialogTrigger asChild><button className="action-btn-sm shrink-0 whitespace-nowrap"><Plus className="h-4 w-4" /> Nova</button></DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
              <DialogHeader><DialogTitle>{editingId ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo de Atividade *</label>
                  <select value={form.tipo} onChange={(e) => updateField("tipo", e.target.value)} className="form-input font-bold text-primary">
                    {ATIVIDADE_TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <FieldInput label="Nome da Atividade *" value={form.nome} onChange={(v) => updateField("nome", v)} />
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">DescriÃ§Ã£o</label><textarea value={form.descricao} onChange={(e) => updateField("descricao", e.target.value)} className="form-input min-h-[60px] resize-none" /></div>
                <div><label className="text-xs font-semibold text-muted-foreground mb-2 block">Modalidade</label><div className="flex gap-2">{(['interna','externa'] as const).map(m => <button key={m} type="button" onClick={() => updateField("modalidade",m)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.modalidade===m?'bg-primary text-primary-foreground shadow-md':'bg-muted text-muted-foreground'}`}>{m==='interna'?'ðŸ  Interna':'ðŸŒ Externa'}</button>)}</div></div>
                {form.modalidade === 'externa' && <div className="animate-fade-in"><label className="text-xs font-semibold text-muted-foreground mb-1 block">ConduÃ§Ã£o</label><select value={form.conducao} onChange={(e) => updateField("conducao", e.target.value)} className="form-input"><option value="">Selecione...</option>{CONDUCAO_TIPOS.map(c => <option key={c}>{c}</option>)}</select></div>}
                <div className="grid grid-cols-2 gap-2"><FieldInput label="Data" type="date" value={form.data} onChange={(v) => updateField("data", v)} /><FieldInput label="HorÃ¡rio" type="time" value={form.horario} onChange={(v) => updateField("horario", v)} /></div>
                <FieldInput label="Local" value={form.local} onChange={(v) => updateField("local", v)} />
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">ObservaÃ§Ã£o</label><textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="form-input min-h-[60px] resize-none" /></div>
                <button onClick={handleAdd} disabled={mutation.isPending} className="w-full action-btn">{mutation.isPending ? "Salvando..." : editingId ? 'Salvar AlteraÃ§Ãµes' : 'Criar Atividade'}</button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state animate-float-up"><div className="icon-box bg-liturgical/10 text-liturgical mx-auto mb-3"><ListChecks className="h-6 w-6" /></div><p className="text-sm font-medium text-muted-foreground">Nenhuma atividade cadastrada</p></div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const TIPO_ICONES: Record<string, string> = {
              'Retiro': '⛺', 'Celebração': '✨', 'Encontro de pais': '👨‍👩‍👧',
              'Gincana': '🎯', 'Passeios': '🌿', 'Jornada': '🚶', 'Eventos geral': '📅', 'Outros': '📌',
            };
            const sorted = [...list].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
            const groups: Record<string, typeof sorted> = {};
            const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
            const DIAS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];

            sorted.forEach(item => {
              const d = new Date(item.data + 'T12:00:00');
              const key = `${d.getFullYear()}-${d.getMonth()}`;
              if (!groups[key]) groups[key] = [];
              groups[key].push(item);
            });

            return Object.entries(groups).map(([key, items]) => {
              const [y, m] = key.split('-').map(Number);
              const monthLabel = `${MESES[m]} ${y}`;
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-liturgical/25 to-liturgical/40" />
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-liturgical/10 to-liturgical/5 border border-liturgical/20 shadow-sm">
                      <h3 className="text-xs font-extrabold text-liturgical uppercase tracking-[0.18em]">{monthLabel}</h3>
                      <span className="text-[10px] font-bold text-liturgical/50 ml-1">({items.length})</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-liturgical/25 to-liturgical/40" />
                  </div>

                  {items.map((item, i) => {
                    const d = new Date(item.data + 'T12:00:00');
                    const cor = tipoColors[item.tipo] || 'bg-muted text-muted-foreground';
                    const icone = TIPO_ICONES[item.tipo] || '📌';
                    return (
                      <button
                        key={item.id}
                        onClick={() => setViewItem(item)}
                        className="w-full text-left group animate-float-up"
                        style={{ animationDelay: `${i * 55}ms` }}
                      >
                        <div className="flex items-stretch bg-card rounded-2xl border border-black/5 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all active:scale-[0.98] overflow-hidden relative">
                          <div className={`absolute top-0 bottom-0 left-0 w-1 ${cor.split(' ')[0].replace('bg-','bg-')}`} />
                          
                          {/* Coluna da data */}
                          <div className="flex flex-col items-center justify-center px-4 py-4 border-r border-black/5 shrink-0 min-w-[75px] bg-muted/30 group-hover:bg-primary/5 transition-colors pl-5">
                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none mb-1">{DIAS[d.getDay()]}</span>
                            <span className="text-3xl font-black text-foreground leading-none">{String(d.getDate()).padStart(2,'0')}</span>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{MESES[d.getMonth()].substring(0,3)}</span>
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 px-4 sm:px-5 py-3 sm:py-4 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-base leading-none bg-muted/50 p-1 rounded-md">{icone}</span>
                              <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-current/10 ${cor}`}>
                                {item.tipo}
                              </span>
                              {item.modalidade === 'externa' && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                  <Car className="h-2.5 w-2.5" /> Externa
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">{item.nome}</h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
                              {item.horario && (
                                <p className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 text-primary/70" /> {item.horario}
                                </p>
                              )}
                              {item.local && (
                                <p className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-muted-foreground max-w-full">
                                  <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" /> <span className="truncate">{item.local}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-center px-4 opacity-50 group-hover:opacity-100 transition-opacity pr-5">
                            <div className="w-8 h-8 rounded-full bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
      )}

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="rounded-2xl border-border/30 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          {viewItem && (
            <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden relative">
              {/* Header Bar Clean */}
              <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-black/5 bg-background/90 backdrop-blur-md">
                <span className="text-sm font-bold text-foreground truncate pr-4">Detalhes da Atividade</span>
                <div className="flex items-center gap-1.5 pr-8">
                  <button onClick={() => handleEdit(viewItem)} className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(viewItem.id)} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                <div className="text-center sm:text-left">
                   <div className="flex justify-center sm:justify-start gap-2 mb-3">
                     <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-current/10 ${tipoColors[viewItem.tipo] || 'bg-muted text-muted-foreground'}`}>
                       <span>{TIPO_ICONES[viewItem.tipo] || '📌'}</span> {viewItem.tipo}
                     </span>
                     <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                       {viewItem.modalidade === 'externa' ? 'Externa' : 'Interna'}
                     </span>
                   </div>
                   <h2 className="text-2xl font-black text-foreground leading-tight tracking-tight mb-2">{viewItem.nome}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tempo */}
                  <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm space-y-3.5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary"><Calendar className="w-4 h-4" /></div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Data</p>
                            <p className="text-sm font-semibold text-foreground">{viewItem.data ? formatarDataVigente(viewItem.data) : 'A definir'}</p>
                         </div>
                      </div>
                      <div className="h-px bg-black/5" />
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary"><Clock className="w-4 h-4" /></div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Horário</p>
                            <p className="text-sm font-semibold text-foreground">{viewItem.horario || 'A definir'}</p>
                         </div>
                      </div>
                  </div>

                  {/* Espaço */}
                  <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm space-y-3.5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600"><MapPin className="w-4 h-4" /></div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none mb-0.5">Local</p>
                            <p className="text-sm font-semibold text-foreground truncate">{viewItem.local || 'Não informado'}</p>
                         </div>
                      </div>
                      {viewItem.modalidade === 'externa' && viewItem.conducao && (
                        <>
                          <div className="h-px bg-black/5" />
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600"><Car className="w-4 h-4" /></div>
                             <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest leading-none mb-0.5">Condução</p>
                                <p className="text-sm font-semibold text-foreground truncate">{viewItem.conducao}</p>
                             </div>
                          </div>
                        </>
                      )}
                  </div>
                </div>

                {viewItem.descricao && (
                  <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Descrição</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.descricao}</p>
                  </div>
                )}
                
                {viewItem.observacao && (
                  <div className="bg-accent/5 rounded-2xl p-5 border border-accent/10">
                    <h4 className="text-[10px] font-black text-accent-foreground uppercase tracking-widest mb-2">Observação</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.observacao}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button onClick={() => { setPresencaItem(viewItem); setPresencaOpen(true); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-all font-bold text-xs ring-1 ring-inset ring-success/20">
                    <Users className="h-4 w-4" /> 
                    <span>Lista de Presença <span className="bg-success text-white rounded-full px-1.5 py-0.5 ml-1 text-[10px]">{(viewItem.presencas||[]).length}</span></span>
                  </button>
                  {viewItem.modalidade === 'externa' && (
                    <button onClick={() => printAutorizacao(viewItem)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold text-xs ring-1 ring-inset ring-primary/20">
                      <Printer className="h-4 w-4" /> Baixar Autorização
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={presencaOpen} onOpenChange={setPresencaOpen}>
        <DialogContent className="rounded-2xl border-border/30 max-w-sm">
          <DialogHeader><DialogTitle className="px-2">Presença - {presencaItem?.nome}</DialogTitle></DialogHeader>
          {catequizandos.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum catequizando matriculado</p> : (
            <div className="space-y-1 mt-2 max-h-[50vh] overflow-y-auto px-1">
              {catequizandos.map(c => {
                const present = (presencaItem?.presencas || []).includes(c.id);
                return (
                  <button key={c.id} onClick={() => togglePresenca(c.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors border ${present ? 'bg-success/10 border-success/20' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${present ? 'bg-success border-success' : 'border-black/10'}`}>{present && <CheckCircle2 className="h-3 w-3 text-white" />}</div>
                    <div className="flex-1 text-left min-w-0">
                      <span className={`font-bold block truncate leading-tight ${present ? 'text-foreground' : 'text-muted-foreground'}`}>{c.nome}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tight truncate block mt-0.5">Resp: {c.responsavel || 'Não informado'}</span>
                    </div>
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
