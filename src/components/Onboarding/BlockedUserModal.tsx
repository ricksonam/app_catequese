import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ShieldAlert, Mail, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockedUserModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

export function BlockedUserModal({ open, onClose, reason }: BlockedUserModalProps) {
  const supportEmail = "ricksonam@hotmail.com";

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950">
        {/* Banner de alerta */}
        <div className="h-2 w-full bg-destructive" />
        
        <div className="flex flex-col items-center text-center p-8">
          {/* Ícone central */}
          <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mb-6 border-2 border-destructive/20 animate-pulse">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>

          {/* Título e subtítulo */}
          <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Conta Suspensa</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Identificamos uma violação nos nossos termos de uso ou políticas de segurança, e seu acesso foi restrito.
          </p>

          {/* Card com o motivo */}
          <div className="w-full bg-slate-50 dark:bg-zinc-900 rounded-2xl p-5 mb-8 text-left border border-black/5 dark:border-white/5 shadow-inner">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
              Motivo do Bloqueio
            </p>
            <p className="text-sm font-bold text-foreground leading-snug">
              {reason || "Violação dos termos de uso da plataforma iCatequese."}
            </p>
          </div>

          {/* Informação de suporte */}
          <div className="w-full space-y-4 mb-2">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Suporte Técnico</p>
                <p className="text-sm font-bold text-foreground truncate">{supportEmail}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-lg h-9 w-9 text-primary hover:bg-primary/10"
                onClick={() => window.location.href = `mailto:${supportEmail}`}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-[11px] text-muted-foreground font-medium px-4">
              Se você acredita que isso foi um erro, entre em contato conosco enviando um e-mail para o endereço acima.
            </p>
          </div>
        </div>

        {/* Rodapé com ação */}
        <div className="p-6 bg-slate-50 dark:bg-zinc-900/50 border-t border-black/5 dark:border-white/5">
          <Button 
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-foreground text-background font-bold hover:bg-foreground/90 transition-all active:scale-[0.98]"
          >
            Entendi e sair
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
