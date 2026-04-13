import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Printer, FileText, Users, Calendar, ClipboardList, BookOpen, 
  Clock, CheckCircle2, LayoutGrid, UserCircle, Share2, 
  ArrowLeft, Search, X, ChevronRight, Eye
} from "lucide-react";
import { toast } from "sonner";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useParoquias, useComunidades } from "@/hooks/useSupabaseData";
import { cn } from "@/lib/utils";
import * as Templates from "./ReportTemplates";
import { Input } from "@/components/ui/input";

interface ReportModuleProps {
  context: "encontros" | "catequizandos" | "atividades" | "plano";
  turmaId: string;
  trigger?: React.ReactNode;
  initialDocId?: string;
  instantReport?: string;
}

const MODULE_CONFIG: any = {
  encontros: {
    title: "Relatórios de Encontros",
    icon: Calendar,
    color: "from-sky-500 to-blue-600",
    reports: [
      { id: "enc_complet", label: "Ficha Completa do Encontro", icon: ClipboardList, desc: "Roteiro, tema e avaliação", needsSelect: true },
      { id: "cham_vaz_enc", label: "Ficha de Presença (Individual)", icon: UserCircle, desc: "Lista em branco para um encontro", needsSelect: true },
      { id: "cham_vaz_sem", label: "Ficha de Presença (Semestral)", icon: LayoutGrid, desc: "Grade de chamada em branco", needsSelect: false },
      { id: "rel_status", label: "Relação por Status", icon: CheckCircle2, desc: "Realizados, pendentes e cancelados", needsSelect: false },
    ]
  },
  catequizandos: {
    title: "Relatórios de Catequizandos",
    icon: Users,
    color: "from-violet-500 to-purple-600",
    reports: [
      { id: "cat_individual", label: "Ficha Completa do Catequizando", icon: FileText, desc: "Dados cadastrais e sacramentos", needsSelect: true },
      { id: "lista_turma", label: "Relação Geral da Turma", icon: Users, desc: "Nomes e status dos alunos", needsSelect: false },
      { id: "lista_resp", label: "Relação de Responsáveis", icon: BookOpen, desc: "Nomes e contatos de emergência", needsSelect: false },
    ]
  },
  atividades: {
    title: "Relatórios de Atividades",
    icon: LayoutGrid,
    color: "from-emerald-500 to-teal-600",
    reports: [
      { id: "ativ_complet", label: "Ficha Completa da Atividade", icon: FileText, desc: "Descrição e planejamento", needsSelect: true },
      { id: "pres_responsaveis", label: "Presença de Responsáveis", icon: ClipboardList, desc: "Ficha em branco para reuniões", needsSelect: false },
    ]
  },
  plano: {
    title: "Relatórios do Plano da Turma",
    icon: ClipboardList,
    color: "from-amber-500 to-orange-600",
    reports: [
      { id: "plano_unificado", label: "Cronograma Geral", icon: Calendar, desc: "Encontros e Atividades por período", needsSelect: false },
    ]
  }
};

export default function ReportModule({ context, turmaId, trigger, initialDocId, instantReport }: ReportModuleProps) {
  const [step, setStep] = useState<'list' | 'select' | 'preview'>('list');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(initialDocId || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [] } = useEncontros(turmaId);
  const { data: catequizandos = [] } = useCatequizandos(turmaId);
  const { data: atividades = [] } = useAtividades(turmaId);
  const { data: paroquias = [] } = useParoquias();
  const { data: comunidades = [] } = useComunidades();

  const turma = turmas.find(t => t.id === turmaId);
  const config = MODULE_CONFIG[context];

  useEffect(() => {
    if (instantReport && initialDocId) {
      setSelectedReportId(instantReport);
      setSelectedRecordId(initialDocId);
      setStep('preview');
      setIsPreviewOpen(true);
    }
  }, [instantReport, initialDocId]);

  if (!turma) return null;

  const comunidade = comunidades.find(c => c.id === turma.comunidadeId);
  const paroquia = paroquias.find(p => p.id === comunidade?.paroquiaId);
  const org = { 
    paroquia: paroquia?.nome || "Paróquia não informada", 
    comunidade: comunidade?.nome || "Comunidade não informada" 
  };

  const handleReportClick = (report: any) => {
    setSelectedReportId(report.id);
    if (report.needsSelect && !initialDocId) {
      setStep('select');
    } else {
      setStep('preview');
      setIsModalOpen(false);
      setIsPreviewOpen(true);
    }
  };

  const handleRecordSelect = (id: string) => {
    setSelectedRecordId(id);
    setStep('preview');
    setIsModalOpen(false);
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const reportName = config.reports.find((r: any) => r.id === selectedReportId)?.label || "Relatório";
    const shareData = {
      title: 'IVC - Gestão de Catequese',
      text: `Confira o ${reportName} da turma ${turma.nome}. Para enviar o documento completo, escolha 'Salvar como PDF' no menu de impressão.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.info("Para compartilhar o arquivo PDF, selecione 'Salvar como PDF' na tela de impressão.");
          window.print();
        }
      }
    } else {
      toast.info("Para compartilhar o arquivo PDF, selecione 'Salvar como PDF' na tela de impressão.");
      window.print();
    }
  };

  const resetFlow = () => {
    setStep('list');
    setSelectedReportId(null);
    setSelectedRecordId(initialDocId || null);
    setIsModalOpen(false);
    setIsPreviewOpen(false);
  };

  const renderSelectionList = () => {
    let items: any[] = [];
    let labelKey = "nome";

    if (context === "encontros") {
      items = encontros;
      labelKey = "tema";
    } else if (context === "catequizandos") {
      items = catequizandos;
    } else if (context === "atividades") {
      items = atividades;
    }

    const filtered = items.filter(it => 
      (it[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div className="relative px-4">
          <Search className="absolute left-7 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar registro..." 
            className="pl-10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto px-4 space-y-1">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => handleRecordSelect(item.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item[labelKey]}</p>
                {item.data && <p className="text-[10px] text-muted-foreground">{new Date(item.data + 'T00:00').toLocaleDateString('pt-BR')}</p>}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">Nenhum registro encontrado.</p>
          )}
        </div>
      </div>
    );
  };

  const renderPreviewContent = () => {
    if (!selectedReportId) return null;

    switch (selectedReportId) {
      case "enc_complet":
        const targetEncontros = selectedRecordId ? encontros.filter(e => e.id === selectedRecordId) : encontros;
        return targetEncontros.map(e => <Templates.EncontroFullSheet key={e.id} doc={e} org={org} turma={turma} />);
      case "cham_vaz_enc":
        const targetEnc = selectedRecordId ? encontros.find(e => e.id === selectedRecordId) : null;
        return <Templates.AttendanceBlankSheet doc={targetEnc} org={org} turma={turma} catequizandos={catequizandos} />;
      case "cham_vaz_sem":
        return <Templates.SemesterAttendanceSheet org={org} turma={turma} catequizandos={catequizandos} />;
      case "rel_status":
        return <Templates.SemesterAttendanceSheet org={org} turma={turma} catequizandos={catequizandos} />; // Placeholder
      case "cat_individual":
        const targetCats = selectedRecordId ? catequizandos.filter(c => c.id === selectedRecordId) : catequizandos;
        return targetCats.map(c => <Templates.CatequizandoIndividualSheet key={c.id} doc={c} org={org} turma={turma} />);
      case "lista_turma":
        return <Templates.ParentsContactList org={org} turma={turma} catequizandos={catequizandos} />;
      case "lista_resp":
        return <Templates.ParentsContactList org={org} turma={turma} catequizandos={catequizandos} />;
      case "ativ_complet":
        const targetAtivs = selectedRecordId ? atividades.filter(a => a.id === selectedRecordId) : atividades;
        return targetAtivs.map(a => <Templates.ActivityFullSheet key={a.id} doc={a} org={org} turma={turma} />);
      case "pres_responsaveis":
        return <Templates.AttendanceBlankSheet org={org} turma={turma} catequizandos={catequizandos} />;
      case "plano_unificado":
        const allItems = [
          ...encontros.map(e => ({ ...e, type: 'encontro' })),
          ...atividades.map(a => ({ ...a, type: 'atividade' }))
        ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        
        const grouped: any[] = [];
        allItems.forEach(item => {
          const m = new Date(item.data + 'T00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const existing = grouped.find(g => g.month === m);
          if (existing) existing.items.push(item);
          else grouped.push({ month: m, items: [item] });
        });
        return <Templates.UnifiedPlanSheet org={org} turma={turma} items={grouped} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild onClick={() => { setIsModalOpen(true); setStep('list'); }}>
          {trigger || (
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wide">Relatórios</span>
            </button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {/* Header */}
          <div className={cn("p-6 text-white bg-gradient-to-br transition-all duration-500", config.color)}>
            <div className="flex items-center gap-3">
              {step === 'select' ? (
                <button onClick={() => setStep('list')} className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <config.icon className="h-6 w-6" />
                </div>
              )}
              <div>
                <DialogTitle className="text-xl font-black">
                  {step === 'select' ? "Selecione o Registro" : config.title}
                </DialogTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-0.5">{turma.nome}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="py-4">
            {step === 'list' ? (
              <div className="px-4 space-y-2">
                {config.reports.map((report: any) => (
                  <button
                    key={report.id}
                    onClick={() => handleReportClick(report)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/60 transition-all text-left group border border-transparent hover:border-black/5"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary")}>
                      <report.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{report.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{report.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              renderSelectionList()
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Overlay */}
      {isPreviewOpen && (
        <div className="preview-overlay">
          <div className="preview-actions">
            <button onClick={resetFlow} className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-6 w-px bg-white/20 mx-2" />
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-primary font-black uppercase text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#d4a574] text-white font-black uppercase text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </button>
            <div className="h-6 w-px bg-white/20 mx-2" />
            <button onClick={resetFlow} className="p-2.5 rounded-xl bg-destructive/20 hover:bg-destructive text-white transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="paper-preview p-0 md:p-12 overflow-visible">
             <div className="bg-white text-black min-h-full">
               {renderPreviewContent()}
             </div>
          </div>

          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/80 backdrop-blur-md rounded-2xl text-white text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10 text-center animate-bounce">
            Dica: No celular, salve como PDF para enviar no WhatsApp
          </div>
        </div>
      )}

      {/* Hidden Portal for System Print */}
      {isPreviewOpen && createPortal(
        <div className="hidden print:block absolute top-0 left-0 w-full min-h-screen bg-white z-[999999] print-wrapper">
          {renderPreviewContent()}
        </div>,
        document.body
      )}
    </>
  );
}
