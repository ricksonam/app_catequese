import { Lock, Sparkles, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface PremiumPaywallProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onAction?: () => void;
}

export function PremiumPaywall({ title, description, icon, onAction }: PremiumPaywallProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center animate-fade-in my-8 max-w-md mx-auto">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          {icon ? icon : <Lock className="h-10 w-10 text-primary" />}
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center border-2 border-background shadow-lg animate-bounce-subtle">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3">{title}</h2>
      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
        {description}
      </p>

      {/* Preço em destaque */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl px-6 py-3 mb-6 flex items-center gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Plano Premium</p>
          <p className="text-2xl font-black text-primary">
            R$ 9,90 <span className="text-sm font-normal text-muted-foreground">/ ano</span>
          </p>
          <p className="text-[11px] text-muted-foreground">Pagamento único anual — sem renovação automática</p>
        </div>
      </div>

      <div className="w-full space-y-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl p-4 text-left shadow-sm">
          <h3 className="font-bold text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Benefícios do Premium
          </h3>
          <ul className="space-y-2 text-sm text-amber-800/80 dark:text-amber-200/70">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span> Acesso total a todos os jogos bíblicos
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span> Turmas ilimitadas para cadastrar
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span> Biblioteca de orações e dinâmicas
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span> Relatórios em PDF e materiais de apoio
            </li>
          </ul>
        </div>

        {/* Usando Link ao invés de navigate() para garantir que a navegação funciona mesmo após o modal fechar */}
        <Link
          to="/minha-assinatura"
          onClick={onAction}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-primary-foreground font-bold py-4 px-6 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          Assinar Plano Premium <ChevronRight className="h-5 w-5" />
        </Link>
        <p className="text-xs text-muted-foreground/60">
          Pagamento único anual. Não há renovação automática sem seu aviso.
        </p>
      </div>
    </div>
  );
}
