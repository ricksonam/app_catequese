import { useState, useEffect } from "react";
import { Heart, Copy, CheckCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

interface ApoieModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApoieModal({ open, onOpenChange }: ApoieModalProps) {
  const [copied, setCopied] = useState(false);
  const pixKey = "ricksonam@hotmail.com";
  const favorecido = "Rickson Amazonas";

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Fallback absoluto sem uso de focus() ou inputs, que causam pulo na tela
    const fallbackCopy = (text: string) => {
      const el = document.createElement("span");
      el.textContent = text;
      el.style.whiteSpace = "pre";
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);

      const selection = window.getSelection();
      const range = document.createRange();
      selection?.removeAllRanges();
      range.selectNodeContents(el);
      selection?.addRange(range);

      let success = false;
      try {
        success = document.execCommand("copy");
      } catch {
        success = false;
      }

      selection?.removeAllRanges();
      document.body.removeChild(el);
      return success;
    };

    const copyText = async () => {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(pixKey);
          return true;
        } catch {
          return fallbackCopy(pixKey);
        }
      }
      return fallbackCopy(pixKey);
    };

    copyText().then((success) => {
      if (success) {
        setCopied(true);
        toast.success("Chave Pix copiada! 💛", {
          description: "Cole no seu app de pagamento.",
        });
        setTimeout(() => setCopied(false), 3000);
      } else {
        toast.error("Não foi possível copiar. Copie manualmente.");
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm relative rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-amber-950">
        {/* Orbs decorativos */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-orange-400/20 blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />

        {/* Botão fechar */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-foreground/60 hover:text-foreground transition-all active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center gap-5 p-7 pt-8 max-h-[90vh] overflow-y-auto overflow-x-hidden">
          {/* Ícone animado */}
          <div className="relative flex items-center justify-center mt-2">
            {/* Anéis pulsantes */}
            <span className="absolute w-24 h-24 rounded-full bg-amber-400/20 animate-ping" style={{ animationDuration: "2s" }} />
            <span className="absolute w-20 h-20 rounded-full bg-amber-400/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />

            {/* Círculo principal */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-400/40">
              {/* Shimmer interno */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{
                    animation: "shimmer 2.5s infinite linear",
                    transform: "skewX(-20deg)",
                  }}
                />
              </div>
              <Heart className="h-9 w-9 text-white drop-shadow-lg" fill="white" />
              {/* Sparkle */}
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-300 drop-shadow animate-bounce" style={{ animationDuration: "1.5s" }} />
            </div>
          </div>

          {/* Título */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-amber-800 dark:text-amber-300 leading-tight">
              ❤️ Apoie o iCatequese!
            </h2>
            <div className="flex items-center justify-center gap-1.5">
              <div className="h-px w-8 bg-amber-300" />
              <Sparkles className="h-3 w-3 text-amber-400" />
              <div className="h-px w-8 bg-amber-300" />
            </div>
          </div>

          {/* Mensagem */}
          <div className="rounded-2xl bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border border-amber-200/60 dark:border-amber-700/30 p-4 text-center shadow-sm w-full">
            <p className="text-sm text-foreground/80 dark:text-zinc-300 font-medium leading-relaxed">
              Se você está gostando do <strong>iCatequese</strong> e ele tem ajudado na sua missão, considere nos apoiar! 🙏
            </p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              O app é <strong className="text-amber-600 dark:text-amber-400">100% gratuito</strong> e qualquer contribuição ajuda a manter e evoluir a plataforma.
            </p>
          </div>

          {/* Seção Pix */}
          <div className="w-full rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-400/30 shrink-0">
            <div className="rounded-[14px] bg-white/95 dark:bg-zinc-900/95 p-4 space-y-3">
              {/* Label Pix */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <svg viewBox="0 0 512 512" className="w-4 h-4 fill-amber-600" xmlns="http://www.w3.org/2000/svg">
                    <path d="M242.4 292.5C247.8 287.1 254.4 284.4 261.1 284.4C267.7 284.4 274.4 287.1 279.7 292.5L357.6 370.4C393.3 406.1 450.6 406.1 486.3 370.4C522 334.7 522 277.4 486.3 241.7L408.3 163.7C402.9 158.3 400.1 151.6 400.1 144.9C400.1 138.2 402.9 131.5 408.3 126.2C419.1 115.5 435.1 115.5 445.9 126.2L523.8 204.1C576.5 256.8 576.5 341.4 523.8 394.1C471.1 446.8 386.5 446.8 333.8 394.1L255.9 316.2C250.5 310.8 242.5 310.8 237.1 316.2C231.7 321.6 231.7 329.6 237.1 335L314.9 412.8C314.9 412.8 314.9 412.8 314.9 412.9C367.6 465.5 452.3 465.5 505 412.9C557.6 360.2 557.6 275.5 505 222.9L427.1 144.1C416.3 133.3 411.9 118.6 411.9 104.1C411.9 89.6 416.3 74.86 427.1 64.07C449 42.22 484.9 42.22 506.8 64.07L522.8 80.07C528.2 85.47 535 88.27 541.7 88.27C548.4 88.27 555.1 85.47 560.5 80.07C571.2 69.37 571.2 52.47 560.5 41.77L544.5 25.77C516.6-2.132 477.3-2.132 449.4 25.77C421.5 53.67 421.5 93.07 449.4 120.9L527.2 198.8C567.3 238.9 567.3 303.6 527.2 343.7C487.1 383.8 422.4 383.8 382.3 343.7L304.5 265.9C293.7 255.1 279.1 249.7 264.5 249.7C249.9 249.7 235.3 255.1 224.5 265.9L146.7 343.7C106.6 383.8 41.9 383.8 1.8 343.7C-38.3 303.6-38.3 238.9 1.8 198.8L79.7 120.9C90.4 110.2 95 95.57 95 81.07C95 66.57 90.4 51.97 79.7 41.27C57.8 19.42 21.9 19.42 0 41.27C0 41.27 0 41.27 0 41.27L0 41.27C-21.9 63.12-21.9 99.02 0 120.9L22.3 143.2C27.7 148.6 30.5 155.3 30.5 162C30.5 168.7 27.7 175.4 22.3 180.7C11.6 191.4-4.4 191.4-15.1 180.7L-37.4 158.4C-89.1 105.7-89.1 21.1-37.4-31.6C15.3-84.3 99.9-84.3 152.6-31.6L230.5 46.3C241.3 57.1 255.9 62.5 270.5 62.5C285.1 62.5 299.7 57.1 310.5 46.3L388.4-31.6C441.1-84.3 525.7-84.3 578.4-31.6C631.1 21.1 631.1 105.7 578.4 158.4L500.5 236.3C489.7 247 484.3 261.6 484.3 276.2C484.3 290.8 489.7 305.4 500.5 316.2L578.4 394.1C631.1 446.8 631.1 531.4 578.4 584.1C525.7 636.8 441.1 636.8 388.4 584.1L310.5 506.2C299.7 495.4 285.1 490 270.5 490C255.9 490 241.3 495.4 230.5 506.2L152.6 584.1C99.9 636.8 15.3 636.8-37.4 584.1C-90.1 531.4-90.1 446.8-37.4 394.1L40.5 316.2C51.3 305.4 56.7 290.8 56.7 276.2C56.7 261.6 51.3 247 40.5 236.3L-37.4 158.4" />
                  </svg>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  Chave Pix
                </span>
              </div>

              {/* Favorecido */}
              <div className="text-xs text-muted-foreground font-bold">
                Favorecido: <span className="text-foreground font-black">{favorecido}</span>
              </div>

              {/* Chave + botão copiar */}
              <button
                onClick={handleCopy}
                type="button"
                className="w-full group flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-dashed border-amber-300 dark:border-amber-700 hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <span className="text-sm font-black text-amber-800 dark:text-amber-300 tracking-wide truncate">
                  {pixKey}
                </span>
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 group-hover:text-amber-700 transition-colors">
                  {copied ? (
                    <>
                      <CheckCheck className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Rodapé */}
          <p className="text-[11px] text-center text-muted-foreground font-medium pb-1 mt-1">
            Qualquer valor é bem-vindo e faz diferença! 🌟<br />
            <span className="text-amber-600 dark:text-amber-400 font-bold">Deus abençoe sua generosidade!</span>
          </p>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { transform: skewX(-20deg) translateX(-150%); }
            100% { transform: skewX(-20deg) translateX(350%); }
          }
        `}</style>
      </div>
    </div>
  );
}
