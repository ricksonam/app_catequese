import { useState } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Printer, FileText, Users, Calendar, ClipboardList, BookOpen, Clock, CheckCircle2, LayoutGrid, UserCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useParoquias, useComunidades } from "@/hooks/useSupabaseData";
import { cn } from "@/lib/utils";
import * as Templates from "./ReportTemplates";

interface ReportModuleProps {
  context: "encontros" | "catequizandos" | "atividades" | "plano";
  turmaId: string;
  trigger?: React.ReactNode;
  initialDocId?: string; // Para identificar o doc específico
  instantReport?: string; // ID do relatório para impressão imediata
}

const MODULE_CONFIG = {
  encontros: {
    title: "Relatórios de Encontros",
    icon: Calendar,
    color: "from-sky-500 to-blue-600",
    reports: [
      { id: "enc_complet", label: "Ficha Completa do Encontro", icon: ClipboardList, desc: "Roteiro, tema e avaliação" },
      { id: "cham_vaz_enc", label: "Ficha de Presença (Individual)", icon: UserCircle, desc: "Lista em branco para um encontro" },
      { id: "cham_vaz_sem", label: "Ficha de Presença (Semestral)", icon: LayoutGrid, desc: "Grade de chamada em branco" },
      { id: "rel_status", label: "Relação por Status", icon: CheckCircle2, desc: "Realizados, pendentes e cancelados" },
    ]
  },
  catequizandos: {
    title: "Relatórios de Catequizandos",
    icon: Users,
    color: "from-violet-500 to-purple-600",
    reports: [
      { id: "cat_individual", label: "Ficha Completa do Catequizando", icon: FileText, desc: "Dados cadastrais e sacramentos" },
      { id: "lista_turma", label: "Ficha dos Catequizandos por Turma", icon: Users, desc: "Relação geral da turma" },
      { id: "lista_resp", label: "Relação de Responsáveis", icon: BookOpen, desc: "Nomes e contatos de emergência" },
    ]
  },
  atividades: {
    title: "Relatórios de Atividades",
    icon: LayoutGrid,
    color: "from-emerald-500 to-teal-600",
    reports: [
      { id: "ativ_complet", label: "Ficha Completa da Atividade", icon: FileText, desc: "Descrição e planejamento" },
      { id: "pres_responsaveis", label: "Presença de Responsáveis", icon: ClipboardList, desc: "Ficha em branco para reuniões" },
    ]
  },
  plano: {
    title: "Relatórios do Plano da Turma",
    icon: ClipboardList,
    color: "from-amber-500 to-orange-600",
    reports: [
      { id: "plano_unificado", label: "Cronograma Geral", icon: Calendar, desc: "Encontros e Atividades por período" },
    ]
  }
};

export default function ReportModule({ context, turmaId, trigger, initialDocId, instantReport }: ReportModuleProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [printDoc, setPrintDoc] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [] } = useEncontros(turmaId);
  const { data: catequizandos = [] } = useCatequizandos(turmaId);
  const { data: atividades = [] } = useAtividades(turmaId);
  const { data: paroquias = [] } = useParoquias();
  const { data: comunidades = [] } = useComunidades();

  const turma = turmas.find(t => t.id === turmaId);
  const config = MODULE_CONFIG[context];

  if (!turma) return null;

  const comunidade = comunidades.find(c => c.id === turma.comunidadeId);
  const paroquia = paroquias.find(p => p.id === comunidade?.paroquiaId);
  const org = { 
    paroquia: paroquia?.nome || "Paróquia não informada", 
    comunidade: comunidade?.nome || "Comunidade não informada" 
  };

  const handlePrint = (reportId: string, doc?: any) => {
    setSelectedReport(reportId);
    setPrintDoc(doc || null);
    setTimeout(() => {
      const handleAfterPrint = () => {
        setSelectedReport(null);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      window.print();
    }, 500); // Dar tempo pro React renderizar o DOM do Portal completamente
  };

  const handleShare = (reportId: string, doc?: any) => {
    toast.info("Para compartilhar (ex: WhatsApp), selecione 'Salvar como PDF' na tela de impressão a seguir.", { duration: 6000 });
    handlePrint(reportId, doc);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (instantReport) {
      e.stopPropagation();
      handlePrint(instantReport, initialDocId);
    } else {
      setIsOpen(true);
    }
  };

  // Se initialDocId for passado, podemos ter uma lógica para imprimir direto
  // Mas por agora, vamos manter o modal para escolha se não for óbvio

  const renderPrintTemplate = () => {
    if (!selectedReport) return null;

    switch (selectedReport) {
      case "enc_complet":
        const targetEncontros = printDoc ? encontros.filter(e => e.id === printDoc) : encontros;
        return targetEncontros.map(e => <Templates.EncontroFullSheet key={e.id} doc={e} org={org} turma={turma} />);
      case "cham_vaz_enc":
        const targetEnc = printDoc ? encontros.find(e => e.id === printDoc) : null;
        return <Templates.AttendanceBlankSheet doc={targetEnc} org={org} turma={turma} catequizandos={catequizandos} />;
      case "cham_vaz_sem":
        return <Templates.SemesterAttendanceSheet org={org} turma={turma} catequizandos={catequizandos} />;
      case "cat_individual":
        const targetCats = printDoc ? catequizandos.filter(c => c.id === printDoc) : catequizandos;
        return targetCats.map(c => <Templates.CatequizandoIndividualSheet key={c.id} doc={c} org={org} turma={turma} />);
      case "lista_turma":
        return <Templates.ParentsContactList org={org} turma={turma} catequizandos={catequizandos} />; // Reusing parents list as base
      case "lista_resp":
        return <Templates.ParentsContactList org={org} turma={turma} catequizandos={catequizandos} />;
      case "ativ_complet":
        return atividades.map(a => <Templates.ActivityFullSheet key={a.id} doc={a} org={org} turma={turma} />);
      case "pres_responsaveis":
        return <Templates.AttendanceBlankSheet org={org} turma={turma} catequizandos={catequizandos} />; // Reusing blank sheet
      case "plano_unificado":
        // Group by month
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

  const content = renderPrintTemplate();

  if (instantReport) {
    return (
      <>
        <div onClick={handleTriggerClick} style={{ display: 'contents' }}>
          {trigger}
        </div>
        {selectedReport && (
          <div className="hidden print:block fixed inset-0 min-h-screen w-full bg-white z-[99999] overflow-visible">
            {content}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild onClick={handleTriggerClick}>
          {trigger || (
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wide">Relatórios</span>
            </button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className={cn("p-6 text-white bg-gradient-to-br", config.color)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <config.icon className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black">{config.title}</DialogTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-0.5">{turma.nome}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {config.reports.map((report) => (
              <div
                key={report.id}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-muted/40 transition-all border border-transparent hover:border-black/5 group"
              >
                <div onClick={() => { handlePrint(report.id); setIsOpen(false); }} className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary shrink-0")}>
                    <report.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-bold text-foreground truncate">{report.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{report.desc}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => { handlePrint(report.id); setIsOpen(false); }} 
                    className="p-2.5 rounded-xl bg-white border border-black/5 shadow-sm text-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => { handleShare(report.id); setIsOpen(false); }} 
                    className="p-2.5 rounded-xl bg-[#d4a574]/15 text-[#d4a574] border border-[#d4a574]/20 shadow-sm hover:bg-[#d4a574]/25 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {selectedReport && createPortal(
        <div className="absolute top-0 left-0 w-full min-h-screen bg-white z-[999999] print-wrapper">
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
