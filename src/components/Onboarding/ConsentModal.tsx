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
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Última atualização: 17 de maio de 2026</p>
          </div>

          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Bem-vindo ao iCatequese.<br />
            Este Termo de Uso e Política de Privacidade estabelece as condições para utilização da plataforma, bem como as diretrizes relacionadas à proteção de dados pessoais, segurança digital e uso ético do sistema.<br /><br />
            Ao utilizar o sistema, o usuário declara que leu, compreendeu e concorda integralmente com os termos abaixo.
          </p>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">1. SOBRE O SISTEMA</h4>
            <p className="text-sm leading-relaxed">
              O iCatequese é uma plataforma digital destinada à gestão pastoral da catequese, permitindo o gerenciamento de:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Turmas de catequese;</li>
              <li>Catequizandos;</li>
              <li>Catequistas;</li>
              <li>Encontros;</li>
              <li>Atividades;</li>
              <li>Comunicação com famílias;</li>
              <li>Agenda catequética;</li>
              <li>Conteúdos pastorais;</li>
              <li>Materiais de apoio;</li>
              <li>Recursos de evangelização e formação cristã.</li>
            </ul>
            <p className="text-sm leading-relaxed pt-1">
              A plataforma possui finalidade exclusivamente pastoral, educativa e evangelizadora.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">2. USO EXCLUSIVAMENTE PASTORAL</h4>
            <p className="text-sm leading-relaxed">
              O uso do iCatequese é restrito às atividades pastorais, religiosas, educativas e administrativas relacionadas à catequese.<br /><br />
              É expressamente proibido utilizar a plataforma para:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Campanhas políticas;</li>
              <li>Divulgação político-partidária;</li>
              <li>Propaganda eleitoral;</li>
              <li>Movimentos ideológicos de natureza político-partidária;</li>
              <li>Compartilhamento de fake news;</li>
              <li>Discurso de ódio;</li>
              <li>Conteúdo discriminatório;</li>
              <li>Atividades ilícitas;</li>
              <li>Finalidades comerciais não autorizadas.</li>
            </ul>
            <p className="text-sm leading-relaxed pt-1">
              A utilização da plataforma em desacordo com esta cláusula poderá resultar em suspensão imediata da conta, bloqueio de acesso, exclusão permanente do usuário ou comunicação às autoridades competentes.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">3. CADASTRO E RESPONSABILIDADE DO USUÁRIO</h4>
            <p className="text-sm leading-relaxed">
              O usuário compromete-se a fornecer informações verdadeiras e atualizadas, manter a confidencialidade de sua senha, utilizar a plataforma de forma ética e segura, respeitar os direitos de todos os usuários e garantir que possui autorização para cadastrar dados de terceiros.<br /><br />
              O usuário é integralmente responsável pelas atividades realizadas em sua conta.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">4. PROTEÇÃO DE DADOS — LGPD</h4>
            <p className="text-sm leading-relaxed">
              O iCatequese compromete-se a cumprir integralmente a Lei Geral de Proteção de Dados Pessoais (LGPD). Os dados serão utilizados exclusivamente para organização pastoral, gestão catequética e melhorias no sistema.
            </p>
            <p className="text-xs font-bold text-foreground mt-2 uppercase tracking-wider">4.1 Dados coletados</p>
            <p className="text-sm leading-relaxed">
              Poderão ser coletados nome, data de nascimento, telefone, e-mail, informações pastorais, frequência e imagens autorizadas.
            </p>
            <p className="text-xs font-bold text-foreground mt-2 uppercase tracking-wider">4.2 Direitos do titular</p>
            <p className="text-sm leading-relaxed">
              O titular poderá solicitar acesso, correção, exclusão, portabilidade ou revogação do consentimento a qualquer momento.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">5. ECA DIGITAL</h4>
            <p className="text-sm leading-relaxed">
              O iCatequese reconhece a prioridade absoluta da proteção integral de crianças e adolescentes (ECA). A plataforma compromete-se a proteger a privacidade de menores, minimizar coleta de dados e não comercializar informações.
            </p>
            <p className="text-sm leading-relaxed pt-1">
              É terminantemente proibido compartilhar imagens sem autorização, expor dados sensíveis ou utilizar a plataforma para fins inadequados. Violações resultarão em denúncia às autoridades.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">6. CONSENTIMENTO DOS RESPONSÁVEIS</h4>
            <p className="text-sm leading-relaxed">
              Ao cadastrar crianças ou adolescentes, a paróquia ou catequista declara possuir autorização legítima dos responsáveis legais para cadastro, comunicação e uso de imagens (quando autorizado).
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">7. SEGURANÇA DA INFORMAÇÃO</h4>
            <p className="text-sm leading-relaxed">
              Adotamos controle de acesso, criptografia, monitoramento e backups para proteção dos dados. Apesar disso, nenhum sistema é completamente imune a riscos digitais.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">8. PROPRIEDADE INTELECTUAL</h4>
            <p className="text-sm leading-relaxed">
              Todos os direitos do sistema (layout, código-fonte, funcionalidades, ícones) pertencem ao iCatequese. É proibida a reprodução sem autorização.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">9. PLANOS PREMIUM</h4>
            <p className="text-sm leading-relaxed">
              A plataforma disponibiliza recursos pagos com funcionalidades avançadas. Os valores e condições podem ser alterados mediante comunicação prévia.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">10 a 14. DISPOSIÇÕES GERAIS</h4>
            <p className="text-sm leading-relaxed">
              O iCatequese não se responsabiliza por informações inseridas por usuários ou uso inadequado da ferramenta. O Termo pode ser atualizado periodicamente. O foro da comarca competente no Brasil fica eleito para resolução de conflitos.
            </p>
          </div>

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
