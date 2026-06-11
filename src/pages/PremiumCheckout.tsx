import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Sparkles, CheckCircle2, ShieldCheck, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// SUBSTITUA PELO SEU LINK DA INFINITEPAY
const INFINITEPAY_LINK = "https://pay.infinitepay.io/SUA_TAG_AQUI/9,90"; 

export default function PremiumCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      toast.success("E-mail copiado! Cole na tela de pagamento.");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handlePay = () => {
    // Abrir o link da InfinitePay em nova aba
    window.open(INFINITEPAY_LINK, "_blank");
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-10">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Assinar Premium</h1>
          <p className="text-xs text-muted-foreground">Desbloqueie todo o potencial</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl p-6 text-white shadow-xl animate-float-up relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Sparkles className="w-40 h-40" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/30 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" /> Acesso Ilimitado
          </div>
          
          <h2 className="text-3xl font-black mb-1">R$ 9,90</h2>
          <p className="text-amber-100 text-sm mb-6 font-medium">pagamento único válido por 1 ano inteirinho!</p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-3 text-sm font-medium">
              <div className="bg-white/20 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>
              Jogos Bíblicos ilimitados
            </li>
            <li className="flex items-center gap-3 text-sm font-medium">
              <div className="bg-white/20 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>
              Criação de turmas sem limite
            </li>
            <li className="flex items-center gap-3 text-sm font-medium">
              <div className="bg-white/20 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>
              Orações, Dinâmicas e Diário
            </li>
            <li className="flex items-center gap-3 text-sm font-medium">
              <div className="bg-white/20 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>
              Geração de relatórios PDF
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl p-5 animate-float-up" style={{animationDelay: '100ms'}}>
        <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> Importante para liberar sua conta!
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-4 leading-relaxed">
          O pagamento é processado pela InfinitePay. Para que o sistema identifique o seu pagamento e libere sua conta <strong>automaticamente na mesma hora</strong>, você deve informar o seu e-mail abaixo na hora de pagar:
        </p>

        <div className="flex items-center gap-2 bg-white dark:bg-black/50 p-3 rounded-xl border border-blue-100 dark:border-blue-900 shadow-inner">
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Seu E-mail de Login</p>
            <p className="font-medium text-sm truncate select-all">{user?.email}</p>
          </div>
          <button 
            onClick={handleCopyEmail}
            className="p-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
          >
            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button 
        onClick={handlePay}
        className="w-full action-btn text-lg py-5 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 animate-float-up"
        style={{animationDelay: '200ms'}}
      >
        <ShieldCheck className="w-5 h-5" /> Ir para Pagamento Seguro
        <ExternalLink className="w-4 h-4 opacity-70 ml-1" />
      </button>

      <p className="text-center text-xs text-muted-foreground font-medium animate-float-up" style={{animationDelay: '300ms'}}>
        Pagamento 100% seguro processado via PIX pela InfinitePay.
      </p>
    </div>
  );
}
