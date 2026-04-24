import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
  isSignup?: boolean;
}

export function ConsentModal({
  open,
  onAccept,
  onCancel,
  isSignup = false,
}: ConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-white/20 z-10 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/10 dark:border-white/10">
          <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Termos de Uso</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Body scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-primary/20 bg-white shadow-md shrink-0">
              <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <p className="text-base font-black text-foreground tracking-tight">iCatequese</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Privacidade e Pastoral</p>
            </div>
          </div>

          <p className="text-xs font-medium">
            Bem-vindo ao <strong className="text-foreground">iCatequese</strong>. Para garantir a segurança e a privacidade da nossa caminhada pastoral, precisamos que você concorde com os termos abaixo:
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="font-black text-primary text-[10px] uppercase tracking-wider mb-1">📋 Uso dos Dados</p>
              <p className="text-[11px] leading-snug font-medium text-primary/80">Seus dados são utilizados exclusivamente para a gestão da catequese. Não compartilhamos informações com terceiros.</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <p className="font-black text-amber-600 text-[10px] uppercase tracking-wider mb-1">🔒 Privacidade LGPD</p>
              <p className="text-[11px] leading-snug font-medium text-amber-600/80">As informações dos catequizandos são tratadas com total sigilo, seguindo rigorosamente a LGPD.</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <p className="font-black text-emerald-600 text-[10px] uppercase tracking-wider mb-1">✝️ Missão Evangelizadora</p>
              <p className="text-[11px] leading-snug font-medium text-emerald-600/80">O sistema destina-se ao uso pastoral. É proibido o uso dos dados para fins comerciais.</p>
            </div>
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground/60 pt-2 font-bold uppercase tracking-widest">
            Ad Maiorem Dei Gloriam
          </p>
        </div>
        
        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
          <div 
            onClick={() => setAgreed((v) => !v)}
            className="flex items-center gap-4 cursor-pointer bg-primary/5 p-4 rounded-2xl border-2 border-primary/10 hover:border-primary/30 transition-all select-none"
          >
            <div
              className={`w-7 h-7 rounded-lg border-[3px] flex items-center justify-center shrink-0 transition-all ${
                agreed ? "bg-primary border-primary scale-110 shadow-lg shadow-primary/30" : "border-gray-400 bg-white dark:border-gray-500"
              }`}
            >
              <Check className={`h-5 w-5 text-white transition-opacity ${agreed ? "opacity-100" : "opacity-0"}`} strokeWidth={3} />
            </div>
            <span className="text-xs text-foreground leading-snug font-bold uppercase tracking-tight">
              Li e concordo com os <strong className="text-primary">Termos</strong> e <strong className="text-primary">Privacidade</strong>.
            </span>
          </div>
          <Button
            onClick={onAccept}
            disabled={!agreed}
            className="w-full rounded-2xl h-12 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
          >
            {isSignup ? "Confirmar Cadastro" : "Entrar no Aplicativo"}
          </Button>
          {!isSignup && (
            <button onClick={onCancel} className="w-full text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest py-1 hover:text-destructive transition-colors">
              Cancelar e Sair
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
