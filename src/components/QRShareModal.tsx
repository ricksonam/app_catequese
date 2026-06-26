import { QRCodeSVG } from "qrcode.react";
import { Share2, Copy, X } from "lucide-react";
import { copyToClipboardOrShare } from "@/lib/utils";
import { toast } from "sonner";

interface QRShareModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description: React.ReactNode;
  accentColor?: string; // tailwind bg class, e.g. "bg-primary" or "bg-amber-500"
  shareText?: string;
  shareTitle?: string;
}

export function QRShareModal({
  open,
  onClose,
  url,
  title,
  description,
  accentColor = "bg-primary",
  shareText,
  shareTitle,
}: QRShareModalProps) {
  if (!open) return null;

  const handleCopy = async () => {
    const ok = await copyToClipboardOrShare(url, {
      title: shareTitle || title,
      text: shareText || url,
    });
    if (ok) toast.success("Link copiado!", { duration: 3000 });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle || title,
          text: shareText || "",
          url,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="relative bg-background rounded-3xl shadow-2xl w-full max-w-xs sm:max-w-sm flex flex-col gap-5 p-6">
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition-colors"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        {/* Título */}
        <p className="text-center text-sm font-black uppercase tracking-widest text-foreground pr-10">
          {title}
        </p>

        {/* Descrição */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {description}
        </p>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 bg-white rounded-2xl border border-black/10 shadow-sm">
            <QRCodeSVG
              value={url}
              size={150}
              level="M"
              includeMargin={false}
              fgColor="#000000"
            />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Aponte a câmera para ler
          </p>
        </div>

        <div className="border-t border-border/40 w-full" />

        {/* Link copiável */}
        <div className="flex flex-col gap-2 w-full">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
            Ou copie o link
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/50 px-3 py-2 w-full overflow-hidden">
            <span className="flex-1 text-xs text-muted-foreground font-mono truncate min-w-0">
              {url}
            </span>
            <button
              onClick={handleCopy}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg ${accentColor} text-white text-xs font-black hover:opacity-90 active:scale-95 transition-all`}
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </button>
          </div>
        </div>

        {/* Compartilhar */}
        <button
          onClick={handleShare}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl ${accentColor} text-white text-sm font-black hover:opacity-90 active:scale-95 transition-all shadow-md`}
        >
          <Share2 className="h-4 w-4" />
          Compartilhar via WhatsApp / E-mail
        </button>
      </div>
    </div>
  );
}
