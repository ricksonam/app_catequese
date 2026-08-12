import { useState, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Printer, Share2, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportItem {
  id: string;
  label: string;
  subtitle?: string;
  avatarInitial?: string;
  data: any;
}

interface ModuleReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  items: ReportItem[];
  renderTemplate: (itemData: any) => ReactNode;
  reportName: string;
  turmaName: string;
  color: "violet" | "sky" | "blue" | "indigo" | "fuchsia";
}

// ─── Color map ────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  violet: {
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10",
    text: "text-violet-600",
    hoverBg: "hover:bg-violet-500/5",
    printBtn: "text-violet-600 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20",
  },
  sky: {
    gradient: "from-sky-500 to-blue-600",
    bg: "bg-sky-500/10",
    text: "text-sky-600",
    hoverBg: "hover:bg-sky-500/5",
    printBtn: "text-sky-600 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20",
  },
  blue: {
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    hoverBg: "hover:bg-blue-500/5",
    printBtn: "text-blue-600 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
  },
  indigo: {
    gradient: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-500/10",
    text: "text-indigo-600",
    hoverBg: "hover:bg-indigo-500/5",
    printBtn: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20",
  },
  fuchsia: {
    gradient: "from-fuchsia-500 to-pink-600",
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-600",
    hoverBg: "hover:bg-fuchsia-500/5",
    printBtn: "text-fuchsia-600 bg-fuchsia-500/10 border-fuchsia-500/20 hover:bg-fuchsia-500/20",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ModuleReportSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  items,
  renderTemplate,
  reportName,
  turmaName,
  color,
}: ModuleReportSheetProps) {
  const [printTarget, setPrintTarget] = useState<any>(null);
  const hiddenCaptureRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [readyToShareParams, setReadyToShareParams] = useState<any>(null);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const printContent = printTarget ? renderTemplate(printTarget) : null;

  const handlePrint = (item: ReportItem) => {
    setPrintTarget(item.data);
    setTimeout(() => window.print(), 100);
  };

  const handleCompartilhar = async (item: ReportItem) => {
    setPrintTarget(item.data);
    setIsGenerating(true);
    setReadyToShareParams(null);
    const toastId = toast.loading("Gerando relatório...");

    setTimeout(async () => {
      try {
        if (!hiddenCaptureRef.current) throw new Error("Elemento não encontrado");
        const canvas = await html2canvas(hiddenCaptureRef.current, {
          scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / pageWidth;
        const scaledHeight = canvas.height / ratio;
        let heightLeft = scaledHeight;
        let position = 0;
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, scaledHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - scaledHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pageWidth, scaledHeight);
          heightLeft -= pageHeight;
        }
        const pdfBlob = pdf.output("blob");
        const fileName = `${reportName.replace(/\s+/g, "_")}_${item.label.replace(/\s+/g, "_")}.pdf`;
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });
        toast.dismiss(toastId);
        if (isMobile && navigator.share) {
          setReadyToShareParams({ file, reportName, id: item.id });
          toast.success("Pronto! Toque em 'Enviar!'", { duration: 2000 });
        } else {
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("PDF baixado com sucesso!");
        }
      } catch (err) {
        console.error("Erro ao gerar PDF", err);
        toast.error("Falha ao gerar o PDF", { id: toastId });
      } finally {
        setIsGenerating(false);
      }
    }, 500);
  };

  const handleEnviarAgora = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readyToShareParams) return;
    try {
      await navigator.share({
        title: readyToShareParams.reportName,
        text: `Confira o ${readyToShareParams.reportName}`,
        files: [readyToShareParams.file],
      });
      setReadyToShareParams(null);
    } catch (err) {
      console.error("Erro ao compartilhar", err);
    }
  };

  const c = COLOR_MAP[color] || COLOR_MAP.violet;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setPrintTarget(null); setReadyToShareParams(null); } }}>
        <DialogContent hideClose className="max-w-lg w-[95vw] rounded-3xl p-0 overflow-hidden border-none shadow-2xl print:hidden">
          {/* Header */}
          <div className={cn("p-5 text-white bg-gradient-to-br", c.gradient)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black uppercase tracking-tight">{title}</DialogTitle>
                  {subtitle && <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-0.5">{subtitle}</p>}
                </div>
              </div>
              <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <span className="text-white font-bold text-sm">✕</span>
              </button>
            </div>
          </div>

          {/* Items list — same layout as Central de Relatórios */}
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-black/5">
            {items.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Nenhum item disponível</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className={cn("w-full flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 transition-colors gap-3", c.hoverBg)}>
                  <div className="flex items-center gap-3">
                    {item.avatarInitial && (
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0", c.bg, c.text)}>
                        {item.avatarInitial}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.label}</p>
                      {item.subtitle && <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => handlePrint(item)} className={cn("flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-xl border transition-colors active:scale-95", c.printBtn)}>
                      <Printer className="h-3 w-3 shrink-0" /> Imprimir
                    </button>
                    {readyToShareParams?.id === item.id ? (
                      <button onClick={handleEnviarAgora} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-white bg-[#25D366] px-3 py-2 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all animate-pulse">
                        <Share2 className="h-3 w-3 shrink-0" /> Enviar!
                      </button>
                    ) : (
                      <button disabled={isGenerating} onClick={() => handleCompartilhar(item)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-500/10 px-3 py-2 rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-colors active:scale-95 disabled:opacity-50">
                        <Share2 className={cn("h-3 w-3 shrink-0", isGenerating && printTarget === item.data && "animate-spin")} />
                        {isGenerating && printTarget === item.data ? "Aguarde" : "Compartilhar"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden capture container for html2canvas */}
      <div className="pointer-events-none print:hidden" style={{ position: "fixed", left: "-9999px", top: 0, width: "210mm" }}>
        <div ref={hiddenCaptureRef} className="bg-white text-black p-0 m-0">
          {printContent}
        </div>
      </div>

      {/* Print portal for system print */}
      {printTarget && createPortal(
        <div className="print-wrapper" style={{ display: "none", position: "fixed", top: 0, left: 0, width: "100%", backgroundColor: "white", zIndex: 999999 }}>
          <div className="bg-white text-black">{printContent}</div>
        </div>,
        document.body
      )}
    </>
  );
}
