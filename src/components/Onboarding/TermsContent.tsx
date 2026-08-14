import { ShieldCheck } from "lucide-react";

export function TermsContent() {
  return (
    <>
          <p className="text-base text-justify font-semibold text-slate-800 dark:text-slate-200">
            Bem-vindo ao iCatequese.<br />
            Este Termo de Uso e Política de Privacidade estabelece as condições para utilização da plataforma, bem como as diretrizes relacionadas à proteção de dados pessoais, segurança digital e uso ético do sistema.<br /><br />
            Ao utilizar o sistema, o usuário declara que leu, compreendeu e concorda integralmente com os termos abaixo.
          </p>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">1. SOBRE O SISTEMA</h4>
            <p className="text-base leading-relaxed text-justify">
              O iCatequese é uma plataforma digital destinada à gestão pastoral da catequese, permitindo o gerenciamento de:
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 text-justify">
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
            <p className="text-base leading-relaxed text-justify pt-1">
              A plataforma possui finalidade exclusivamente pastoral, educativa e evangelizadora.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">2. USO EXCLUSIVAMENTE PASTORAL</h4>
            <p className="text-base leading-relaxed text-justify">
              O uso do iCatequese é restrito às atividades pastorais, religiosas, educativas e administrativas relacionadas à catequese.<br /><br />
              É expressamente proibido utilizar a plataforma para:
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 text-justify">
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
            <p className="text-base leading-relaxed text-justify pt-1">
              A utilização da plataforma em desacordo com esta cláusula poderá resultar em suspensão imediata da conta, bloqueio de acesso, exclusão permanente do usuário ou comunicação às autoridades competentes.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">3. CADASTRO E RESPONSABILIDADE DO USUÁRIO</h4>
            <p className="text-base leading-relaxed text-justify">
              O usuário compromete-se a fornecer informações verdadeiras e atualizadas, manter a confidencialidade de sua senha, utilizar a plataforma de forma ética e segura, respeitar os direitos de todos os usuários e garantir que possui autorização para cadastrar dados de terceiros.<br /><br />
              O usuário é integralmente responsável pelas atividades realizadas em sua conta.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">4. PROTEÇÃO DE DADOS — LGPD</h4>
            <p className="text-base leading-relaxed text-justify">
              O iCatequese compromete-se a cumprir integralmente a Lei Geral de Proteção de Dados Pessoais (LGPD). Os dados registrados na plataforma terá total sigilo e não será repassados a terceiros.
            </p>
            <p className="text-xs font-bold text-foreground mt-2 uppercase tracking-wider">4.1 Dados coletados</p>
            <p className="text-base leading-relaxed text-justify">
              Poderão ser coletados nome, data de nascimento, telefone, e-mail, informações pastorais, frequência e imagens autorizadas.
            </p>
            <p className="text-xs font-bold text-foreground mt-2 uppercase tracking-wider">4.2 Direitos do titular</p>
            <p className="text-base leading-relaxed text-justify">
              O titular poderá solicitar acesso, correção, exclusão, portabilidade ou revogação do consentimento a qualquer momento.
            </p>
          </div>

          <div className="space-y-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              5. ECA DIGITAL — Lei nº 15.211/2025
            </h4>
            <p className="text-base leading-relaxed text-justify text-amber-800">
              O iCatequese reconhece e adota integralmente os princípios da <strong>Lei nº 15.211/2025 — ECA Digital</strong>, que assegura a proteção integral de crianças e adolescentes no ambiente digital, garantindo seu respeito, dignidade e integridade.
            </p>
            <p className="text-base leading-relaxed text-justify text-amber-800">
              Em conformidade com esta lei, a plataforma garante:
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 text-justify text-amber-800">
              <li><strong>Respeito à dignidade</strong> de crianças e adolescentes em todos os recursos digitais;</li>
              <li><strong>Proteção contra exposição indevida</strong> — é terminantemente proibido publicar, compartilhar ou divulgar fotos, vídeos ou qualquer imagem de menores sem o <em>consentimento expresso e documentado</em> dos responsáveis legais;</li>
              <li><strong>Minimização de dados</strong> — coleta apenas o estritamente necessário para fins pastorais;</li>
              <li><strong>Não comercialização</strong> de informações de menores em nenhuma hipótese;</li>
              <li>Denúncia obrigatória às autoridades competentes em caso de violações identificadas.</li>
            </ul>
            <p className="text-base leading-relaxed text-justify text-amber-800 font-semibold mt-1">
              Violações a esta cláusula resultarão em suspensão imediata da conta e comunicação às autoridades.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">6. CONSENTIMENTO DOS RESPONSÁVEIS</h4>
            <p className="text-base leading-relaxed text-justify">
              Ao cadastrar crianças ou adolescentes, a paróquia ou catequista declara possuir autorização legítima dos responsáveis legais para cadastro, comunicação e uso de imagens (quando autorizado).
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">7. SEGURANÇA DA INFORMAÇÃO</h4>
            <p className="text-base leading-relaxed text-justify">
              Adotamos controle de acesso, criptografia, monitoramento e backups para proteção dos dados. Apesar disso, nenhum sistema é completamente imune a riscos digitais.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">8. PROPRIEDADE INTELECTUAL</h4>
            <p className="text-base leading-relaxed text-justify">
              Todos os direitos do sistema (layout, código-fonte, funcionalidades, ícones) pertencem ao iCatequese. É proibida a reprodução sem autorização.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">10. SUSPENSÃO E CANCELAMENTO</h4>
            <p className="text-base leading-relaxed text-justify">
              O iCatequese poderá suspender ou cancelar contas que:
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 text-justify">
              <li>Violaram este Termo;</li>
              <li>Utilizem a plataforma para fins políticos;</li>
              <li>Pratiquem atividades ilícitas;</li>
              <li>Coloquem em risco dados de menores;</li>
              <li>Promovam conteúdos ofensivos ou discriminatórios.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">11. LIMITAÇÃO DE RESPONSABILIDADE</h4>
            <p className="text-base leading-relaxed text-justify">
              O sistema atua como ferramenta de apoio pastoral e administrativo.<br /><br />
              O iCatequese não se responsabiliza por:
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 text-justify">
              <li>Informações inseridas por usuários;</li>
              <li>Uso inadequado da plataforma;</li>
              <li>Compartilhamento indevido realizado por terceiros;</li>
              <li>Danos decorrentes de falhas externas de internet ou serviços de terceiros.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">12. ALTERAÇÕES DOS TERMOS</h4>
            <p className="text-base leading-relaxed text-justify">
              Este Termo poderá ser atualizado periodicamente para adequação legal, tecnológica ou pastoral.<br /><br />
              A continuidade do uso da plataforma após alterações será interpretada como concordância com os novos termos.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">13. CONTATO</h4>
            <p className="text-base leading-relaxed text-justify">
              Para dúvidas relacionadas a este Termo, proteção de dados ou segurança digital, o usuário poderá entrar em contato pelos canais oficiais do iCatequese.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">14. FORO</h4>
            <p className="text-base leading-relaxed text-justify">
              Fica eleito o foro da comarca de Manaus, Estado do Amazonas para resolução de quaisquer conflitos relacionados ao uso da plataforma, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </div>


    </>
  );
}
