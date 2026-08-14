import { useState } from "react";
import { X, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TermsContent } from "./TermsContent";

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
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-base text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar">
          
          <div className="flex flex-col gap-1 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-primary/20 bg-white shadow-md shrink-0">
                <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground tracking-tight leading-none">iCatequese</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Privacidade & Termos</p>
              </div>
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight leading-tight">Termo de Uso e Política de Privacidade</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Última atualização: 13 de agosto de 2026</p>
          </div>

          <TermsContent />
          <div className="p-5 bg-primary/5 rounded-2xl border border-primary/20 text-center mt-6">
            <p className="text-sm font-black text-primary">
              Ao utilizar o iCatequese, o usuário declara estar de acordo com todos os termos acima.
            </p>
          </div>

          <p className="text-xs text-center text-slate-400 pt-4 font-black uppercase tracking-[0.3em] pb-6">
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
            {isSignup ? "Aceitar Termos e Criar Conta" : "Entrar no Aplicativo"}
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
