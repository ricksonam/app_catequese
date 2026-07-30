import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Heart, Copy, CheckCircle2, HeartHandshake, Coffee, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ApoieModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApoieModal({ open, onOpenChange }: ApoieModalProps) {
  const [copied, setCopied] = useState(false);
  const pixKey = "ricksonam@hotmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[90vw] rounded-3xl border-none bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 shadow-2xl overflow-hidden p-0">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500"></div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="relative mt-2">
              <div className="absolute inset-0 bg-pink-200 dark:bg-pink-900/30 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative w-24 h-24 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-xl border border-pink-100 dark:border-pink-900/50 z-10">
                <HeartHandshake className="w-12 h-12 text-pink-500 animate-bounce" />
              </div>
              <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-pulse z-20" />
              <Heart className="absolute -bottom-2 -left-3 w-7 h-7 text-red-500 animate-bounce z-20" style={{ animationDelay: '0.3s' }} />
            </div>

            <DialogHeader className="space-y-2">
              <DialogTitle className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                Apoie o iCatequese
              </DialogTitle>
              <DialogDescription className="text-base text-slate-600 dark:text-slate-300 font-medium">
                O aplicativo é totalmente <span className="font-bold text-pink-600 dark:text-pink-400">gratuito</span> e feito com muito carinho!
              </DialogDescription>
            </DialogHeader>

            <div className="bg-white/80 dark:bg-zinc-800/80 rounded-2xl p-5 w-full shadow-inner border border-slate-100 dark:border-zinc-700/50 backdrop-blur-sm">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
                Se este app tem ajudado na sua caminhada, considere fazer uma contribuição para ajudar nos custos de manutenção e novas melhorias.
              </p>

              <div className="bg-pink-50/50 dark:bg-pink-950/20 rounded-xl p-4 border border-pink-100/50 dark:border-pink-900/30">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-black text-pink-500 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                    Chave PIX (E-mail)
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-lg p-2.5 border border-pink-100 dark:border-pink-900/30 shadow-sm transition-all hover:border-pink-300 dark:hover:border-pink-700/50 group">
                    <span className="font-mono text-[15px] font-bold text-slate-700 dark:text-slate-200 select-all truncate pr-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{pixKey}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleCopy}
                      className="h-9 w-9 shrink-0 rounded-md hover:bg-pink-100 hover:text-pink-600 dark:hover:bg-pink-900/50 p-0"
                    >
                      {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-pink-500" />}
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-1 text-sm bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-md">
                    <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold mb-1 sm:mb-0">Favorecido:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Rickson Amazonas Farias</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">
              <Coffee className="w-4 h-4 text-amber-600" />
              Qualquer valor é bem-vindo!
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
