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
  'Retiro': 'bg-primary/10 text-primary', 'CelebraÃ§Ã£o': 'bg-liturgical/10 text-liturgical',
  'Encontro de pais': 'bg-accent/15 text-accent-foreground', 'Gincana': 'bg-success/10 text-success',
  'Passeios': 'bg-gold/15 text-gold', 'Jornada': 'bg-primary/10 text-primary',
  'Eventos geral': 'bg-muted text-muted-foreground', 'Outros': 'bg-muted text-muted-foreground',
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
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div><h1 className="text-xl font-bold text-foreground">Atividades e Eventos</h1><p className="text-xs text-muted-foreground">{turma?.nome} â€¢ {list.length} atividades</p></div>
        </div>
        <div className="flex items-center gap-2">
          {id && <ReportModule context="atividades" turmaId={id} />}
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ ...emptyForm }); } }}>
            <DialogTrigger asChild><button className="action-btn-sm"><Plus className="h-4 w-4" /> Nova</button></DialogTrigger>
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
              'Retiro': 'ðŸ•ï¸', 'CelebraÃ§Ã£o': 'âœï¸', 'Encontro de pais': 'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§',
              'Gincana': 'ðŸŽ¯', 'Passeios': 'ðŸŒ¿', 'Jornada': 'ðŸš¶', 'Eventos geral': 'ðŸ“…', 'Outros': 'ðŸ“Œ',
            };
            const sorted = [...list].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
            const groups: Record<string, typeof sorted> = {};
            const MESES = ["Janeiro","Fevereiro","MarÃ§o","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
            const DIAS = ["Dom","Seg","Ter","Qua","Qui","Sex","SÃ¡b"];

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
                      <span className="text-[9px] text-liturgical/70">âœ</span>
                      <h3 className="text-xs font-extrabold text-liturgical uppercase tracking-[0.18em]">{monthLabel}</h3>
                      <span className="text-[10px] font-bold text-liturgical/50 ml-1">({items.length})</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-liturgical/25 to-liturgical/40" />
                  </div>

                  {items.map((item, i) => {
                    const d = new Date(item.data + 'T12:00:00');
                    const cor = tipoColors[item.tipo] || 'bg-muted text-muted-foreground';
                    const icone = TIPO_ICONES[item.tipo] || 'ðŸ“Œ';
                    return (
                      <button
                        key={item.id}
                        onClick={() => setViewItem(item)}
                        className="w-full relative p-[1.5px] rounded-2xl bg-gradient-to-br from-liturgical/30 via-primary/15 to-primary/5 shadow-md hover:shadow-lg animate-float-up active:scale-[0.98] transition-all duration-300 hover:-translate-y-0.5"
                        style={{ animationDelay: `${i * 55}ms` }}
                      >
                        <div className="rounded-[14px] bg-card overflow-hidden">
                          <div className={`${cor.split(' ')[0].replace('bg-', 'bg-gradient-to-r from-').replace('/10','/60').replace('/15','/60')} from-${cor.split(' ')[0].replace('bg-','').replace('/10','').replace('/15','')}/60 to-transparent h-1 w-full`} />

                          <div className="flex items-stretch">
                            <div className="flex flex-col items-center justify-center px-4 py-3.5 bg-gradient-to-b from-liturgical/5 to-liturgical/10 shrink-0 min-w-[60px] border-r border-black/5">
                              <span className="text-xl leading-none mb-0.5">{icone}</span>
                              <span className="text-2xl font-black text-foreground leading-tight">{String(d.getDate()).padStart(2,'0')}</span>
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wide">{DIAS[d.getDay()]}</span>
                            </div>

                            <div className="flex-1 px-4 py-3 min-w-0 text-left">
                              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mb-1.5 ${cor}`}>
                                {item.tipo}
                              </span>
                              <p className="text-sm font-bold text-foreground leading-snug truncate">{item.nome}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {item.horario && <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><Clock className="h-3 w-3" />{item.horario}</span>}
                                {item.local && <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3" />{item.local}</span>}
                                {item.modalidade === 'externa' && <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md"><Car className="h-3 w-3" />Externa</span>}
                              </div>
                            </div>

                            <div className="flex items-center justify-center px-4 border-l border-black/5 opacity-50">
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
            <>
              <div className={`px-5 pt-5 pb-4 ${tipoColors[viewItem.tipo]?.replace(/text-\S+/, '') || 'bg-muted'}`}>
                <span className={`inline-block pill-btn text-[10px] mb-2 ${tipoColors[viewItem.tipo] || 'bg-muted text-muted-foreground'}`}>{viewItem.tipo} â€¢ {viewItem.modalidade === 'externa' ? 'Externa' : 'Interna'}</span>
                <h2 className="text-lg font-bold text-foreground">{viewItem.nome}</h2>
              </div>
              <div className="px-5 flex items-center justify-between">
                <button onClick={() => handleEdit(viewItem)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold"><Pencil className="h-3.5 w-3.5" /> Editar</button>
                <button onClick={() => handleDelete(viewItem.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-destructive/10 text-destructive text-xs font-semibold"><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
              </div>
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {viewItem.data && <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5"><Calendar className="h-4 w-4 text-primary shrink-0" /><span className="text-xs font-medium text-foreground">{formatarDataVigente(viewItem.data)}</span></div>}
                  {viewItem.horario && <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5"><Clock className="h-4 w-4 text-primary shrink-0" /><span className="text-xs font-medium text-foreground">{viewItem.horario}</span></div>}
                  {viewItem.local && <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 col-span-2"><MapPin className="h-4 w-4 text-primary shrink-0" /><span className="text-xs font-medium text-foreground">{viewItem.local}</span></div>}
                  {viewItem.conducao && <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 col-span-2"><Car className="h-4 w-4 text-primary shrink-0" /><span className="text-xs font-medium text-foreground">{viewItem.conducao}</span></div>}
                </div>
                {viewItem.descricao && <div><p className="text-xs font-semibold text-muted-foreground mb-1">DescriÃ§Ã£o</p><p className="text-sm text-foreground">{viewItem.descricao}</p></div>}
                {viewItem.observacao && <div><p className="text-xs font-semibold text-muted-foreground mb-1">ObservaÃ§Ã£o</p><p className="text-sm text-foreground">{viewItem.observacao}</p></div>}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setPresencaItem(viewItem); setPresencaOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success/10 text-success text-xs font-semibold"><Users className="h-3.5 w-3.5" /> PresenÃ§a ({(viewItem.presencas||[]).length})</button>
                  {viewItem.modalidade === 'externa' && <button onClick={() => printAutorizacao(viewItem)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold"><Printer className="h-3.5 w-3.5" /> AutorizaÃ§Ã£o</button>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={presencaOpen} onOpenChange={setPresencaOpen}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader><DialogTitle>PresenÃ§a - {presencaItem?.nome}</DialogTitle></DialogHeader>
          {catequizandos.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum catequizando</p> : (
            <div className="space-y-1 mt-2 max-h-[50vh] overflow-y-auto">
              {catequizandos.map(c => {
                const present = (presencaItem?.presencas || []).includes(c.id);
                return (
                  <button key={c.id} onClick={() => togglePresenca(c.id)} className={`w-full flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl text-sm transition-colors ${present ? 'bg-success/10' : 'hover:bg-muted/50'}`}>
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${present ? 'bg-success border-success' : 'border-border'}`}>{present && <CheckCircle2 className="h-3 w-3 text-white" />}</div>
                      <div className="flex-1 text-left">
                        <span className={`font-bold block ${present ? 'text-foreground' : 'text-muted-foreground'}`}>{c.responsavel || 'Sem responsÃ¡vel'}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Catequizando: {c.nome}</span>
                      </div>
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
