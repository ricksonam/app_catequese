import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
      { id: "cal_anual", label: "Calendário Anual de Celebrações", icon: Calendar, desc: "Aniversários de nascimento e batismo", needsSelect: false },
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
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

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
    if (!previewRef.current) return;
    
    setIsGenerating(true);
    const toastId = toast.loading("Gerando PDF para compartilhar...");

    try {
      const reportName = config.reports.find((r: any) => r.id === selectedReportId)?.label || "Relatório";
      const element = previewRef.current;
      
      // Para garantir que o PDF saia em A4, precisamos que o elemento capturado 
      // não esteja escalonado pela visualização mobile (scale-0.6).
      // Vamos clonar o conteúdo para um container temporário fora da tela com largura fixa de A4.
      const printContainer = document.createElement("div");
      printContainer.style.position = "absolute";
      printContainer.style.left = "-9999px";
      printContainer.style.top = "0";
      printContainer.style.width = "210mm"; // Largura exata A4
      printContainer.style.backgroundColor = "white";
      printContainer.className = "pdf-capture-container";
      
      // Clona o conteúdo da prévia
      printContainer.innerHTML = element.innerHTML;
      document.body.appendChild(printContainer);

      const canvas = await html2canvas(printContainer, {
        scale: 2, // Aumenta resolução
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1024, // Força largura de desktop para o renderizador
      });

      // Remove o container temporário
      document.body.removeChild(printContainer);

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Primeira página
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Páginas subsequentes (caso o relatório seja longo)
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const pdfBlob = pdf.output("blob");
      const fileName = `${reportName.replace(/\s+/g, "_")}_${turma.nome.replace(/\s+/g, "_")}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Relatório: ${reportName}`,
          text: `Confira o ${reportName} da turma ${turma.nome}.`,
        });
        toast.success("Enviado com sucesso!", { id: toastId });
        
        // Dá um pequeno delay para que o menu de compartilhamento feche suavemente antes de voltar
        setTimeout(() => {
          resetFlow();
        }, 500);
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        toast.success("PDF gerado e baixado!", { id: toastId });
      }
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("Erro ao gerar PDF profissional. Tente Imprimir.", { id: toastId });
    } finally {
      setIsGenerating(false);
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
      case "cal_anual":
        return <Templates.AnnualCelebrationsCalendar org={org} turma={turma} catequizandos={catequizandos} />;
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
        <DialogTrigger asChild onClick={(e) => { 
          if (instantReport && initialDocId) {
            // Se for um relatório instantâneo, bypassamos a lista e vamos direto para o preview
            e.preventDefault();
            setSelectedReportId(instantReport);
            setSelectedRecordId(initialDocId);
            setStep('preview');
            setIsPreviewOpen(true);
          } else {
            setIsModalOpen(true); 
            setStep('list'); 
          }
        }}>
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
              disabled={isGenerating}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-black uppercase text-xs shadow-lg hover:scale-105 active:scale-95 transition-all",
                isGenerating ? "bg-gray-400 cursor-not-allowed" : "bg-[#d4a574]"
              )}
            >
              <Share2 className={cn("h-4 w-4", isGenerating && "animate-spin")} />
              {isGenerating ? "Gerando..." : "Compartilhar"}
            </button>
            <div className="h-6 w-px bg-white/20 mx-2" />
            <button onClick={resetFlow} className="p-2.5 rounded-xl bg-destructive/20 hover:bg-destructive text-white transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="paper-preview p-0 md:p-12 overflow-visible" ref={previewRef}>
             <div className="bg-white text-black min-h-full">
               {renderPreviewContent()}
             </div>
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
