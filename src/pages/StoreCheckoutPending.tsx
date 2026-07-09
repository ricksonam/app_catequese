import { useNavigate } from "react-router-dom";
import { Clock, ArrowLeft, Mail, RefreshCw } from "lucide-react";

export default function StoreCheckoutPending() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-foreground">Pagamento Pendente</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seu pagamento está sendo processado. Isso pode levar alguns minutos.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-4 text-left space-y-3">
          <p className="text-xs font-black text-amber-800 uppercase tracking-wider">O que acontece agora?</p>
          <ul className="space-y-2 text-[11px] text-amber-700 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-black">1.</span> O Mercado Pago está processando o seu pagamento (pode levar até 2 dias úteis para boleto).
            </li>
            <li className="flex items-start gap-2">
              <span className="font-black">2.</span> Assim que for confirmado, você receberá o acesso automaticamente.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-black">3.</span> O material ficará disponível na seção Loja → Meus Downloads.
            </li>
          </ul>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-50 border border-blue-100 text-left">
          <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Você receberá uma notificação por e-mail quando o pagamento for confirmado.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/modulos/loja")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-muted text-foreground font-bold text-sm active:scale-[0.98] transition-all border border-border/50"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-all shadow-md shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" /> Verificar
          </button>
        </div>
      </div>
    </div>
  );
}
